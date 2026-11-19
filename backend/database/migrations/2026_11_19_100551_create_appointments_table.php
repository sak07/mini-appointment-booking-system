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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();    // who booked
            $table->foreignId('service_id')->constrained()->cascadeOnDelete(); // what they booked
            $table->date('appointment_date');
            $table->string('appointment_time', 5);                 // "HH:MM", e.g. "10:00"
            $table->string('status', 20)->default('pending');      // pending | confirmed | completed | cancelled
            $table->text('notes')->nullable();
            $table->timestamps();

            // Speeds up the "is this service already booked at this date + time?" lookup.
            $table->index(['service_id', 'appointment_date', 'appointment_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
