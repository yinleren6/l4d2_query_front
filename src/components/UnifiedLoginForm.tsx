import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

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
    <Card className="w-full max-w-md p-6 shadow-lg overflow-hidden">
      <h1 className="text-2xl font-bold text-center mb-4">用户登录</h1>

      {/* ========== 滑动 Tab 核心代码 ========== */}
      <div className="relative flex mb-5 h-10 rounded-md bg-slate-100 dark:bg-slate-800">
        {/* 滑动背景块 */}
        <div
          className="absolute inset-y-0 w-1/2 rounded-md bg-primary transition-all duration-300 ease-in-out shadow-sm"
          style={{
            left: tab === "token" ? "0%" : "50%",
          }}></div>

        {/* Token 登录按钮 */}
        <button
          onClick={() => setTab("token")}
          disabled={loading}
          className="relative z-10 flex-1 text-sm font-medium text-slate-600 transition-colors duration-300 dark:text-slate-300"
          style={{
            color: tab === "token" ? "white" : "",
          }}>
          Token 登录
        </button>

        {/* ID 登录按钮 */}
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

      {/* 高度平滑动画 */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${tab === "admin" ? "h-20" : "h-8"}
        `}>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {tab === "admin" ? (
            <div className="space-y-4">
              <Input placeholder="ID" value={adminForm.id} onChange={(e) => setAdminForm({ ...adminForm, id: e.target.value })} disabled={loading} onKeyDown={handleKeyDown} />
              <Input type="password" placeholder="密码" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} disabled={loading} onKeyDown={handleKeyDown} />
            </div>
          ) : (
            <div>
              <Input placeholder="请输入登录 Token" value={tokenForm.token} onChange={(e) => setTokenForm({ token: e.target.value })} disabled={loading} onKeyDown={handleKeyDown} />
            </div>
          )}
        </form>
      </div>

      {/* 登录按钮 */}
      <div className="mt-5">
        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </Button>
      </div>
    </Card>
  );
}
