<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;

class EmployeesTableSeeder extends Seeder
{
    public function run()
    {
        // These must match the folders in your `photos/` directory: employee_0, employee_1, etc.
        for ($i = 0; $i < 5; $i++) {
            Employee::updateOrCreate(
                ['id' => $i],
                [
                    'name' => 'employee_' . $i,
                    'position' => 'Staff', // optional if you have this column
                ]
            );
        }
    }
}
