// src/components/tabs/PlayerListTab.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import request from "@/api/request";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import StreamingServerList from "@/components/StreamingServerList";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
export default function PlayerListTab() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<{ group_id: string; name: string }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const mountedRef = useRef(true);

  const isAdmin = user?.role === "admin";
  const currentUserId = user?.id || "";

  const fetchGroups = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingGroups(true);
    try {
      const res = await request.get("/api/admin/groups");
      if (!mountedRef.current) return;
      const enabledGroups = res.data.filter((g: any) => g.enabled === true).map((g: any) => ({ group_id: g.group_id, name: g.group_id }));
      setGroups(enabledGroups);
      if (enabledGroups.length > 0 && !selectedGroup) {
        setSelectedGroup(enabledGroups[0].group_id);
      }
    } catch (err) {
      toast.error("获取群组列表失败");
    } finally {
      if (mountedRef.current) setLoadingGroups(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchGroups();
    else if (currentUserId) setSelectedGroup(currentUserId);
  }, [isAdmin, currentUserId, fetchGroups]);

  const handleManualRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const navigateToPublic = () => {
    window.open(`/p/${selectedGroup}`, "_blank");
  };

  if (loadingGroups && isAdmin) return <div className="p-8 text-center">加载中...</div>;
  if (groups.length === 0 && isAdmin && !loadingGroups) {
    return <Card className="p-8 text-center text-muted-foreground">暂无可用群组，请先添加群组。</Card>;
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium">选择群组：</span>
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="px-3 py-1.5 border rounded-md bg-background text-sm">
            {groups.map((g) => (
              <option key={g.group_id} value={g.group_id}>
                {g.name}
              </option>
            ))}
          </select>
          <Button variant="secondary" size="default" onClick={handleManualRefresh} className="bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90">
            <RefreshCw size={18} />
          </Button>
          <button onClick={navigateToPublic} className="px-4 py-1.5 bg-sky-400 text-white rounded-md text-xs font-medium hover:bg-sky-600 transition">
            服务器玩家列表页面
          </button>
        </div>
      )}
      {!isAdmin && (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="default" onClick={handleManualRefresh} className="bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90">
            <RefreshCw size={18} />
          </Button>

          <Button variant="secondary" size="default" onClick={navigateToPublic} className="bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90">
            服务器玩家列表页面
          </Button>
        </div>
      )}
      <StreamingServerList key={refreshKey} groupId={selectedGroup} isAutoRefresh={true} />
    </div>
  );
}
