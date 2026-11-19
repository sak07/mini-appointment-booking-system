<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    // Demo data: one admin, one customer, four services.
    // updateOrCreate = safe to run more than once (no duplicates).
    public function run(): void
    {
        User::updateOrCreate(['email' => 'admin@example.com'], [
            'name' => 'Admin',
            'password' => 'password', // hashed automatically by the User model
            'role' => 'admin',
        ]);

        User::updateOrCreate(['email' => 'customer@example.com'], [
            'name' => 'Demo Customer',
            'phone' => '+971500000000',
            'password' => 'password',
            'role' => 'customer',
        ]);

        $services = [
            ['name' => 'Haircut & Styling', 'description' => 'A classic haircut finished with a wash and style.', 'duration_minutes' => 45, 'price' => 80],
            ['name' => 'Beard Trim', 'description' => 'Shape and trim with a hot towel finish.', 'duration_minutes' => 30, 'price' => 40],
            ['name' => 'Facial Treatment', 'description' => 'Deep cleansing facial for all skin types.', 'duration_minutes' => 60, 'price' => 150],
            ['name' => 'Full Body Massage', 'description' => 'Relaxing 60-minute full body massage.', 'duration_minutes' => 60, 'price' => 220],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(['name' => $service['name']], $service);
        }
    }
}
