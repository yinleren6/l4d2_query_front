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
  onVersionUpdate?: (data: { version: string; force: boolean; message?: string }) => void;
}
export interface StreamingServerListRef {
  refresh: () => void;
}

const StreamingServerList = forwardRef<StreamingServerListRef, StreamingServerListProps>(({ groupID, token, isAutoRefresh = true, onLoadingChange, onError, onServersChange, onVersionUpdate }, ref) => {
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
  const onLoadingChangeRef = useRef(onLoadingChange);
  const onErrorRef = useRef(onError);
  const onServersChangeRef = useRef(onServersChange);
  useEffect(() => {
    onLoadingChangeRef.current = onLoadingChange;
    onErrorRef.current = onError;
    onServersChangeRef.current = onServersChange;
  }, [onLoadingChange, onError, onServersChange]);
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
  const refresh = useCallback(() => {
    if (isRefreshing.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      isRefreshing.current = true;
      wsRef.current.send(JSON.stringify({ type: "refresh_btn" }));
      wsRef.current.send(JSON.stringify({ type: "check_update" }));
      setTimeout(() => {
        isRefreshing.current = false;
      }, 5000);
    }
  }, []);

  useImperativeHandle(ref, () => ({ refresh }));
  useEffect(() => {
    if (!groupID || !isAutoRefresh) return;
    cleanup();
    let wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/ws/stream/${groupID}`;
    if (token) {
      wsUrl += `?token=${encodeURIComponent(token)}`;
    }

    const ws = new WebSocket(wsUrl);
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
      ws.send(JSON.stringify({ type: "check_update" }));
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
                if (pendingTimeoutsRef.current[addr]) {
                  clearTimeout(pendingTimeoutsRef.current[addr]);
                }
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
          // pong
        } else if (type === "version_update") {
          onVersionUpdate?.(data);
        }
      } catch (e) {
        console.error("电波识别失败了", e);
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
  }, [groupID, isAutoRefresh, token, connectionKey, cleanup, onVersionUpdate]);

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
