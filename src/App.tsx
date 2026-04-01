import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import MainLayout from '@/layout/MainLayout'
import OverviewPage from '@/pages/OverviewPage'
import ServerConfigPage from '@/pages/ServerConfigPage'
import AppVersionPage from '@/pages/AppVersionPage'
import WhitelistPage from '@/pages/WhitelistPage'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/config/server" element={<ServerConfigPage />} />
          <Route path="/config/version" element={<AppVersionPage />} />
          <Route path="/whitelist" element={<WhitelistPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}