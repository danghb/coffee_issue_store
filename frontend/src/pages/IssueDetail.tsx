
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { issueService, authService, type Issue } from '../services/api';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, X, Download, ImageIcon, FileText, Video, Trash2, Save, RefreshCw, ShieldAlert, Calendar, User, Wrench, Pencil, Link2, MessageSquare, Check } from 'lucide-react';
import { cn } from '../lib/utils';
// import { FileUpload } from '../components/Upload';
import MarkdownEditor from '../components/MarkdownEditor';
import { EditableField } from '../components/EditableField';
import { EditableTags } from '../components/EditableTags';
import { SeverityBadge, PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { ResolveIssueDialog } from '../components/ResolveIssueDialog';
import { StatusSelectDialog } from '../components/StatusSelectDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import IssueSelector from '../components/IssueSelector';
import CommentForm from '../components/CommentForm';
import { AttachmentItem } from '../components/AttachmentItem';
import IssueTaskList from '../components/IssueTaskList'; // New Component

// 静态空函数，避免重新渲染
const noOpChange = () => { };

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = authService.getCurrentUser();
  const isInternalViewer = user?.role === 'ADMIN' || user?.role === 'DEVELOPER';

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [submittedNanoId, setSubmittedNanoId] = useState<string | null>(null);

  // 评论与状态



  // 描述编辑状态
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');

  // 并案状态

  const [showIssueSelector, setShowIssueSelector] = useState(false);
  // New state for Confirm Dialog
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [pendingMergeTarget, setPendingMergeTarget] = useState<{ id: number, title?: string } | null>(null);

  // Unmerge dialog state
  const [showUnmergeDialog, setShowUnmergeDialog] = useState(false);
  const [pendingUnmergeChildId, setPendingUnmergeChildId] = useState<number | null>(null);

  // Status/Resolution dialogs
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>('');


  // Delete Dialog Check
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);


  // 辅助函数：获取下载链接
  const getDownloadUrl = (path: string) => {
    return `/api/uploads/files/${path}`;
  };

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // 操作记录折叠状态
  const [showOperationLog, setShowOperationLog] = useState(false);
  // 附件折叠状态
  const [showAttachments, setShowAttachments] = useState(false);
  // 正在编辑的评论ID
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState(''); // 新增：正在编辑的评论内容
  const [previewImage, setPreviewImage] = useState<string | null>(null); // 图片预览状态

  // Memoize loadIssue to avoid re-creation if dependencies don't change
  const loadIssue = useCallback(async (issueId: number | string) => {
    try {
      setLoading(true);
      const data = await issueService.getIssue(issueId);
      setIssue(data);
    } catch (err) {
      console.error(err);
      setError('无法加载问题详情');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      const numericId = Number(id);
      // Support NanoID (string) or DB ID (number)
      loadIssue(isNaN(numericId) ? id : numericId);
    }
  }, [id, loadIssue]);

  useEffect(() => {
    // Check for submission success state from navigation
    if (location.state?.submissionSuccess) {
      setShowSuccessBanner(true);
      setSubmittedNanoId(location.state.nanoId);
      // Clear the state to prevent banner from reappearing on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);




  // 单字段更新函数 (用于行内编辑)
  const handleFieldUpdate = async (field: string, newValue: any) => {
    if (!issue) return;
    try {
      await issueService.update(issue.id, { [field]: newValue });

      // Update local state without full reload for smoother UX
      setIssue(prev => prev ? { ...prev, [field]: newValue } : null);
    } catch (err) {
      console.error(err);
      alert('更新失败');
    }
  };

  const handleDeleteIssue = async () => {
    if (!issue) return;
    try {
      await issueService.deleteIssue(issue.id);
      navigate('/issues', { replace: true });
    } catch (err) {
      console.error(err);
      alert('删除失败');
    }
  };


  // Resolution Dialog handlers
  /*
  const handleStatusChange = async (newStatus: string) => {
    if (!issue) return;

    // If resolving or closing, open dialog to confirm category/add comment
    if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
      setTargetStatus(newStatus);
      setShowStatusDialog(true); // Use setShowStatusDialog instead of setShowResolveDialog
      return;
    }

    // Otherwise standard confirmation (optional)
    if (newStatus !== 'IN_PROGRESS' && !window.confirm(`确认将状态变更为 ${newStatus}?`)) return;

    try {
      await issueService.updateStatus(issue.id, newStatus, user?.username || 'Admin'); // Assuming currentUser is user
      await loadIssue(issue.id);
    } catch (err) {
      console.error(err);
      alert('状态更新失败');
    }
  };
  */

  const handleResolveConfirm = async (data: { categoryId: number; comment?: string }) => {
    if (!issue) return;
    try {
      await issueService.update(issue.id, { status: targetStatus, categoryId: data.categoryId });
      if (data.comment) {
        await issueService.addComment(issue.id, data.comment, user?.username || 'Admin', false);
      }
      await loadIssue(issue.id);
      setShowStatusDialog(false); // Close the StatusSelectDialog
    } catch (err) {
      console.error(err);
      alert('操作失败');
    }
  };



  // Step 1: User selects a target issue -> Opens Confirmation Dialog
  const handleMergeSelect = (targetId: number) => {
    setPendingMergeTarget({ id: targetId });
    setShowIssueSelector(false); // Close selector
    setShowMergeDialog(true);    // Open confirmation
  };

  // Step 2: User confirms -> Execute API call
  const executeMerge = async () => {
    if (!pendingMergeTarget || !issue) return;

    try {
      // API expects: merge(parentId, childIds[])
      await issueService.merge(pendingMergeTarget.id, [issue.id]);
      navigate(`/issues/${pendingMergeTarget.id}`);
    } catch (error: any) {
      alert(error.message || '并案失败');
    } finally {
      setShowMergeDialog(false);
      setPendingMergeTarget(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN') + ' ' + new Date(dateString).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-red-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  // 渲染操作记录（Admin only）
  const renderOperationLog = () => {
    if (!issue?.comments) return null;

    const operationLogs = issue.comments.filter(c =>
      c.type === 'STATUS_CHANGE' ||
      c.type === 'FIELD_CHANGE' ||
      c.type === 'SYSTEM'
    );

    if (operationLogs.length === 0) return null;

    return (
      <div className="flow-root">
        <ul className="-mb-8">
          {operationLogs.map((comment, idx) => (
            <li key={comment.id}>
              <div className="relative pb-6">
                {idx !== operationLogs.length - 1 && (
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    {comment.type === 'STATUS_CHANGE' ? (
                      <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                      </span>
                    ) : (
                      <span className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center ring-8 ring-white">
                        <Pencil className="h-4 w-4 text-purple-600" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900 mr-2">{comment.author}</span>
                        {comment.type === 'STATUS_CHANGE' ? (
                          <span>将状态更新为 <span className="font-medium text-blue-600">{comment.newStatus}</span></span>
                        ) : (
                          (() => {
                            try {
                              const changeData = JSON.parse(comment.content || '{}');
                              return (
                                <span className="text-purple-700">
                                  修改了 <span className="font-medium">{changeData.fieldName}</span>
                                  <span className="text-gray-400 mx-1">:</span>
                                  <span className="line-through text-gray-400">{changeData.oldValue || '(空)'}</span>
                                  <span className="mx-1">→</span>
                                  <span className="font-medium text-purple-600">{changeData.newValue}</span>
                                </span>
                              );
                            } catch {
                              return <span>修改了字段</span>;
                            }
                          })()
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderTimeline = () => {
    if (!issue?.comments || issue.comments.length === 0) {
      return <div className="text-gray-500 text-sm text-center py-4">暂无评论</div>;
    }

    // 只显示用户提交的评论（MESSAGE类型），并按ID倒序排列（最新的在最上面）
    const userComments = issue.comments
      .filter(c => c.type === 'MESSAGE')
      .sort((a, b) => b.id - a.id);

    if (userComments.length === 0) {
      return <div className="text-gray-500 text-sm text-center py-4">暂无评论</div>;
    }

    // 分页计算
    const totalPages = Math.ceil(userComments.length / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedComments = userComments.slice(startIdx, endIdx);

    return (
      <>
        <div className="flow-root">
          <ul className="-mb-8">
            {paginatedComments.map((comment, commentIdx) => (
              <li key={comment.id}>
                <div className="relative pb-8">
                  {commentIdx !== paginatedComments.length - 1 ? (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex space-x-3 group">
                    <div className="flex-shrink-0">
                      <span className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white",
                        comment.isInternal ? "bg-yellow-100" : "bg-gray-100"
                      )}>
                        {comment.isInternal ? (
                          <ShieldAlert className="h-4 w-4 text-yellow-600" aria-hidden="true" />
                        ) : (
                          <User className="h-4 w-4 text-gray-500" aria-hidden="true" />
                        )}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 mr-2">
                            {comment.author}
                          </span>
                          {comment.isInternal && <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">内部</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 ml-auto">
                          {/* ml-auto explicitly pushes this to the far right relative to the flex container, though justify-between already does it. */}
                          <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
                          {(isInternalViewer || user?.username === comment.author) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingContent(comment.content || '');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="编辑评论"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-800">
                        {editingCommentId === comment.id ? (
                          <div className="space-y-2">
                            <MarkdownEditor
                              value={editingContent}
                              onChange={setEditingContent}
                              editable={true}
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setEditingCommentId(null)}
                                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded shadow-sm"
                              >
                                取消
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await issueService.updateComment(issue.id, comment.id, editingContent);
                                    await loadIssue(issue.id);
                                    setEditingCommentId(null);
                                  } catch (err) {
                                    console.error('Failed to update comment:', err);
                                    alert('更新评论失败');
                                  }
                                }}
                                className="px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm flex items-center"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                保存
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none text-gray-800 break-words">
                            <MarkdownEditor
                              value={comment.content || ''}
                              onChange={noOpChange}
                              editable={false}
                            />
                          </div>
                        )}

                        {/* Attachments inside the bubble */}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-3">
                            {comment.attachments.map((file) => (
                              <AttachmentItem
                                key={file.id}
                                attachment={file}
                                getDownloadUrl={getDownloadUrl}
                                onPreviewImage={(url) => setPreviewImage(url)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-0 mt-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  显示 <span className="font-medium">{startIdx + 1}</span> 到 <span className="font-medium">{Math.min(endIdx, userComments.length)}</span>，
                  共 <span className="font-medium">{userComments.length}</span> 条评论
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20",
                        page === currentPage
                          ? "z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <ArrowLeft className="h-5 w-5 rotate-180" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderCustomData = () => {
    if (!issue?.customData) return null;
    let data: Record<string, any> = {};
    try {
      data = JSON.parse(issue.customData);
    } catch (e) {
      return null;
    }

    if (Object.keys(data).length === 0) return null;

    return (
      <section className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">附加信息</h3>
        </div>
        <div className="px-4 py-5 sm:p-6 space-y-3">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b border-gray-100 last:border-0 pb-2 last:pb-0">
              <span className="text-sm text-gray-500">{key}</span>
              <span className="text-sm text-gray-900 font-medium text-right max-w-xs break-words">
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error || '找不到该问题'}
        </div>
        <Link to="/issues" className="text-blue-600 hover:underline">返回列表</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {
        showSuccessBanner && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                问题提交成功！您的查询编码是：{' '}
                <span className="font-mono font-bold text-green-800">{submittedNanoId}</span>
                。您可以在“进度查询”页面凭此编码追踪处理进度。
              </p>
            </div>
          </div>
        )
      }

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => navigate('/issues')} className="text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  #{issue.nanoId || issue.id}
                </span>
                {issue.category && (
                  <span className="text-sm font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {issue.category.name}
                  </span>
                )}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 flex flex-wrap items-center gap-3">
              <EditableField
                value={issue.title}
                onSave={(val) => handleFieldUpdate('title', val)}
                displayClassName="text-2xl font-bold text-gray-900"
              />
              <EditableField
                value={issue.severity || 2}
                onSave={(val) => handleFieldUpdate('severity', val)}
                type="select"
                options={[
                  { value: 1, label: '🟢 轻微' },
                  { value: 2, label: '🟡 一般' },
                  { value: 3, label: '🟠 严重' },
                  { value: 4, label: '🔴 紧急' }
                ]}
                renderValue={(val) => <SeverityBadge severity={val} className="cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 transition-all" />}
              />
              {isInternalViewer && (
                <EditableField
                  value={issue.priority || 'P2'}
                  onSave={(val) => handleFieldUpdate('priority', val)}
                  type="select"
                  options={[
                    { value: 'P0', label: '🔴 P0 紧急' },
                    { value: 'P1', label: '🟠 P1 高' },
                    { value: 'P2', label: '🟡 P2 中' },
                    { value: 'P3', label: '🟢 P3 低' }
                  ]}
                  renderValue={(val) => <PriorityBadge priority={val} className="cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 transition-all" />}
                />
              )}
            </div>
            {/* Inline Tags */}
            <div className="mt-2">
              <EditableTags
                value={issue.tags || '[]'}
                onSave={async (val) => {
                  await issueService.update(issue.id, { tags: val });
                  await loadIssue(issue.id);
                }}
              />
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center" title={`提交于 ${formatDate(issue.submitDate)}`}>
                <Calendar className="w-4 h-4 mr-1.5" />
                {new Date(issue.submitDate).toLocaleDateString()}
              </span>
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1.5" />
                {issue.reporterName}
              </span>

            </div>
          </div>

          {/* Clickable Status Badge */}
          <div
            onClick={() => {
              setTargetStatus(issue.status);
              setShowStatusDialog(true);
            }}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            title="点击修改状态"
          >
            <StatusBadge status={issue.status} className="text-lg px-4 py-2" />
          </div>

          {/* Admin Actions */}
          {isInternalViewer && (
            <div className="flex items-center space-x-1 ml-4 border-l border-gray-100 pl-4">

              {/* Merge Button */}
              {!issue.parent && (!issue.children || issue.children.length === 0) && (
                <button
                  onClick={() => setShowIssueSelector(true)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="并案处理"
                >
                  <Link2 className="w-5 h-5" />
                </button>
              )}

              {/* Delete Button */}
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="删除工单"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Merged Banner (For Child Issues) */}
      {issue.parent && (
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link2 className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                此工单已并入主工单
                <Link to={`/issues/${issue.parent.id}`} className="font-bold underline ml-1 hover:text-blue-900">
                  #{issue.parent.id} {issue.parent.title}
                </Link>
              </p>
            </div>
          </div>
          <Link to={`/issues/${issue.parent.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-500 whitespace-nowrap">
            前往查看 &rarr;
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 space-y-6">





          {/* Description Card */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                问题详情
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  详细描述
                </label>

                {editingDescription ? (
                  <div className="space-y-3">
                    <MarkdownEditor
                      value={descriptionValue}
                      onChange={setDescriptionValue}
                      height={300}
                      editable={true}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setDescriptionValue(issue.description || '');
                          setEditingDescription(false);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-4 h-4 mr-1" />
                        取消
                      </button>
                      <button
                        onClick={async () => {
                          if (descriptionValue !== issue.description) {
                            await issueService.update(issue.id, { description: descriptionValue });
                            await loadIssue(issue.id);
                          }
                          setEditingDescription(false);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="group relative cursor-pointer bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-blue-200 transition-colors"
                    onClick={() => {
                      setDescriptionValue(issue.description || '');
                      setEditingDescription(true);
                    }}
                  >
                    <MarkdownEditor value={issue.description || ''} onChange={noOpChange} editable={false} />
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-blue-600 bg-white px-2 py-1 rounded shadow-sm border">
                      <Pencil className="w-3 h-3" />
                      点击编辑
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">发生时间</span>
                  <EditableField
                    value={issue.occurredAt ? new Date(issue.occurredAt).toISOString().split('T')[0] : ''}
                    onSave={(val) => handleFieldUpdate('occurredAt', val)}
                    type="date"
                    placeholder="-"
                    displayClassName="text-sm font-medium text-gray-900"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">出现频率</span>
                  <EditableField
                    value={issue.frequency || ''}
                    onSave={(val) => handleFieldUpdate('frequency', val)}
                    type="select"
                    options={[
                      { value: '', label: '请选择' },
                      { value: '必现', label: '必现' },
                      { value: '高频', label: '高频' },
                      { value: '低频', label: '低频' },
                      { value: '单次', label: '单次' }
                    ]}
                    placeholder="-"
                    displayClassName="text-sm font-medium text-gray-900"
                  />
                </div>


              </div>
            </div>
          </section>

          {/* Task List Section */}
          {(isInternalViewer || user) && (
            <div className="mb-6">
              <IssueTaskList issueId={issue.id} canEdit={!!user} />
            </div>
          )}





          {/* Comments / Timeline */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-base font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-green-500" />
                处理记录
              </h3>
            </div>
            <div className="p-6">
              {renderTimeline()}
            </div>
          </section>

          {/* Add Comment Form */}
          <CommentForm
            issueId={issue.id}
            user={user}
            isInternalViewer={isInternalViewer}
            onCommentAdded={async () => {
              await loadIssue(issue.id);
            }}
          />


          {/* Attachments Card (Collapsible) */}
          {issue.attachments && issue.attachments.length > 0 && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center cursor-pointer"
                onClick={() => setShowAttachments(!showAttachments)}
              >
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2 text-indigo-500" />
                  图片/视频/日志附件 ({issue.attachments.length})
                </h3>
                <button className="text-gray-400 hover:text-gray-600">
                  {showAttachments ? '收起' : '展开'}
                </button>
              </div>
              {showAttachments && (
                <ul className="divide-y divide-gray-100">
                  {issue.attachments.map((file) => (
                    <li key={file.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center overflow-hidden">
                        <div className="p-2 bg-gray-100 rounded-lg mr-3">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <a
                        href={getDownloadUrl(file.path)}
                        className="ml-4 flex-shrink-0 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-1.5" />
                        下载
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Operation Log (Admin Only) */}
          {isInternalViewer && renderOperationLog() && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center cursor-pointer"
                onClick={() => setShowOperationLog(!showOperationLog)}
              >
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2 text-blue-500" />
                  操作记录
                </h3>
                <button className="text-gray-400 hover:text-gray-600">
                  {showOperationLog ? '收起' : '展开'}
                </button>
              </div>
              {showOperationLog && (
                <div className="p-6">
                  {renderOperationLog()}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Column: Sidebar Info */}
        <div className="space-y-6">

          {/* Child Issues List (For Parent Issues) */}
          {issue.children && issue.children.length > 0 && (
            <section className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-blue-100 bg-blue-50/30">
                <h3 className="text-xs font-semibold text-blue-900 uppercase tracking-wider flex items-center">
                  <Link2 className="w-3 h-3 mr-1.5" />
                  关联子工单 ({issue.children.length})
                </h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {issue.children.map(child => (
                  <li key={child.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <Link to={`/issues/${child.id}`} className="block group flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-mono text-gray-500 group-hover:text-blue-600">#{child.id}</span>
                          <StatusBadge status={child.status} className="scale-75 origin-top-right" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {child.title}
                        </p>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <span>{child.reporterName}</span>
                          <span className="mx-1">·</span>
                          <span>{new Date(child.createdAt).toLocaleDateString()}</span>
                        </div>
                      </Link>
                      {isInternalViewer && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPendingUnmergeChildId(child.id);
                            setShowUnmergeDialog(true);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors flex-shrink-0"
                          title="取消关联"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Device Info Card */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">设备信息</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs text-gray-400 block mb-1">机型</span>
                <span className="text-base font-semibold text-gray-900 block">{issue.model?.name || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-1">序列号 (SN)</span>
                <EditableField
                  value={issue.serialNumber || '-'}
                  onSave={(val) => handleFieldUpdate('serialNumber', val)}
                  displayClassName="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400 block mb-1">CTR版本号</span>
                  <EditableField
                    value={issue.firmware || '-'}
                    onSave={(val) => handleFieldUpdate('firmware', val)}
                    displayClassName="text-sm text-gray-900"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">HMI版本号</span>
                  <EditableField
                    value={issue.softwareVer || '-'}
                    onSave={(val) => handleFieldUpdate('softwareVer', val)}
                    displayClassName="text-sm text-gray-900"
                  />
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-400 block mb-1">备注信息</span>
                  <EditableField
                    value={issue.remarks || ''}
                    onSave={(val) => handleFieldUpdate('remarks', val)}
                    displayClassName="text-sm text-gray-900"
                    placeholder="无"
                  />
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-1">购买日期</span>
                <EditableField
                  value={issue.purchaseDate ? formatDate(issue.purchaseDate).split(' ')[0] : '-'}
                  onSave={(val) => handleFieldUpdate('purchaseDate', val)}
                  displayClassName="text-sm text-gray-900"
                />
              </div>
            </div>
          </section>

          {/* Reporter Info Card */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">联系人信息</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-400 block mb-1">联系人姓名</span>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                      {issue.reporterName.charAt(0).toUpperCase()}
                    </div>
                    <EditableField
                      value={issue.reporterName}
                      onSave={(val) => handleFieldUpdate('reporterName', val)}
                      displayClassName="text-sm font-medium text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">联系方式</span>
                  <EditableField
                    value={issue.contact || '-'}
                    onSave={(val) => handleFieldUpdate('contact', val)}
                    displayClassName="text-sm text-gray-900"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">客户名称</span>
                  <EditableField
                    value={issue.customerName || '-'}
                    onSave={(val) => handleFieldUpdate('customerName', val)}
                    displayClassName="text-sm text-gray-900 font-medium"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Environment Info Card */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">环境参数</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400 block mb-1">国家或地区</span>
                  <EditableField
                    value={issue.environment || '-'}
                    onSave={(val) => handleFieldUpdate('environment', val)}
                    displayClassName="text-sm text-gray-900"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">使用地点</span>
                  <EditableField
                    value={issue.location || '-'}
                    onSave={(val) => handleFieldUpdate('location', val)}
                    displayClassName="text-sm text-gray-900"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">进水方式</span>
                  <EditableField
                    value={issue.waterType || '-'}
                    onSave={(val) => handleFieldUpdate('waterType', val)}
                    type="select"
                    options={[
                      { value: '水箱', label: '水箱' },
                      { value: '桶装水', label: '桶装水' },
                      { value: '自进水', label: '自进水' }
                    ]}
                    displayClassName="text-sm text-gray-900"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">电源电压频率</span>
                  <EditableField
                    value={issue.voltage || '-'}
                    onSave={(val) => handleFieldUpdate('voltage', val)}
                    displayClassName="text-sm text-gray-900"
                  />
                </div>

              </div>
            </div>
          </section>

          {/* Troubleshooting Card */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                <Wrench className="w-3 h-3 mr-1.5" />
                排查记录
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">尝试重启</span>
                  <EditableField
                    value={issue.restarted ? 'true' : 'false'}
                    onSave={(val) => handleFieldUpdate('restarted', val === 'true')}
                    type="select"
                    options={[
                      { value: 'true', label: '是' },
                      { value: 'false', label: '否' }
                    ]}
                    renderValue={(val) => (
                      <span className={cn("text-sm font-medium", val === 'true' || val === true ? "text-green-600" : "text-gray-400")}>
                        {val === 'true' || val === true ? '是' : '否'}
                      </span>
                    )}
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">尝试清洁</span>
                  <EditableField
                    value={issue.cleaned ? 'true' : 'false'}
                    onSave={(val) => handleFieldUpdate('cleaned', val === 'true')}
                    type="select"
                    options={[
                      { value: 'true', label: '是' },
                      { value: 'false', label: '否' }
                    ]}
                    renderValue={(val) => (
                      <span className={cn("text-sm font-medium", val === 'true' || val === true ? "text-green-600" : "text-gray-400")}>
                        {val === 'true' || val === true ? '是' : '否'}
                      </span>
                    )}
                  />
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-1">更换配件</span>
                <EditableField
                  value={issue.replacedPart || ''}
                  onSave={(val) => handleFieldUpdate('replacedPart', val)}
                  placeholder="未更换配件"
                  displayClassName="text-sm text-gray-900"
                />
              </div>

              <div>
                <span className="text-xs text-gray-500 block mb-1">排查步骤</span>
                <EditableField
                  value={issue.troubleshooting || ''}
                  onSave={(val) => handleFieldUpdate('troubleshooting', val)}
                  type="textarea"
                  placeholder="无详细排查记录"
                  displayClassName="text-sm text-gray-900 whitespace-pre-wrap"
                />
              </div>
            </div>
          </section>

          {/* Custom Data Card */}
          {renderCustomData()}



        </div>
      </div>
      {
        showResolveDialog && issue && (
          <ResolveIssueDialog
            currentStatus={targetStatus}
            currentCategoryId={issue.category?.id}
            onClose={() => setShowResolveDialog(false)}
            onConfirm={handleResolveConfirm}
          />
        )
      }

      {/* Merge Confirm Dialog */}
      <ConfirmDialog
        isOpen={showMergeDialog}
        title="确认并案"
        content={`确定要将当前工单 #${issue?.id} 并入主工单 #${pendingMergeTarget?.id} 吗？\n\n并案后，当前工单将作为子工单，状态变更等操作将由主工单统一管理。`}
        confirmText="确认并入"
        onClose={() => setShowMergeDialog(false)}
        onConfirm={executeMerge}
      />

      {/* Issue Selector Dialog */}
      {showIssueSelector && (
        <IssueSelector
          currentIssueId={issue?.id}
          onSelect={handleMergeSelect}
          onCancel={() => setShowIssueSelector(false)}
        />
      )}

      {/* Status Change Dialog */}
      {
        showStatusDialog && issue && (
          <StatusSelectDialog
            isOpen={showStatusDialog}
            currentStatus={issue.status}
            currentCategoryId={issue.category?.id}
            onClose={() => setShowStatusDialog(false)}
            onConfirm={async (status, categoryId, comment) => {
              try {
                const updates: any = { status };
                if (categoryId) updates.categoryId = categoryId;

                await issueService.update(issue.id, updates);

                if (comment) {
                  await issueService.addComment(issue.id, comment, user?.username || 'Admin', false);
                }

                await loadIssue(issue.id);
              } catch (err) {
                console.error(err);
                alert('状态更新失败');
              }
            }}
          />
        )
      }

      {/* Unmerge Confirm Dialog */}
      <ConfirmDialog
        isOpen={showUnmergeDialog}
        title="取消关联"
        content={`确定要将工单 #${pendingUnmergeChildId} 从此主工单中移除吗？\n\n移除后，该工单将恢复为独立工单。`}
        confirmText="确认移除"
        isDestructive={true}
        onClose={() => {
          setShowUnmergeDialog(false);
          setPendingUnmergeChildId(null);
        }}
        onConfirm={async () => {
          if (!pendingUnmergeChildId || !issue) return;
          try {
            await issueService.unmerge(pendingUnmergeChildId);
            await loadIssue(issue.id);
            setShowUnmergeDialog(false);
            setPendingUnmergeChildId(null);
          } catch (error: any) {
            alert(error.message || '取消关联失败');
          }
        }}
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 -right-2 text-white hover:text-gray-300 p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="删除工单"
        content="确定要删除此工单吗？此操作无法撤销。"
        confirmText="确认删除"
        isDestructive={true}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteIssue}
      />

    </div >
  );
}
