<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('timesheet_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('timesheet_id')->constrained()->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_role')->nullable();
            $table->text('reason')->nullable();
            $table->json('context')->nullable();
            $table->timestamps();

            $table->index(['timesheet_id', 'created_at'], 'timesheet_status_histories_sheet_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timesheet_status_histories');
    }
};
