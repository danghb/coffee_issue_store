import React, { useState } from 'react';
import DualModeEditor from './DualModeEditor';
import { Check, X, Pencil } from 'lucide-react';

interface DescriptionEditorProps {
    value: string;
    onSave: (value: string) => Promise<void>;
}

export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ value, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);

    const handleStartEdit = () => {
        setEditValue(value);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (editValue === value) {
            setIsEditing(false);
            return;
        }

        try {
            setIsSaving(true);
            await onSave(editValue);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save description:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    return (
        <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                详细描述
            </label>

            {isEditing ? (
                <div className="space-y-3">
                    <DualModeEditor
                        value={editValue}
                        onChange={setEditValue}
                        height={300}
                        editable={true}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="w-4 h-4 mr-1" />
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
                        >
                            <Check className="w-4 h-4 mr-1" />
                            {isSaving ? '保存中...' : '保存'}
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className="group relative cursor-pointer bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-blue-200 transition-colors"
                    onClick={handleStartEdit}
                >
                    <DualModeEditor value={value} onChange={() => { }} editable={false} />
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-blue-600 bg-white px-2 py-1 rounded shadow-sm border">
                        <Pencil className="w-3 h-3" />
                        点击编辑
                    </div>
                </div>
            )}
        </div>
    );
};

export default DescriptionEditor;
