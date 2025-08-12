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
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}