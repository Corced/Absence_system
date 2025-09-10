<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Schedule;
use App\Models\Employee;

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

        $validated = $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
            'items' => 'required|array|min:1',
            'items.*.employee_id' => 'required|exists:employees,id',
        ]);

        $year = (int) $validated['year'];
        $month = (int) $validated['month'];

        foreach ($validated['items'] as $item) {
            $payload = [
                'employee_id' => $item['employee_id'],
                'year' => $year,
                'month' => $month,
            ];
            for ($i = 1; $i <= 31; $i++) {
                $k = 'h' . $i;
                if (array_key_exists($k, $item)) {
                    $val = $item[$k];
                    $payload[$k] = is_null($val) || $val === '' ? null : (string) $val;
                }
            }

            Schedule::updateOrCreate(
                ['employee_id' => $item['employee_id'], 'year' => $year, 'month' => $month],
                $payload
            );
        }

        return response()->json(['message' => 'Schedules saved']);
    }
}

