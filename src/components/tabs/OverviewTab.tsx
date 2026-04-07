// src/components/tabs/OverviewTab.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import request from "@/api/request";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { OverviewStats, DailyStat } from "@/types";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

export default function OverviewTab() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [daily, setDaily] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStats = useCallback(async () => {
    if (mountedRef.current) {
      setLoading(false);
    }
    // 取消上一次未完成的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    setLoading(true);
    setError("");

    try {
      // 使用 Promise.allSettled 分别处理两个接口，避免一个失败导致全部失败
      const [overviewResult, dailyResult] = await Promise.allSettled([request.get<OverviewStats>("/api/stats/overview", { signal }), request.get<DailyStat[]>("/api/stats/daily?days=7", { signal })]);

      // 处理 overview 结果
      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value.data);
      } else {
        const err = overviewResult.reason;
        if ((err as Error).name !== "AbortError") {
          let errorMsg = "加载总览数据失败";
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            errorMsg = "登录已过期，请重新登录";
          } else if (axios.isAxiosError(err) && err.response?.status === 404) {
            errorMsg = "总览接口不存在，请检查后端服务";
          }
          setError((prev) => (prev ? `${prev}；${errorMsg}` : errorMsg));
          toast.error(errorMsg);
        }
      }

      // 处理 daily 结果
      if (dailyResult.status === "fulfilled") {
        let dailyData = dailyResult.value.data;
        // 按日期升序排序，确保图表折线顺序正确
        dailyData = [...dailyData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setDaily(dailyData);
      } else {
        const err = dailyResult.reason;
        if ((err as Error).name !== "AbortError") {
          let errorMsg = "加载趋势数据失败";
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            errorMsg = "登录已过期，请重新登录";
          } else if (axios.isAxiosError(err) && err.response?.status === 404) {
            errorMsg = "趋势接口不存在，请检查后端服务";
          }
          setError((prev) => (prev ? `${prev}；${errorMsg}` : errorMsg));
          toast.error(errorMsg);
        }
      }
    } catch (err) {
      // 捕获非请求错误（如代码异常）
      if ((err as Error).name !== "AbortError") {
        const errorMsg = "加载统计数据失败，请刷新重试";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, []);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    fetchStats();
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStats]);

  // 手动重试函数
  const handleRetry = () => {
    fetchStats();
  };

  // 加载状态 UI
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">加载统计数据中...</p>
      </div>
    );
  }

  // 错误状态 UI（仅当两个接口都失败时显示错误，部分成功时继续展示）
  // 如果 overview 和 daily 都为空且 error 存在，则展示完全失败页面
  const isBothFailed = !overview && daily.length === 0 && error !== "";
  if (isBothFailed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-destructive text-lg font-medium">{error}</p>
        <Button onClick={handleRetry}>重试</Button>
      </div>
    );
  }

  // 正常渲染：统计卡片 + 图表
  return (
    <div className="space-y-6">
      {/* 统计卡片：响应式网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="animate-fade-slide">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总用户数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.total_users ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="animate-fade-slide">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日活跃</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.today_active ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="animate-fade-slide">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日请求</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.today_requests ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="animate-fade-slide">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">新用户</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.today_new_users ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域：空数据占位 + 响应式高度 */}
      <Card className="p-6 animate-fade-slide">
        <h3 className="text-lg font-semibold mb-4">近7日数据趋势</h3>
        <div className="h-[300px] sm:h-[400px] w-full">
          {daily.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">暂无趋势数据</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={daily}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#8884d8"
                  label={{
                    value: "活跃用户数",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#82ca9d"
                  label={{
                    value: "请求总数",
                    angle: 90,
                    position: "insideRight",
                  }}
                />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="users" stroke="#8884d8" name="活跃用户" activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="events" stroke="#82ca9d" name="请求总数" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}
