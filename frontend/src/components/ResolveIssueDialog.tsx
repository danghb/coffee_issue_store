import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { settingsService, type Category } from '../services/api';

interface ResolveIssueDialogProps {
    currentStatus: string; // The status we are changing TO
    currentCategoryId?: number;
    onClose: () => void;
    onConfirm: (data: { categoryId: number; comment?: string }) => Promise<void>;
}

export function ResolveIssueDialog({ currentStatus, currentCategoryId, onClose, onConfirm }: ResolveIssueDialogProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCats, setLoadingCats] = useState(true);

    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(currentCategoryId);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoadingCats(true);
            const data = await settingsService.getCategories();
            setCategories(data);
            // If no category selected initially, maybe select first? Or leave empty?
            // User must select one if we want to enforce it.
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCats(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedCategoryId) {
            alert('请选择问题分类');
            return;
        }
        try {
            setSubmitting(true);
            await onConfirm({ categoryId: selectedCategoryId, comment });
        } catch (err) {
            console.error(err);
            alert('操作失败');
            setSubmitting(false);
        }
    };

    const title = currentStatus === 'RESOLVED' ? '标记为已解决' : '关闭工单';

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            问题分类 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={selectedCategoryId || ''}
                                onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            >
                                <option value="" disabled>请选择分类</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            处理说明 / 备注 (选填)
                        </label>
                        <textarea
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            placeholder="请输入处理过程或关闭原因..."
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || loadingCats}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        确认
                    </button>
                </div>
            </div>
        </div>
    );
}
