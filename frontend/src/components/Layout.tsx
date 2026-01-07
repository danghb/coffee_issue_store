import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  List, 
  PlusCircle, 
  Settings, 
  Menu,
  X,
  Search,
  Bell
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: '问题列表', href: '/issues', icon: List },
    { name: '提交问题', href: '/submit', icon: PlusCircle },
    { name: '统计看板', href: '/dashboard', icon: LayoutDashboard },
    { name: '系统设置', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
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
          <span className="text-xl font-bold text-blue-600 tracking-tight">
            ProblemTracker
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
          {navigation.map((item) => {
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
           <div className="flex items-center">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
               AD
             </div>
             <div className="ml-3">
               <p className="text-sm font-medium text-gray-700">Admin User</p>
               <p className="text-xs text-gray-500">admin@example.com</p>
             </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (Mobile Only / Search) */}
        <header className="bg-white shadow-sm lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center">
               <span className="text-lg font-semibold text-gray-800 md:hidden">ProblemTracker</span>
            </div>
            <div>
              {/* Placeholder for right side actions */}
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
           {children}
        </main>
      </div>
    </div>
  );
}
