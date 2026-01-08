import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { issueService, authService, type Issue } from '../services/api';
import { Loader2, ArrowLeft, Download, FileText, Image as ImageIcon, Video, Calendar, User, AlertCircle, Wrench, MessageSquare, Send, RefreshCw, ShieldAlert, CheckCircle2, Pencil, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { FileUpload } from '../components/Upload';
import DualModeEditor from '../components/DualModeEditor';
import { EditableField } from '../components/EditableField';
import { EditableTags } from '../components/EditableTags';
import { SeverityBadge, PriorityBadge } from '../components/ui/Badge';
import { ResolveIssueDialog } from '../components/ResolveIssueDialog';
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
  const [isMerging, setIsMerging] = useState(false);
  const [showIssueSelector, setShowIssueSelector] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // 操作记录折叠状态
  const [showOperationLog, setShowOperationLog] = useState(false);

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

  // Resolution Dialog
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');

  const handleStatusChange = async (newStatus: string) => {
    if (!issue) return;

    // If resolving or closing, open dialog to confirm category/add comment
    if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
      setTargetStatus(newStatus);
      setShowResolveDialog(true);
      return;
    }

    // Otherwise standard confirmation (optional)
    if (newStatus !== 'IN_PROGRESS' && !window.confirm(`确认将状态变更为 ${newStatus}?`)) return;

    try {
      setUpdatingStatus(true);
      await issueService.updateStatus(issue.id, newStatus, user?.username || 'Admin');
      await loadIssue(issue.id);
    } catch (err) {
      console.error(err);
      alert('状态更新失败');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResolveConfirm = async (data: { categoryId: number; comment?: string }) => {
    if (!issue) return;
    try {
      setUpdatingStatus(true);

      // 1. Update Category if changed or not set
      if (issue.category?.id !== data.categoryId) {
        // We need to use issueService.update which wraps api.put('/issues/:id', data)
        // Ensure backend create/update logic handles categoryId (It typically should if api expects Partial<Issue>)
        await issueService.update(issue.id, { categoryId: data.categoryId });
      }

      // 2. Add Comment if present
      if (data.comment?.trim()) {
        const authorName = user ? user.username : 'Admin';
        await issueService.addComment(issue.id, data.comment, authorName, false, []);
      }

      // 3. Update Status
      await issueService.updateStatus(issue.id, targetStatus, user?.username || 'Admin');

      // 4. Reload
      await loadIssue(issue.id);
      setShowResolveDialog(false);
    } catch (err) {
      console.error(err);
      alert('操作失败');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMerge = async (targetId?: number) => {
    const targetIdToUse = targetId || (mergeTargetId ? parseInt(mergeTargetId, 10) : null);

    if (!targetIdToUse || !issue) return;

    if (!window.confirm(`确认将当前工单 #${issue.id} 并入工单 #${targetIdToUse}?`)) {
      return;
    }

    try {
      setIsMerging(true);
      await issueService.merge(issue.id, [targetIdToUse]);
      navigate(`/issues/${targetIdToUse}`);
    } catch (error: any) {
      alert(error.message || '并案失败');
    } finally {
      setIsMerging(false);
      setMergeTargetId('');
      setShowIssueSelector(false);
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

    const operationLogs = issue.comments.filter(c => c.type === 'STATUS_CHANGE' || c.type === 'FIELD_CHANGE');

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

    // 只显示用户评论（MESSAGE和SYSTEM）
    const userComments = issue.comments.filter(c => c.type === 'MESSAGE' || c.type === 'SYSTEM');

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
                      <div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900 mr-2">
                            {comment.author}
                            {comment.isInternal && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">内部</span>}
                          </span>
                          <div className="text-sm text-gray-800">
                            <DualModeEditor value={comment.content || ''} onChange={() => { }} editable={false} />
                          </div>
                        </div>

                        {/* Comment Attachments */}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {comment.attachments.map(file => (
                              <a
                                key={file.id}
                                href={`/api/uploads/files/${file.path}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-200 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                              >
                                {getFileIcon(file.mimeType)}
                                <span className="ml-2 truncate max-w-[150px]">{file.filename}</span>
                              </a>
                            ))}
                          </div>
                        )}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
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
              <EditableField
                value={issue.status}
                onSave={(val) => handleFieldUpdate('status', val)}
                type="select"
                options={[
                  { value: 'PENDING', label: '待处理' },
                  { value: 'IN_PROGRESS', label: '处理中' },
                  { value: 'RESOLVED', label: '已解决' },
                  { value: 'CLOSED', label: '已关闭' }
                ]}
                renderValue={(val) => (
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    val === 'PENDING' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                      val === 'IN_PROGRESS' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        val === 'RESOLVED' ? "bg-green-50 text-green-700 border-green-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                  )}>
                    {val === 'PENDING' ? '待处理' : val === 'IN_PROGRESS' ? '处理中' : val === 'RESOLVED' ? '已解决' : '已关闭'}
                  </span>
                )}
              />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2 flex items-center gap-3">
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

        <div className="flex gap-2">
          {/* Quick Actions */}
          {issue.status !== 'IN_PROGRESS' && (
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              disabled={updatingStatus}
              className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            >
              处理中
            </button>
          )}
          {issue.status !== 'RESOLVED' && (
            <button
              onClick={() => handleStatusChange('RESOLVED')}
              disabled={updatingStatus}
              className="px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors border border-green-200"
            >
              已解决
            </button>
          )}
          {issue.status !== 'CLOSED' && (
            <button
              onClick={() => handleStatusChange('CLOSED')}
              disabled={updatingStatus}
              className="px-4 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            >
              关闭
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Merge Alert (If Child) */}
          {issue.parent && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg flex items-start">
              <div className="flex-shrink-0">
                <RefreshCw className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  此工单已并入主工单{' '}
                  <Link to={`/issues/${issue.parent.id}`} className="font-medium underline hover:text-blue-600">
                    #{issue.parent.id} {issue.parent.title}
                  </Link>
                  {' '}进行统一处理。
                </p>
              </div>
            </div>
          )}

          {/* Children List (If Parent) */}
          {issue.children && issue.children.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2 text-blue-500" />
                  关联的子工单 ({issue.children.length})
                </h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {issue.children.map(child => (
                  <li key={child.id} className="px-6 py-3 hover:bg-gray-50">
                    <Link to={`/issues/${child.id}`} className="flex justify-between items-center group">
                      <span className="text-sm text-gray-700 group-hover:text-blue-600">
                        #{child.id} - {child.title}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(child.submitDate).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

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


          {/* Attachments Card */}
          {issue.attachments && issue.attachments.length > 0 && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2 text-indigo-500" />
                  附件 ({issue.attachments.length})
                </h3>
              </div>
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
                      href={`/api/uploads/files/${file.path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-4 flex-shrink-0 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      下载
                    </a>
                  </li>
                ))}
              </ul>
            </section>
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
                <span className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">{issue.serialNumber || '-'}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400 block mb-1">固件版本</span>
                  <span className="text-sm text-gray-900">{issue.firmware || '-'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">软件版本</span>
                  <span className="text-sm text-gray-900">{issue.softwareVer || '-'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-1">购买日期</span>
                <span className="text-sm text-gray-900">{formatDate(issue.purchaseDate).split(' ')[0]}</span>
              </div>
            </div>
          </section>

          {/* Reporter Info Card */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">联系人信息</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                  {issue.reporterName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{issue.reporterName}</p>
                  {issue.contact && <p className="text-xs text-gray-500">{issue.contact}</p>}
                </div>
              </div>
              {issue.customerName && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400 block mb-1">客户名称</span>
                  <span className="text-sm text-gray-900 font-medium">{issue.customerName}</span>
                </div>
              )}
            </div>
          </section>

          {/* Environment Info Card */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">环境参数</h3>
            </div>
            <div className="p-5">
              <dl className="space-y-3">
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-gray-500">使用环境</dt>
                  <dd className="text-sm font-medium text-gray-900 bg-gray-50 px-2 py-0.5 rounded">{issue.environment || '-'}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-gray-500">地点</dt>
                  <dd className="text-sm font-medium text-gray-900">{issue.location || '-'}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-gray-500">水源</dt>
                  <dd className="text-sm font-medium text-gray-900">{issue.waterType || '-'}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-gray-500">电压</dt>
                  <dd className="text-sm font-medium text-gray-900">{issue.voltage || '-'}</dd>
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
            <section className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-blue-100 bg-blue-50/30">
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

                {/* Merge Action */}
                {!issue.parent && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">
                      并案处理
                    </label>
                    <button
                      onClick={() => setShowIssueSelector(true)}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none transition-colors"
                    >
                      选择主工单并入
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      将此工单作为子工单并入另一个主工单
                    </p>
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

      {showIssueSelector && (
        <IssueSelector
          currentIssueId={issue?.id}
          onSelect={(targetId) => handleMerge(targetId)}
          onCancel={() => setShowIssueSelector(false)}
        />
      )}
    </div>
  );
}
