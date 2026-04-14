// src/components/StreamingServerList.tsx
import { forwardRef, useImperativeHandle, useState, useEffect, useCallback, useRef } from "react";
import ServerList from "./ServerList";
import { ServerInfo } from "./ServerCard";
import { toast } from "sonner";

interface StreamingServerListProps {
  groupID: string;
  token?: string;
  isAutoRefresh?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: string) => void;
  onServersChange?: (servers: ServerInfo[]) => void;
}
export interface StreamingServerListRef {
  refresh: () => void;
}

const StreamingServerList = forwardRef<StreamingServerListRef, StreamingServerListProps>(({ groupID, token, isAutoRefresh = true, onLoadingChange, onError, onServersChange }, ref) => {
  const [serversMap, setServersMap] = useState<Record<string, ServerInfo>>({});
  const [serverOrder, setServerOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const [connectionKey, setConnectionKey] = useState(0);
  const autoRefreshIntervalRef = useRef<number | null>(null);
  const servers = serverOrder.map((key) => serversMap[key]).filter(Boolean);
  const isRefreshing = useRef(false);
  const pendingTimeoutsRef = useRef<Record<string, number>>({});
  // 稳定回调引用，避免不必要的重连
  const onLoadingChangeRef = useRef(onLoadingChange);
  const onErrorRef = useRef(onError);
  const onServersChangeRef = useRef(onServersChange);
  useEffect(() => {
    onLoadingChangeRef.current = onLoadingChange;
    onErrorRef.current = onError;
    onServersChangeRef.current = onServersChange;
  }, [onLoadingChange, onError, onServersChange]);

  // 日志工具（保持不变）
  const lastTimeRef = useRef<number>(0);
  useEffect(() => {
    lastTimeRef.current = Date.now();
  }, []);
  const logInterval = () => {
    const now = Date.now();
    const diff = now - lastTimeRef.current;
    lastTimeRef.current = now;
    const pad = (num: number, length = 2) => num.toString().padStart(length, "0");
    const ms = diff % 1000;
    const sec = Math.floor(diff / 1000) % 60;
    const min = Math.floor(diff / 60000) % 60;
    const hour = Math.floor(diff / 3600000);
    if (hour > 0 || min > 0 || sec > 1) {
      return `[间隔] ${pad(hour)}:${pad(min)}:${pad(sec)}.${pad(ms, 3)}`;
    } else {
      return ``;
    }
  };

  // 自动刷新定时器（30秒发送一次 refresh）
  useEffect(() => {
    if (isAutoRefresh) {
      autoRefreshIntervalRef.current = window.setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "refresh" }));
        }
      }, 30000);
    }
    return () => {
      if (autoRefreshIntervalRef.current) clearInterval(autoRefreshIntervalRef.current);
    };
  }, [isAutoRefresh]);

  // 数据变化回调
  useEffect(() => {
    onServersChangeRef.current?.(servers);
  }, [servers]);

  useEffect(() => {
    onLoadingChangeRef.current?.(loading);
  }, [loading]);

  const cleanup = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  // 手动刷新
  const refresh = useCallback(() => {
    if (isRefreshing.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      isRefreshing.current = true;
      wsRef.current.send(JSON.stringify({ type: "refresh_btn" }));
      setTimeout(() => {
        isRefreshing.current = false;
      }, 5000);
    }
  }, []);

  useImperativeHandle(ref, () => ({ refresh }));

  // 建立 WebSocket 连接（支持 token 鉴权）
  useEffect(() => {
    if (!groupID || !isAutoRefresh) return;
    cleanup();

    // 【关键修改】构建 WebSocket URL，如果 token 存在则作为查询参数附加
    let wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/ws/stream/${groupID}`;
    if (token) {
      wsUrl += `?token=${encodeURIComponent(token)}`;
    }

    const ws = new WebSocket(wsUrl);
    // eslint-disable-next-line react-hooks/immutability
    wsRef.current = ws;

    ws.onopen = () => {
      toast.success("嘀嘀~电波对接成功！");
      console.log(new Date(Date.now()).toTimeString().split(" ")[0] + "." + new Date(Date.now()).getMilliseconds().toString().padStart(3, "0"), logInterval(), "WebSocket connected");
      reconnectAttempts.current = 0;
      setLoading(true);
      setError("");
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, data } = message;

        if (type === "order") {
          const order = data.order as string[];
          setServerOrder(order);
          setServersMap((prev) => {
            const newMap = { ...prev };
            order.forEach((addr) => {
              if (!newMap[addr]) {
                newMap[addr] = {
                  ServerAddress: addr,
                  ServerName: "加载中...",
                  Players: 0,
                  MaxPlayers: 0,
                  Map: "",
                  Mode: "",
                  PlayersList: [],
                  hasError: false,
                };
                // 清除旧的定时器
                if (pendingTimeoutsRef.current[addr]) {
                  clearTimeout(pendingTimeoutsRef.current[addr]);
                }
                // 设置超时定时器
                pendingTimeoutsRef.current[addr] = window.setTimeout(() => {
                  setServersMap((prevMap) => {
                    const target = prevMap[addr];
                    if (target && target.ServerName === "加载中...") {
                      return {
                        ...prevMap,
                        [addr]: {
                          ...target,
                          ServerName: "查询失败",
                          hasError: true,
                        },
                      };
                    }
                    return prevMap;
                  });
                  delete pendingTimeoutsRef.current[addr];
                }, 5000);
              }
            });
            return newMap;
          });
        } else if (type === "server") {
          const serverData = data as ServerInfo;
          // 清除该地址的超时定时器
          if (pendingTimeoutsRef.current[serverData.ServerAddress]) {
            clearTimeout(pendingTimeoutsRef.current[serverData.ServerAddress]);
            delete pendingTimeoutsRef.current[serverData.ServerAddress];
          }
          setServersMap((prev) => ({
            ...prev,
            [serverData.ServerAddress]: serverData,
          }));
        } else if (type === "done") {
          setLoading(false);
          onLoadingChangeRef.current?.(false);
        } else if (type === "error") {
          const errMsg = data?.error || "连接失败";
          setError(errMsg);
          onErrorRef.current?.(errMsg);
          setLoading(false);
          onLoadingChangeRef.current?.(false);
        } else if (type === "pong") {
          // 心跳响应
        }
      } catch (e) {
        console.error("解析 WebSocket 消息失败", e);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
      const errMsg = "嘀嘀… 通讯已断开";
      setError(errMsg);
      onErrorRef.current?.(errMsg);
      setLoading(false);
      onLoadingChangeRef.current?.(false);
    };

    ws.onclose = () => {
      toast.error("嘀嘀… 通讯中断，正在努力重新对接电波中✨");
      console.log(new Date(Date.now()).toTimeString().split(" ")[0] + "." + new Date(Date.now()).getMilliseconds().toString().padStart(3, "0"), logInterval(), "WebSocket closed");
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (isAutoRefresh && mountedRef.current) {
        const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts.current));
        reconnectAttempts.current++;
        reconnectTimerRef.current = window.setTimeout(() => {
          if (mountedRef.current && isAutoRefresh) {
            setConnectionKey((k) => k + 1);
          }
        }, delay);
      }
    };

    return () => {
      ws.close();
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [groupID, isAutoRefresh, token, connectionKey, cleanup]); // 【关键修改】依赖数组中添加 token

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(pendingTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ServerList
      servers={servers}
      loading={loading}
      error={error}
      emptyMessage="暂无服务器信息"
      placeholderCount={9}
      containerClassName="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3 w-full"
      cardClassName="w-full"
    />
  );
});

export default StreamingServerList;
