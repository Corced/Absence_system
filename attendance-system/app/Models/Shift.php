<?php

  namespace App\Models;

  use Illuminate\Database\Eloquent\Model;

  class Shift extends Model
  {
      protected $fillable = [
          'code',
          'name',
          'start_time',
          'end_time',
          'timezone',
      ];

      public function employees()
      {
          return $this->hasMany(Employee::class);
      }

      public static function resolveIdFromIdOrCode($idOrCode): ?int
      {
          if (is_null($idOrCode)) {
              return null;
          }
          if (is_numeric($idOrCode)) {
              return (int) $idOrCode;
          }
          $shift = static::where('code', (string) $idOrCode)->first();
          return $shift?->id;
      }
  }