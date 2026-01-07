import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  List, 
  PlusCircle, 
  Settings, 
  Menu,
  X,
  LogOut,
  LogIn,
  Search
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { authService, type User } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, [location.pathname]); // Re-check user on route change

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navigation = [
    { name: '提交问题', href: '/submit', icon: PlusCircle, public: true },
    { name: '进度查询', href: '/track', icon: Search, public: true }, // New
    { name: '问题列表', href: '/issues', icon: List, public: false },
    { name: '统计看板', href: '/dashboard', icon: LayoutDashboard, public: false },
    { name: '系统设置', href: '/settings', icon: Settings, public: false },
  ];

  const filteredNavigation = navigation.filter(item => item.public || user);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ... existing mobile backdrop ... */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Area */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
          <span className="text-xl font-bold text-blue-600 tracking-tight truncate">
            咖啡机问题追踪
          </span>
          <button 
            className="md:hidden text-gray-500"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-blue-600" : "text-gray-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Bottom Area */}
        <div className="absolute bottom-0 w-full border-t border-gray-100 p-4">
           {user ? (
             <div className="flex items-center justify-between">
               <div className="flex items-center overflow-hidden">
                 <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold text-xs">
                   {user.username.substring(0, 2).toUpperCase()}
                 </div>
                 <div className="ml-3 truncate">
                   <p className="text-sm font-medium text-gray-700 truncate">{user.name || user.username}</p>
                   <p className="text-xs text-gray-500 truncate">{user.role}</p>
                 </div>
               </div>
               <button 
                 onClick={handleLogout}
                 className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                 title="退出登录"
               >
                 <LogOut className="w-5 h-5" />
               </button>
             </div>
           ) : (
             <Link
               to="/login"
               className="flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
             >
               <LogIn className="w-4 h-4 mr-2" />
               管理员登录
             </Link>
           )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ... existing header and main ... */}
        <header className="bg-white shadow-sm lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center">
               <span className="text-lg font-semibold text-gray-800 md:hidden">咖啡机问题追踪</span>
            </div>
            <div>
              {/* Placeholder for right side actions */}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col">
           <div className="flex-1">
             {children}
           </div>
           
           <footer className="mt-8 pt-6 border-t border-gray-100 text-center">
             <p className="text-sm text-gray-400">
               研发中心电子部开发 &copy; {new Date().getFullYear()}
             </p>
           </footer>
        </main>
      </div>
    </div>
  );
}
