import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SubmitIssuePage from './pages/SubmitIssue';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* 默认跳转到提交页 */}
        <Route path="/" element={<Navigate to="/submit" replace />} />
        
        {/* 提交问题页 */}
        <Route path="/submit" element={<SubmitIssuePage />} />
        
        {/* 后续添加看板页 */}
        {/* <Route path="/issues" element={<IssueListPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
