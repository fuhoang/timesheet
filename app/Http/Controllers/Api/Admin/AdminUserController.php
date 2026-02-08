<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max((int) $request->query('per_page', 10), 1);

        return response()->json([
            'users' => User::query()
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
        $user->projects()->sync($ids);

        return response()->json([
            'message' => 'Projects updated',
            'projects' => $user->projects()->get(['id', 'name']),
        ]);
    }
}
