import React from 'react';
import Skeleton from '../ui/Skeleton';

export function TableSkeleton({ rows = 5 }) {
    return (
        <div className="animate-pulse divide-y">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex px-4 py-4 gap-4">
                    <Skeleton className="h-4 w-1/4 bg-gray-200 rounded" />
                    <Skeleton className="h-4 w-1/4 bg-gray-200 rounded" />
                    <Skeleton className="h-4 w-20 bg-gray-200 rounded ml-auto" />
                </div>
            ))}
        </div>
    );
}
