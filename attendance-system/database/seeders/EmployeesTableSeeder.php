<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\Shift;

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
                    'email' => 'employee_' . $i . '@example.com',
                    'nip' => str_pad((string) (100000 + $i), 8, '0', STR_PAD_LEFT),
                    'position' => 'Staff', // optional if you have this column
                    // Demonstrate assigning by code for even indexes, by id for odd indexes
                    'shift_id' => $i % 2 === 0 ? 'PAGI' : Shift::first()?->id,
                ]
            );
        }
    }
}
