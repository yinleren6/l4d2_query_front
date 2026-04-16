// AboutTab.tsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, Upload, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/AuthState";
import request from "@/api/request"; // 封装的 axios 实例
import { LatestVersionInfo, CurrentVersion } from "@/types";

export default function AboutTab() {
  const [current, setCurrent] = useState<CurrentVersion | null>(null);
  const [latest, setLatest] = useState<LatestVersionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const { user } = useAuthStore();
  const token = user?.jwtToken;

  // 获取当前运行版本（从 /api/ok）
  const fetchCurrentVersion = async () => {
    try {
      const res = await request.get("/api/ok");
      const data = res.data; // axios 返回数据在 data 字段
      setCurrent({
        frontVersion: data.FrontVersion || "未知",
        frontBuildTime: data.FrontbuildTime || "未知",
        backendVersion: data.BackendVersion || "未知",
        backendBuildTime: data.BackendBuildTime || "未知",
      });
    } catch (err: any) {
      console.error("获取当前版本失败", err);
      toast.error("获取当前版本失败");
    }
  };

  // 检查更新（GET 请求获取最新版本信息）
  const handleCheckUpdate = async () => {
    setLoading(true);
    try {
      const res = await request.get("/api/admin/update/latest");
      const data = res.data;
      setLatest({
        lastestFrontversion: data.FrontVersion || "",
        lastestFrontbuildTime: data.FrontbuildTime || "",
        lastestBackendVersion: data.BackendVersion || "",
        lastestBackendBuildTime: data.BackendBuildTime || "",
        force: data.Force || false,
        message: data.Message,
      });
      toast.success("版本信息已刷新");
    } catch (err: any) {
      toast.error(err.message || "检查更新失败");
    } finally {
      setLoading(false);
    }
  };

  // 触发更新（POST 请求）
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
    } catch (err: any) {
      toast.error(err.message || "触发更新失败");
      setUpdating(false);
    }
  };

  // 服务重启后自动刷新页面（轮询 /api/ok）
  const waitForServiceRecovery = () => {
    const checkHealth = async () => {
      try {
        await request.get("/api/ok");
        // 请求成功说明服务已恢复
        window.location.reload();
      } catch {
        setTimeout(checkHealth, 2000);
      }
    };
    checkHealth();
  };

  // 初始化获取当前版本
  useEffect(() => {
    fetchCurrentVersion();
  }, []);

  const hasNewVersion = latest && current && (latest.lastestBackendVersion !== current.backendVersion || latest.lastestFrontversion !== current.frontVersion);
  const isForce = latest?.force;

  return (
    <div className="space-y-6">
      {/* 当前版本卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>当前版本信息</CardTitle>
          <CardDescription>正在运行的服务版本</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium w-24">前端版本：</span>
            <code className="px-2 py-1 bg-muted rounded">{current?.frontVersion || "加载中..."}</code>
            <span className="font-medium w-24">构建时间：</span>
            <code className="px-2 py-1 bg-muted rounded">{current?.frontBuildTime || "加载中..."}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium w-24">后端版本：</span>
            <code className="px-2 py-1 bg-muted rounded">{current?.backendVersion || "加载中..."}</code>
            <span className="font-medium w-24">构建时间：</span>
            <code className="px-2 py-1 bg-muted rounded">{current?.backendBuildTime || "加载中..."}</code>
          </div>
        </CardContent>
      </Card>

      {/* 更新操作卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>版本更新</CardTitle>
          <CardDescription>检查并更新到最新版本</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button onClick={handleCheckUpdate} disabled={loading || updating} variant="outline">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "检查中..." : "检查更新"}
            </Button>
            {latest && <Badge variant={hasNewVersion ? "destructive" : "secondary"}>{hasNewVersion ? "有新版本" : "已是最新"}</Badge>}
          </div>

          {latest && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">最新版本</span>
                {isForce && <Badge variant="destructive">强制更新</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  前端：<code className="bg-muted px-1 rounded">{latest.lastestFrontversion}</code>
                </div>
                <div>
                  前端时间：<code className="bg-muted px-1 rounded">{latest.lastestFrontbuildTime}</code>
                </div>
                <div>
                  后端：<code className="bg-muted px-1 rounded">{latest.lastestBackendVersion}</code>
                </div>
                <div>
                  后端时间：<code className="bg-muted px-1 rounded">{latest.lastestBackendBuildTime}</code>
                </div>
              </div>
              {latest.message && <p className="text-sm text-muted-foreground mt-2">{latest.message}</p>}
              {hasNewVersion && (
                <Alert className="mt-2" variant={isForce ? "destructive" : "default"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>发现新版本</AlertTitle>
                  <AlertDescription>{isForce ? "此版本为强制更新，服务将自动重启" : "建议立即更新以获得最新功能和修复" + latest.message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleTriggerUpdate} disabled={!latest || !hasNewVersion || updating || loading} className="w-full" variant={isForce ? "destructive" : "default"}>
            <Upload className="mr-2 h-4 w-4" />
            {updating ? "更新中..." : "立即更新"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
