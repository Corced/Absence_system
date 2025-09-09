<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ShiftController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/attendance/mark', [AttendanceController::class, 'markAttendance']);
    Route::post('/attendance/clock-out', [AttendanceController::class, 'clockOut']);
    Route::post('/attendance/train', [AttendanceController::class, 'trainModel']);
    Route::get('/attendance', [AttendanceController::class, 'getAttendances']);
    Route::get('/attendance/my', [AttendanceController::class, 'getMyAttendances']);
    Route::get('/employees', [AttendanceController::class, 'getEmployees']);
    Route::get('/shifts', [ShiftController::class, 'index']);
    Route::post('/shifts', [ShiftController::class, 'store']);
    Route::post('/shifts/assign', [ShiftController::class, 'assign']);
    Route::get('/shifts/assignments', [ShiftController::class, 'assignments']);
});