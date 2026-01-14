import { authService } from '../../services/api';
import { Box, ListChecks, BarChart3, Users, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettingsRootProps {
    onNavigate: (view: any) => void;
}

export default function SettingsRoot({ onNavigate }: SettingsRootProps) {
    const currentUser = authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'ADMIN';

    const menus = [
        {
            id: 'models',
            title: '机型管理',
            desc: '管理产品型号、启用/停用设备',
            icon: Box,
            color: 'bg-blue-100 text-blue-600',
        },
        {
            id: 'categories',
            title: '问题分类',
            desc: '管理问题的类型和原因分类',
            icon: ListChecks,
            color: 'bg-green-100 text-green-600',
        },
        {
            id: 'fields',
            title: '表单配置',
            desc: '自定义问题上报的问卷字段',
            icon: ListChecks,
            color: 'bg-purple-100 text-purple-600',
        },
        // 仅ADMIN可见
        ...(isAdmin ? [{
            id: 'performance',
            title: '绩效管理',
            desc: '设置SLA目标与考核指标',
            icon: BarChart3,
            color: 'bg-orange-100 text-orange-600',
        }] : []),
        ...(isAdmin ? [{
            id: 'users',
            title: '用户管理',
            desc: '管理系统用户、角色和权限',
            icon: Users,
            color: 'bg-red-100 text-red-600',
        }] : []),
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">系统设置</h1>
                <p className="text-sm text-gray-500 mt-1">配置系统参数与业务规则</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menus.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className="flex flex-col text-left bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
                    >
                        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110", item.color)}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2 mb-4 flex-1">
                            {item.desc}
                        </p>
                        <div className="flex items-center text-sm font-medium text-gray-400 group-hover:text-blue-500">
                            进入设置
                            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
