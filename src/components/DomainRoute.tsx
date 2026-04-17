import { Navigate, Outlet } from "react-router-dom";

export function DashOnlyRoute() {
  const host = window.location.host;
  const isDashDomain = host.startsWith("dash.");

  if (!isDashDomain) {
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
}
export function PublicOnlyRoute() {
  const host = window.location.host;
  const isPublicDomain = host.startsWith("l.");

  if (!isPublicDomain) {
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
}
