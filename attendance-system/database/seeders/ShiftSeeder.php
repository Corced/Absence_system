<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shift;

class ShiftSeeder extends Seeder
{
    public function run()
    {
        $shifts = [
            ['code' => '100', 'name' => 'Pegawai Off', 'start_time' => '00:00:00', 'end_time' => '00:00:00'],
            ['code' => '110', 'name' => 'Pegawai Pagi', 'start_time' => '07:00:00', 'end_time' => '15:30:00'],
            ['code' => '111', 'name' => 'Pegawai Piket', 'start_time' => '08:00:00', 'end_time' => '08:00:00'],
            ['code' => '131', 'name' => 'Jaga Petugas Filing', 'start_time' => '07:00:00', 'end_time' => '15:00:00'],
            ['code' => '140', 'name' => 'Depo HD Siang', 'start_time' => '13:00:00', 'end_time' => '20:00:00'],
            ['code' => '200', 'name' => 'Shift Off', 'start_time' => '00:00:00', 'end_time' => '00:00:00'],
            ['code' => '210', 'name' => 'Shift Pagi', 'start_time' => '07:00:00', 'end_time' => '15:00:00'],
            ['code' => '220', 'name' => 'Shift Siang', 'start_time' => '14:00:00', 'end_time' => '20:00:00'],
            ['code' => '231', 'name' => 'Shift Malam', 'start_time' => '20:00:00', 'end_time' => '07:00:00'],
            ['code' => '232', 'name' => 'Loket HD 1', 'start_time' => '07:00:00', 'end_time' => '10:00:00'],
            ['code' => '240', 'name' => 'Shift Pramusaji', 'start_time' => '06:00:00', 'end_time' => '18:00:00'],
            ['code' => '242', 'name' => 'Shift Pramusaji Sore', 'start_time' => '13:00:00', 'end_time' => '18:00:00'],
            ['code' => '250', 'name' => 'Shift Poli Sore', 'start_time' => '14:00:00', 'end_time' => '17:00:00'],
            ['code' => '252', 'name' => 'Loket HD 2', 'start_time' => '10:00:00', 'end_time' => '14:00:00'],
            ['code' => '260', 'name' => 'Shift Siang Gizi', 'start_time' => '13:00:00', 'end_time' => '20:00:00'],
            ['code' => '262', 'name' => 'TPPRI Minggu', 'start_time' => '08:00:00', 'end_time' => '12:00:00'],
            ['code' => '270', 'name' => 'Shift Siang HD', 'start_time' => '13:00:00', 'end_time' => '18:00:00'],
            ['code' => '271', 'name' => 'Shift Malam Gizi', 'start_time' => '19:00:00', 'end_time' => '07:00:00'],
            ['code' => '272', 'name' => 'Shift Pagi HD', 'start_time' => '07:00:00', 'end_time' => '14:00:00'],
            ['code' => '280', 'name' => 'Shift Jantung', 'start_time' => '07:00:00', 'end_time' => '15:30:00'],
            ['code' => '290', 'name' => 'Shift Pagi Gizi', 'start_time' => '07:00:00', 'end_time' => '13:00:00'],
            ['code' => '300', 'name' => 'Kasir Off', 'start_time' => '00:00:00', 'end_time' => '00:00:00'],
            ['code' => '310', 'name' => 'Kasir Pagi', 'start_time' => '07:30:00', 'end_time' => '17:00:00'],
            ['code' => '321', 'name' => 'Kasir Malam', 'start_time' => '19:30:00', 'end_time' => '07:30:00'],
            ['code' => '330', 'name' => 'Kasir Siang', 'start_time' => '14:00:00', 'end_time' => '19:30:00'],
            ['code' => '400', 'name' => 'Libur Shift 24 Jam', 'start_time' => '00:00:00', 'end_time' => '00:00:00'],
            ['code' => '411', 'name' => 'Shift 24 Jam', 'start_time' => '08:00:00', 'end_time' => '08:00:00'],
            ['code' => '421', 'name' => 'Supervisi', 'start_time' => '08:00:00', 'end_time' => '08:00:00'],
            ['code' => '430', 'name' => 'Supervisi Hari Libur', 'start_time' => '07:00:00', 'end_time' => '14:00:00'],
            ['code' => '500', 'name' => 'Radiologi Off', 'start_time' => '00:00:00', 'end_time' => '00:00:00'],
            ['code' => '510', 'name' => 'Radiologi Pagi', 'start_time' => '07:00:00', 'end_time' => '15:00:00'],
            ['code' => '511', 'name' => 'Radiologi Naik Jaga', 'start_time' => '15:00:00', 'end_time' => '08:00:00'],
            ['code' => '521', 'name' => 'Radiologi Piket Malam', 'start_time' => '15:00:00', 'end_time' => '07:00:00'],
            ['code' => '531', 'name' => 'Radiologi Malam', 'start_time' => '20:00:00', 'end_time' => '07:00:00'],
            ['code' => '532', 'name' => 'Radiologi Siang', 'start_time' => '14:00:00', 'end_time' => '20:00:00'],
            ['code' => '600', 'name' => 'Depo 1 Off', 'start_time' => '00:00:00', 'end_time' => '00:00:00'],
            ['code' => '610', 'name' => 'Depo 1 Pagi', 'start_time' => '07:00:00', 'end_time' => '15:00:00'],
            ['code' => '620', 'name' => 'Depo 1 Siang', 'start_time' => '13:00:00', 'end_time' => '19:00:00'],
            ['code' => '621', 'name' => 'Depo 1 Malam', 'start_time' => '19:00:00', 'end_time' => '07:00:00'],
            ['code' => '640', 'name' => 'Depo 1 Pagi Hr Libur', 'start_time' => '08:00:00', 'end_time' => '16:00:00'],
            ['code' => '651', 'name' => 'Depo 1 Naik Jaga', 'start_time' => '16:00:00', 'end_time' => '08:00:00'],
            ['code' => '700', 'name' => 'Lab Off', 'start_time' => '00:00:00', 'end_time' => '00:00:00'],
            ['code' => '710', 'name' => 'Lab Pagi', 'start_time' => '07:00:00', 'end_time' => '14:30:00'],
            ['code' => '712', 'name' => 'Dokter Pagi Hr Libur', 'start_time' => '07:00:00', 'end_time' => '18:00:00'],
            ['code' => '720', 'name' => 'Lab Siang', 'start_time' => '14:30:00', 'end_time' => '20:30:00'],
            ['code' => '731', 'name' => 'Lab Malam', 'start_time' => '20:30:00', 'end_time' => '07:00:00'],
            ['code' => '740', 'name' => 'Depo 1 Pagi Idul Fitri', 'start_time' => '08:00:00', 'end_time' => '18:00:00'],
            ['code' => '741', 'name' => 'Depo 1 (Kode 1)', 'start_time' => '10:00:00', 'end_time' => '09:00:00'],
            ['code' => '751', 'name' => 'Depo 1 (Kode 2)', 'start_time' => '10:00:00', 'end_time' => '09:00:00'],
            ['code' => '761', 'name' => 'Depo 1 (Kode 3)', 'start_time' => '09:00:00', 'end_time' => '08:00:00'],
            ['code' => '771', 'name' => 'Depo 1 (Kode 4)', 'start_time' => '08:00:00', 'end_time' => '08:00:00'],
            ['code' => '800', 'name' => 'Depo 2 Off', 'start_time' => '00:00:00', 'end_time' => '00:00:00'],
            ['code' => '810', 'name' => 'Depo 2 Pagi', 'start_time' => '07:00:00', 'end_time' => '15:00:00'],
            ['code' => '811', 'name' => 'Dokter Malam Hr Lbr', 'start_time' => '18:00:00', 'end_time' => '07:00:00'],
            ['code' => '812', 'name' => 'Dokter Pagi', 'start_time' => '07:00:00', 'end_time' => '14:00:00'],
            ['code' => '814', 'name' => 'Dokter Siang', 'start_time' => '14:00:00', 'end_time' => '20:00:00'],
            ['code' => '820', 'name' => 'Depo 2 Siang', 'start_time' => '13:00:00', 'end_time' => '19:00:00'],
            ['code' => '822', 'name' => 'Depo OK dan Depo HD', 'start_time' => '07:00:00', 'end_time' => '14:00:00'],
            ['code' => '830', 'name' => 'Depo 2 Malam', 'start_time' => '19:00:00', 'end_time' => '07:00:00'],
            ['code' => '840', 'name' => 'Depo 2 Pagi Hr Libur', 'start_time' => '07:00:00', 'end_time' => '16:00:00'],
            ['code' => '850', 'name' => 'Shift Loundry Sabtu', 'start_time' => '07:00:00', 'end_time' => '11:00:00'],
            ['code' => '851', 'name' => 'Depo 2 Naik Jaga', 'start_time' => '16:00:00', 'end_time' => '07:00:00'],
            ['code' => '900', 'name' => 'Cuti Melahirkan', 'start_time' => '00:00:00', 'end_time' => '00:00:00'],
            ['code' => '910', 'name' => 'Pegawai Orientasi', 'start_time' => '06:30:00', 'end_time' => '15:30:00'],
            ['code' => '911', 'name' => 'Dokter Malam', 'start_time' => '20:00:00', 'end_time' => '07:00:00'],
            ['code' => '912', 'name' => 'Kebersihan Pagi', 'start_time' => '05:00:00', 'end_time' => '09:00:00'],
            ['code' => '914', 'name' => 'Kebersihan Siang', 'start_time' => '09:00:00', 'end_time' => '13:00:00'],
            ['code' => '916', 'name' => 'Kebersihan Sore', 'start_time' => '13:00:00', 'end_time' => '17:00:00'],
            ['code' => '920', 'name' => 'Cuti Tahunan', 'start_time' => '00:00:00', 'end_time' => '00:00:00'],
            ['code' => '922', 'name' => 'Depo 3 Siang', 'start_time' => '13:00:00', 'end_time' => '19:00:00'],
            ['code' => '930', 'name' => 'Sakit', 'start_time' => '00:00:00', 'end_time' => '00:00:00'],
            ['code' => '932', 'name' => 'Depo 3 Malam', 'start_time' => '12:00:00', 'end_time' => '00:00:00'],
            ['code' => '940', 'name' => 'Dinas Luar', 'start_time' => '00:00:00', 'end_time' => '00:00:00'],
            ['code' => '942', 'name' => 'Depo 3 Pagi', 'start_time' => '07:00:00', 'end_time' => '15:00:00'],
            ['code' => '950', 'name' => 'Depo 1 Pagi (B)', 'start_time' => '07:30:00', 'end_time' => '12:30:00'],
            ['code' => '951', 'name' => 'Depo Shift Hari Raya', 'start_time' => '07:00:00', 'end_time' => '07:00:00'],
            ['code' => '960', 'name' => 'Depo 1 Dinas Minggu', 'start_time' => '15:30:00', 'end_time' => '20:00:00'],
            ['code' => '970', 'name' => 'Depo 1 Dinas Libur', 'start_time' => '08:00:00', 'end_time' => '16:00:00'],
            ['code' => '980', 'name' => 'Depo Non Shift Siang', 'start_time' => '10:00:00', 'end_time' => '18:00:00'],
            ['code' => '981', 'name' => 'Radioterapi Middle', 'start_time' => '07:00:00', 'end_time' => '15:00:00'],
            ['code' => '990', 'name' => 'Radioterapi Pagi', 'start_time' => '07:00:00', 'end_time' => '15:00:00'],
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

