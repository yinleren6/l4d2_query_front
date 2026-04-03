import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// 懒加载页面组件
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const AdminLoginPage = lazy(() => import('@/pages/AdminLoginPage'))
const NormalLoginPage = lazy(() => import('@/pages/NormalLoginPage'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// 加载中 fallback
const PageLoading = () => <div className="p-8 text-center">加载中...</div>

export default function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageLoading />}>
                <Routes>
                    <Route path="/manage" element={<AdminLoginPage />} />
                    <Route path="/login" element={<NormalLoginPage />} />
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
