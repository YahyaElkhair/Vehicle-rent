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
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->constrained('agencies')->onDelete('cascade');
            $table->foreignId('vehicle_id')->unique()->constrained('vehicles')->onDelete('cascade');

            // Post details
            $table->string('title');
            $table->text('description');
            $table->enum('status', ['draft', 'published'])->default('draft');


            // delevry options
            $table->json('delivery_options')->default(json_encode(['agency pickup']));

            // Requirements
            $table->unsignedInteger('min_driver_age')->default(21);
            $table->unsignedInteger('min_license_years')->default(2);

            // Statistics
            $table->unsignedInteger('view_count')->default(0);
            $table->unsignedInteger('rental_count')->default(0);

            $table->decimal('average_rating', 3, 2)->default(0.00)->comment('0.00 to 5.00');
            $table->unsignedInteger('total_reviews')->default(0);

            $table->json('rating_distribution')->nullable();

            // SEO
            $table->string('slug')->unique();
            $table->text('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('tags')->nullable();


            $table->timestamps();
            // $table->softDeletes();

            // Indexes
            $table->index(['agency_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
