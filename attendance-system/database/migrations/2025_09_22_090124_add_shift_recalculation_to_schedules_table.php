<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->timestamp('last_updated_at')->nullable()->after('updated_at');
            $table->boolean('needs_shift_recalculation')->default(false)->after('last_updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropColumn(['last_updated_at', 'needs_shift_recalculation']);
        });
    }
};