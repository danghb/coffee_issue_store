import { useState, useEffect } from 'react';
import { issueService, type Issue } from '../services/api';
import { Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface IssueSelectorProps {
    currentIssueId?: number;
    onSelect: (issueId: number) => void;
    onCancel: () => void;
}

export default function IssueSelector({ currentIssueId, onSelect, onCancel }: IssueSelectorProps) {
    const [search, setSearch] = useState('');
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        loadIssues();
    }, [search]);

    const loadIssues = async () => {
        try {
            setLoading(true);
            const { items } = await issueService.getIssues(
                1,
                20,
                undefined,
                search,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            );
            // 过滤掉当前Issue
            setIssues(items.filter(i => i.id !== currentIssueId));
        } catch (error) {
            console.error('Failed to load issues:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (selectedId) {
            onSelect(selectedId);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">选择要并入的主工单</h3>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="搜索工单标题或ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Issue List */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">加载中...</div>
                    ) : issues.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">没有找到工单</div>
                    ) : (
                        <div className="space-y-2">
                            {issues.map((issue) => (
                                <div
                                    key={issue.id}
                                    onClick={() => setSelectedId(issue.id)}
                                    className={cn(
                                        "p-4 border rounded-lg cursor-pointer transition-all",
                                        selectedId === issue.id
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono text-gray-500">#{issue.id}</span>
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full",
                                                    issue.status === 'PENDING' && "bg-yellow-100 text-yellow-800",
                                                    issue.status === 'IN_PROGRESS' && "bg-blue-100 text-blue-800",
                                                    issue.status === 'RESOLVED' && "bg-green-100 text-green-800",
                                                    issue.status === 'CLOSED' && "bg-gray-100 text-gray-800"
                                                )}>
                                                    {issue.status}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-medium text-gray-900 truncate">{issue.title}</h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {issue.model?.name} · {new Date(issue.createdAt).toLocaleDateString('zh-CN')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedId}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        确认并案
                    </button>
                </div>
            </div>
        </div>
    );
}
