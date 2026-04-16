// App.tsx
import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashOnlyRoute, PublicOnlyRoute } from "@/components/DomainRoute";
import DashboardLayout from "@/pages/DashboardPage";
import OverviewTab from "@/components/tabs/OverviewTab";
import ServerConfigTab from "@/components/tabs/ServerConfigTab";
import AboutTab from "@/components/tabs/AboutTab";
import AppVersionTab from "@/components/tabs/AppConfigTab";
import WhitelistTab from "@/components/tabs/UserlistTab";
import PlayerListTab from "@/components/tabs/PlayerListTab";
import AccountTab from "@/components/tabs/UserAccountTab";
import LoginPage from "@/pages/LoginPage";
import PublicServerInfo from "@/pages/PublicInfoPage";
import { Toaster } from "sonner";
import { useAnimatedFavicon } from "@/lib/useAnimatedFavicon";
import NotFound from "@/pages/NotFound";
import LoadingGif from "@/components/ui/loadinggif";
const PageLoading = () => (
  <div className="p-8 text-center">
    <LoadingGif />
    加载中...
  </div>
);

export default function App() {
  useAnimatedFavicon();
  return (
    <BrowserRouter>
      <Toaster />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* 根路径自动跳转到 dashboard */}

          <Route path="/test" element={<div>Test OK</div>} />

          {/* 管理后台路由 - 只能在 dash.xxx 访问 */}
          <Route element={<DashOnlyRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
              <Route index element={<OverviewTab />} />
              <Route path="overview" element={<OverviewTab />} />
              <Route path="serverconfig" element={<ServerConfigTab />} />
              <Route path="appconfig" element={<AppVersionTab />} />
              <Route path="whitelist" element={<WhitelistTab />} />
              <Route path="playerlist" element={<PlayerListTab />} />
              <Route path="account" element={<AccountTab />} />
              <Route path="about" element={<AboutTab />} />
            </Route>
          </Route>

          {/* 公开路由 - 只能在 l.xxx 访问 */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/p/:groupID" element={<PublicServerInfo />} />
          </Route>
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
