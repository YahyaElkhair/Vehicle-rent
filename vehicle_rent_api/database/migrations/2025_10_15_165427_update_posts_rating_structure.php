<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // Remove old star count columns
            $table->dropColumn([
                'five_star_count',
                'four_star_count',
                'three_star_count',
                'two_star_count',
                'one_star_count'
            ]);

            // Change average_rating precision
            $table->decimal('average_rating', 3, 2)->default(0.00)->change();

            // Add new JSON column for rating distribution
            $table->json('rating_distribution')->nullable()
                ->comment('{"5":10,"4":5,"3":2,"2":1,"1":0}');

            // Add index for rating-based queries
            $table->index('average_rating');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // Restore old columns
            $table->unsignedInteger('five_star_count')->default(0);
            $table->unsignedInteger('four_star_count')->default(0);
            $table->unsignedInteger('three_star_count')->default(0);
            $table->unsignedInteger('two_star_count')->default(0);
            $table->unsignedInteger('one_star_count')->default(0);

            // Revert average_rating
            $table->decimal('average_rating', 3, 1)->default(0.0)->change();

            // Remove new columns
            $table->dropColumn('rating_distribution');
            $table->dropIndex(['average_rating']);
        });
    }
};
