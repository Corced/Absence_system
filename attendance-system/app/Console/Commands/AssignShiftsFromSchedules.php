<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Employee;

class AssignShiftsFromSchedules extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'shifts:assign-from-schedules {--year=} {--month=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically assign shifts to employees based on their schedule patterns';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $year = $this->option('year') ?: date('Y');
        $month = $this->option('month') ?: date('n');

        $this->info("Assigning shifts for {$year}-{$month}...");

        $employees = Employee::all();
        $assignedCount = 0;
        $skippedCount = 0;

        foreach ($employees as $employee) {
            $this->line("Processing employee: {$employee->name} (NIP: {$employee->nip})");
            
            $assignedShift = $employee->assignShiftFromSchedules($year, $month);
            
            if ($assignedShift) {
                $this->info("  ✓ Assigned shift: {$assignedShift->name} ({$assignedShift->code})");
                $assignedCount++;
            } else {
                $this->warn("  - No shift assigned (no schedule data or no valid shift codes)");
                $skippedCount++;
            }
        }

        $this->newLine();
        $this->info("Summary:");
        $this->info("  - Employees processed: " . $employees->count());
        $this->info("  - Shifts assigned: {$assignedCount}");
        $this->info("  - Skipped: {$skippedCount}");
        
        return Command::SUCCESS;
    }
}
