import { Navigate, Outlet } from "react-router-dom";

// 管理后台专用
export function DashOnlyRoute() {
  const host = window.location.host;
  const isDashDomain = host.startsWith("dash.");

  if (!isDashDomain) {
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
}

// 公开页专用 l.xxx
export function PublicOnlyRoute() {
  const host = window.location.host;
  const isPublicDomain = host.startsWith("l.");

  if (!isPublicDomain) {
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
}
