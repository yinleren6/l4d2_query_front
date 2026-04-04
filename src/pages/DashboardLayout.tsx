// src/pages/DashboardLayout.tsx
import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
    Menu,
    LogOut,
    LayoutDashboard,
    Server,
    Database,
    Users,
    Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { useLocation } from 'react-router-dom'

export default function DashboardLayout() {
    const { logout, user } = useAuthStore()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const menuItems: MenuItem[] = [
        {
            to: '/dashboard/overview',
            label: '统计总览',
            icon: <LayoutDashboard size={18} />,
            roles: ['admin'],
        },
        {
            to: '/dashboard/server',
            label: '服务器配置',
            icon: <Server size={18} />,
            roles: ['admin', 'user'],
        },
        {
            to: '/dashboard/version',
            label: 'App版本配置',
            icon: <Database size={18} />,
            roles: ['admin'],
        },
        {
            to: '/dashboard/whitelist',
            label: '用户白名单',
            icon: <Users size={18} />,
            roles: ['admin'],
        },
        {
            to: '/dashboard/server-info',
            label: '服务器信息',
            icon: <Activity size={18} />,
            roles: ['admin'],
        },
    ]

    const userRole = user?.role || 'user'
    const accessibleMenus = menuItems.filter((item) =>
        item.roles.includes(userRole),
    )
    // 在组件内部
    const location = useLocation()
    useEffect(() => {
        if (location.pathname === '/dashboard' && accessibleMenus.length > 0) {
            navigate(accessibleMenus[0].to, { replace: true })
        }
    }, [location, accessibleMenus, navigate])
    interface MenuItem {
        to: string
        label: string
        icon: React.ReactNode
        roles: string[]
    }

    // 如果没有任何权限，登出
    useEffect(() => {
        if (accessibleMenus.length === 0) {
            logout()
            navigate('/login', { replace: true })
        }
    }, [accessibleMenus, logout, navigate])

    const handleLogout = () => {
        logout()
        navigate('/login', { replace: true })
    }

    // 如果无权限，不渲染（等待重定向）
    if (accessibleMenus.length === 0) return null

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* 顶部栏 */}
            <header className="bg-white dark:bg-slate-800 border-b px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={20} />
                    </Button>
                    <h1 className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        控制面板
                    </h1>
                </div>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                    <LogOut size={16} className="mr-2" />
                    退出登录
                </Button>
            </header>

            <div className="flex">
                {/* 侧边栏 */}
                <aside
                    className={cn(
                        'fixed top-0 left-0 z-40 w-64 h-screen bg-white dark:bg-slate-800 border-r transition-transform md:relative md:translate-x-0',
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                    )}
                >
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold">导航菜单</h2>
                        </div>
                        <nav className="flex-1 p-2 space-y-1">
                            {accessibleMenus.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) =>
                                        cn(
                                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
                                        )
                                    }
                                >
                                    {item.icon}
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* 内容区 */}
                <main className="flex-1 p-4 sm:p-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* 移动端遮罩层 */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    )
}
