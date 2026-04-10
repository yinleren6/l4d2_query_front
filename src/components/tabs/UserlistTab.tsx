import { useState, useEffect, useRef, useCallback } from "react";
import request from "@/api/request";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { WhitelistItem as UserlistItem } from "@/types";
import { toast } from "sonner";
import { Copy, RefreshCw, Trash2, SquarePen, Ban, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingGif from "@/components/ui/loadinggif";
export default function WhitelistTab() {
  const [list, setList] = useState<UserlistItem[]>([]);
  const [userID, setUserID] = useState("");

  const [loading, setLoading] = useState(false);

  // ✅ 只存【刚创建的用户ID + 对应token】，刷新消失
  const [newCreatedToken, setNewCreatedToken] = useState<{
    userId: string | null;
    token: string | null;
  }>({ userId: null, token: null });

  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  function formatIsoDate(isoStr: string): string {
    const d = new Date(isoStr);
    if (isNaN(d.valueOf())) return "";

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  const cancelPendingRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const loadUserlist = useCallback(async () => {
    cancelPendingRequest();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const res = await request.get("/api/admin/groups", {
        signal: controller.signal,
      });
      if (mountedRef.current) setList(res.data || []);
    } catch (err: any) {
      if (err.name === "AbortError" || !mountedRef.current) return;
      toast.error(err.response?.data?.error || "加载失败");
      if (mountedRef.current) setList([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadUserlist();
    return () => {
      mountedRef.current = false;
      cancelPendingRequest();
    };
  }, [loadUserlist]);

  // 添加群组
  const addGrouplist = async () => {
    const id = userID.trim();
    if (!id) {
      toast.error("请输入群组ID");
      return;
    }
    if (list.some((item) => item.user_id === id)) {
      toast.warning("已存在");
      return;
    }
    try {
      const res = await request.post("/api/admin/groups", { user_id: id });

      setNewCreatedToken({
        userId: id,
        token: res.data.token,
      });

      setUserID("");
      toast.success("添加成功");
      await loadUserlist();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "添加失败");
    }
  };
  const refreshToken = async (userID: string) => {
    if (!confirm(`确定要刷新群组 ${userID} 的 Token 吗？旧的 Token 将失效。`)) return;
    try {
      const res = await request.patch(`/api/admin/groups/${userID}/re-token`);
      setNewCreatedToken({
        userId: userID,
        token: res.data.token,
      });

      toast.success("Token 已刷新");
      await loadUserlist();
    } catch {
      toast.error("刷新失败");
    }
  };
  // 复制 token
  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success("已复制");
    } catch {
      toast.error("复制失败");
    }
  };

  const toggleEnable = async (userID: string, currentlyEnabled: boolean) => {
    if (!confirm(`确定要${currentlyEnabled ? "禁用" : "启用"}群组 ${userID} 吗？`)) return;
    try {
      await request.patch(`/api/admin/groups/${userID}/enabled`, { enabled: !currentlyEnabled });
      toast.success(currentlyEnabled ? "已禁用" : "已启用");
      await loadUserlist();
    } catch {
      toast.error("操作失败");
    }
  };

  const editGroupConfig = (userID: string) => {
    navigate(`/dashboard/serverconfig?group=${userID}`);
  };

  const deleteGroup = async (userID: string) => {
    if (!confirm(`确定要删除群组 ${userID} 吗？`)) return;
    try {
      await request.delete(`/api/admin/groups/${userID}`);
      toast.success("删除成功");
      await loadUserlist();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "删除失败");
    }
  };

  return (
    <Card className="p-6 w-full h-full min-h-175 animate-fade-slide">
      <h2 className="text-lg font-semibold mb-4">群组列表</h2>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input type="number" value={userID} onChange={(e) => setUserID(e.target.value)} placeholder="输入群组ID" onKeyDown={(e) => e.key === "Enter" && addGrouplist()} className="flex-1" />
        <Button onClick={addGrouplist} className="sm:w-auto w-full">
          添加群组
        </Button>
      </div>

      {loading ? (
        <div className="p-10 text-center">
          <LoadingGif />
          加载中...
        </div>
      ) : list.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">暂无群组</div>
      ) : (
        <div className="space-y-2">
          {list.map((item) => (
            <div key={item.user_id} className="flex flex-col p-4 border rounded-lg gap-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.user_id}</span>
                <span className="font-medium">{item.user_name}</span>
                <span className={`flex justify-center px-2 py-1 items-center justify-items-center text-xs rounded ${item.enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {item.enabled ? (
                    <>
                      <Check size={16} className="mr-1" />
                      已启用
                    </>
                  ) : (
                    <>
                      <Ban size={16} className="mr-1" />
                      已禁用
                    </>
                  )}
                </span>
              </div>
              <p className="text-sm text-slate-500">上次登录: {formatIsoDate(item.last_login)}</p>
              <p className="text-sm text-slate-500">创建时间: {formatIsoDate(item.created_at)}</p>

              {/* ✅ 只给【刚创建的这个用户】显示 token */}
              {newCreatedToken.userId === item.user_id && newCreatedToken.token && (
                <div className="flex-wrap items-center gap-2 mt-1 ring-2 ring-blue-500 rounded-lg px-2">
                  <div className="text-sm text-amber-600 p-2">注意: 登录 Token 仅显示一次，刷新页面消失，请妥善保管</div>
                  <div className="bg-slate-100 p-2 rounded text-sm font-mono px-2">{newCreatedToken.token}</div>
                  <Button variant="default" size="lg" onClick={() => copyToken(newCreatedToken.token!)}>
                    <Copy size={16} className="mr-1" />
                    复制
                  </Button>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" size="lg" onClick={() => editGroupConfig(item.user_id)}>
                  <SquarePen />
                  编辑群组配置
                </Button>
                <Button variant="destructive" size="lg" onClick={() => refreshToken(item.user_id)} disabled={!item.enabled}>
                  <RefreshCw size={16} />
                  刷新 Token
                </Button>
                <Button variant="destructive" size="lg" onClick={() => deleteGroup(item.user_id)}>
                  <Trash2 size={16} className="mr-1" />
                  删除
                </Button>
                <Button variant={item.enabled ? "destructive" : "default"} size="lg" onClick={() => toggleEnable(item.user_id, item.enabled)}>
                  {item.enabled ? (
                    <>
                      <Ban />
                      "禁用"
                    </>
                  ) : (
                    <>
                      <Check />
                      "启用"
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
