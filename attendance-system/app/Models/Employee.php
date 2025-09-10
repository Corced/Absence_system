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
}