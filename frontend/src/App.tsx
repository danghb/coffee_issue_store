import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SubmitIssuePage from './pages/SubmitIssue';
import IssueListPage from './pages/IssueList';
import IssueDetailPage from './pages/IssueDetail';
import DashboardPage from './pages/Dashboard';
import SettingsPage from './pages/Settings';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* 默认跳转到列表页 */}
        <Route path="/" element={<Navigate to="/issues" replace />} />
        
        {/* 提交问题页 */}
        <Route path="/submit" element={<SubmitIssuePage />} />
        
        {/* 问题列表页 */}
        <Route path="/issues" element={<IssueListPage />} />
        
        {/* 问题详情页 */}
        <Route path="/issues/:id" element={<IssueDetailPage />} />

        {/* 统计看板页 */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* 设置页 */}
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
