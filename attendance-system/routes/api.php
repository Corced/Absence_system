<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AttendanceController;

Route::post('/attendance/mark', [AttendanceController::class, 'markAttendance']);
Route::post('/attendance/train', [AttendanceController::class, 'trainModel']);
