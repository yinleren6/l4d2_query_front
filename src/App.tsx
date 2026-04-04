// src/App.tsx
import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardPage from '@/pages/DashboardPage'
import AdminLoginPage from '@/pages/AdminLoginPage'
import NormalLoginPage from '@/pages/NormalLoginPage'
import NotFound from '@/pages/NotFound'

// 加载中 fallback
const PageLoading = () => <div className="p-8 text-center">加载中...</div>

export default function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageLoading />}>
                <Routes>
                    <Route path="/manage" element={<AdminLoginPage />} />
                    <Route path="/login" element={<NormalLoginPage />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
