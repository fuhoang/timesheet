import React from 'react';
import Button from '../../../components/ui/Button';

export default function AdminUsersPagination({ pagination, onPageChange }) {
    if (pagination.last_page <= 1) return null;

    return (
        <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
                Page {pagination.current_page} of {pagination.last_page}
            </div>
            <div className="flex items-center gap-2">
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
            </div>
        </div>
    );
}
