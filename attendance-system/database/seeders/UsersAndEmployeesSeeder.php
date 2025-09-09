<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;

class UsersAndEmployeesSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'John Doe', 'email' => 'john@example.com', 'role' => 'user'],
            ['name' => 'Jane Smith', 'email' => 'jane@example.com', 'role' => 'user'],
            ['name' => 'Mudden Joe', 'email' => 'mud@example.com', 'role' => 'user'],
            ['name' => 'Jackin Makwhok', 'email' => 'jack@example.com', 'role' => 'user'],
            ['name' => 'Admin', 'email' => 'admin@example.com', 'role' => 'admin'],
        ];

        $createdUsers = [];
        foreach ($users as $u) {
            $createdUsers[$u['email']] = User::updateOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'password' => bcrypt('password'),
                    'role' => $u['role'],
                ]
            );
        }

        $employees = [
            ['name' => 'John Doe', 'email' => 'john@example.com', 'position' => 'Editor'],
            ['name' => 'Jane Smith', 'email' => 'jane@example.com', 'position' => 'Manager'],
            ['name' => 'Mudden Joe', 'email' => 'mud@example.com', 'position' => 'Junior Programmer'],
            ['name' => 'Jackin Makwhok', 'email' => 'jack@example.com', 'position' => 'Senior Programmer'],
        ];

        foreach ($employees as $e) {
            $user = $createdUsers[$e['email']];
            Employee::updateOrCreate(
                ['email' => $e['email']],
                [
                    'name' => $e['name'],
                    'position' => $e['position'],
                    'user_id' => $user->id,
                ]
            );
        }
    }
}

