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
  Search,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
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
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navigation = [
    { name: '提交问题', href: '/submit', icon: PlusCircle, public: true },
    { name: '进度查询', href: '/track', icon: Search, public: true },
    { name: '问题列表', href: '/issues', icon: List, public: false },
    { name: '统计看板', href: '/dashboard', icon: LayoutDashboard, public: false },
    { name: '系统设置', href: '/settings', icon: Settings, public: false },
  ];

  const filteredNavigation = navigation.filter(item => item.public || user);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out md:relative",
        // Mobile behavior
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        // Desktop behavior (width transition)
        sidebarCollapsed ? "md:w-0 md:overflow-hidden" : "md:w-64"
      )}>
        <div className="h-full flex flex-col w-64"> {/* Inner container fixed width to prevent content squashing during transition */}
          {/* Logo Area */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 flex-shrink-0">
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
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 mr-3 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile / Bottom Area */}
          <div className="border-t border-gray-100 p-4 flex-shrink-0">
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
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors flex-shrink-0"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 mr-2" />
                管理员登录
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Mobile Header & Desktop Toggle */}
        <header className="bg-white shadow-sm flex items-center h-16 px-4 md:px-6 relative z-10">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 focus:outline-none md:hidden mr-4"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex items-center text-gray-400 hover:text-gray-600 mr-4 focus:outline-none"
            title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          <div className="flex items-center">
            <span className="text-lg font-semibold text-gray-800 md:hidden">咖啡机问题追踪</span>
            {/* Optional: Add Breadcrumbs or Page Title here for desktop if needed */}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col w-full">
          <div className="flex-1 w-full">
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
