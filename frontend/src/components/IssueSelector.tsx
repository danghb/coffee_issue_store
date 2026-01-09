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
            // 过滤掉当前Issue，以及已经是子工单的Issue（防止嵌套）
            setIssues(items.filter(i => i.id !== currentIssueId && !i.parentId));
        } catch (error) {
            console.error('Failed to load issues:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        console.log('IssueSelector: Confirm clicked', { selectedId });
        if (selectedId) {
            onSelect(selectedId);
        } else {
            console.log('IssueSelector: No selectedId');
        }
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-[400px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col max-h-[600px]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
                <h3 className="text-sm font-semibold text-gray-900">选择主工单</h3>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-gray-200 bg-white">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="搜索..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                    />
                </div>
            </div>

            {/* Issue List */}
            <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
                {loading ? (
                    <div className="text-center py-8 text-gray-500 text-sm">加载中...</div>
                ) : issues.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">没有找到工单</div>
                ) : (
                    <div className="space-y-1">
                        {issues.map((issue) => (
                            <div
                                key={issue.id}
                                onClick={() => setSelectedId(issue.id)}
                                className={cn(
                                    "p-2.5 border rounded-md cursor-pointer transition-all group",
                                    selectedId === issue.id
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-transparent hover:bg-gray-50 border-gray-100"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-mono text-gray-500">#{issue.id}</span>
                                            <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                {issue.title}
                                            </h4>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded text-[10px]",
                                                issue.status === 'PENDING' && "bg-yellow-100 text-yellow-800",
                                                issue.status === 'IN_PROGRESS' && "bg-blue-100 text-blue-800",
                                                issue.status === 'RESOLVED' && "bg-green-100 text-green-800",
                                                issue.status === 'CLOSED' && "bg-gray-100 text-gray-800"
                                            )}>
                                                {issue.status}
                                            </span>
                                            <span>{issue.model?.name}</span>
                                        </div>
                                    </div>
                                    {selectedId === issue.id && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2 bg-gray-50/50 rounded-b-lg">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                    取消
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!selectedId}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    确认并案
                </button>
            </div>
        </div>
    );
}
