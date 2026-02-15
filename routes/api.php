<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TimesheetController;
use App\Http\Controllers\Api\TimeEntryController;
use App\Http\Controllers\Api\Admin\AdminTimesheetController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\Admin\AdminProjectController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\ConfigHealthController;


/*
|--------------------------------------------------------------------------
| API Routes for React SPA
|--------------------------------------------------------------------------
*/

Route::middleware(['web'])->group(function () {
    Route::get('/health', [HealthController::class, 'health']);
    Route::get('/ready', [HealthController::class, 'ready']);

    // Public: only login/register
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return $request->user();
    })->middleware('auth:sanctum');

    // Authenticated users
    Route::middleware(['auth:sanctum'])->group(function () {

        // Projects (non-admin list)
        Route::apiResource('projects', ProjectController::class)->only(['index']);

        // Reports
        Route::get('/reports', [ReportController::class, 'index']);

        // Timesheets
        Route::get('/timesheets/today', [TimesheetController::class, 'today']);
        Route::get('/timesheets/week', [TimesheetController::class, 'week']);
        Route::post('/timesheets/submit-week', [TimesheetController::class, 'submitWeek']);

        // Time Entries
        Route::prefix('time-entries')->group(function () {
            Route::post('start', [TimeEntryController::class, 'start']);
            Route::post('stop', [TimeEntryController::class, 'stop']);
            Route::get('running', [TimeEntryController::class, 'running']);
            Route::patch('{timeEntry}', [TimeEntryController::class, 'update']);
        });
    });

    // Admin-only routes
    Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
        Route::get('/config/health', [ConfigHealthController::class, 'index']);

        // Projects
        Route::apiResource('projects', AdminProjectController::class)->only(['index', 'store', 'update', 'destroy']);

        // Users + project assignments
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::put('/users/{user}/projects', [AdminUserController::class, 'updateProjects']);

        // Timesheets
        Route::get('/timesheets', [AdminTimesheetController::class, 'index']);
        Route::post('/timesheets/bulk-approve', [AdminTimesheetController::class, 'bulkApprove'])
            ->middleware('throttle:15,1');
        Route::post('/timesheets/bulk-reject', [AdminTimesheetController::class, 'bulkReject'])
            ->middleware('throttle:15,1');
        Route::get('/timesheets/{timesheet}', [AdminTimesheetController::class, 'show']);
        Route::get('/timesheets/{timesheet}/history', [AdminTimesheetController::class, 'history']);
        Route::patch('/timesheets/{timesheet}/note', [AdminTimesheetController::class, 'updateNote']);
        Route::patch('/time-entries/{timeEntry}/note', [AdminTimesheetController::class, 'updateEntryNote']);
        Route::post('/timesheets/{timesheet}/approve', [AdminTimesheetController::class, 'approve']);
        Route::post('/timesheets/{timesheet}/reject', [AdminTimesheetController::class, 'reject']);
        Route::post('/timesheets/{timesheet}/unlock', [AdminTimesheetController::class, 'unlock']);
    });
});
