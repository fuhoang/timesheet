<?php
// database/seeders/TimesheetSeeder.php

namespace Database\Seeders;

use App\Models\Timesheet;
use App\Models\User;
use Illuminate\Database\Seeder;

class TimesheetSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'user@test.com')->first();

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 120,
        ]);
    }
}

