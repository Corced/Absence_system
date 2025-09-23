<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class Schedule extends Model
{
    protected $fillable = [
        'employee_id', 'year', 'month',
        'h1','h2','h3','h4','h5','h6','h7','h8','h9','h10',
        'h11','h12','h13','h14','h15','h16','h17','h18','h19','h20',
        'h21','h22','h23','h24','h25','h26','h27','h28','h29','h30','h31',
        'needs_shift_recalculation'
    ];

    protected static function booted()
    {
        static::saving(function ($schedule) {
            // Mark for recalculation if any day field is being changed
            if ($schedule->isDirty(array_map(fn($i) => 'h'.$i, range(1, 31)))) {
                $schedule->needs_shift_recalculation = true;
                $schedule->last_updated_at = now();
            }
        });

        static::saved(function ($schedule) {
            // Process shift recalculation after save if needed
            if ($schedule->needs_shift_recalculation) {
                $schedule->recalculateEmployeeShift();
            }
        });
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function recalculateEmployeeShift()
    {
        try {
            $employee = $this->employee;
            if ($employee) {
                $assignedShift = $employee->assignShiftFromSchedules($this->year, $this->month);
                
                if ($assignedShift) {
                    Log::info("Shift updated for employee {$employee->name} to {$assignedShift->name} based on schedule changes");
                }
                
                // Reset the flag
                $this->update(['needs_shift_recalculation' => false]);
            }
        } catch (\Exception $e) {
            Log::error("Failed to recalculate shift for schedule {$this->id}: " . $e->getMessage());
        }
    }
}