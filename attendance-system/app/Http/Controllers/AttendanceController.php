<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
class AttendanceController extends Controller
{
 public function markAttendance(Request $request)
{
    
    $request->validate([
        'image' => 'required|string',
        'latitude' => 'required|numeric|between:-90,90',
        'longitude' => 'required|numeric|between:-180,180',
    ]);

    $imageData = $request->input('image'); // base64 image string
    $latitude = $request->input('latitude');
    $longitude = $request->input('longitude');
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

        if (isset($data['id'])) {
            $employee = Employee::find($data['id']);
            if ($employee) {
                Attendance::create([
                    'employee_id' => $employee->id,
                    'attendance_time' => now(),
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                ]);
                return response()->json(['message' => 'Attendance marked successfully']);
            } else {
                return response()->json(['error' => 'Employee not found'], 404);
            }
        } else {
            return response()->json(['error' => 'No match found'], 404);
        }
    } catch (\Exception $e) {
        return response()->json(['error' => 'Recognition failed: ' . $e->getMessage()], 500);
    }
}
    public function trainModel(){
    $client = new \GuzzleHttp\Client();

    try {
        $response = $client->post('http://localhost:5000/train', [
            'headers' => [
                'Accept' => 'application/json',
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        return response()->json([
            'message' => $data['message'] ?? 'Training complete',
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Failed to trigger model training: ' . $e->getMessage(),
        ], 500);
    }
}

}
