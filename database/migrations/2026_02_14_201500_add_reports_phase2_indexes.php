<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('timesheets', function (Blueprint $table) {
            $table->index(
                ['status', 'work_date', 'user_id'],
                'timesheets_status_work_date_user_idx'
            );
        });

        Schema::table('time_entries', function (Blueprint $table) {
            $table->index(
                ['timesheet_id', 'project_id'],
                'time_entries_timesheet_project_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('timesheets', function (Blueprint $table) {
            $table->dropIndex('timesheets_status_work_date_user_idx');
        });

        Schema::table('time_entries', function (Blueprint $table) {
            $table->dropIndex('time_entries_timesheet_project_idx');
        });
    }
};
