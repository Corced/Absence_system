<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule shift recalculation daily at midnight
Schedule::command('shifts:recalculate')->daily();

// Schedule shift assignment from schedules on the 25th of each month for next month
Schedule::command('shifts:assign-from-schedules --month='.(date('n')+1))->monthlyOn(25, '00:00');