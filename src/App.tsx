// src/App.tsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/pages/DashboardLayout' // 新建布局组件
import OverviewTab from '@/components/tabs/OverviewTab'
import ServerConfigTab from '@/components/tabs/ServerConfigTab'
import AppVersionTab from '@/components/tabs/AppVersionTab'
import WhitelistTab from '@/components/tabs/WhitelistTab'
import ServerInfoTab from '@/components/tabs/ServerInfoTab'

// 懒加载页面组件
const AdminLoginPage = lazy(() => import('@/pages/AdminLoginPage'))
const NormalLoginPage = lazy(() => import('@/pages/NormalLoginPage'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const PageLoading = () => <div className="p-8 text-center">加载中...</div>

export default function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageLoading />}>
                <Routes>
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
                        {/* 子路由：每个菜单项对应一个 URL */}
                        <Route index element={<OverviewTab />} />{' '}
                        {/* /dashboard */}
                        <Route path="overview" element={<OverviewTab />} />{' '}
                        {/* /dashboard/overview */}
                        <Route
                            path="server"
                            element={<ServerConfigTab />}
                        />{' '}
                        {/* /dashboard/server */}
                        <Route
                            path="version"
                            element={<AppVersionTab />}
                        />{' '}
                        {/* /dashboard/version */}
                        <Route
                            path="whitelist"
                            element={<WhitelistTab />}
                        />{' '}
                        {/* /dashboard/whitelist */}
                        <Route
                            path="server-info"
                            element={<ServerInfoTab />}
                        />{' '}
                        {/* /dashboard/server-info */}
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
