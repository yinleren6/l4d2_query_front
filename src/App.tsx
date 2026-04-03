import { BrowserRouter, Routes, Route } from 'react-router-dom'
// import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
// import { Theme } from "@radix-ui/themes";
import AdminLoginPage from '@/pages/AdminLoginPage'
import NormalLoginPage from '@/pages/NormalLoginPage'

// import TestForm from '@/pages/TestForm';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
      <Toaster />
      <Routes>
        {/* <Route path="/login" element={<LoginPage />} /> */}

          {/* <Route path="/test-form" element={<TestForm />} /> */}
          <Route path="/manage" element={<AdminLoginPage />} />
          <Route path="/login" element={<NormalLoginPage />} />



          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
              }
      />
      </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

