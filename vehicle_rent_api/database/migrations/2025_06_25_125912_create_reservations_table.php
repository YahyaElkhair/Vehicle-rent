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
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();

            // Relationships
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('agency_id')->constrained('agencies')->onDelete('cascade');
            $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade');

            // $table->foreignId('post_id')->constrained('posts')->onDelete('cascade');
            // $table->foreignId('payment_id')->nullable()->constrained('payments')->onDelete('set null');

            // Reservation details
            $table->string('reservation_number')->unique();
            $table->dateTime('pickup_date');
            $table->dateTime('return_date');

            $table->enum('pickup_type', ['pickup', 'delivery'])->default('pickup')->change();
            $table->json('pickup_coordinations')->nullable();
            $table->json('delevry_coordinations')->nullable();
            $table->json('return_coordinations')->nullable();

            $table->enum('status', [
                'pending',
                'confirmed',
                'paid',
                'active',
                'completed',
                'cancelled',
                'refunded'
            ])->default('pending');

            // Cancellation
            $table->text('cancellation_reason')->nullable();
            $table->decimal('refund_amount', 10, 2)->nullable();

            // Pricing information
            $table->decimal('daily_rate', 10, 2);
            $table->decimal('total_amount', 12, 2);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->decimal('final_amount', 12, 2);

            // Driver information
            // $table->string('driver_full_name');
            // $table->string('driver_email');
            // $table->string('driver_phone');
            // $table->date('driver_birth_date');
            // $table->string('driver_license_number');
            // $table->string('driver_license_country');
            // $table->date('driver_license_issue_date');
            // $table->date('driver_license_expiry_date');

            // Insurance options
            // $table->string('insurance_type');
            // $table->decimal('insurance_cost', 10, 2);
            // $table->text('insurance_coverage')->nullable();

            // Additional options
            $table->json('additional_equipment')->nullable(); // ['child_seat', 'gps', etc]
            $table->decimal('equipment_cost', 10, 2)->default(0);

            // Trip details (filled after return)
            // $table->integer('starting_mileage')->nullable();
            // $table->integer('ending_mileage')->nullable();
            // $table->text('damage_report')->nullable();
            // $table->decimal('extra_charges', 10, 2)->nullable();
            // $table->text('extra_charges_notes')->nullable();


            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['reservation_number']);
            $table->index(['client_id', 'status']);
            $table->index(['pickup_date', 'return_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
