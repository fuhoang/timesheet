import React from 'react';

export default function Button({
    variant = 'primary',
    size = 'md',
    className = '',
    type = 'button',
    ...props
}) {
    const base =
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-60';
    const sizes = {
        xs: 'text-xs px-2 py-1',
        sm: 'text-sm px-3 py-1.5',
        md: 'text-sm px-4 py-2',
        lg: 'text-base px-5 py-2.5',
    };
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700',
        success: 'bg-green-600 text-white hover:bg-green-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        link: 'text-indigo-600 hover:text-indigo-700 dark:text-blue-300 dark:hover:text-blue-200 p-0',
        'link-muted': 'text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-white p-0',
        'link-success': 'text-green-600 hover:text-green-700 p-0',
        'link-danger': 'text-red-600 hover:text-red-700 p-0',
    };

    return (
        <button
            type={type}
            className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
            {...props}
        />
    );
}
