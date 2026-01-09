import { useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    content: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
}

export function ConfirmDialog({
    isOpen,
    title,
    content,
    confirmText = '确认',
    cancelText = '取消',
    isDestructive = false,
    onClose,
    onConfirm
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        try {
            setLoading(true);
            await onConfirm();
        } catch (error) {
            console.error('Confirm action failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col transform transition-all animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                        {isDestructive && <AlertTriangle className="w-5 h-5 text-red-500" />}
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    </div>
                    <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {content}
                    </p>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50/50 rounded-b-lg flex justify-end gap-3 process-footer">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 border border-gray-300 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-white text-sm font-medium rounded-lg border transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDestructive
                                ? 'bg-red-600 hover:bg-red-700 border-red-600'
                                : 'bg-blue-600 hover:bg-blue-700 border-blue-600'
                            }`}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
