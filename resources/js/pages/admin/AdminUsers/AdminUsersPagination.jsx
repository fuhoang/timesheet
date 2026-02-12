import React from 'react';
import Button from '../../../components/ui/Button';

export default function AdminUsersPagination({ pagination, onPageChange }) {
    if (pagination.last_page <= 1) return null;

    return (
        <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
                Page {pagination.current_page} of {pagination.last_page}
                <span className="ml-2 text-xs text-gray-400">
                    ({pagination.from}-{pagination.to} of {pagination.total})
                </span>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(1)}
                    disabled={pagination.current_page <= 1}
                >
                    First
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onPageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                >
                    Previous
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onPageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                >
                    Next
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(pagination.last_page)}
                    disabled={pagination.current_page >= pagination.last_page}
                >
                    Last
                </Button>
            </div>
        </div>
    );
}
