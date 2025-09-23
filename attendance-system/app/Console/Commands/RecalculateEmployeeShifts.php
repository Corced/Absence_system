<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Employee;

class RecalculateEmployeeShifts extends Command
{
    protected $signature = 'shifts:recalculate {--year=} {--month=} {--all}';
    protected $description = 'Recalculate employee shifts based on schedule data';

    public function handle()
    {
        $year = $this->option('year') ?: date('Y');
        $month = $this->option('month') ?: date('n');
        $processAll = $this->option('all');

        if ($processAll) {
            $this->info("Recalculating shifts for all historical data...");
            // You might want to implement batch processing for all months
        } else {
            $this->info("Recalculating shifts for {$year}-{$month}...");
        }

        $updatedCount = Employee::recalculateAllShifts($year, $month);

        $this->info("Completed! Updated shifts for {$updatedCount} employees.");
        return Command::SUCCESS;
    }
}