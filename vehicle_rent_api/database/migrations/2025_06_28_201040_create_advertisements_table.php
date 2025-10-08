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
        Schema::create('advertisements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->onDelete('cascade');

            $table->decimal('amount', 10, 2); // Paid amount
            $table->enum('status', ['pending', 'active', 'expired', 'cancelled'])->default('active');
            $table->integer('duration_days')->default(7); // How long the boost lasts
            $table->enum('advertisement_type', ['standard', 'premium'])->default('standard');
            $table->dateTime('starts_at')->default(now());
            $table->dateTime('ends_at');

            $table->string('paypal_order_id')->nullable(); // PayPal order ref
            $table->timestamps();
            $table->softDeletes();
            
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advertisements');
    }
};
