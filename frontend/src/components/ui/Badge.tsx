import React from 'react';
import { cn } from '../../lib/utils';

interface SeverityBadgeProps {
    severity: number | string;
    className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className }) => {
    // 1=LOW, 2=MEDIUM, 3=HIGH, 4=CRITICAL
    const map: Record<string, string> = {
        '1': 'LOW', 'LOW': 'LOW',
        '2': 'MEDIUM', 'MEDIUM': 'MEDIUM',
        '3': 'HIGH', 'HIGH': 'HIGH',
        '4': 'CRITICAL', 'CRITICAL': 'CRITICAL'
    };

    const s = String(severity).toUpperCase();
    const key = map[s] || 'MEDIUM';

    const config = {
        LOW: { emoji: '🟢', label: '轻微', color: 'bg-green-100 text-green-800 border-green-200' },
        MEDIUM: { emoji: '🟡', label: '一般', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        HIGH: { emoji: '🟠', label: '严重', color: 'bg-orange-100 text-orange-800 border-orange-200' },
        CRITICAL: { emoji: '🔴', label: '紧急', color: 'bg-red-100 text-red-800 border-red-200' },
    };

    const cfg = config[key as keyof typeof config] || config.MEDIUM;

    return (
        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', cfg.color, className)}>
            <span className="mr-1">{cfg.emoji}</span>
            {cfg.label}
        </span>
    );
};

interface PriorityBadgeProps {
    priority: string;
    className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className }) => {
    const config = {
        P0: { label: 'P0', desc: '立即处理', color: 'bg-red-100 text-red-800 border-red-300' },
        P1: { label: 'P1', desc: '紧急', color: 'bg-orange-100 text-orange-800 border-orange-300' },
        P2: { label: 'P2', desc: '高', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        P3: { label: 'P3', desc: '普通', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    };

    const cfg = config[priority as keyof typeof config] || config.P2;

    return (
        <span
            className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold border', cfg.color, className)}
            title={cfg.desc}
        >
            {cfg.label}
        </span>
    );
};

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
    const config = {
        PENDING: { label: '待处理', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        IN_PROGRESS: { label: '处理中', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        RESOLVED: { label: '已解决', color: 'bg-green-50 text-green-700 border-green-200' },
        CLOSED: { label: '已关闭', color: 'bg-gray-50 text-gray-700 border-gray-200' },
    };

    const cfg = config[status as keyof typeof config] || config.PENDING;

    return (
        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border', cfg.color, className)}>
            {cfg.label}
        </span>
    );
};
