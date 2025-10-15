<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->enum('pickup_type', ['pickup', 'delivery'])->default('pickup')->change();
        });
    }

    public function down()
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->enum('pickup_type', ['self pickup', 'delivery'])->default('self pickup')->change();
        });
    }
};
