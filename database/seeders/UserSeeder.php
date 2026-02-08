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
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'is_admin' => 1,
        ]);

        User::create([
            'name' => 'John Doe',
            'email' => 'user@test.com',
            'password' => Hash::make('password'),
            'is_admin' => 0,
        ]);

        User::create([
            'name' => 'Fu Hoang',
            'email' => 'fu@test.com',
            'password' => Hash::make('password'),
            'is_admin' => 0,
        ]);

        User::factory()->count(17)->create();
    }
}
