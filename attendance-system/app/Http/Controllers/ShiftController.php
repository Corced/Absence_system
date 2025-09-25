<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Shift;
use Illuminate\Support\Facades\Validator;

class ShiftController extends Controller
{
    public function index()
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json(
            Shift::orderBy('code')->get(['id','code','name','start_time','end_time','timezone'])
        );
    }

    public function store(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:10|unique:shifts,code',
            'name' => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'timezone' => 'sometimes|string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        try {
            $shift = Shift::create($request->all());
            return response()->json($shift, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal membuat shift'], 500);
        }
    }

    public function update(Request $request, Shift $shift)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:10|unique:shifts,code,' . $shift->id,
            'name' => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'timezone' => 'sometimes|string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        try {
            $shift->update($request->all());
            return response()->json($shift);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal memperbarui shift'], 500);
        }
    }

    public function destroy(Shift $shift)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if shift is being used by employees
        if ($shift->employees()->count() > 0) {
            return response()->json([
                'error' => 'Tidak dapat menghapus shift karena sedang digunakan oleh karyawan'
            ], 422);
        }

        try {
            $shift->delete();
            return response()->json(['message' => 'Shift berhasil dihapus']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal menghapus shift'], 500);
        }
    }
}