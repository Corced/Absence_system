<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'name',
        'email',
        'position',
        'user_id',
        'shift_id', // Add shift_id to fillable if not already present
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function shiftAssignments()
    {
        return $this->hasMany(EmployeeShiftAssignment::class);
    }
}