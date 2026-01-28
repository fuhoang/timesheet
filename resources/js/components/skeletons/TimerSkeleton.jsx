import React from 'react';
import Skeleton from '../ui/Skeleton';

export function TimerSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <Skeleton className="h-10 w-40 bg-gray-200 rounded"  />
            <Skeleton className="h-12 w-32 bg-gray-200 rounded-xl" />
        </div>
    );
}
