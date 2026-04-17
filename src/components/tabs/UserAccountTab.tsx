import { useState } from "react";
import { useAuthStore } from "@/store/AuthState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import request from "@/api/request";
import { ShieldAlert, Copy } from "lucide-react";

export default function AccountPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [newGroupToken, setNewGroupToken] = useState<string | null>(null);
  const handleRefreshToken = async () => {
    if (!confirm("⚠️ 确认刷新 Token 吗？\n刷新后旧 Token 将无法登录,请保管好新的 token！")) return;
    setLoading(true);
    setNewGroupToken(null);
    try {
      const { data } = await request.post("/api/user/refresh-group-token");
      setNewGroupToken(data.token);
      toast.success("✅ Token 已刷新！请立即复制保存");
    } catch (err) {
      toast.error("❌ 刷新失败");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-6 text-center">请先登录</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">账户设置</h1>

      <Card className="p-6 space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">用户ID</label>
          <Input value={user.id} readOnly />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">角色</label>
          <Input value={user.role === "admin" ? "管理员" : "用户"} readOnly />
        </div>
        {newGroupToken && (
          <div className="space-y-2">
            <label className="text-sm text-red-600 font-semibold">新登录Token（仅本次显示，刷新页面消失）</label>
            <Input value={newGroupToken} readOnly className="font-mono text-xs border-red-400" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(newGroupToken);
                toast.success("已复制新Token");
              }}>
              <Copy className="w-4 h-4 mr-1" /> 复制新Token
            </Button>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="destructive" onClick={handleRefreshToken} disabled={loading} className="flex-1">
            <ShieldAlert className="w-4 h-4 mr-2" />
            {loading ? "刷新中..." : "刷新群登录Token"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
