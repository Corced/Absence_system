<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'nip',
        'name',
        'email',
        'nip',
        'position',
        'user_id',
        'shift_id', // Add shift_id to fillable if not already present
    ];

    public function setShiftIdAttribute($value): void
    {
        $resolved = \App\Models\Shift::resolveIdFromIdOrCode($value);
        $this->attributes['shift_id'] = $resolved;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    /**
     * Automatically assign shift based on most frequent schedule codes
     */
    public function assignShiftFromSchedules($year = null, $month = null)
    {
        if (!$year) {
            $year = date('Y');
        }
        if (!$month) {
            $month = date('n');
        }

        // Get schedules for the specified period
        $schedules = $this->schedules()
            ->where('year', $year)
            ->where('month', $month)
            ->get();

        if ($schedules->isEmpty()) {
            return null;
        }

        // Count frequency of each shift code
        $shiftCounts = [];
        foreach ($schedules as $schedule) {
            for ($i = 1; $i <= 31; $i++) {
                $dayKey = 'h' . $i;
                $shiftCode = $schedule->$dayKey;
                
                if ($shiftCode && $shiftCode !== 'OFF' && $shiftCode !== '') {
                    $shiftCounts[$shiftCode] = ($shiftCounts[$shiftCode] ?? 0) + 1;
                }
            }
        }

        if (empty($shiftCounts)) {
            return null;
        }

        // Find the most frequent shift code
        $mostFrequentCode = array_keys($shiftCounts, max($shiftCounts))[0];
        
        // Find the shift by code
        $shift = Shift::where('code', $mostFrequentCode)->first();
        
        if ($shift) {
            $this->shift_id = $shift->id;
            $this->save();
            return $shift;
        }

        return null;
    }

    /**
     * Get current shift based on schedule and time
     */
    public function getCurrentShift()
    {
        $now = now();
        $year = $now->year;
        $month = $now->month;
        $day = $now->day;

        // Get today's schedule
        $schedule = $this->schedules()
            ->where('year', $year)
            ->where('month', $month)
            ->first();

        if (!$schedule) {
            return $this->shift; // Fallback to default shift
        }

        $dayKey = 'h' . $day;
        $shiftCode = $schedule->$dayKey;

        if (!$shiftCode || $shiftCode === 'OFF' || $shiftCode === '') {
            return null; // No shift today
        }

        // Find shift by code
        $shift = Shift::where('code', $shiftCode)->first();
        return $shift ?: $this->shift;
    }
}