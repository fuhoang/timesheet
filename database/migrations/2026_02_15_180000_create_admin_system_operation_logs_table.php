<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_system_operation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->unsignedInteger('affected_count')->default(0);
            $table->boolean('dry_run')->default(false);
            $table->string('request_id')->nullable();
            $table->json('context')->nullable();
            $table->timestamps();

            $table->index(['action', 'created_at'], 'admin_system_op_logs_action_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_system_operation_logs');
    }
};

