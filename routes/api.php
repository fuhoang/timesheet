<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TimesheetController;
use App\Http\Controllers\Api\TimeEntryController;
use App\Http\Controllers\Api\Admin\AdminTimesheetController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| These routes are used by the React SPA.
| Authentication is handled by Sanctum session cookies.
*/

Route::middleware(['web', 'auth:sanctum'])->group(function () {

    // authenticated user
    Route::get('/user', function (Illuminate\Http\Request $request) {
        return $request->user();
    });

    // projects
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);

    // timesheets
    Route::get('/timesheets/today', [TimesheetController::class, 'today']);
    Route::get('/timesheets/week', [TimesheetController::class, 'week']);
    Route::post('/timesheets/submit-week', [TimesheetController::class, 'submitWeek']);

    // time entries
    Route::post('/time-entries/start', [TimeEntryController::class, 'start']);
    Route::post('/time-entries/stop', [TimeEntryController::class, 'stop']);
    Route::get('/time-entries/running', [TimeEntryController::class, 'running']);

    Route::apiResource('projects', \App\Http\Controllers\Api\Admin\ProjectController::class);

});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/timesheets', [AdminTimesheetController::class, 'index']);
    Route::get('/timesheets/{timesheet}', [AdminTimesheetController::class, 'show']);

    Route::post('/timesheets/{timesheet}/approve', [AdminTimesheetController::class, 'approve']);
    Route::post('/timesheets/{timesheet}/reject', [AdminTimesheetController::class, 'reject']);

    Route::post('/timesheets/{timesheet}/unlock', [AdminTimesheetController::class, 'unlock']);
});

