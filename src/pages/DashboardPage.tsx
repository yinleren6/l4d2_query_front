import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OverviewTab from '@/components/tabs/OverviewTab'
import ServerConfigTab from '@/components/tabs/ServerConfigTab'
import AppVersionTab from '@/components/tabs/AppVersionTab'
import WhitelistTab from '@/components/tabs/WhitelistTab'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

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
          退出登录
        </Button>
      </header>

      {/* 主内容区：固定居中容器 */}
      <main className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* 核心Tabs组件：明确指定水平布局，确保上下结构 */}
        <Tabs
          defaultValue="overview"
          orientation="horizontal"
          className="w-full flex flex-col gap-6"
        >
          {/* Tab导航栏：固定在内容区顶部，4列网格横向排列 */}
          <TabsList className="w-full grid grid-cols-4 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            <TabsTrigger
              value="overview"
              className="py-2 rounded-md transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:shadow-sm"
            >
              统计总览
            </TabsTrigger>
            <TabsTrigger
              value="server"
              className="py-2 rounded-md transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:shadow-sm"
            >
              服务器配置
            </TabsTrigger>
            <TabsTrigger
              value="version"
              className="py-2 rounded-md transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:shadow-sm"
            >
              App版本配置
            </TabsTrigger>
            <TabsTrigger
              value="whitelist"
              className="py-2 rounded-md transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:shadow-sm"
            >
              用户白名单
            </TabsTrigger>
          </TabsList>

          {/* Tab内容区：固定在导航栏下方，每个Tab对应独立内容 */}
          <TabsContent value="overview" className="m-0 p-0 focus-visible:outline-none focus-visible:ring-0">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="server" className="m-0 p-0 focus-visible:outline-none focus-visible:ring-0">
            <ServerConfigTab />
          </TabsContent>
          <TabsContent value="version" className="m-0 p-0 focus-visible:outline-none focus-visible:ring-0">
            <AppVersionTab />
          </TabsContent>
          <TabsContent value="whitelist" className="m-0 p-0 focus-visible:outline-none focus-visible:ring-0">
            <WhitelistTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}