// AboutTab.tsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
      const res = await request.get("/api/ok");
      const data = res.data;
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

  const waitForServiceRecovery = () => {
    const checkHealth = async () => {
      try {
        await request.get("/api/ok");
        window.location.reload();
      } catch {
        setTimeout(checkHealth, 2000);
      }
    };
    checkHealth();
  };

  useEffect(() => {
    fetchCurrentVersion();
  }, []);

  const hasNewVersion = latest && current && (latest.lastestBackendVersion !== current.backendVersion || latest.lastestFrontversion !== current.frontVersion);
  const isForce = latest?.force;

  return (
    <div className="space-y-6">
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
                  <AlertDescription>{isForce ? "更新加载中～服务要重启一下下，很快就好啦，请稍等！" : "唔…… 到底更新了什么呢？我完全不清楚哦……" + latest.message}</AlertDescription>
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
