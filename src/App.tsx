// src/App.tsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/pages/DashboardPage' // 新建布局组件
import OverviewTab from '@/components/tabs/OverviewTab'
import ServerConfigTab from '@/components/tabs/ServerConfigTab'
import AppVersionTab from '@/components/tabs/AppConfigTab'
import WhitelistTab from '@/components/tabs/WhitelistTab'
import PlayerListTab from '@/components/tabs/PlayerListTab'
import PublicServerInfo from '@/pages/PublicInfoPage'
import { Toaster } from 'sonner' // 👈 必须引入
// 懒加载页面组件
const AdminLoginPage = lazy(() => import('@/pages/AdminLoginPage'))
const NormalLoginPage = lazy(() => import('@/pages/NormalLoginPage'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const PageLoading = () => <div className="p-8 text-center">加载中...</div>

export default function App() {
    return (
        <BrowserRouter>
            <Toaster />
            <Suspense fallback={<PageLoading />}>
                <Routes>
                    <Route path="/test" element={<div>Test OK</div>} />
                    <Route path="/manage" element={<AdminLoginPage />} />
                    <Route path="/login" element={<NormalLoginPage />} />
                    {/* 受保护的路由组 */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<OverviewTab />} />
                        <Route path="overview" element={<OverviewTab />} />
                        <Route
                            path="serverconfig"
                            element={<ServerConfigTab />}
                        />
                        <Route path="appconfig" element={<AppVersionTab />} />
                        <Route path="whitelist" element={<WhitelistTab />} />
                        <Route path="playerlist" element={<PlayerListTab />} />
                    </Route>
                    {/* 公开页面 */}
                    <Route path="/p/:groupID" element={<PublicServerInfo />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
