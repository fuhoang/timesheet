<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TimesheetController;
use App\Http\Controllers\Api\TimeEntryController;

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


    // time entries
    Route::post('/time-entries/start', [TimeEntryController::class, 'start']);
    Route::post('/time-entries/stop', [TimeEntryController::class, 'stop']);

    Route::get('/time-entries/running', [TimeEntryController::class, 'running']);

    Route::apiResource('projects', \App\Http\Controllers\Api\Admin\ProjectController::class);

});
