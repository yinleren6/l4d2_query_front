import { Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'

export default function MainLayout() {
  const { logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <header className="border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">控制面板</h1>
        <Button variant="destructive" onClick={logout}>退出登录</Button>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}