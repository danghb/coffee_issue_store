
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { issueService, authService, type Issue } from '../services/api';
import { Loader2, ArrowLeft, Send, CheckCircle, AlertCircle, Clock, Archive, MoreHorizontal, Paperclip, X, Download, ImageIcon, FileText, Video, Trash2, Edit2, Save, XCircle, Plus, Minus, RefreshCw, ShieldAlert, Calendar, User, Wrench, Pencil, Link2, MessageSquare, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { FileUpload } from '../components/Upload';
import DualModeEditor from '../components/DualModeEditor';
import { EditableField } from '../components/EditableField';
import { EditableTags } from '../components/EditableTags';
import { SeverityBadge, PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { ResolveIssueDialog } from '../components/ResolveIssueDialog';
import { StatusSelectDialog } from '../components/StatusSelectDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import IssueSelector from '../components/IssueSelector';

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
  const [commentContent, setCommentContent] = useState('');
  const [guestName, setGuestName] = useState(''); // For guest users
  const [commentIsInternal, setCommentIsInternal] = useState(true); // Default internal for admins
  const [commentAttachmentIds, setCommentAttachmentIds] = useState<number[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // 描述编辑状态
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');

  // 并案状态
  const [mergeTargetId, setMergeTargetId] = useState('');
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
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Issue['status'] | ''>('');

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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !commentContent.trim()) return;

    try {
      setSubmittingComment(true);
      // 如果未登录，author 优先使用 guestName，否则 'Guest'
      // 如果已登录，author 默认为 username (后端从 token 提取)
      const authorName = user ? user.username : (guestName.trim() || 'Guest');
      await issueService.addComment(issue.id, commentContent, authorName, isInternalViewer ? commentIsInternal : false, commentAttachmentIds);
      setCommentContent('');
      setCommentAttachmentIds([]); // Reset attachments
      // setGuestName(''); // Optional: keep name for next comment? Let's keep it for convenience
      setCommentIsInternal(true); // Reset to default
      await loadIssue(issue.id); // 刷新
    } catch (err) {
      console.error(err);
      alert('评论失败');
    } finally {
      setSubmittingComment(false);
    }
  };


  // 单字段更新函数 (用于行内编辑)
  const handleFieldUpdate = async (field: string, newValue: any) => {
    if (!issue) return;
    try {
      await issueService.update(issue.id, { [field]: newValue });
      await loadIssue(issue.id);
    } catch (err) {
      console.error('Field update failed:', err);
      throw err; // Re-throw so EditableField knows update failed
    }
  };

  // Resolution Dialog handlers
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

  const handleStatusChange2 = async (newStatus: string) => {
    if (!issue) return;
    try {
      await issueService.updateStatus(issue.id, newStatus, user?.username || 'Admin');
      await loadIssue(issue.id);
    } catch (err) {
      console.error(err);
      alert('状态更新失败');
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

    // 只显示用户提交的评论（MESSAGE类型）
    const userComments = issue.comments.filter(c => c.type === 'MESSAGE');

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
                  <div className="relative flex space-x-3">
                    <div>
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
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 flex items-center justify-between">
                          <span className="font-medium text-gray-900 mr-2">
                            {comment.author}
                            {comment.isInternal && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">内部</span>}
                          </span>
                          <div className="flex items-center gap-2">
                            <time className="text-sm whitespace-nowrap text-gray-500" dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(comment.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="编辑评论"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-800 mt-1">
                          {editingCommentId === comment.id ? (
                            <DualModeEditor
                              value={comment.content || ''}
                              onChange={async (newContent) => {
                                try {
                                  await issueService.updateComment(issue.id, comment.id, newContent);
                                  await loadIssue(issue.id);
                                  setEditingCommentId(null);
                                } catch (err) {
                                  console.error('Failed to update comment:', err);
                                  alert('更新评论失败');
                                }
                              }}
                              editable={true}
                              clickToEdit={false}
                            />
                          ) : (
                            <DualModeEditor
                              value={comment.content || ''}
                              onChange={() => { }}
                              editable={false}
                              clickToEdit={false}
                            />
                          )}
                        </div>
                      </div>

                      {/* Comment Attachments */}
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {comment.attachments.map(file => (
                            <a
                              key={file.id}
                              href={getDownloadUrl(file.path)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-200 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                              {getFileIcon(file.mimeType)}
                              <span className="ml-2 truncate max-w-[150px]">{file.filename}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 分页控件 */}
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
              <CheckCircle2 className="h-5 w-5 text-green-400" />
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
            <div className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <EditableField
                value={issue.title}
                onSave={(val) => handleFieldUpdate('title', val)}
                displayClassName="text-2xl font-bold text-gray-900"
              />
              <SeverityBadge severity={issue.severity || 'MEDIUM'} />
              {isInternalViewer && <PriorityBadge priority={issue.priority || 'P2'} />}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5" />
                提交于 {formatDate(issue.submitDate)}
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
                    <DualModeEditor
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
                    <DualModeEditor value={issue.description || ''} onChange={() => { }} editable={false} />
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
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">问题现象</span>
                  <EditableField
                    value={issue.phenomenon || ''}
                    onSave={(val) => handleFieldUpdate('phenomenon', val)}
                    placeholder="-"
                    displayClassName="text-sm font-medium text-gray-900"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 block mb-1">错误代码</span>
                  <EditableField
                    value={issue.errorCode || ''}
                    onSave={(val) => handleFieldUpdate('errorCode', val)}
                    placeholder="-"
                    displayClassName="text-sm font-mono text-gray-900"
                  />
                </div>
              </div>
            </div>
          </section>





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

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <form onSubmit={handleAddComment}>
                <div className="space-y-3">
                  {!user && (
                    <div>
                      <label htmlFor="guestName" className="sr-only">您的称呼</label>
                      <input
                        type="text"
                        id="guestName"
                        className="block w-full sm:w-1/3 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-lg p-2"
                        placeholder="您的称呼 (选填)"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                      />
                    </div>
                  )}
                  <div>
                    <label htmlFor="comment" className="sr-only">添加回复</label>
                    <DualModeEditor
                      value={commentContent}
                      onChange={setCommentContent}
                      height={200}
                      editable={true}
                    />
                  </div>
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

          {/* Attachments Card (Collapsible) */}
          {issue.attachments && issue.attachments.length > 0 && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center cursor-pointer"
                onClick={() => setShowAttachments(!showAttachments)}
              >
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2 text-indigo-500" />
                  附件 ({issue.attachments.length})
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
                  <span className="text-xs text-gray-400 block mb-1">固件版本</span>
                  <EditableField
                    value={issue.firmware || '-'}
                    onSave={(val) => handleFieldUpdate('firmware', val)}
                    displayClassName="text-sm text-gray-900"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">软件版本</span>
                  <EditableField
                    value={issue.softwareVer || '-'}
                    onSave={(val) => handleFieldUpdate('softwareVer', val)}
                    displayClassName="text-sm text-gray-900"
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
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-gray-400 block mb-1">使用环境</dt>
                  <dd><EditableField
                    value={issue.environment || ''}
                    onSave={(val) => handleFieldUpdate('environment', val)}
                    type="select"
                    options={[
                      { value: '', label: '请选择' },
                      { value: '商用', label: '商用' },
                      { value: '家用', label: '家用' }
                    ]}
                    displayClassName="text-sm font-medium text-gray-900 bg-gray-50 px-2 py-0.5 rounded inline-block"
                  /></dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 block mb-1">地点</dt>
                  <dd><EditableField
                    value={issue.location || '-'}
                    onSave={(val) => handleFieldUpdate('location', val)}
                    displayClassName="text-sm font-medium text-gray-900"
                  /></dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 block mb-1">水源</dt>
                  <dd><EditableField
                    value={issue.waterType || ''}
                    onSave={(val) => handleFieldUpdate('waterType', val)}
                    type="select"
                    options={[
                      { value: '', label: '请选择' },
                      { value: '自来水', label: '自来水' },
                      { value: '过滤水', label: '过滤水' },
                      { value: '瓶装水', label: '瓶装水' }
                    ]}
                    displayClassName="text-sm font-medium text-gray-900"
                  /></dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 block mb-1">电压</dt>
                  <dd><EditableField
                    value={issue.voltage || '-'}
                    onSave={(val) => handleFieldUpdate('voltage', val)}
                    displayClassName="text-sm font-medium text-gray-900"
                  /></dd>
                </div>
              </dl>
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
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-600">尝试重启</span>
                <span className={cn("text-xs font-medium", issue.restarted ? "text-green-600" : "text-gray-400")}>
                  {issue.restarted ? '是' : '否'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-600">尝试清洁</span>
                <span className={cn("text-xs font-medium", issue.cleaned ? "text-green-600" : "text-gray-400")}>
                  {issue.cleaned ? '是' : '否'}
                </span>
              </div>
              {issue.replacedPart && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500 block mb-1">更换配件</span>
                  <p className="text-xs text-gray-900">{issue.replacedPart}</p>
                </div>
              )}
              {issue.troubleshooting && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500 block mb-1">排查步骤</span>
                  <p className="text-xs text-gray-900">{issue.troubleshooting}</p>
                </div>
              )}
            </div>
          </section>

          {/* Custom Data Card */}
          {renderCustomData()}

          {/* Internal Management Card (Admin Only) */}
          {isInternalViewer && (
            <section className="bg-white rounded-xl shadow-sm border border-blue-100">
              <div className="px-5 py-3 border-b border-blue-100 bg-blue-50/30 rounded-t-xl">
                <h3 className="text-xs font-semibold text-blue-900 uppercase tracking-wider flex items-center">
                  <ShieldAlert className="w-3 h-3 mr-1.5" />
                  内部管理
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Severity */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">
                    严重程度
                  </label>
                  <EditableField
                    value={issue.severity || 'MEDIUM'}
                    onSave={(val) => handleFieldUpdate('severity', val)}
                    type="select"
                    options={[
                      { value: 1, label: '🟢 轻微' },
                      { value: 2, label: '🟡 一般' },
                      { value: 3, label: '🟠 严重' },
                      { value: 4, label: '🔴 紧急' }
                    ]}
                    renderValue={(val) => <SeverityBadge severity={val} />}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">
                    目标日期
                  </label>
                  <EditableField
                    value={issue.targetDate ? new Date(issue.targetDate).toISOString().split('T')[0] : ''}
                    onSave={(val) => handleFieldUpdate('targetDate', val)}
                    type="date"
                    placeholder="-"
                    displayClassName="text-sm text-gray-900"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">
                    标签
                  </label>
                  <EditableTags
                    value={issue.tags || '[]'}
                    onSave={async (val) => {
                      await issueService.update(issue.id, { tags: val });
                      await loadIssue(issue.id);
                    }}
                  />
                </div>

                {/* Merge Action - Only allow if not a child (no parent) AND not a parent (no children) - limit depth to 1 */}
                {!issue.parent && (!issue.children || issue.children.length === 0) && (
                  <div className="pt-4 border-t border-gray-200 relative">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">
                      并案处理
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        console.log('Merge button clicked');
                        e.preventDefault();
                        setShowIssueSelector(prev => !prev);
                      }}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none transition-colors"
                    >
                      选择主工单并入
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      将此工单作为子工单并入另一个主工单
                    </p>
                    {showIssueSelector && (
                      <IssueSelector
                        currentIssueId={issue?.id}
                        onSelect={handleMergeSelect}
                        onCancel={() => setShowIssueSelector(false)}
                      />
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

        </div>
      </div>
      {showResolveDialog && issue && (
        <ResolveIssueDialog
          currentStatus={targetStatus}
          currentCategoryId={issue.category?.id}
          onClose={() => setShowResolveDialog(false)}
          onConfirm={handleResolveConfirm}
        />
      )}

      {/* Merge Confirm Dialog */}
      <ConfirmDialog
        isOpen={showMergeDialog}
        title="确认并案"
        content={`确定要将当前工单 #${issue?.id} 并入主工单 #${pendingMergeTarget?.id} 吗？\n\n并案后，当前工单将作为子工单，状态变更等操作将由主工单统一管理。`}
        confirmText="确认并入"
        onClose={() => setShowMergeDialog(false)}
        onConfirm={executeMerge}
      />

      {/* Status Change Dialog */}
      {showStatusDialog && issue && (
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
      )}

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

    </div>
  );
}
