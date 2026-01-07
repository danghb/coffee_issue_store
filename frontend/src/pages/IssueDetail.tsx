import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { issueService, authService, type Issue, type Comment } from '../services/api';
import { Loader2, ArrowLeft, Download, FileText, Image as ImageIcon, Video, Calendar, User, Settings, AlertCircle, Wrench, MessageSquare, Send, RefreshCw, ShieldAlert, Flag, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { FileUpload } from '../components/Upload';
import RichTextEditor from '../components/RichTextEditor';

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

  // 内部字段编辑状态
  const [editingInternal, setEditingInternal] = useState(false);
  const [internalForm, setInternalForm] = useState({ severity: '', priority: '', tags: [] as string[] });

  // Basic Info Edit State
  const [editingBasic, setEditingBasic] = useState(false);
  const [basicForm, setBasicForm] = useState<Partial<Issue>>({});

  // 并案状态
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  // Memoize loadIssue to avoid re-creation if dependencies don't change
  const loadIssue = useCallback(async (issueId: number | string) => {
    try {
      setLoading(true);
      const data = await issueService.getIssue(issueId);
      setIssue(data);

      let parsedTags: string[] = [];
      try {
        parsedTags = data.tags ? JSON.parse(data.tags) : [];
      } catch (e) {
        parsedTags = [];
      }

      setInternalForm({
        severity: data.severity || 'MEDIUM',
        priority: data.priority || 'P2',
        tags: parsedTags
      });
      // Init basic form
      setBasicForm({
        description: data.description,
        occurredAt: data.occurredAt,
        frequency: data.frequency,
        phenomenon: data.phenomenon,
        errorCode: data.errorCode,
        // Add more fields if needed
        restarted: data.restarted,
        cleaned: data.cleaned,
        replacedPart: data.replacedPart,
        troubleshooting: data.troubleshooting
      });
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

  const handleUpdateInternal = async () => {
    if (!issue) return;
    try {
      setLoading(true);
      const dataToUpdate = {
        ...internalForm,
        tags: JSON.stringify(internalForm.tags)
      };
      await issueService.update(issue.id, dataToUpdate);
      setEditingInternal(false);
      await loadIssue(issue.id);
    } catch (err) {
      alert('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBasic = async () => {
    if (!issue) return;
    try {
      setLoading(true);
      await issueService.update(issue.id, basicForm);
      setEditingBasic(false);
      await loadIssue(issue.id);
    } catch (err) {
      alert('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!issue) return;
    if (!window.confirm(`确认将状态变更为 ${newStatus}?`)) return;

    try {
      setUpdatingStatus(true);
      await issueService.updateStatus(issue.id, newStatus, user?.username || 'Admin');
      await loadIssue(issue.id); // 刷新
    } catch (err) {
      console.error(err);
      alert('状态更新失败');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMerge = async () => {
    if (!issue || !mergeTargetId) return;

    const targetId = Number(mergeTargetId);
    if (isNaN(targetId) || targetId === issue.id) {
      alert('请输入有效的、不同于当前工单的 ID');
      return;
    }

    if (!window.confirm(`确认将当前工单 (#${issue.id}) 并入主工单 (#${targetId}) 吗？\n并案后，当前工单将作为子工单关联。`)) return;

    try {
      setIsMerging(true);
      // Backend expects: parentId, childIds[]. 
      // We want to merge CURRENT issue INTO target issue.
      // So parent = targetId, children = [issue.id]
      await issueService.merge(targetId, [issue.id]);
      alert('并案成功！');
      await loadIssue(issue.id);
    } catch (err) {
      console.error(err);
      alert('并案失败，请检查目标 ID 是否存在');
    } finally {
      setIsMerging(false);
      setMergeTargetId('');
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">🔴 紧急</span>;
      case 'HIGH': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">🟠 严重</span>;
      case 'LOW': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">🟢 轻微</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">🟡 一般</span>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return <span className="text-gray-400">-</span>;
    switch (priority) {
      case 'P0': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">P0</span>;
      case 'P1': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">P1</span>;
      case 'P2': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">P2</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white">P3</span>;
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

  const renderTimeline = () => {
    // Note: Backend already filters out internal comments if user is not admin.
    if (!issue?.comments || issue.comments.length === 0) {
      return <div className="text-gray-500 text-sm text-center py-4">暂无处理记录</div>;
    }

    return (
      <div className="flow-root">
        <ul className="-mb-8">
          {issue.comments.map((comment, commentIdx) => (
            <li key={comment.id}>
              <div className="relative pb-8">
                {commentIdx !== issue.comments.length - 1 ? (
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    {comment.type === 'STATUS_CHANGE' ? (
                      <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                        <RefreshCw className="h-4 w-4 text-blue-600" aria-hidden="true" />
                      </span>
                    ) : (
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
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900 mr-2">
                          {comment.author}
                          {comment.isInternal && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">内部</span>}
                        </span>
                        {comment.type === 'STATUS_CHANGE' ? (
                          <span>将状态更新为 <span className="font-medium text-blue-600">{comment.newStatus}</span></span>
                        ) : (
                          <div className="text-gray-800 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: comment.content || '' }} />
                        )}
                      </p>

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
      {showSuccessBanner && (
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
      )}

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
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                issue.status === 'PENDING' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                  issue.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-700 border-blue-200" :
                    issue.status === 'RESOLVED' ? "bg-green-50 text-green-700 border-green-200" :
                      "bg-gray-50 text-gray-700 border-gray-200"
              )}>
                {issue.status}
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2 flex items-center gap-3">
            {issue.title}
            {getSeverityBadge(issue.severity)}
            {isInternalViewer && getPriorityBadge(issue.priority)}
          </h1>
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

          {/* Internal Fields (Admin Only) */}
          {isInternalViewer && (
            <section className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-100 flex justify-between items-center">
                <h3 className="text-base font-semibold text-amber-900 flex items-center">
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  内部管理
                </h3>
                {!editingInternal ? (
                  <button
                    onClick={() => setEditingInternal(true)}
                    className="text-sm text-amber-700 hover:text-amber-900 font-medium"
                  >
                    编辑属性
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateInternal}
                      className="text-sm bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700 shadow-sm"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingInternal(false)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6 grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-2">
                    严重程度 (公开)
                  </label>
                  {editingInternal ? (
                    <select
                      value={internalForm.severity}
                      onChange={(e) => setInternalForm(prev => ({ ...prev, severity: e.target.value }))}
                      className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2"
                    >
                      <option value="LOW">🟢 轻微</option>
                      <option value="MEDIUM">🟡 一般</option>
                      <option value="HIGH">🟠 严重</option>
                      <option value="CRITICAL">🔴 紧急</option>
                    </select>
                  ) : (
                    <div className="text-sm text-gray-900">{getSeverityBadge(issue.severity)}</div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-2 flex items-center">
                    <Flag className="w-3 h-3 mr-1" /> 优先级 (内部)
                  </label>
                  {editingInternal ? (
                    <select
                      value={internalForm.priority}
                      onChange={(e) => setInternalForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2"
                    >
                      <option value="P0">P0 - 立即处理</option>
                      <option value="P1">P1 - 紧急</option>
                      <option value="P2">P2 - 高</option>
                      <option value="P3">P3 - 普通</option>
                    </select>
                  ) : (
                    <div className="text-sm text-gray-900">{getPriorityBadge(issue.priority)}</div>
                  )}
                </div>

                <div className="col-span-2 border-t border-amber-200 pt-4">
                  <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-2">
                    标签 (Tags)
                  </label>
                  {editingInternal ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {internalForm.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-1 rounded bg-white text-amber-900 text-xs border border-amber-200 shadow-sm">
                            {tag}
                            <button
                              onClick={() => setInternalForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                              className="ml-1.5 text-amber-400 hover:text-amber-700 font-bold leading-none"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="输入标签按回车添加..."
                        className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 placeholder-amber-300/70"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val && !internalForm.tags.includes(val)) {
                              setInternalForm(prev => ({ ...prev, tags: [...prev.tags, val] }));
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {issue.tags && JSON.parse(issue.tags).map((tag: string) => (
                        <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                      {(!issue.tags || JSON.parse(issue.tags).length === 0) && <span className="text-sm text-gray-400 italic">无标签</span>}
                    </div>
                  )}
                </div>

                {/* Merge Action (Admin Only) */}
              </div> {/* End of p-6 grid */}

              {/* Merge Action (Admin Only) */}
              {!issue.parent && (
                <div className="px-6 py-4 border-t border-amber-200">
                  <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-2">
                    并案处理 (将此工单并入...)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="输入主工单 ID"
                      className="block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2 bg-white"
                      value={mergeTargetId}
                      onChange={(e) => setMergeTargetId(e.target.value.replace(/\D/g, ''))}
                    />
                    <button
                      onClick={handleMerge}
                      disabled={isMerging || !mergeTargetId}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none disabled:opacity-50 shadow-sm"
                    >
                      {isMerging ? <Loader2 className="w-4 h-4 animate-spin" /> : '并入'}
                    </button>
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    注意：并案后，本工单将作为子工单，状态追踪将引导至主工单。
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Description Card */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                问题详情
              </h3>
              {!editingBasic ? (
                <button
                  onClick={() => setEditingBasic(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  编辑
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateBasic}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingBasic(false)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">详细描述</label>
                {editingBasic ? (
                  <RichTextEditor
                    value={basicForm.description || ''}
                    onChange={(html) => setBasicForm(prev => ({ ...prev, description: html }))}
                    editable={true}
                  />
                ) : (
                  <div className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100" dangerouslySetInnerHTML={{ __html: issue.description }} />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className={cn("bg-gray-50 p-3 rounded-lg border border-gray-100", editingBasic && "bg-white border-gray-300")}>
                  <span className="text-xs text-gray-500 block mb-1">发生时间</span>
                  {editingBasic ? (
                    <input
                      type="datetime-local"
                      value={basicForm.occurredAt ? new Date(basicForm.occurredAt).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, occurredAt: e.target.value }))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{formatDate(issue.occurredAt)}</span>
                  )}
                </div>
                <div className={cn("bg-gray-50 p-3 rounded-lg border border-gray-100", editingBasic && "bg-white border-gray-300")}>
                  <span className="text-xs text-gray-500 block mb-1">出现频率</span>
                  {editingBasic ? (
                    <select
                      value={basicForm.frequency || ''}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, frequency: e.target.value }))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1"
                    >
                      <option value="">请选择</option>
                      <option value="必现">必现</option>
                      <option value="高频">高频</option>
                      <option value="低频">低频</option>
                      <option value="单次">单次</option>
                    </select>
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{issue.frequency || '-'}</span>
                  )}
                </div>
                <div className={cn("bg-gray-50 p-3 rounded-lg border border-gray-100", editingBasic && "bg-white border-gray-300")}>
                  <span className="text-xs text-gray-500 block mb-1">问题现象</span>
                  {editingBasic ? (
                    <input
                      type="text"
                      value={basicForm.phenomenon || ''}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, phenomenon: e.target.value }))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{issue.phenomenon || '-'}</span>
                  )}
                </div>
                <div className={cn("bg-gray-50 p-3 rounded-lg border border-gray-100", editingBasic && "bg-white border-gray-300")}>
                  <span className="text-xs text-gray-500 block mb-1">错误代码</span>
                  {editingBasic ? (
                    <input
                      type="text"
                      value={basicForm.errorCode || ''}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, errorCode: e.target.value }))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1"
                    />
                  ) : (
                    <span className="text-sm font-mono text-gray-900">{issue.errorCode || '-'}</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Troubleshooting Card */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-base font-semibold text-gray-900 flex items-center">
                <Wrench className="w-4 h-4 mr-2 text-purple-500" />
                排查记录
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className={cn("w-2 h-2 rounded-full mr-3", issue.restarted ? "bg-green-500" : "bg-gray-300")} />
                  <span className="text-sm font-medium text-gray-700">尝试重启</span>
                  <span className="ml-auto text-sm text-gray-900">{issue.restarted ? '是' : '否'}</span>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className={cn("w-2 h-2 rounded-full mr-3", issue.cleaned ? "bg-green-500" : "bg-gray-300")} />
                  <span className="text-sm font-medium text-gray-700">尝试清洁</span>
                  <span className="ml-auto text-sm text-gray-900">{issue.cleaned ? '是' : '否'}</span>
                </div>
              </div>

              {(issue.replacedPart || issue.troubleshooting) && (
                <div className="space-y-4">
                  {issue.replacedPart && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">更换配件</span>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{issue.replacedPart}</p>
                    </div>
                  )}
                  {issue.troubleshooting && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">其他排查步骤</span>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{issue.troubleshooting}</p>
                    </div>
                  )}
                </div>
              )}
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
                    <RichTextEditor
                      value={commentContent}
                      onChange={setCommentContent}
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

          {/* Custom Data Card */}
          {renderCustomData()}

        </div>
      </div>
    </div >
  );
}
