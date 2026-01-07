import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { issueService, type Issue, type DeviceModel } from '../services/api';
import { Loader2, Plus, Search, FileText, Calendar, AlertCircle, Filter, Download, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export default function IssueListPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 筛选状态
  const [statusFilter, setStatusFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [models, setModels] = useState<DeviceModel[]>([]);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [page]); // 仅在页码变化时自动刷新

  const handleSearch = () => {
    setPage(1); // 重置为第一页
    fetchIssues(); // 手动触发查询
  };

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
        statusFilter || undefined, 
        searchKeyword || undefined, 
        modelFilter || undefined,
        startDate || undefined,
        endDate || undefined
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 tracking-tight">问题列表</h1>
           <p className="text-sm text-gray-500 mt-1">管理和追踪所有上报的产品问题</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </button>
          <Link
            to="/submit"
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            提交新问题
          </Link>
        </div>
      </div>
      
      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
             </div>
             
             <div className="flex gap-2">
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="开始日期"
                />
                <span className="self-center text-gray-400">-</span>
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="结束日期"
                />
             </div>

             <div>
               <select
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="block w-full pl-3 pr-10 py-2 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-gray-50 focus:bg-white transition-colors"
               >
                 <option value="">所有状态</option>
                 <option value="PENDING">待处理</option>
                 <option value="IN_PROGRESS">处理中</option>
                 <option value="RESOLVED">已解决</option>
                 <option value="CLOSED">已关闭</option>
               </select>
             </div>

             <div>
               <select
                 value={modelFilter}
                 onChange={(e) => setModelFilter(e.target.value)}
                 className="block w-full pl-3 pr-10 py-2 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-gray-50 focus:bg-white transition-colors"
               >
                 <option value="">所有机型</option>
                 {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
               </select>
             </div>

             <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
               <button
                 onClick={handleSearch}
                 className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full sm:w-auto justify-center"
               >
                 <Search className="w-4 h-4 mr-2" />
                 查询
               </button>
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
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      #{issue.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", getStatusColor(issue.status))}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">{issue.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-1 mt-0.5">{issue.description}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/issues/${issue.id}`} className="text-blue-600 hover:text-blue-900 hover:underline">
                        查看详情
                      </Link>
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
