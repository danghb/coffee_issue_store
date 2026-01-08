import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface EditableFieldProps {
    value: string | number | null | undefined;
    onSave: (newValue: string) => Promise<void>;
    label?: string;
    type?: 'text' | 'select' | 'textarea' | 'date';
    options?: { value: string | number; label: string }[];
    className?: string;
    displayClassName?: string;
    placeholder?: string;
    renderValue?: (value: any) => React.ReactNode;
}

export const EditableField: React.FC<EditableFieldProps> = ({
    value,
    onSave,
    label,
    type = 'text',
    options = [],
    className = '',
    displayClassName = '',
    placeholder = '点击编辑',
    renderValue,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(String(value ?? ''));
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setEditValue(String(value ?? ''));
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (editValue === String(value ?? '')) {
            setIsEditing(false);
            return;
        }

        try {
            setIsSaving(true);
            await onSave(editValue);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditValue(String(value ?? ''));
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && type !== 'textarea') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                {type === 'select' ? (
                    <select
                        ref={inputRef as React.RefObject<HTMLSelectElement>}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 rounded-md border border-blue-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        disabled={isSaving}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ) : type === 'textarea' ? (
                    <textarea
                        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 rounded-md border border-blue-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                        disabled={isSaving}
                    />
                ) : (
                    <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type={type}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 rounded-md border border-blue-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        disabled={isSaving}
                    />
                )}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="保存"
                >
                    <Check className="w-4 h-4" />
                </button>
                <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                    title="取消"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'group flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1 transition-colors',
                className
            )}
            onClick={() => setIsEditing(true)}
        >
            <span className={cn('flex-1', displayClassName, !value && 'text-gray-400 italic')}>
                {renderValue ? renderValue(value) : (value || placeholder)}
            </span>
            <Pencil className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

export default EditableField;
