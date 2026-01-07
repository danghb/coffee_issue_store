import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SubmitIssuePage from './pages/SubmitIssue';
import IssueListPage from './pages/IssueList';
import IssueDetailPage from './pages/IssueDetail';
import DashboardPage from './pages/Dashboard';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/Login';
import IssueTrackingPage from './pages/IssueTracking';
import Layout from './components/Layout';
import { authService } from './services/api';
import './App.css';

// 保护路由组件
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = authService.getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* 默认跳转到提交页 (游客默认入口) */}
          <Route path="/" element={<Navigate to="/submit" replace />} />
          
          {/* 登录页 */}
          <Route path="/login" element={<LoginPage />} />

          {/* 提交问题页 (公开) */}
          <Route path="/submit" element={<SubmitIssuePage />} />

          {/* 进度查询页 (公开) */}
          <Route path="/track" element={<IssueTrackingPage />} />
          <Route path="/track/:id" element={<IssueDetailPage />} /> {/* Reuse Detail Page for Public Tracking */}
          
          {/* 问题列表页 (需登录) */}
          <Route path="/issues" element={
            <ProtectedRoute>
              <IssueListPage />
            </ProtectedRoute>
          } />
          
          {/* 问题详情页 (需登录 - 游客查询待后续开发) */}
          <Route path="/issues/:id" element={
            <ProtectedRoute>
              <IssueDetailPage />
            </ProtectedRoute>
          } />

          {/* 统计看板页 (需登录) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          {/* 设置页 (需登录) */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
