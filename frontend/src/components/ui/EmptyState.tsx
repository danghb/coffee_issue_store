import React from 'react';
import { cn } from '../../lib/utils';
import { FileText, type LucideIcon } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon = FileText,
    title,
    description,
    actionLabel,
    onAction,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50",
            className
        )}>
            <div className="p-3 bg-white rounded-full shadow-sm mb-4">
                <Icon className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
            {description && <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>}

            {actionLabel && onAction && (
                <Button onClick={onAction} variant="outline" size="sm">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
