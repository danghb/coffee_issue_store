import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface DateRangeFilterProps {
    startDate: string;
    endDate: string;
    onChange: (start: string, end: string) => void;
    className?: string;
}

type PresetType = 'all' | 'week' | 'month' | 'year' | 'custom';

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
    startDate,
    endDate,
    onChange,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [preset, setPreset] = useState<PresetType>('month');
    const containerRef = useRef<HTMLDivElement>(null);

    // Helper to format date
    const formatDateInput = (date: Date) => date.toISOString().split('T')[0];

    // Helper to get ranges
    const getPresetRange = (type: PresetType) => {
        const end = new Date();
        const start = new Date();
        if (type === 'week') start.setDate(end.getDate() - 7);
        if (type === 'month') start.setMonth(end.getMonth() - 1);
        if (type === 'year') start.setFullYear(end.getFullYear() - 1);

        if (type === 'all') return { start: '', end: '' };

        return { start: formatDateInput(start), end: formatDateInput(end) };
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle Preset Click
    const handlePresetSelect = (type: PresetType) => {
        setPreset(type);
        if (type !== 'custom') {
            const { start, end } = getPresetRange(type);
            onChange(start, end);
            setIsOpen(false);
        }
    };

    // Get Display Text
    const getDisplayText = () => {
        if (preset === 'all') return '所有时间';
        if (preset === 'week') return '近一周';
        if (preset === 'month') return '近一月';
        if (preset === 'year') return '近一年';
        if (startDate && endDate) return `${startDate} - ${endDate}`;
        return '自定义范围';
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-white hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
                <div className="flex items-center gap-2 truncate">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{getDisplayText()}</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown Content */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full sm:w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                        {/* Presets */}
                        <div className="flex flex-col">
                            {[
                                { id: 'all', label: '所有时间' },
                                { id: 'week', label: '近一周' },
                                { id: 'month', label: '近一月' },
                                { id: 'year', label: '近一年' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handlePresetSelect(item.id as PresetType)}
                                    className={cn(
                                        "flex items-center px-3 py-2 text-sm rounded-lg transition-colors text-left",
                                        preset === item.id
                                            ? "bg-blue-50 text-blue-700 font-medium"
                                            : "text-gray-700 hover:bg-gray-50"
                                    )}
                                >
                                    {item.label}
                                    {preset === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePresetSelect('custom')}
                                className={cn(
                                    "flex items-center px-3 py-2 text-sm rounded-lg transition-colors text-left",
                                    preset === 'custom'
                                        ? "bg-blue-50 text-blue-700 font-medium"
                                        : "text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                自定义范围...
                                {preset === 'custom' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                            </button>
                        </div>

                        {/* Custom Inputs */}
                        {preset === 'custom' && (
                            <div className="mt-2 pt-2 border-t border-gray-100 p-2 space-y-2 bg-gray-50/50 rounded-lg mx-1 mb-1">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 ml-1">开始日期</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => onChange(e.target.value, endDate)}
                                        className="block w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 ml-1">结束日期</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => onChange(startDate, e.target.value)}
                                        className="block w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
