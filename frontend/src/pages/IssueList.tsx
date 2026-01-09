import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { issueService, authService, type Issue, type DeviceModel } from '../services/api';
import { useDebounce } from '../lib/hooks';
import { KanbanBoard } from '../components/KanbanBoard';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { SeverityBadge, PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { MultiSelect } from '../components/ui/MultiSelect';
import MDEditor from "@uiw/react-md-editor";
import { Loader2, Plus, Search, FileText, AlertCircle, Download, LayoutDashboard, Columns } from 'lucide-react';

import { cn } from '../lib/utils';

export default function IssueListPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list'); // New
  const [sortField, setSortField] = useState<'createdAt' | 'priority' | 'severity'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const user = authService.getCurrentUser();
  const isInternalViewer = user?.role === 'ADMIN' || user?.role === 'DEVELOPER';

  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [modelFilter, setModelFilter] = useState<number[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  // Date state initialized with "near month" logic (calculated in filter component or passed as default)
  // We'll calculate default month range here for initial state
  const formatDateInput = (date: Date) => date.toISOString().split('T')[0];
  const getDefaultRange = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - 1);
    return { start: formatDateInput(start), end: formatDateInput(end) };
  };

  const [startDate, setStartDate] = useState(() => getDefaultRange().start);
  const [endDate, setEndDate] = useState(() => getDefaultRange().end);

  const [models, setModels] = useState<DeviceModel[]>([]);

  const debouncedSearchKeyword = useDebounce(searchKeyword, 500);

  useEffect(() => {
    loadModels();
  }, []);

  // Clear status filter when switching to Kanban to avoid empty columns
  useEffect(() => {
    if (viewMode === 'kanban') {
      setStatusFilter([]);
    }
  }, [viewMode]);

  useEffect(() => {
    fetchIssues();
  }, [page, statusFilter, modelFilter, debouncedSearchKeyword, startDate, endDate, sortField, sortOrder]);

  const loadModels = async () => {
    try {
      const data = await issueService.getModels();
      setModels(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const data = await issueService.getIssues(
        page,
        20,
        statusFilter.length > 0 ? statusFilter : undefined,
        debouncedSearchKeyword || undefined,
        modelFilter.length > 0 ? modelFilter : undefined,
        startDate || undefined,
        endDate || undefined,
        sortField,
        sortOrder
      );
      setIssues(data.items);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      console.error(err);
      setError('无法加载问题列表');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.location.href = '/api/stats/export';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const handleStatusChange = async (issueId: number, newStatus: string) => {
    try {
      // Optimistic update
      setIssues(prev => prev.map(issue =>
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      ));

      await issueService.updateStatus(issueId, newStatus);
    } catch (error) {
      console.error('Failed to update status', error);
      // Revert or show toast (optional: fetch issues again)
      fetchIssues();
    }
  };

  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">问题列表</h1>
          <p className="text-sm text-gray-500 mt-1">管理和追踪所有上报的产品问题</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          {/* 视图切换 */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'list' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
              )}
              title="列表视图"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'kanban' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
              )}
              title="看板视图"
            >
              <Columns className="w-4 h-4" />
            </button>
          </div>

          {/* 排序下拉列表 */}
          <div className="relative inline-block text-left">
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortField(field as 'createdAt' | 'priority' | 'severity');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="pl-3 pr-8 py-2 text-sm border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
            >
              <option value="createdAt-desc">最新提交</option>
              <option value="priority-asc">优先级 (高 &rarr; 低)</option>
              <option value="severity-desc">严重程度 (高 &rarr; 低)</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            导出
          </button>
          <Link
            to="/submit"
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            提交问题
          </Link>
        </div>
      </div>

      {/* Filters Card */}
      <div className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4 transition-all duration-300 sticky top-4 z-10",
        viewMode === 'kanban' ? "mb-0 rounded-b-none border-b-0 shadow-none z-30" : ""
      )}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              placeholder="搜索机型、客户、SN、描述..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>


          <div>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
          </div>

          {viewMode !== 'kanban' && (
            <div>
              <MultiSelect
                options={[
                  { value: 'PENDING', label: '待处理' },
                  { value: 'IN_PROGRESS', label: '处理中' },
                  { value: 'RESOLVED', label: '已解决' },
                  { value: 'CLOSED', label: '已关闭' }
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="筛选状态 (可多选)"
              />
            </div>
          )}

          <div>
            <MultiSelect
              options={models.map(m => ({ value: m.id, label: m.name }))}
              value={modelFilter}
              onChange={setModelFilter}
              placeholder="筛选机型 (可多选)"
            />
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">暂无问题反馈</h3>
            <p className="mt-1 text-gray-500">点击右上角提交第一个问题</p>
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="bg-gray-50 h-[calc(100vh-14rem)] overflow-hidden rounded-b-xl border border-t-0 border-gray-100">
            <div className="h-full p-4 overflow-x-auto">
              <KanbanBoard issues={issues} onStatusChange={handleStatusChange} />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标题 / 描述
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    机型 / 客户
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    上报人
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提交时间
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issues.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => navigate(`/issues/${issue.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      #{issue.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={issue.status} />
                        {issue.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {issue.category.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">{issue.title}</div>
                      <div className="text-sm text-gray-500 mb-2 max-h-[3em] overflow-hidden relative">
                        <div data-color-mode="light">
                          <MDEditor.Markdown
                            source={issue.description || ''}
                            style={{
                              backgroundColor: 'transparent',
                              color: 'inherit',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <SeverityBadge severity={issue.severity || 'MEDIUM'} className="scale-90 origin-left" />
                        {isInternalViewer && <PriorityBadge priority={issue.priority || 'P2'} className="scale-90 origin-left" />}
                        {issue.tags && (() => {
                          try {
                            const tags = JSON.parse(issue.tags);
                            if (Array.isArray(tags) && tags.length > 0) {
                              return tags.map((tag: string) => (
                                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                  {tag}
                                </span>
                              ));
                            }
                          } catch { }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{issue.model?.name || '-'}</div>
                      <div className="text-xs text-gray-500">{issue.customerName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {issue.reporterName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(issue.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              上一页
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                当前第 <span className="font-medium">{page}</span> 页，共 <span className="font-medium">{totalPages}</span> 页
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
