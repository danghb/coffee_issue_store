import React, { useState } from 'react';
import { Send, ShieldAlert, Loader2, ImageIcon } from 'lucide-react';
import MarkdownEditor from './MarkdownEditor';
import { FileUpload } from './Upload';
import { cn } from '../lib/utils';
import { issueService, type User } from '../services/api';

interface CommentFormProps {
    issueId: number;
    user: User | null;
    isInternalViewer: boolean;
    onCommentAdded: () => Promise<void>;
}

const CommentForm: React.FC<CommentFormProps> = ({
    issueId,
    user,
    isInternalViewer,
    onCommentAdded
}) => {
    const [commentContent, setCommentContent] = useState('');
    const [commentIsInternal, setCommentIsInternal] = useState(isInternalViewer); // Default true for internal viewers
    const [commentAttachmentIds, setCommentAttachmentIds] = useState<number[]>([]);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [guestName, setGuestName] = useState('');

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentContent.trim() && commentAttachmentIds.length === 0) return;

        try {
            setSubmittingComment(true);
            const authorName = user ? user.username : (guestName.trim() || 'Guest');

            // 注意：这里的第四个参数 isInternal 逻辑
            // 如果查看者是内部人员，则使用勾选框的值；否则默认为 false
            await issueService.addComment(
                issueId,
                commentContent,
                authorName,
                isInternalViewer ? commentIsInternal : false,
                commentAttachmentIds
            );

            setCommentContent('');
            setCommentAttachmentIds([]);
            // setGuestName(''); // Keep guest name for convenience if multiple comments
            if (isInternalViewer) {
                setCommentIsInternal(true); // Reset to default true for internal
            }

            await onCommentAdded();
        } catch (err) {
            console.error(err);
            alert('评论失败');
        } finally {
            setSubmittingComment(false);
        }
    };

    return (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-900">添加回复</h3>
            </div>
            <div className="p-6">
                <form onSubmit={handleAddComment}>
                    {!user && (
                        <div className="mb-4">
                            <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-1">
                                您的姓名 (选填)
                            </label>
                            <input
                                type="text"
                                id="guestName"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="访客"
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label htmlFor="comment" className="sr-only">添加回复</label>
                        {/* 关键优化：MarkdownEditor 现在是这个小组件的子组件，输入只会触发 CommentForm 重新渲染 */}
                        <MarkdownEditor
                            value={commentContent}
                            onChange={setCommentContent}
                            height={200}
                            editable={true}
                        />
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                        <div>
                            {isInternalViewer && (
                                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={commentIsInternal}
                                        onChange={(e) => setCommentIsInternal(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <span className="flex items-center">
                                        <ShieldAlert className="w-4 h-4 mr-1 text-gray-500" />
                                        内部可见
                                    </span>
                                </label>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={submittingComment || (!commentContent.trim() && commentAttachmentIds.length === 0)}
                            className={cn(
                                "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors",
                                isInternalViewer && commentIsInternal
                                    ? "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
                                    : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                            )}
                        >
                            {submittingComment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            {isInternalViewer && commentIsInternal ? '发送内部备注' : '发送回复'}
                        </button>
                    </div>

                    {/* Attachment Upload Area */}
                    <div className="mt-4">
                        <FileUpload
                            onUploadComplete={setCommentAttachmentIds}
                            className="border-gray-200"
                        />
                    </div>

                </form>
            </div>
        </section>
    );
};

export default CommentForm;
