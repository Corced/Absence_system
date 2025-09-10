<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shift;

class ShiftsTableSeeder extends Seeder
{
    public function run()
    {
        $shifts = [
            ['code' => 'PAGI', 'name' => 'Shift Pagi', 'start_time' => '08:00:00', 'end_time' => '16:00:00', 'timezone' => 'Asia/Jakarta'],
            ['code' => 'SIANG', 'name' => 'Shift Siang', 'start_time' => '12:00:00', 'end_time' => '20:00:00', 'timezone' => 'Asia/Jakarta'],
            ['code' => 'MALAM', 'name' => 'Shift Malam', 'start_time' => '20:00:00', 'end_time' => '04:00:00', 'timezone' => 'Asia/Jakarta'],
        ];

        foreach ($shifts as $data) {
            Shift::updateOrCreate(
                ['code' => $data['code']],
                $data
            );
        }
    }
}

