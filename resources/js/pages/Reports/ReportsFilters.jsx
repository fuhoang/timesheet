import React from 'react';

export default function ReportsFilters({
    startDate,
    endDate,
    status,
    includeDrafts,
    projectId,
    userId,
    sort,
    direction,
    perPage,
    projects,
    users,
    totalRows,
    presetName,
    presets,
    onStartDateChange,
    onEndDateChange,
    onStatusChange,
    onIncludeDraftsChange,
    onProjectChange,
    onUserChange,
    onSortChange,
    onDirectionChange,
    onPerPageChange,
    onPresetNameChange,
    onPresetSelect,
    onPresetSave,
    onPresetRemove,
}) {
    return (
        <div className="sticky top-4 z-10 bg-gray-50/80 backdrop-blur">
            <div className="bg-white border rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs uppercase text-gray-500">Start</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={event => onStartDateChange(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-500">End</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={event => onEndDateChange(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-500">Status</label>
                        <select
                            value={status}
                            onChange={event => onStatusChange(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            <option value="">All statuses</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-500">Project</label>
                        <select
                            value={projectId}
                            onChange={event => onProjectChange(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            <option value="">All projects</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {users.length > 1 ? (
                        <div>
                            <label className="text-xs uppercase text-gray-500">User</label>
                            <select
                                value={userId}
                                onChange={event => onUserChange(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            >
                                <option value="">All users</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div />
                    )}
                    <div>
                        <label className="text-xs uppercase text-gray-500">Sort</label>
                        <select
                            value={sort}
                            onChange={event => onSortChange(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            <option value="total_minutes">Total minutes</option>
                            <option value="name">User name</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-500">Direction</label>
                        <select
                            value={direction}
                            onChange={event => onDirectionChange(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-500">Per page</label>
                        <select
                            value={perPage}
                            onChange={event => onPerPageChange(Number(event.target.value))}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {['', 'submitted', 'approved', 'rejected', 'draft'].map(value => {
                        const label = value ? value : 'all';
                        const active = status === value;
                        return (
                            <button
                                key={`status-chip-${label}`}
                                type="button"
                                onClick={() => onStatusChange(value)}
                                className={`px-3 py-1 rounded-full border text-xs uppercase ${
                                    active
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={includeDrafts}
                            onChange={event => onIncludeDraftsChange(event.target.checked)}
                        />
                        Include drafts
                    </label>
                    {!includeDrafts && !status && (
                        <span className="text-xs text-gray-400">Drafts excluded.</span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="text-xs uppercase text-gray-500">Presets</div>
                    <select
                        value=""
                        onChange={event => onPresetSelect(event.target.value)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                        <option value="">Select preset</option>
                        {presets.map(preset => (
                            <option key={preset.name} value={preset.name}>
                                {preset.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={presetName}
                        onChange={event => onPresetNameChange(event.target.value)}
                        placeholder="Preset name"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <button
                        type="button"
                        onClick={onPresetSave}
                        className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                    >
                        Save preset
                    </button>
                    <div className="text-sm text-gray-600">{totalRows} users total</div>
                </div>

                {presets.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {presets.map(preset => (
                            <div
                                key={`preset-${preset.name}`}
                                className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-600"
                            >
                                <span>{preset.name}</span>
                                <button
                                    type="button"
                                    onClick={() => onPresetRemove(preset.name)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
