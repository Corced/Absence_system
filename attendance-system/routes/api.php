<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ShiftController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/attendance/mark', [AttendanceController::class, 'markAttendance']);
    Route::post('/attendance/clock-out', [AttendanceController::class, 'clockOut']);
    Route::post('/attendance/train', [AttendanceController::class, 'trainModel']);
    Route::get('/attendance', [AttendanceController::class, 'getAttendances']);
    Route::get('/attendance/my', [AttendanceController::class, 'getMyAttendances']);
    Route::get('/attendance/my-shift', [AttendanceController::class, 'getMyShiftInfo']);
    Route::get('/employees', [AttendanceController::class, 'getEmployees']);

    // schedules
    Route::get('/schedules', [ScheduleController::class, 'index']);
    Route::post('/schedules', [ScheduleController::class, 'bulkUpsert']);
    Route::post('/schedules/import-excel', [ScheduleController::class, 'importExcel']);
    Route::get('/schedules/template', [ScheduleController::class, 'downloadTemplate']);
    Route::get('/schedules/export-excel', [ScheduleController::class, 'exportExcel']);

    // shifts - CRUD routes
    Route::get('/shifts', [ShiftController::class, 'index']);
    Route::post('/shifts', [ShiftController::class, 'store']);
    Route::put('/shifts/{shift}', [ShiftController::class, 'update']);
    Route::delete('/shifts/{shift}', [ShiftController::class, 'destroy']);
});