<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'shift_id')) {
                $table->foreignId('shift_id')->nullable()->constrained('shifts')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'shift_id')) {
                $table->dropConstrainedForeignId('shift_id');
            }
        });
    }
};

