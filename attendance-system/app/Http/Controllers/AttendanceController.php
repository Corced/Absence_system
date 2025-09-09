<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AttendanceController extends Controller
{
    private $hospitalLocations = [
        ['lat' => -7.9901595, 'lon' => 112.6205187],
        ['lat' => -7.9903000, 'lon' => 112.6206000],
        ['lat' => -7.9900000, 'lon' => 112.6207000],
    ];
    private $geofenceRadius = 1000; // 20 meters, as previously updated

    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000;
        $lat1 = deg2rad($lat1);
        $lon1 = deg2rad($lon1);
        $lat2 = deg2rad($lat2);
        $lon2 = deg2rad($lon2);

        $dlat = $lat2 - $lat1;
        $dlon = $lon2 - $lon1;

        $a = sin($dlat / 2) * sin($dlat / 2) +
             cos($lat1) * cos($lat2) * sin($dlon / 2) * sin($dlon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    private function isWithinGeofence($lat, $lon)
    {
        $closestDistance = PHP_FLOAT_MAX;
        foreach ($this->hospitalLocations as $location) {
            $distance = $this->calculateDistance($lat, $lon, $location['lat'], $location['lon']);
            Log::info('Geofence check', [
                'lat' => $lat,
                'lon' => $lon,
                'hospital_lat' => $location['lat'],
                'hospital_lon' => $location['lon'],
                'distance' => $distance,
            ]);
            $closestDistance = min($closestDistance, $distance);
            if ($distance <= $this->geofenceRadius) {
                return [true, $distance];
            }
        }
        return [false, $closestDistance];
    }

    private function getAddress($lat, $lon)
    {
        try {
            $client = new Client(['headers' => ['User-Agent' => 'AttendanceSystem/1.0']]);
            $response = $client->get("https://nominatim.openstreetmap.org/reverse?format=json&lat={$lat}&lon={$lon}");
            $data = json_decode($response->getBody(), true);
            $address = $data['display_name'] ?? 'Unknown location';
            Log::info('Geocoding result', ['lat' => $lat, 'lon' => $lon, 'address' => $address]);

            if (stripos($address, 'Rumah Sakit Tentara Dokter Soepraoen') === false &&
                stripos($address, 'S. Soepraoen') === false) {
                return 'Area Rumah Sakit Tentara Dokter Soepraoen';
            }

            return $address;
        } catch (\Exception $e) {
            Log::warning('Geocoding failed for lat: ' . $lat . ', lon: ' . $lon, ['error' => $e->getMessage()]);
            return 'Tidak dapat menentukan lokasi';
        }
    }

public function markAttendance(Request $request)
{
    $request->validate([
        'image' => 'required|string',
        'latitude' => 'required|numeric|between:-90,90',
        'longitude' => 'required|numeric|between:-180,180',
    ]);

    $imageData = $request->input('image');
    $latitude = $request->input('latitude');
    $longitude = $request->input('longitude');

    [$isWithinGeofence, $distance] = $this->isWithinGeofence($latitude, $longitude);
    if (!$isWithinGeofence) {
        return response()->json([
            'error' => 'Kamu berada di luar jangkauan Rumah sakit. Jarak terdekat: ' . round($distance, 2) . ' meter'
        ], 403);
    }

    $client = new Client();

    try {
        $imageBinary = base64_decode($imageData);
        if (!$imageBinary) {
            return response()->json(['error' => 'Invalid base64 image data'], 422);
        }

        $response = $client->post('http://localhost:5000/recognize', [
            'multipart' => [
                [
                    'name' => 'image',
                    'contents' => $imageBinary,
                    'filename' => 'webcam.jpg',
                ],
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        if (isset($data['identity'])) {
            $identity = $data['identity'];
            $employeeId = (int) str_replace('employee_', '', $identity);
            $employee = Employee::find($employeeId);

            if (!$employee) {
                return response()->json(['error' => 'Employee not found'], 404);
            }

            $user = Auth::user();
            if ($employee->user_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized: Face does not match logged-in user'], 403);
            }

            $shift = $employee->shift;

            // Check if shift is null and handle accordingly
            if (!$shift) {
                return response()->json([
                    'error' => '❌ Gagal absen: Shift tidak ditemukan untuk karyawan ini!'
                ], 403);
            }

            // Additional layer: Check if shift matches current timezone
            $tz = new \DateTimeZone('Asia/Jakarta');
            $currentTime = new \DateTime('now', $tz);
            $shiftStart = new \DateTime($shift->start_time, $tz);
            $shiftEnd = new \DateTime($shift->end_time, $tz);

            // Handle overnight shifts
            if ($shiftEnd < $shiftStart) {
                if ($currentTime < $shiftStart) {
                    $shiftEnd->modify('-1 day');
                } else {
                    $shiftStart->modify('+1 day');
                }
            }

            if ($currentTime < $shiftStart || $currentTime > $shiftEnd) {
                return response()->json([
                    'error' => '❌ Gagal absen: Jam shift Anda tidak sesuai dengan waktu saat ini!'
                ], 403);
            }

            $address = $this->getAddress($latitude, $longitude);
            if (stripos($address, 'Rumah Sakit Tentara Dokter Soepraoen') === false &&
                stripos($address, 'S. Soepraoen') === false) {
                return response()->json(['error' => 'Location not at Rumah Sakit Tentara Dokter Soepraoen'], 403);
            }

            Attendance::create([
                'employee_id' => $employee->id,
                'attendance_time' => now(),
                'latitude' => $latitude,
                'longitude' => $longitude,
                'address' => $address,
                'distance' => $distance,
            ]);
            return response()->json(['message' => 'Attendance marked successfully']);
        } else {
            return response()->json(['error' => 'No match found'], 404);
        }
    } catch (\Exception $e) {
        Log::error('Recognition failed for user: ' . Auth::id(), ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Recognition failed: ' . $e->getMessage()], 500);
    }
}

    public function trainModel(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'image' => 'required|string',
        ]);

        $employeeId = $request->input('employee_id');
        $imageData = $request->input('image');

        $imageBinary = base64_decode($imageData);
        if (!$imageBinary) {
            return response()->json(['error' => 'Invalid base64 image data'], 422);
        }

        $tempPath = "temp/employee_{$employeeId}_train.jpg";
        Storage::disk('local')->put($tempPath, $imageBinary);

        $client = new Client();

        try {
            $response = $client->post('http://localhost:5000/train', [
                'multipart' => [
                    [
                        'name' => 'employee_id',
                        'contents' => (string) $employeeId,
                    ],
                    [
                        'name' => 'image',
                        'contents' => fopen(storage_path("app/{$tempPath}"), 'r'),
                        'filename' => 'train.jpg',
                    ],
                ],
            ]);

            Storage::disk('local')->delete($tempPath);

            $data = json_decode($response->getBody(), true);
            return response()->json([
                'message' => $data['message'] ?? "Training complete for employee_{$employeeId}",
            ]);
        } catch (\Exception $e) {
            Storage::disk('local')->delete($tempPath);
            Log::error('Model training failed for employee: ' . $employeeId, ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to trigger model training: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getAttendances()
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $attendances = Attendance::with('employee')->latest()->get();
        $client = new Client(['headers' => ['User-Agent' => 'AttendanceSystem/1.0']]);

        foreach ($attendances as $att) {
            if (!$att->address || stripos($att->address, 'Unable to retrieve') !== false) {
                $att->address = $this->getAddress($att->latitude, $att->longitude);
                $att->save();
                sleep(1); // Respect Nominatim rate limits
            }
            if (is_null($att->distance)) {
                [$isWithinGeofence, $distance] = $this->isWithinGeofence($att->latitude, $att->longitude);
                $att->distance = $distance;
                $att->save();
            }
        }

        return response()->json($attendances);
    }

    public function getEmployees()
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $employees = Employee::all();
        return response()->json($employees);
    }

    public function getMyAttendances()
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();
        
        if (!$employee) {
            return response()->json(['error' => 'Employee not found'], 404);
        }

        $attendances = Attendance::where('employee_id', $employee->id)
            ->orderBy('attendance_time', 'desc')
            ->get();

        return response()->json($attendances);
    }
}