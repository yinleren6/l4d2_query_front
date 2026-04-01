import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import OverviewTab from '@/components/tabs/OverviewTab'
import ServerConfigTab from '@/components/tabs/ServerConfigTab'
import AppVersionTab from '@/components/tabs/AppVersionTab'
import WhitelistTab from '@/components/tabs/WhitelistTab'

export default function DashboardPage() {
  const { logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="border-b bg-white dark:bg-slate-900 shadow-sm p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold text-purple-600">控制面板</h1>
        <Button variant="destructive" size="sm" onClick={logout}>退出登录</Button>
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 w-full flex-wrap">
            <TabsTrigger value="overview">统计总览</TabsTrigger>
            <TabsTrigger value="serverConfig">服务器配置</TabsTrigger>
            <TabsTrigger value="appVersion">App版本配置</TabsTrigger>
            <TabsTrigger value="whitelist">用户白名单</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="serverConfig"><ServerConfigTab /></TabsContent>
          <TabsContent value="appVersion"><AppVersionTab /></TabsContent>
          <TabsContent value="whitelist"><WhitelistTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  )
}