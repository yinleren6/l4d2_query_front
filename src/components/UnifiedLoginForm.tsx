import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, HelpCircle } from "lucide-react";

interface UnifiedLoginFormProps {
  onAdminLogin: (values: Record<string, string>) => Promise<void>;
  onTokenLogin: (values: Record<string, string>) => Promise<void>;
  loading: boolean;
}

export default function UnifiedLoginForm({ onAdminLogin, onTokenLogin, loading }: UnifiedLoginFormProps) {
  const [tab, setTab] = useState<"admin" | "token">("token");
  const [adminForm, setAdminForm] = useState({ id: "", password: "" });
  const [tokenForm, setTokenForm] = useState({ token: "" });

  const handleSubmit = async () => {
    if (loading) return;

    if (tab === "admin") {
      if (!adminForm.id.trim() || !adminForm.password.trim()) {
        toast.error("请输入ID和密码");
        return;
      }
      await onAdminLogin(adminForm);
    } else {
      if (!tokenForm.token.trim()) {
        toast.error("请输入登录 Token");
        return;
      }
      await onTokenLogin(tokenForm);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  return (
    <Card className="w-full max-w-md p-8 shadow-none border border-gray-200 rounded-2xl bg-white h-130 flex flex-col">
      {/* 图标区域 */}
      <div className="flex justify-center mb-6 shrink-0">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
          <Lock className="w-8 h-8 text-blue-600 stroke-3" />
        </div>
      </div>

      {/* 标题区域 */}
      <div className="text-center mb-6 shrink-0">
        <h1 className="text-xl font-bold text-gray-900 mb-2">欢迎使用 </h1>
        <p className="text-sm text-gray-500">{"请输入您的 Access Token 以继续访问系统"}</p>
      </div>

      {/* Tab 切换 */}
      <div className="relative flex mb-6 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0">
        <div
          className="absolute inset-y-0 w-1/2 rounded-md bg-primary transition-all duration-300 ease-in-out shadow-sm"
          style={{
            left: tab === "token" ? "0%" : "50%",
          }}></div>

        <button
          onClick={() => setTab("token")}
          disabled={loading}
          className="relative z-10 flex-1 text-sm font-medium text-slate-600 transition-colors duration-300 dark:text-slate-300"
          style={{
            color: tab === "token" ? "white" : "",
          }}>
          Token 登录
        </button>

        <button
          onClick={() => setTab("admin")}
          disabled={loading}
          className="relative z-10 flex-1 text-sm font-medium text-slate-600 transition-colors duration-300 dark:text-slate-300"
          style={{
            color: tab === "admin" ? "white" : "",
          }}>
          ID 登录
        </button>
      </div>

      {/* 动态内容区域 */}
      <div className="relative grow">
        {/* Admin 表单 */}
        <div className={`absolute w-full transition-all duration-300 ease-in-out ${tab === "admin" ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}`}>
          <div className="space-y-4 mb-6">
            <Input
              placeholder="ID"
              value={adminForm.id}
              onChange={(e) => setAdminForm({ ...adminForm, id: e.target.value })}
              disabled={loading}
              onKeyDown={handleKeyDown}
              className="h-10 text-xs px-4 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
            <Input
              type="password"
              placeholder="密码"
              value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              disabled={loading}
              onKeyDown={handleKeyDown}
              className="h-10 text-xs px-4 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Token 表单 */}
        <div className={`absolute w-full transition-all duration-300 ease-in-out ${tab === "token" ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
          <div className="relative mb-6">
            <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="请输入您的 Access Token"
              value={tokenForm.token}
              onChange={(e) => setTokenForm({ token: e.target.value })}
              disabled={loading}
              onKeyDown={handleKeyDown}
              className="h-10 pl-10 text-xs rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="absolute w-full top-30">
          <Button onClick={handleSubmit} disabled={loading} className="w-full h-10 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors">
            {loading ? "验证中..." : "验证并进入"}
          </Button>

          {/* 获取 Token 链接 */}
          {tab === "token" && (
            <div className="flex justify-between mt-4 transition-opacity duration-300">
              <a
                href="#"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("请联系管理员获取 Access Token");
                }}>
                <HelpCircle className="w-3 h-3" />
                我没有 Token，我该去哪里获得 Token?
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("请联系管理员注册");
                }}>
                <HelpCircle className="w-3 h-3" />
                注册
              </a>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
