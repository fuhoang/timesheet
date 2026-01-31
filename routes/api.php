<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TimesheetController;
use App\Http\Controllers\Api\TimeEntryController;
use App\Http\Controllers\Api\Admin\AdminTimesheetController;
use App\Http\Controllers\Api\Admin\AdminProjectController;


/*
|--------------------------------------------------------------------------
| API Routes for React SPA
|--------------------------------------------------------------------------
*/

Route::middleware(['web'])->group(function () {

    // Public: only login/register
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return $request->user();
    })->middleware('auth:sanctum');

    // Authenticated users
    Route::middleware(['auth:sanctum'])->group(function () {

        // Projects
        Route::apiResource('projects', AdminProjectController::class)->only(['index', 'store', 'update', 'destroy']);

        // Timesheets
        Route::get('/timesheets/today', [TimesheetController::class, 'today']);
        Route::get('/timesheets/week', [TimesheetController::class, 'week']);
        Route::post('/timesheets/submit-week', [TimesheetController::class, 'submitWeek']);

        // Time Entries
        Route::prefix('time-entries')->group(function () {
            Route::post('start', [TimeEntryController::class, 'start']);
            Route::post('stop', [TimeEntryController::class, 'stop']);
            Route::get('running', [TimeEntryController::class, 'running']);
        });
    });

    // Admin-only routes
    Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
        // Timesheets
        Route::get('/timesheets', [AdminTimesheetController::class, 'index']);
        Route::get('/timesheets/{timesheet}', [AdminTimesheetController::class, 'show']);
        Route::post('/timesheets/{timesheet}/approve', [AdminTimesheetController::class, 'approve']);
        Route::post('/timesheets/{timesheet}/reject', [AdminTimesheetController::class, 'reject']);
        Route::post('/timesheets/{timesheet}/unlock', [AdminTimesheetController::class, 'unlock']);
    });
});
