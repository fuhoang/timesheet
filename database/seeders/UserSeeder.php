<?php
// database/seeders/UserSeeder.php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $seedUsers = [
            [
                'name' => 'Admin User',
                'email' => 'admin@test.com',
                'is_admin' => 1,
            ],
            [
                'name' => 'John Doe',
                'email' => 'user@test.com',
                'is_admin' => 0,
            ],
            [
                'name' => 'Fu Hoang',
                'email' => 'fu@test.com',
                'is_admin' => 0,
            ],
        ];

        foreach ($seedUsers as $seedUser) {
            User::updateOrCreate(
                ['email' => $seedUser['email']],
                [
                    'name' => $seedUser['name'],
                    'password' => Hash::make('password'),
                    'is_admin' => $seedUser['is_admin'],
                ]
            );
        }

        $targetUsers = 20;
        $missing = max(0, $targetUsers - User::count());
        if ($missing > 0) {
            User::factory()->count($missing)->create();
        }
    }
}
