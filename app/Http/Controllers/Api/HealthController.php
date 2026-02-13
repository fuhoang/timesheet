<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'app' => 'timesheet',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function ready(): JsonResponse
    {
        try {
            DB::connection()->getPdo();

            return response()->json([
                'status' => 'ready',
                'db' => 'ok',
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'not_ready',
                'db' => 'error',
                'timestamp' => now()->toIso8601String(),
            ], 503);
        }
    }
}

