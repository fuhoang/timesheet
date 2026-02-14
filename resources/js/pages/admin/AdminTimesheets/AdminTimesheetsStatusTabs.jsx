import React from 'react';
import Button from '../../../components/ui/Button';

const STATUS_TABS = [
    { label: 'All', value: '' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Draft', value: 'draft' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Approved', value: 'approved' },
];

export default function AdminTimesheetsStatusTabs({ currentStatus, onSelect }) {
    return (
        <div className="bg-white p-3 rounded-2xl shadow border flex flex-wrap gap-2">
            {STATUS_TABS.map(tab => {
                const isActive = currentStatus === tab.value;
                return (
                    <Button
                        key={tab.value}
                        type="button"
                        onClick={() => onSelect(tab.value)}
                        variant={isActive ? 'primary' : 'secondary'}
                        size="sm"
                        className={`rounded-full ${isActive ? 'border border-blue-600' : 'border-gray-200'}`}
                    >
                        {tab.label}
                    </Button>
                );
            })}
        </div>
    );
}
