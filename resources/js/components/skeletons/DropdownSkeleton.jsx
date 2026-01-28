import React from 'react';
import Skeleton from '../ui/Skeleton';

export function DropdownSkeleton() {
    return (
        <div className="animate-pulse">
            <Skeleton className="h-10 bg-gray-200 rounded-lg" />
        </div>
    );
}
