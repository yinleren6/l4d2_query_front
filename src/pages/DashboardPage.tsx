// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import OverviewTab from '@/components/tabs/OverviewTab'
import ServerConfigTab from '@/components/tabs/ServerConfigTab'
import AppVersionTab from '@/components/tabs/AppVersionTab'
import WhitelistTab from '@/components/tabs/WhitelistTab'
import ServerInfoTab from '@/components/tabs/ServerInfoTab'
import Sidebar, { MenuItem } from '@/components/layout/Sidebar'
import { LayoutDashboard, Server, Database, Users } from 'lucide-react'
import { Server as ServerIcon } from 'lucide-react' // 新增导入
export default function DashboardPage() {
    const { logout, user } = useAuthStore()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<string>('')
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // 定义菜单项（与原来 tabConfig 对应）
    const menuItems: MenuItem[] = [
        {
            value: 'overview',
            label: '统计总览',
            icon: <LayoutDashboard className="h-4 w-4" />,
            roles: ['admin'],
        },
        {
            value: 'server-config',
            label: '服务器配置',
            icon: <Server className="h-4 w-4" />,
            roles: ['admin', 'user'],
        },
        {
            value: 'version',
            label: 'App版本配置',
            icon: <Database className="h-4 w-4" />,
            roles: ['admin'],
        },
        {
            value: 'whitelist',
            label: '用户白名单',
            icon: <Users className="h-4 w-4" />,
            roles: ['admin'],
        },
        {
            value: 'server-info', // 新页面标识
            label: '服务器信息',
            icon: <ServerIcon className="h-4 w-4" />,
            roles: ['admin'], // 只有 admin 可访问
        },
    ]

    const userRole = user?.role || 'user'
    const accessibleTabs = menuItems.filter((item) =>
        item.roles.includes(userRole),
    )

    // 设置默认激活的Tab
    useEffect(() => {
        if (accessibleTabs.length > 0 && !activeTab) {
            setActiveTab(accessibleTabs[0].value)
        } else if (accessibleTabs.length === 0) {
            logout()
            navigate('/login', { replace: true })
        }
    }, [accessibleTabs, activeTab, logout, navigate])

    const handleLogout = () => {
        logout()
        navigate('/login', { replace: true })
    }

    if (accessibleTabs.length === 0) {
        return null
    }

    // 根据 activeTab 渲染对应组件
    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab />
            case 'server-config':
                return <ServerConfigTab />
            case 'version':
                return <AppVersionTab />
            case 'whitelist':
                return <WhitelistTab />
            case 'server-info': // 新分支
                return <ServerInfoTab />
            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* 顶部导航栏（移动端显示汉堡菜单） */}
            <header className="bg-white dark:bg-slate-800 border-b px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        控制面板
                    </h1>
                </div>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                    退出登录
                </Button>
            </header>

            {/* 主体区域：侧边栏 + 内容 */}
            <div className="flex min-h-screen">
                <Sidebar
                    items={menuItems}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    userRole={userRole}
                />
                {/* 右侧内容区 */}
                <main className="flex-1">
                    <div className="max-w-7xl mx-auto">{renderContent()}</div>
                </main>
            </div>
        </div>
    )
}
