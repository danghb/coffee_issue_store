import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const user = authService.getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
