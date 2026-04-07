// src/pages/DashboardLayout.tsx
import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu, LogOut, LayoutDashboard, Server, Database, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export default function DashboardLayout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      to: "/dashboard/overview",
      label: "统计总览",
      icon: <LayoutDashboard size={18} />,
      roles: ["admin"],
    },

    {
      to: "/dashboard/appconfig",
      label: "App版本配置",
      icon: <Database size={18} />,
      roles: ["admin"],
    },
    {
      to: "/dashboard/whitelist",
      label: "群组列表",
      icon: <Users size={18} />,
      roles: ["admin"],
    },
    {
      to: "/dashboard/serverconfig",
      label: "服务器配置",
      icon: <Server size={18} />,
      roles: ["admin", "user"],
    },
    {
      to: "/dashboard/playerlist",
      label: "服务器信息",
      icon: <Activity size={18} />,
      roles: ["admin", "user"],
    },
  ];

  const userRole = user?.role || "user";
  const accessibleMenus = menuItems.filter((item) => item.roles.includes(userRole));

  // 重定向默认子路由
  useEffect(() => {
    if (location.pathname === "/dashboard" && accessibleMenus.length > 0) {
      navigate(accessibleMenus[0].to, { replace: true });
    }
  }, [location, accessibleMenus, navigate]);

  // 无权限时退出
  useEffect(() => {
    if (accessibleMenus.length === 0) {
      logout();
      navigate("/login", { replace: true });
    }
  }, [accessibleMenus, logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (accessibleMenus.length === 0) return null;

  return (
    <div className="h-screen overflow-hidden">
      {/* 顶部栏 - 固定在最上层 */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </Button>
          <h1 className="text-xl font-bold text-purple-600 dark:text-purple-400">控制面板</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-300">{user?.id || ""}</span>
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut size={16} className="mr-2" />
            退出登录
          </Button>
        </div>
      </header>

      {/* 侧边栏 - 从顶部栏下方开始，固定 */}
      <aside
        className={cn(
          "fixed left-0 top-14 z-20 w-64 h-[calc(100vh-3.5rem)] bg-white dark:bg-slate-800 border-r transition-transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0" // 桌面端始终显示
        )}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">导航菜单</h2>
          </div>
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {accessibleMenus.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive ? "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  )
                }>
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* 主内容区 - 避开顶部栏和侧边栏 */}
      <main className="pt-14 md:pl-64 h-full overflow-y-auto">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* 移动端遮罩层 */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-15 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}

interface MenuItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}
