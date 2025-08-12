<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();                      // e.g. 0, 1, 2, 3 matching folder labels
            $table->string('name');       // employee name, e.g. 'employee_0'
            $table->string('email');     // e.g : employee@example.com 
            $table->string('position')->nullable(); // optional
            $table->timestamps();              // created_at, updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
