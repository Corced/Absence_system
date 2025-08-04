<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Attendance;
use App\Models\Employee;
use Carbon\Carbon;

class AttendancesTableSeeder extends Seeder
{
    public function run()
    {
        $employees = Employee::all();

        if ($employees->isEmpty()) {
            $this->command->warn('No employees found to seed attendance.');
            return;
        }

        foreach ($employees as $index => $employee) {
            // Generate multiple attendance records per employee
            Attendance::create([
                'employee_id' => $employee->id,
                'attendance_time' => Carbon::now()->subDays(0),
                'latitude' => -7.981894 + mt_rand(-1000, 1000) / 100000.0,
                'longitude' => 112.626503 + mt_rand(-1000, 1000) / 100000.0,
            ]);

            Attendance::create([
                'employee_id' => $employee->id,
                'attendance_time' => Carbon::now()->subDays(1),
                'latitude' => -7.981894 + mt_rand(-1000, 1000) / 100000.0,
                'longitude' => 112.626503 + mt_rand(-1000, 1000) / 100000.0,
            ]);

            Attendance::create([
                'employee_id' => $employee->id,
                'attendance_time' => Carbon::now()->subDays(2),
                'latitude' => -7.981894 + mt_rand(-1000, 1000) / 100000.0,
                'longitude' => 112.626503 + mt_rand(-1000, 1000) / 100000.0,
            ]);
        }

        $this->command->info('Attendance seeded for ' . $employees->count() . ' employee(s).');
    }
}
