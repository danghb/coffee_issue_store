import React, { useState, useEffect } from 'react';
import { taskService } from '../services/api';
import type { IssueTask } from '../services/api';
import { Plus, CheckCircle, Circle, Clock, XCircle, Trash2, User as UserIcon, Save, X, Loader2, Tag, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import MarkdownEditor from './MarkdownEditor';

interface IssueTaskListProps {
    issueId: number;
    canEdit: boolean;
}

export default function IssueTaskList({ issueId, canEdit }: IssueTaskListProps) {
    const [tasks, setTasks] = useState<IssueTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Modal State
    const [selectedTask, setSelectedTask] = useState<IssueTask | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Edit Form State (inside modal)
    const [editForm, setEditForm] = useState<{
        title: string;
        description: string;
        assigneeName: string;
        status: IssueTask['status'];
        result: string;
    }>({
        title: '',
        description: '',
        assigneeName: '',
        status: 'TODO',
        result: ''
    });

    const loadTasks = async () => {
        try {
            setLoading(true);
            const data = await taskService.getTasks(issueId);
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [issueId]);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        try {
            setIsCreating(true);
            await taskService.createTask(issueId, { title: newTaskTitle });
            setNewTaskTitle('');
            await loadTasks();
        } catch (error) {
            alert('创建任务失败');
        } finally {
            setIsCreating(false);
        }
    };

    const handleStatusChange = async (taskId: number, newStatus: IssueTask['status']) => {
        try {
            await taskService.updateTask(issueId, selectedTask?.id || taskId, { status: newStatus });
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

            // If updating from within modal
            if (selectedTask?.id === taskId) {
                setEditForm(prev => ({ ...prev, status: newStatus }));
                setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (error) {
            alert('状态更新失败');
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!window.confirm('确定要删除此任务吗？')) return;
        try {
            await taskService.deleteTask(issueId, taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            if (selectedTask?.id === taskId) {
                closeModal();
            }
        } catch (error) {
            alert('删除失败');
        }
    };

    const openModal = (task: IssueTask) => {
        setSelectedTask(task);
        setEditForm({
            title: task.title,
            description: task.description || '',
            assigneeName: task.assigneeName || task.assignee?.name || task.assignee?.username || '',
            status: task.status,
            result: task.result || ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTask(null);
    };

    const handleSaveTaskDetails = async () => {
        if (!selectedTask) return;
        try {
            const updated = await taskService.updateTask(issueId, selectedTask.id, {
                title: editForm.title,
                description: editForm.description,
                assigneeName: editForm.assigneeName,
                status: editForm.status,
                result: editForm.result
            });

            setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...updated } : t));
            closeModal();
        } catch (error) {
            alert('保存任务详情失败');
        }
    };

    const statusConfig = {
        TODO: { label: '待处理', color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200', icon: Circle },
        IN_PROGRESS: { label: '进行中', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Clock },
        DONE: { label: '已完成', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle },
        CANCELED: { label: '已取消', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200', icon: XCircle },
    };

    const StatusBadge = ({ status, onClick }: { status: IssueTask['status'], onClick?: () => void }) => {
        const config = statusConfig[status] || statusConfig.TODO;
        const Icon = config.icon;

        return (
            <span
                onClick={(e) => {
                    if (onClick) {
                        e.stopPropagation();
                        onClick();
                    }
                }}
                className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    config.color, config.bg, config.border,
                    onClick && "cursor-pointer hover:opacity-80"
                )}
            >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
            </span>
        );
    };

    if (loading && tasks.length === 0) {
        return <div className="p-8 text-center text-gray-400 text-sm animate-pulse">正在加载任务...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="p-1 bg-blue-100 text-blue-600 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                    </div>
                    任务列表
                    <span className="text-xs font-normal text-gray-500 ml-1 bg-gray-100 px-2 py-0.5 rounded-full">
                        {tasks.filter(t => t.status === 'DONE').length} / {tasks.length}
                    </span>
                </h3>
            </div>

            <div className="p-6">
                <ul className="space-y-3 mb-6">
                    {tasks.map(task => (
                        <li key={task.id}
                            className="group relative bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => openModal(task)}
                        >
                            <div className="flex items-start gap-4">
                                {/* Status Icon Column */}
                                <div className="pt-1 shrink-0">
                                    <StatusBadge status={task.status as any} />
                                </div>

                                <div className="flex-1 min-w-0 space-y-2">
                                    {/* Header Row: Title & Assignee */}
                                    <div className="flex justify-between items-start gap-3">
                                        <span className={cn(
                                            "font-medium text-gray-900 text-sm leading-6",
                                            (task.status === 'DONE' || task.status === 'CANCELED') && "text-gray-500"
                                        )}>
                                            {task.title}
                                        </span>

                                        {task.assigneeName && (
                                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600 border border-gray-200">
                                                <UserIcon className="w-3 h-3" />
                                                {task.assigneeName}
                                            </span>
                                        )}
                                    </div>

                                    {/* Result Preview */}
                                    {task.result && (
                                        <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100/50">
                                            <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                <span className="font-semibold text-gray-700 mr-1">结论:</span>
                                                {task.result}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="hidden group-hover:flex absolute right-2 top-2">
                                    {/* Hover actions could go here */}
                                </div>
                            </div>
                        </li>
                    ))}

                    {tasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                            <div className="p-3 bg-gray-100 rounded-full mb-3">
                                <CheckCircle className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-gray-400 text-sm">暂无任务，开始规划工作吧</p>
                        </div>
                    )}
                </ul>

                {canEdit && (
                    <form onSubmit={handleCreateTask} className="flex gap-3">
                        <div className="relative flex-1">
                            <Plus className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="添加新任务..."
                                className="w-full pl-9 rounded-lg border-gray-200 bg-gray-50 shadow-sm focus:bg-white focus:border-blue-500 focus:ring-blue-500 text-sm py-2 transition-all"
                                disabled={isCreating}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newTaskTitle.trim() || isCreating}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "添加"}
                        </button>
                    </form>
                )}
            </div>

            {/* Polished Task Details Modal */}
            {isModalOpen && selectedTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 9999 }}>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={closeModal} />

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">任务详情</h3>
                                <p className="text-xs text-gray-400 mt-0.5">ID: #{selectedTask.id}</p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Title Input */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700">任务标题</label>
                                {canEdit ? (
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full text-lg font-medium px-0 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder:text-gray-300 transition-colors"
                                        placeholder="输入任务标题..."
                                    />
                                ) : (
                                    <div className="text-lg font-medium text-gray-900">{editForm.title}</div>
                                )}
                            </div>

                            {/* Meta Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                {/* Status Selector */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">当前状态</label>
                                    {canEdit ? (
                                        <div className="flex flex-wrap gap-2">
                                            {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((key) => {
                                                const config = statusConfig[key];
                                                const isActive = editForm.status === key;
                                                const Icon = config.icon;
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => setEditForm(prev => ({ ...prev, status: key }))}
                                                        className={cn(
                                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                                            isActive
                                                                ? cn(config.bg, config.text, config.border, "ring-1 ring-offset-1 ring-blue-500/30")
                                                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                                        )}
                                                    >
                                                        <Icon className="w-3.5 h-3.5" />
                                                        {config.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <StatusBadge status={editForm.status} />
                                    )}
                                </div>

                                {/* Assignee Input */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">负责人</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-4 w-4 text-gray-400" />
                                        </div>
                                        {canEdit ? (
                                            <input
                                                type="text"
                                                value={editForm.assigneeName}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, assigneeName: e.target.value }))}
                                                placeholder="未指派"
                                                className="w-full pl-9 rounded-lg border-gray-200 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                            />
                                        ) : (
                                            <div className="pl-9 py-2 text-sm text-gray-900">{editForm.assigneeName || '未指派'}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Description Editor */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    详细描述
                                </label>
                                <div className="min-h-[120px]">
                                    {canEdit ? (
                                        <MarkdownEditor
                                            value={editForm.description}
                                            onChange={(val) => setEditForm(prev => ({ ...prev, description: val || '' }))}
                                            className="min-h-[120px] shadow-sm border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/20"
                                        />
                                    ) : (
                                        <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg border border-gray-100/50 text-gray-600">
                                            {editForm.description || <span className="text-gray-400 italic">无详细描述</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Result Textarea */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <CheckCircle className="w-4 h-4 text-gray-400" />
                                    处理结果 / 结论
                                </label>
                                {canEdit ? (
                                    <textarea
                                        value={editForm.result}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, result: e.target.value }))}
                                        placeholder="在这里填写最终的处理结论..."
                                        className="w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[100px] text-sm leading-relaxed p-3"
                                    />
                                ) : (
                                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm text-gray-700 whitespace-pre-wrap">
                                        {editForm.result || <span className="text-gray-400 italic">暂无结论</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                            {canEdit && (
                                <button
                                    onClick={() => handleDeleteTask(selectedTask.id)}
                                    className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                                >
                                    <Trash2 className="w-4 h-4" /> 删除
                                </button>
                            )}

                            <div className="flex gap-3 ml-auto">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                                >
                                    取消
                                </button>
                                {canEdit && (
                                    <button
                                        onClick={handleSaveTaskDetails}
                                        className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                                    >
                                        <Save className="w-4 h-4" />
                                        保存更改
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
