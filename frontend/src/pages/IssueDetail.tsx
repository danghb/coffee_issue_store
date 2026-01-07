import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { issueService, type Issue, type Comment } from '../services/api';
import { Loader2, ArrowLeft, Download, FileText, Image as ImageIcon, Video, Calendar, User, Settings, AlertCircle, Wrench, MessageSquare, Send, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 评论与状态
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      loadIssue(Number(id));
    }
  }, [id]);

  const loadIssue = async (issueId: number) => {
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
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !commentContent.trim()) return;

    try {
      setSubmittingComment(true);
      await issueService.addComment(issue.id, commentContent, 'Admin'); // 暂定 Admin
      setCommentContent('');
      await loadIssue(issue.id); // 刷新
    } catch (err) {
      console.error(err);
      alert('评论失败');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!issue) return;
    if (!window.confirm(`确认将状态变更为 ${newStatus}?`)) return;

    try {
      setUpdatingStatus(true);
      await issueService.updateStatus(issue.id, newStatus, 'Admin');
      await loadIssue(issue.id); // 刷新
    } catch (err) {
      console.error(err);
      alert('状态更新失败');
    } finally {
      setUpdatingStatus(false);
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
                      <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                        <User className="h-4 w-4 text-gray-500" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900 mr-2">{comment.author}</span>
                        {comment.type === 'STATUS_CHANGE' ? (
                          <span>将状态更新为 <span className="font-medium text-blue-600">{comment.newStatus}</span></span>
                        ) : (
                          <span className="text-gray-800">{comment.content}</span>
                        )}
                      </p>
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
          <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">调查问卷 (补充信息)</h3>
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
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button onClick={() => navigate('/issues')} className="mr-4 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 truncate max-w-lg">
                <span className="text-gray-500 mr-2">#{issue.id}</span>
                {issue.title}
              </h1>
              <span className={cn(
                "ml-4 px-2.5 py-0.5 rounded-full text-xs font-medium",
                issue.status === 'PENDING' ? "bg-yellow-100 text-yellow-800" :
                issue.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-800" :
                issue.status === 'RESOLVED' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              )}>
                {issue.status}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              提交于 {formatDate(issue.submitDate)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Description */}
            <section className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-400" />
                  问题详情
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">详细描述</label>
                  <div className="mt-2 text-gray-900 whitespace-pre-wrap text-sm leading-relaxed bg-gray-50 p-4 rounded">
                    {issue.description}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">发生时间</span>
                    <span className="text-sm text-gray-900">{formatDate(issue.occurredAt)}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">出现频率</span>
                    <span className="text-sm text-gray-900">{issue.frequency || '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">问题现象</span>
                    <span className="text-sm text-gray-900">{issue.phenomenon || '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">错误代码</span>
                    <span className="text-sm text-gray-900 font-mono">{issue.errorCode || '-'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Troubleshooting */}
            <section className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Wrench className="w-5 h-5 mr-2 text-gray-400" />
                  排查记录
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="flex items-center">
                     <span className={cn("w-3 h-3 rounded-full mr-2", issue.restarted ? "bg-green-500" : "bg-gray-300")} />
                     <span className="text-sm text-gray-700">尝试重启: {issue.restarted ? '是' : '否'}</span>
                   </div>
                   <div className="flex items-center">
                     <span className={cn("w-3 h-3 rounded-full mr-2", issue.cleaned ? "bg-green-500" : "bg-gray-300")} />
                     <span className="text-sm text-gray-700">尝试清洁: {issue.cleaned ? '是' : '否'}</span>
                   </div>
                 </div>
                 {issue.replacedPart && (
                   <div className="mt-4">
                     <span className="text-sm font-medium text-gray-500 block">更换配件</span>
                     <span className="text-sm text-gray-900">{issue.replacedPart}</span>
                   </div>
                 )}
                 {issue.troubleshooting && (
                   <div className="mt-4">
                     <span className="text-sm font-medium text-gray-500 block">其他排查步骤</span>
                     <p className="mt-1 text-sm text-gray-900">{issue.troubleshooting}</p>
                   </div>
                 )}
              </div>
            </section>

            {/* Attachments */}
            {issue.attachments && issue.attachments.length > 0 && (
              <section className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-gray-400" />
                    附件 ({issue.attachments.length})
                  </h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  {issue.attachments.map((file) => (
                    <li key={file.id} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center overflow-hidden">
                        {getFileIcon(file.mimeType)}
                        <div className="ml-3 truncate">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <a 
                        href={`/api/uploads/files/${file.path}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="ml-4 flex-shrink-0 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        下载/预览
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Timeline / Comments */}
            <section className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-gray-400" />
                  处理记录
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {renderTimeline()}
              </div>
              
              {/* Add Comment Area */}
              <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
                <form onSubmit={handleAddComment}>
                  <div>
                    <label htmlFor="comment" className="sr-only">添加回复</label>
                    <textarea
                      id="comment"
                      name="comment"
                      rows={3}
                      className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md p-2"
                      placeholder="添加回复或备注..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                     {/* Quick Status Change Buttons */}
                     <div className="flex space-x-2">
                        {issue.status !== 'IN_PROGRESS' && (
                          <button
                            type="button"
                            disabled={updatingStatus}
                            onClick={() => handleStatusChange('IN_PROGRESS')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                          >
                            标记为处理中
                          </button>
                        )}
                        {issue.status !== 'RESOLVED' && (
                          <button
                            type="button"
                            disabled={updatingStatus}
                            onClick={() => handleStatusChange('RESOLVED')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                          >
                            标记为已解决
                          </button>
                        )}
                         {issue.status !== 'CLOSED' && (
                          <button
                            type="button"
                            disabled={updatingStatus}
                            onClick={() => handleStatusChange('CLOSED')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200"
                          >
                            关闭问题
                          </button>
                        )}
                     </div>

                    <button
                      type="submit"
                      disabled={submittingComment || !commentContent.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {submittingComment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      发送回复
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>

          {/* Right Column: Sidebar Info */}
          <div className="space-y-6">
            
            {/* Device Info */}
            <section className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">设备信息</h3>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-4">
                <div>
                  <span className="text-xs text-gray-500 uppercase block mb-1">机型</span>
                  <span className="text-base font-semibold text-gray-900">{issue.model?.name || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase block mb-1">序列号 (SN)</span>
                  <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{issue.serialNumber || '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase block mb-1">固件版本</span>
                    <span className="text-sm text-gray-900">{issue.firmware || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase block mb-1">软件版本</span>
                    <span className="text-sm text-gray-900">{issue.softwareVer || '-'}</span>
                  </div>
                </div>
                <div>
                   <span className="text-xs text-gray-500 uppercase block mb-1">购买日期</span>
                   <span className="text-sm text-gray-900">{formatDate(issue.purchaseDate).split(' ')[0]}</span>
                </div>
              </div>
            </section>

            {/* Reporter Info */}
            <section className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">联系人信息</h3>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-4">
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900 font-medium">{issue.reporterName}</span>
                </div>
                {issue.contact && (
                  <div className="text-sm text-gray-600 pl-6 break-all">
                    {issue.contact}
                  </div>
                )}
                {issue.customerName && (
                  <div className="pt-2 border-t border-gray-100 mt-2">
                    <span className="text-xs text-gray-500 block">客户名称</span>
                    <span className="text-sm text-gray-900">{issue.customerName}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Environment Info */}
            <section className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">环境参数</h3>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-3">
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-500">使用环境</span>
                   <span className="text-sm text-gray-900 font-medium">{issue.environment || '-'}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-500">地点</span>
                   <span className="text-sm text-gray-900 font-medium">{issue.location || '-'}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-500">水源</span>
                   <span className="text-sm text-gray-900 font-medium">{issue.waterType || '-'}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-500">电压</span>
                   <span className="text-sm text-gray-900 font-medium">{issue.voltage || '-'}</span>
                 </div>
              </div>
            </section>
            
            {/* Custom Data */}
            {renderCustomData()}

          </div>
        </div>
      </div>
    </div>
  );
}
