import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, ArrowRight, Clock, ChevronRight } from 'lucide-react';
import { issueService } from '../services/api';

export default function IssueTrackingPage() {
  const [issueId, setIssueId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('issue_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueId.trim()) return;
    await performSearch(issueId);
  };

  const performSearch = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      // Try to fetch issue to verify existence
      // Backend now supports querying by nanoId (string) or id (number)
      // Since input can be string now, we pass it as is
      const issue = await issueService.getIssue(id);
      if (issue) {
        // Use nanoId for URL if available, otherwise id
        const trackId = issue.nanoId || issue.id;
        navigate(`/track/${trackId}`);
      }
    } catch (err) {
      setError('未找到该编号的问题，请检查输入是否正确');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">咖啡机问题进度查询</h1>
          <p className="mt-2 text-gray-500">输入查询编码查看处理进度和最新回复</p>
        </div>

        <form onSubmit={handleSearch} className="mt-8 space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              required
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm font-mono"
              placeholder="请输入查询编码"
              value={issueId}
              onChange={(e) => setIssueId(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !issueId}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                查询进度
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        </form>
        
        {/* History Section */}
        {history.length > 0 && (
          <div className="mt-12 text-left">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-1.5" />
              最近查询记录
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {history.slice(0, 3).map((item: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => performSearch(item.nanoId || item.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <div className="flex flex-col items-start overflow-hidden mr-3">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{item.title}</span>
                    <span className="text-xs text-gray-400 font-mono mt-0.5">
                      {item.nanoId || `ID: ${item.id}`} &middot; {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-400 mt-8">
          <p>查询编码在提交成功时生成，请妥善保管</p>
        </div>
      </div>
    </div>
  );
}
