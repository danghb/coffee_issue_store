import React, { useMemo } from 'react';
import { useDroppable, useDraggable, DndContext, DragOverlay, defaultDropAnimationSideEffects, type DropAnimation } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import type { Issue } from '../services/api';
import { AlertCircle, CheckCircle, Clock, Archive } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

interface KanbanBoardProps {
    issues: Issue[];
    onStatusChange: (issueId: number, newStatus: string) => void;
}

const COLUMNS = [
    { id: 'PENDING', title: '待处理', icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { id: 'IN_PROGRESS', title: '处理中', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'RESOLVED', title: '已解决', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { id: 'CLOSED', title: '已关闭', icon: Archive, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
];

export function KanbanBoard({ issues, onStatusChange }: KanbanBoardProps) {
    const [activeId, setActiveId] = React.useState<number | null>(null);

    const activeIssue = useMemo(() => issues.find(i => i.id === activeId), [issues, activeId]);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Find the column we dropped into
            const overId = over.id;
            // If over is a column ID
            if (COLUMNS.find(c => c.id === overId)) {
                onStatusChange(active.id, overId);
            } else {
                // If over is another card, allow sorting locally? Or just find the column of that card?
                // For simplicity, we assume we drop onto a column droppable
                // But typically SortableContext needs items.
                // Let's rely on Droppable columns.
            }
        }
        setActiveId(null);
    };

    // Group issues by status
    const columns = useMemo(() => {
        const cols: Record<string, Issue[]> = {};
        COLUMNS.forEach(c => cols[c.id] = []);
        issues.forEach(issue => {
            if (cols[issue.status]) {
                cols[issue.status].push(issue);
            } else {
                // Handle unknown status or just ignore
                if (!cols['PENDING']) cols['PENDING'] = [];
                // fallback
            }
        });
        return cols;
    }, [issues]);

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    return (
        <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {COLUMNS.map(col => (
                    <KanbanColumn
                        key={col.id}
                        column={col}
                        issues={columns[col.id] || []}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeIssue ? <IssueCard issue={activeIssue} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}

function KanbanColumn({ column, issues }: { column: typeof COLUMNS[0], issues: Issue[] }) {
    const { setNodeRef } = useDroppable({
        id: column.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={cn("flex-shrink-0 flex-1 min-w-[20rem] flex flex-col rounded-lg border h-full max-h-full", column.border, column.bg)}
        >
            <div className={cn("p-3 font-medium flex items-center gap-2 border-b flex-shrink-0", column.border, column.color)}>
                <column.icon className="w-4 h-4" />
                {column.title}
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/50">
                    {issues.length}
                </span>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                {issues.map(issue => (
                    <DraggableIssueCard key={issue.id} issue={issue} />
                ))}
            </div>
        </div>
    );
}

function DraggableIssueCard({ issue }: { issue: Issue }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: issue.id,
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn("touch-none", isDragging && "opacity-50")}
        >
            <IssueCard issue={issue} />
        </div>
    );
}

function IssueCard({ issue, isOverlay }: { issue: Issue, isOverlay?: boolean }) {
    const parseTags = (tagsStr?: string) => {
        try {
            return tagsStr ? JSON.parse(tagsStr) : [];
        } catch {
            return [];
        }
    };
    const tags = parseTags(issue.tags);

    return (
        <div className={cn(
            "bg-white p-3 rounded shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group",
            isOverlay && "shadow-xl rotate-2"
        )}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500 font-mono">#{issue.id}</span>
                {issue.severity && (
                    <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        issue.severity === 'CRITICAL' ? "bg-red-100 text-red-700" :
                            issue.severity === 'HIGH' ? "bg-orange-100 text-orange-700" :
                                "bg-gray-100 text-gray-600"
                    )}>
                        {issue.severity}
                    </span>
                )}
            </div>
            <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                <Link to={`/issues/${issue.id}`} className="hover:text-blue-600">
                    {issue.title}
                </Link>
            </div>
            <div className="text-xs text-gray-500 mb-2 truncate">
                {issue.reporterName} • {issue.model?.name}
            </div>

            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded">
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
