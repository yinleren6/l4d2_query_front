import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';


export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <BrowserRouter>
    <Toaster />
    <Routes>
    <Route path="/login" element={<LoginPage />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes></BrowserRouter>
  </ThemeProvider>
  )
}