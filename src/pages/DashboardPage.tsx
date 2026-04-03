import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OverviewTab from '@/components/tabs/OverviewTab'
import ServerConfigTab from '@/components/tabs/ServerConfigTab'
import AppVersionTab from '@/components/tabs/AppVersionTab'
import WhitelistTab from '@/components/tabs/WhitelistTab'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'

export default function DashboardPage() {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  // 定义Tab配置：value=标识，label=显示文本，component=对应组件，roles=可访问角色
  const tabConfig = [
    { value: 'overview', label: '统计总览', component: <OverviewTab />, roles: ['admin'] },
    { value: 'server', label: '服务器配置', component: <ServerConfigTab />, roles: ['admin', 'user'] },
    { value: 'version', label: 'App版本配置', component: <AppVersionTab />, roles: ['admin'] },
    { value: 'whitelist', label: '用户白名单', component: <WhitelistTab />, roles: ['admin'] },
  ]

  // 获取用户角色（默认普通用户）
  const userRole = user?.role || 'user'
  // 过滤当前用户可访问的Tab
  const accessibleTabs = tabConfig.filter(tab => tab.roles.includes(userRole))
  // 设置默认激活的Tab（取第一个可访问的Tab）
  const defaultTabValue = accessibleTabs.length > 0 ? accessibleTabs[0].value : 'server'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* 顶部导航栏 */}
      <header className="bg-white dark:bg-slate-800 border-b px-6 py-3 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-purple-600 dark:text-purple-400">控制面板</h1>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleLogout}
        >
          <LogOut />  退出登录
        </Button>
      </header>

      {/* 主内容区：固定居中容器 */}
      <main className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* 核心Tabs组件：显式指定水平布局，确保上下结构 */}
        <Tabs
          defaultValue={defaultTabValue}
          orientation="horizontal" // 显式声明水平布局，更稳妥哦嘻嘻~
          className="w-full flex flex-col gap-6"
        >
          {/* 修复TabsList：用flex布局替代动态grid，解决Tailwind动态类名失效问题 */}
          <TabsList className="w-full flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 gap-1">
            {/* 动态渲染可访问的Tab Trigger，给每个加flex-1平分宽度 */}
            {accessibleTabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 py-2 rounded-md transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:shadow-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab内容区：动态渲染可访问的Tab Content */}
          {accessibleTabs.map(tab => (
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