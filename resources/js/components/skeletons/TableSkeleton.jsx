import React from 'react';
import Skeleton from '../ui/Skeleton';

export function TableSkeleton({ rows = 5 }) {
    return (
        <div className="space-y-3 p-4">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-16 ml-auto" />
                </div>
            ))}
        </div>
    );
}
