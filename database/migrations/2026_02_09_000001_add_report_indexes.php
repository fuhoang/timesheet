<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timesheets', function (Blueprint $table) {
            $table->index(['work_date', 'status'], 'timesheets_work_date_status_idx');
            $table->index(['user_id', 'work_date'], 'timesheets_user_work_date_idx');
        });

        Schema::table('time_entries', function (Blueprint $table) {
            $table->index(['project_id', 'timesheet_id'], 'time_entries_project_timesheet_idx');
        });
    }

    public function down(): void
    {
        Schema::table('timesheets', function (Blueprint $table) {
            $table->dropIndex('timesheets_work_date_status_idx');
            $table->dropIndex('timesheets_user_work_date_idx');
        });

        Schema::table('time_entries', function (Blueprint $table) {
            $table->dropIndex('time_entries_project_timesheet_idx');
        });
    }
};
