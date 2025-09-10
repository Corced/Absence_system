<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
<<<<<<< HEAD
            $table->string('nip')->unique()->after('email');
=======
            $table->string('nip')->nullable()->after('id');
>>>>>>> 4914dad0a799135b7ba1c29d0ade2e0ff3fa9b05
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
<<<<<<< HEAD
            $table->dropUnique(['nip']);
=======
>>>>>>> 4914dad0a799135b7ba1c29d0ade2e0ff3fa9b05
            $table->dropColumn('nip');
        });
    }
};

