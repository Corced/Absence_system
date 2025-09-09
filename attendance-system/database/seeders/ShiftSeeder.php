<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shift;

class ShiftSeeder extends Seeder
{
    public function run()
    {
        $shifts = [
            // Core 3-shift system
            ['code' => 'PAGI', 'name' => 'Shift Pagi', 'start_time' => '07:00:00', 'end_time' => '15:00:00'],
            ['code' => 'SIANG', 'name' => 'Shift Siang', 'start_time' => '14:00:00', 'end_time' => '22:00:00'],
            ['code' => 'MALAM', 'name' => 'Shift Malam', 'start_time' => '20:00:00', 'end_time' => '07:00:00'], // overnight

            // Common hospital variants (examples; expand as needed)
            ['code' => 'OFF', 'name' => 'Off', 'start_time' => '00:00:00', 'end_time' => '00:00:00'],
            ['code' => 'HD_SIANG', 'name' => 'Depo HD Siang', 'start_time' => '13:00:00', 'end_time' => '19:00:00'],
            ['code' => 'POLI_PAGI', 'name' => 'Shift Poli Pagi', 'start_time' => '07:00:00', 'end_time' => '14:00:00'],
            ['code' => 'KASIR_PAGI', 'name' => 'Kasir Pagi', 'start_time' => '07:00:00', 'end_time' => '17:00:00'],
            ['code' => 'KASIR_MALAM', 'name' => 'Kasir Malam', 'start_time' => '19:30:00', 'end_time' => '06:00:00'],
            ['code' => 'LAB_PAGI', 'name' => 'Lab Pagi', 'start_time' => '07:00:00', 'end_time' => '14:30:00'],
            ['code' => 'LAB_MALAM', 'name' => 'Lab Malam', 'start_time' => '20:30:00', 'end_time' => '07:00:00'],
        ];

        foreach ($shifts as $s) {
            Shift::updateOrCreate(
                ['code' => $s['code']],
                [
                    'name' => $s['name'],
                    'start_time' => $s['start_time'],
                    'end_time' => $s['end_time'],
                    'timezone' => 'Asia/Jakarta',
                ]
            );
        }
    }
}

