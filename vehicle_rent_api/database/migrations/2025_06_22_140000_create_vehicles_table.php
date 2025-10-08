<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->constrained()->onDelete('cascade');
            $table->string('brand');
            $table->string('model');
            $table->year('year');
            $table->string('color');
            $table->string('license_plate')->unique();
            $table->string('vin')->unique();
            $table->integer('mileage');
            $table->string('engine_type');
            $table->string('transmission');
            $table->string('fuel_type');
            $table->integer('seats');
            $table->integer('doors');
            $table->enum('type' , ['car' , 'motorcycle' , 'truck'])->default('car');

            // Rental information
            $table->decimal('price_per_day', 10, 2);
            $table->decimal('price_per_week', 10, 2)->nullable();
            $table->decimal('price_per_month', 10, 2)->nullable();
            $table->decimal('discount_rate', 5, 2)->nullable()->default(0);
            $table->unsignedInteger('minimum_rental_days')->default(1);

            $table->enum('status' , ['available', 'not available' , 'rented'])->default('available');
            $table->text('description')->nullable();
            $table->json('images');
            $table->json('features')->nullable()->comment('AC, GPS, etc');
            $table->decimal('delivery_fee_per_km', 8, 2)->default(0);

            // Availability
            $table->date('available_from');
            $table->date('available_to')->nullable();
            $table->json('blackout_dates')->nullable()->comment('Dates when not available');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
