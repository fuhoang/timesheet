<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminProjectAssignmentLog;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max((int) $request->query('per_page', 10), 1);
        $queryText = trim((string) $request->query('q', ''));
        $role = $request->query('role');

        return response()->json([
            'users' => User::query()
                ->when($queryText !== '', function ($query) use ($queryText) {
                    $query->where(function ($sub) use ($queryText) {
                        $sub->where('name', 'like', "%{$queryText}%")
                            ->orWhere('email', 'like', "%{$queryText}%");
                    });
                })
                ->when($role === 'admin', fn ($query) => $query->where('is_admin', 1))
                ->when($role === 'user', fn ($query) => $query->where('is_admin', 0))
                ->orderBy('name')
                ->with(['projects:id,name'])
                ->paginate($perPage, ['id', 'name', 'email', 'is_admin']),
            'projects' => Project::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function updateProjects(Request $request, User $user)
    {
        $data = $request->validate([
            'project_ids' => 'array',
            'project_ids.*' => 'integer|exists:projects,id',
        ]);

        $ids = $data['project_ids'] ?? [];
        $beforeIds = $user->projects()->pluck('projects.id')->sort()->values()->all();
        $afterIds = collect($ids)->sort()->values()->all();

        $user->projects()->sync($ids);

        if ($beforeIds !== $afterIds) {
            AdminProjectAssignmentLog::create([
                'admin_id' => $request->user()->id,
                'user_id' => $user->id,
                'before_project_ids' => $beforeIds,
                'after_project_ids' => $afterIds,
            ]);
        }

        return response()->json([
            'message' => 'Projects updated',
            'projects' => $user->projects()->get(['id', 'name']),
        ]);
    }
}
