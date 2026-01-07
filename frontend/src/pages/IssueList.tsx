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
  const [customerSearch, setCustomerSearch] = useState('');
  const [models, setModels] = useState<DeviceModel[]>([]);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [page, statusFilter, modelFilter, customerSearch]);

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
      const data = await issueService.getIssues(page, 20, statusFilter || undefined, customerSearch || undefined, modelFilter || undefined);
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
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">问题列表</h1>
            <div className="flex space-x-4">
               <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                统计看板
              </Link>
               <Link
                to="/settings"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                设置
              </Link>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                导出数据
              </button>
              <Link
                to="/submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                提交新问题
              </Link>
            </div>
          </div>
          
          {/* Filters */}
          <div className="py-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-4">
             <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="搜索客户名称..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
             </div>
             
             <div>
               <select
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
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
                 className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
               >
                 <option value="">所有机型</option>
                 {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
               </select>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">暂无问题反馈</h3>
            <p className="mt-1 text-gray-500">点击右上角提交第一个问题</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {issues.map((issue) => (
                <li key={issue.id}>
                  <Link to={`/issues/${issue.id}`} className="block hover:bg-gray-50 transition-colors">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center truncate">
                          <p className="text-sm font-medium text-blue-600 truncate mr-3">
                            #{issue.id}
                          </p>
                          <p className="text-base font-semibold text-gray-900 truncate">
                            {issue.title}
                          </p>
                          <span className={cn("ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full", getStatusColor(issue.status))}>
                            {issue.status}
                          </span>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                           <span className="text-sm text-gray-500">
                             {formatDate(issue.submitDate)}
                           </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500 mr-6">
                            <span className="font-medium mr-1">机型:</span> 
                            {issue.model?.name || '未知'}
                          </p>
                          <p className="flex items-center text-sm text-gray-500 mr-6">
                             <span className="font-medium mr-1">提交人:</span>
                             {issue.reporterName}
                          </p>
                          {issue.phenomenon && (
                            <p className="flex items-center text-sm text-gray-500">
                              <span className="font-medium mr-1">现象:</span>
                              {issue.phenomenon}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Pagination */}
            {totalPages > 1 && (
               <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                 <div className="flex-1 flex justify-between sm:justify-end">
                   <button
                     onClick={() => setPage(p => Math.max(1, p - 1))}
                     disabled={page === 1}
                     className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                   >
                     上一页
                   </button>
                   <button
                     onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                     disabled={page === totalPages}
                     className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                   >
                     下一页
                   </button>
                 </div>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
