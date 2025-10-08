<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained()->onDelete('cascade');

            // Payment details
            $table->enum('payment_method', ['credit_card', 'paypal', 'cash'])->default('paypal');
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->enum('status', ['CREATED', 'COMPLETED', 'APPROVED', 'FAILED', 'REFUNDED'])->default('CREATED');

            // Generic payment fields
            $table->string('transaction_id')->nullable();
            $table->json('details')->nullable();

            // Timestamps
            $table->timestamps();

            // Indexes
            $table->index('reservation_id');
            $table->index('transaction_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
