<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Shift;
use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;

class ShiftController extends Controller
{
    public function index()
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        return response()->json(Shift::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'code' => 'nullable|string|unique:shifts,code',
            'name' => 'required|string',
            'start_time' => 'required|date_format:H:i:s',
            'end_time' => 'required|date_format:H:i:s',
            'timezone' => 'nullable|string',
        ]);

        $shift = Shift::create([
            'code' => $validated['code'] ?? null,
            'name' => $validated['name'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'timezone' => $validated['timezone'] ?? 'Asia/Jakarta',
        ]);

        return response()->json(['message' => 'Shift created', 'shift' => $shift], 201);
    }

    public function assign(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date_format:Y-m-d',
            'shift_id' => 'nullable|exists:shifts,id',
            'shift_code' => 'nullable|string',
        ]);

        $shiftId = $validated['shift_id'] ?? null;
        if (!$shiftId && isset($validated['shift_code'])) {
            $shift = Shift::where('code', $validated['shift_code'])->first();
            if (!$shift) {
                return response()->json(['error' => 'Shift code not found'], 422);
            }
            $shiftId = $shift->id;
        }

        if (!$shiftId) {
            return response()->json(['error' => 'shift_id or shift_code is required'], 422);
        }

        $assignment = EmployeeShiftAssignment::updateOrCreate(
            [
                'employee_id' => $validated['employee_id'],
                'date' => $validated['date'],
            ],
            [
                'shift_id' => $shiftId,
            ]
        );

        return response()->json(['message' => 'Shift assigned', 'assignment' => $assignment->load('shift')]);
    }

    public function assignments(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $date = $request->query('date');
        $query = EmployeeShiftAssignment::with(['employee', 'shift'])->orderBy('date', 'desc');
        if ($date) {
            $query->where('date', $date);
        }
        return response()->json($query->get());
    }
}

