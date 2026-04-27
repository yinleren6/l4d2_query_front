import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, Upload, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/AuthState";
import request from "@/api/request";
import { LatestVersionInfo, CurrentVersion } from "@/types";

export default function AboutTab() {
  const [current, setCurrent] = useState<CurrentVersion | null>(null);
  const [latest, setLatest] = useState<LatestVersionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const { user } = useAuthStore();
  const token = user?.jwtToken;

  const fetchCurrentVersion = async () => {
    try {
      const frontResp = await fetch("/version.json");
      const frontres = await frontResp.json();

      const backendResp = await request.get("/api/ok");
      const backendres = backendResp.data;

      setCurrent({
        frontVersion: frontres.frontVersion || "未知",
        frontBuildTime: frontres.frontBuildTime || "未知",
        backendVersion: backendres.backendVersion || "未知",
        backendBuildTime: backendres.backendBuildTime || "未知",
      });
    } catch (err) {
      console.error("获取当前版本失败", err);
      toast.error("获取当前版本失败");
    }
  };

  const handleCheckUpdate = async () => {
    setLoading(true);
    try {
      const res = await request.get("/api/admin/update/latest");
      const data = res.data;
      setLatest({
        frontVersion: data.frontVersion || "",
        frontBuildTime: data.frontBuildTime || "",
        backendVersion: data.backendVersion || "",
        backendBuildTime: data.backendBuildTime || "",
        force: data.force || false,
        message: data.message || "",
      });
      toast.success("版本信息已刷新");
    } catch (err) {
      console.error("检查更新失败", err);
      toast.error("检查更新失败");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerUpdate = async () => {
    setUpdating(true);
    try {
      await request.post(
        "/api/admin/update/trigger",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("更新已触发，服务将重启");
      waitForServiceRecovery();
    } catch (err) {
      console.error("触发更新失败", err);
      toast.error("触发更新失败");
      setUpdating(false);
    }
  };

  const waitForServiceRecovery = () => {
    let attempts = 0;
    const maxAttempts = 30;
    const checkHealth = async () => {
      try {
        await request.get("/api/ok");
        window.location.reload();
      } catch {
        attempts++;
        if (attempts >= maxAttempts) {
          toast.error("服务重启超时，请手动刷新页面");
          setUpdating(false);
          return;
        }
        setTimeout(checkHealth, 2000);
      }
    };
    checkHealth();
  };

  useEffect(() => {
    fetchCurrentVersion();
  }, []);

  const hasNewVersion = latest && current && (latest.backendVersion !== current.backendVersion || latest.frontVersion !== current.frontVersion);
  const isForce = latest?.force;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>版本信息</CardTitle>
          <CardDescription>当前运行版本与最新可用版本对比</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 当前版本 */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="font-medium text-sm text-muted-foreground">当前版本</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                前端：<code className="bg-muted px-1 rounded">{current?.frontVersion || "加载中..."}</code>
              </div>
              <div>
                构建时间：<code className="bg-muted px-1 rounded">{current?.frontBuildTime || "加载中..."}</code>
              </div>
              <div>
                后端：<code className="bg-muted px-1 rounded">{current?.backendVersion || "加载中..."}</code>
              </div>
              <div>
                构建时间：<code className="bg-muted px-1 rounded">{current?.backendBuildTime || "加载中..."}</code>
              </div>
            </div>
          </div>

          {/* 检查更新按钮 + 状态 */}
          <div className="flex items-center justify-between">
            <Button onClick={handleCheckUpdate} disabled={loading || updating} variant="outline">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "检查中..." : "检查更新"}
            </Button>
            {latest && (
              <Badge variant={hasNewVersion ? "default" : "secondary"} className={hasNewVersion ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}>
                {hasNewVersion ? "有新版本" : "已是最新"}
              </Badge>
            )}
          </div>

          {/* 最新版本（如果有） */}
          {latest && hasNewVersion && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">最新版本</span>
                {isForce && <Badge variant="destructive">强制更新</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  前端：<code className="bg-muted px-1 rounded">{latest.frontVersion || "—"}</code>
                </div>
                <div>
                  构建时间：<code className="bg-muted px-1 rounded">{latest.frontBuildTime || "—"}</code>
                </div>
                <div>
                  后端：<code className="bg-muted px-1 rounded">{latest.backendVersion || "—"}</code>
                </div>
                <div>
                  构建时间：<code className="bg-muted px-1 rounded">{latest.backendBuildTime || "—"}</code>
                </div>
              </div>
              {latest.message && <p className="text-sm text-muted-foreground mt-2">{latest.message}</p>}
              <Alert className={`mt-2 ${!isForce ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400" : ""}`} variant={isForce ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>发现新版本</AlertTitle>
                <AlertDescription>{isForce ? `【强制更新】${latest.message}，服务将自动重启，请稍候！` : `🎉 发现新版本，点击下方按钮立即更新~`}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* 更新按钮（仅当有新版本时显示） */}
          {hasNewVersion && (
            <Button onClick={handleTriggerUpdate} disabled={updating || loading} className="w-full" variant={isForce ? "destructive" : "default"}>
              <Upload className="mr-2 h-4 w-4" />
              {updating ? "更新中..." : "立即更新"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
