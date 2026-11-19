<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // When the Node.js service accepted the confirmation email for this booking.
    // NULL = not sent (e.g. the notification service was down).
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->timestamp('notification_sent_at')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('notification_sent_at');
        });
    }
};
