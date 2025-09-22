<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Schedule;
use App\Models\Employee;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $year = (int) $validated['year'];
        $month = (int) $validated['month'];

        $employees = Employee::orderBy('name')->get(['id','nip','name']);
        $existing = Schedule::where('year', $year)->where('month', $month)->get()->keyBy('employee_id');

        $rows = $employees->map(function ($emp) use ($existing, $year, $month) {
            $base = [
                'employee_id' => $emp->id,
                'nip' => $emp->nip,
                'name' => $emp->name,
                'year' => $year,
                'month' => $month,
            ];
            $schedule = $existing->get($emp->id);
            for ($i = 1; $i <= 31; $i++) {
                $key = 'h' . $i;
                $base[$key] = $schedule ? ($schedule->$key ?: null) : null;
            }
            return $base;
        })->values();

        return response()->json($rows);
    }

    public function bulkUpsert(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Base validation rules
        $rules = [
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
            'items' => 'required|array|min:1',
            'items.*.employee_id' => 'required|exists:employees,id',
        ];

        // Add dynamic rules for h1..h31
        for ($i = 1; $i <= 31; $i++) {
            $rules["items.*.h$i"] = 'nullable|string|max:10';
        }

        $validated = $request->validate($rules);

        $year = (int) $validated['year'];
        $month = (int) $validated['month'];

        // Log the full validated payload
        Log::info('BulkUpsert request received', [
            'year' => $year,
            'month' => $month,
            'items' => $validated['items'],
        ]);

        foreach ($validated['items'] as $item) {
            $payload = [
                'employee_id' => $item['employee_id'],
                'year' => $year,
                'month' => $month,
            ];

            for ($i = 1; $i <= 31; $i++) {
                $k = 'h' . $i;
                $val = $item[$k] ?? null;
                $payload[$k] = $val === '' ? null : $val;
            }

            // Log the final payload
            Log::info('Upserting schedule for employee', [
                'employee_id' => $item['employee_id'],
                'payload' => $payload,
            ]);

            Schedule::updateOrCreate(
                ['employee_id' => $item['employee_id'], 'year' => $year, 'month' => $month],
                $payload
            );

            $saved = Schedule::where('employee_id', $item['employee_id'])
                ->where('year', $year)
                ->where('month', $month)
                ->first();

            Log::info('Saved DB row', $saved ? $saved->toArray() : []);

            // Automatically assign shift based on schedule
            $employee = Employee::find($item['employee_id']);
            if ($employee) {
                $assignedShift = $employee->assignShiftFromSchedules($year, $month);
                if ($assignedShift) {
                    Log::info('Auto-assigned shift to employee', [
                        'employee_id' => $employee->id,
                        'shift_id' => $assignedShift->id,
                        'shift_code' => $assignedShift->code,
                        'shift_name' => $assignedShift->name
                    ]);
                }
            }
        }

        return response()->json(['message' => 'Schedules saved']);
    }

    public function importExcel(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:10240', // 10MB max
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $year = (int) $request->input('year');
        $month = (int) $request->input('month');
        $file = $request->file('file');

        try {
            // Load the Excel file
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            if (count($rows) < 2) {
                return response()->json(['error' => 'Excel file must contain at least a header row and one data row'], 422);
            }

            // Expected header format: NIP, Name, Day1, Day2, ..., Day31
            $headers = $rows[0];
            $dataRows = array_slice($rows, 1);

            // Validate header format
            if (count($headers) < 33) { // NIP + Name + 31 days
                return response()->json(['error' => 'Excel file must have at least 33 columns (NIP, Name, Day1-Day31)'], 422);
            }

            $importedCount = 0;
            $errors = [];

            foreach ($dataRows as $rowIndex => $row) {
                if (empty($row[0])) { // Skip empty rows
                    continue;
                }

                try {
                    // Get NIP and Name from first two columns
                    $nip = trim($row[0]);
                    $name = trim($row[1]);

                    if (empty($nip)) {
                        $errors[] = "Row " . ($rowIndex + 2) . ": NIP is required";
                        continue;
                    }

                    // Find employee by NIP
                    $employee = Employee::where('nip', $nip)->first();
                    if (!$employee) {
                        $errors[] = "Row " . ($rowIndex + 2) . ": Employee with NIP '{$nip}' not found";
                        continue;
                    }

                    // Prepare schedule data
                    $scheduleData = [
                        'employee_id' => $employee->id,
                        'year' => $year,
                        'month' => $month,
                    ];

                    // Process day columns (columns 2-32, which are indices 2-32 in array)
                    for ($day = 1; $day <= 31; $day++) {
                        $columnIndex = $day + 1; // Skip NIP and Name columns
                        $dayValue = isset($row[$columnIndex]) ? trim($row[$columnIndex]) : null;
                        
                        // Convert empty strings to null
                        $dayValue = ($dayValue === '') ? null : $dayValue;
                        
                        $scheduleData["h{$day}"] = $dayValue;
                    }

                    // Create or update schedule
                    Schedule::updateOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'year' => $year,
                            'month' => $month
                        ],
                        $scheduleData
                    );

                    $importedCount++;

                } catch (\Exception $e) {
                    $errors[] = "Row " . ($rowIndex + 2) . ": " . $e->getMessage();
                    Log::error('Excel import error on row ' . ($rowIndex + 2), [
                        'error' => $e->getMessage(),
                        'row_data' => $row
                    ]);
                }
            }

            $response = [
                'message' => "Successfully imported {$importedCount} schedules",
                'imported_count' => $importedCount,
                'total_rows' => count($dataRows)
            ];

            if (!empty($errors)) {
                $response['errors'] = $errors;
                $response['error_count'] = count($errors);
            }

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('Excel import failed', [
                'error' => $e->getMessage(),
                'file' => $file->getClientOriginalName()
            ]);

            return response()->json([
                'error' => 'Failed to process Excel file: ' . $e->getMessage()
            ], 500);
        }
    }

    public function downloadTemplate()
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Set headers
            $headers = ['NIP', 'Nama'];
            for ($i = 1; $i <= 31; $i++) {
                $headers[] = "h{$i}";
            }
            
            // Write headers
            $sheet->fromArray($headers, null, 'A1');

            // Add sample data
            $employees = Employee::limit(3)->get();
            $row = 2;
            
            foreach ($employees as $employee) {
                $rowData = [$employee->nip, $employee->name];
                
                // Add sample shift codes for first 10 days
                for ($i = 1; $i <= 31; $i++) {
                    if ($i <= 10) {
                        $rowData[] = $i % 2 === 0 ? '110' : '100'; // Sample shift codes
                    } else {
                        $rowData[] = ''; // Empty for remaining days
                    }
                }
                
                $sheet->fromArray($rowData, null, "A{$row}");
                $row++;
            }

            // Add instruction row
            $instructionRow = ['CONTOH', 'INSTRUKSI'];
            for ($i = 1; $i <= 31; $i++) {
                $instructionRow[] = $i <= 5 ? 'Gunakan kode shift seperti: 110, 100, 200, OFF' : '';
            }
            $sheet->fromArray($instructionRow, null, "A{$row}");

            // Style the headers
            $sheet->getStyle('A1:AH1')->getFont()->setBold(true);
            $sheet->getStyle('A1:AH1')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFE0E0E0');

            // Auto-size columns
            foreach (range('A', 'AH') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }

            $writer = new Xlsx($spreadsheet);
            
            // Ensure no output compression/buffering corrupts the XLSX stream
            if (function_exists('ini_set')) {
                @ini_set('zlib.output_compression', '0');
            }
            
            return response()->streamDownload(function() use ($writer) {
                while (ob_get_level() > 0) {
                    @ob_end_clean();
                }
                $writer->save('php://output');
            }, 'template_jadwal_karyawan.xlsx', [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="template_jadwal_karyawan.xlsx"'
            ]);

        } catch (\Exception $e) {
            Log::error('Template generation failed', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to generate template: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportExcel(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $year = (int) $validated['year'];
        $month = (int) $validated['month'];

        try {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Header row
            $headers = ['NIP', 'Nama'];
            for ($i = 1; $i <= 31; $i++) {
                $headers[] = 'h' . $i;
            }
            $sheet->fromArray($headers, null, 'A1');

            // Data rows
            $employees = Employee::orderBy('name')->get(['id','nip','name']);
            $existing = Schedule::where('year', $year)->where('month', $month)->get()->keyBy('employee_id');

            $rowIndex = 2;
            foreach ($employees as $emp) {
                $line = [$emp->nip, $emp->name];
                $schedule = $existing->get($emp->id);
                for ($i = 1; $i <= 31; $i++) {
                    $key = 'h' . $i;
                    $line[] = $schedule ? ($schedule->$key ?: '') : '';
                }
                $sheet->fromArray($line, null, 'A' . $rowIndex);
                $rowIndex++;
            }

            // Bold headers and autosize
            $sheet->getStyle('A1:AH1')->getFont()->setBold(true);
            foreach (range('A', 'AH') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }

            $writer = new Xlsx($spreadsheet);
            $filename = sprintf('jadwal_%04d_%02d.xlsx', $year, $month);

            // Ensure no output compression/buffering corrupts the XLSX stream
            if (function_exists('ini_set')) {
                @ini_set('zlib.output_compression', '0');
            }

            return response()->streamDownload(function () use ($writer) {
                while (ob_get_level() > 0) {
                    @ob_end_clean();
                }
                $writer->save('php://output');
            }, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        } catch (\Exception $e) {
            Log::error('Schedule export failed', [
                'error' => $e->getMessage(),
                'year' => $year,
                'month' => $month,
            ]);
            return response()->json(['error' => 'Failed to export schedules'], 500);
        }
    }
}
