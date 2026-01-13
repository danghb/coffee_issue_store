import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { StatusBadge } from './ui/Badge';
import { settingsService, type Category } from '../services/api';

interface StatusSelectDialogProps {
    isOpen: boolean;
    currentStatus: string;
    currentCategoryId?: number;
    onClose: () => void;
    onConfirm: (status: string, categoryId?: number, comment?: string) => void;
}

const STATUS_OPTIONS = [
    { value: 'PENDING', label: '待处理', color: 'yellow' },
    { value: 'IN_PROGRESS', label: '处理中', color: 'blue' },
    { value: 'RESOLVED', label: '已解决', color: 'green' },
    { value: 'CLOSED', label: '已关闭', color: 'gray' }
];

export function StatusSelectDialog({
    isOpen,
    currentStatus,
    currentCategoryId,
    onClose,
    onConfirm
}: StatusSelectDialogProps) {
    const [selectedStatus, setSelectedStatus] = useState(currentStatus);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(currentCategoryId);
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadCategories();
            setSelectedStatus(currentStatus);
            setSelectedCategoryId(currentCategoryId);
            setComment('');
        }
    }, [isOpen, currentStatus, currentCategoryId]);

    const loadCategories = async () => {
        try {
            const data = await settingsService.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    if (!isOpen) return null;

    const needsCategory = selectedStatus === 'RESOLVED' || selectedStatus === 'CLOSED';

    const handleConfirm = () => {
        if (needsCategory && !selectedCategoryId) {
            alert('请选择问题分类');
            return;
        }
        onConfirm(selectedStatus, selectedCategoryId, comment);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col transform transition-all animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50 rounded-t-lg">
                    <h3 className="text-lg font-semibold text-gray-900">修改工单状态</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-3">请选择新的状态：</p>
                        <div className="space-y-2">
                            {STATUS_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSelectedStatus(option.value)}
                                    className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center justify-between ${selectedStatus === option.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="font-medium text-gray-900">{option.label}</span>
                                    <StatusBadge status={option.value} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category selection - shown only for RESOLVED/CLOSED */}
                    {needsCategory && (
                        <div className="pt-4 border-t space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    问题分类 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedCategoryId || ''}
                                    onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">请选择分类</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    处理说明/备注 (可选)
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="请输入处理过程中的关键问题..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t bg-gray-50/50 rounded-b-lg flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 border border-gray-300 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 border border-blue-600 transition-colors"
                    >
                        确认修改
                    </button>
                </div>
            </div>
        </div>
    );
}
