import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OverviewTab from '@/components/tabs/OverviewTab'
import ServerConfigTab from '@/components/tabs/ServerConfigTab'
import AppVersionTab from '@/components/tabs/AppVersionTab'
import WhitelistTab from '@/components/tabs/WhitelistTab'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
    const { logout, user } = useAuthStore()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<string>('')

    // 定义Tab配置
    const tabConfig = [
        {
            value: 'overview',
            label: '统计总览',
            component: <OverviewTab />,
            roles: ['admin'],
        },
        {
            value: 'server',
            label: '服务器配置',
            component: <ServerConfigTab />,
            roles: ['admin', 'user'],
        },
        {
            value: 'version',
            label: 'App版本配置',
            component: <AppVersionTab />,
            roles: ['admin'],
        },
        {
            value: 'whitelist',
            label: '用户白名单',
            component: <WhitelistTab />,
            roles: ['admin'],
        },
    ]

    const userRole = user?.role || 'user'
    const accessibleTabs = tabConfig.filter((tab) =>
        tab.roles.includes(userRole),
    )

    // 设置默认激活的Tab（只在首次或accessibleTabs变化时更新）
    useEffect(() => {
        if (accessibleTabs.length > 0 && !activeTab) {
            setActiveTab(accessibleTabs[0].value)
        } else if (accessibleTabs.length === 0) {
            // 无任何权限，登出并提示
            logout()
            navigate('/login', { replace: true })
        }
    }, [accessibleTabs, activeTab, logout, navigate])

    const handleLogout = () => {
        logout()
        navigate('/login', { replace: true })
    }

    // 无权限时显示加载或直接重定向（上面 useEffect 已处理，这里作为兜底）
    if (accessibleTabs.length === 0) {
        return null // 或加载中，实际会被重定向
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <header className="bg-white dark:bg-slate-800 border-b px-6 py-3 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    控制面板
                </h1>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                </Button>
            </header>

            <main className="container mx-auto p-4 sm:p-6 max-w-7xl">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    orientation="horizontal"
                    className="w-full flex flex-col gap-6"
                >
                    <TabsList className="w-full flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 gap-1">
                        {accessibleTabs.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="flex-1 py-2 rounded-md transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:shadow-sm"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {accessibleTabs.map((tab) => (
                        <TabsContent
                            key={tab.value}
                            value={tab.value}
                            className="m-0 p-0 focus-visible:outline-none focus-visible:ring-0"
                        >
                            {tab.component}
                        </TabsContent>
                    ))}
                </Tabs>
            </main>
        </div>
    )
}
