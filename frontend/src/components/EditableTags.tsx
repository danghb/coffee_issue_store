import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface EditableTagsProps {
    value: string; // JSON字符串: '["tag1", "tag2"]'
    onSave: (value: string) => Promise<void>;
}

export const EditableTags: React.FC<EditableTagsProps> = ({ value, onSave }) => {
    const [tags, setTags] = useState<string[]>(() => {
        try {
            return value ? JSON.parse(value) : [];
        } catch {
            return [];
        }
    });
    const [inputValue, setInputValue] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleAdd = async () => {
        const newTag = inputValue.trim();
        if (!newTag || tags.includes(newTag)) {
            setInputValue('');
            setIsAdding(false);
            return;
        }

        const newTags = [...tags, newTag];
        setTags(newTags);
        setInputValue('');
        setIsAdding(false);

        try {
            setIsSaving(true);
            await onSave(JSON.stringify(newTags));
        } catch (error) {
            console.error('Failed to save tags:', error);
            setTags(tags); // 回滚
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = async (tagToRemove: string) => {
        const newTags = tags.filter(t => t !== tagToRemove);
        setTags(newTags);

        try {
            setIsSaving(true);
            await onSave(JSON.stringify(newTags));
        } catch (error) {
            console.error('Failed to save tags:', error);
            setTags(tags); // 回滚
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {tags.map((tag) => (
                <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group hover:bg-blue-200 transition-colors"
                >
                    {tag}
                    <button
                        onClick={() => handleRemove(tag)}
                        disabled={isSaving}
                        className="ml-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}

            {isAdding ? (
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={handleAdd}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd();
                        if (e.key === 'Escape') {
                            setInputValue('');
                            setIsAdding(false);
                        }
                    }}
                    autoFocus
                    className="inline-block px-2 py-0.5 text-xs border border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="新标签..."
                />
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isSaving}
                    className="inline-flex items-center px-2 py-0.5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    添加标签
                </button>
            )}

            {tags.length === 0 && !isAdding && (
                <span className="text-sm text-gray-400 italic">无标签</span>
            )}
        </div>
    );
};

export default EditableTags;
