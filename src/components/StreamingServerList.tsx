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

  // 辅助函数：获取当前时间戳字符串
  const getTimestamp = () => new Date().toISOString().slice(11, 23);

  useEffect(() => {
    onLoadingChangeRef.current = onLoadingChange;
    onErrorRef.current = onError;
    onServersChangeRef.current = onServersChange;
  }, [onLoadingChange, onError, onServersChange]);

  const lastTimeRef = useRef<number>(0);
  useEffect(() => {
    lastTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (isAutoRefresh) {
      autoRefreshIntervalRef.current = window.setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          console.log(`[${getTimestamp()}] 发送自动刷新消息 (refresh)`);
          wsRef.current.send(JSON.stringify({ type: "refresh" }));
        }
      }, 15000);
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
      console.log(`[${getTimestamp()}] 手动刷新 (refresh_btn + check_update)`);
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
    console.log(`[${getTimestamp()}] 创建 WebSocket 连接: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    // eslint-disable-next-line react-hooks/immutability
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[${getTimestamp()}] WebSocket 连接已打开 (readyState=${ws.readyState})`);
      toast.success("嘀嘀~电波对接成功！");
      reconnectAttempts.current = 0;
      setLoading(true);
      setError("");
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log(`[${getTimestamp()}] 发送心跳 ping`);
          ws.send(JSON.stringify({ type: "ping" }));
        } else {
          console.log(`[${getTimestamp()}] 心跳 skipped, readyState=${ws.readyState}`);
        }
      }, 10000);
      ws.send(JSON.stringify({ type: "check_update" }));
      console.log(`[${getTimestamp()}] 发送 check_update`);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, data } = message;
        console.log(`[${getTimestamp()}] 收到消息 type=${type}, data=${JSON.stringify(data).substring(0, 200)}`);

        if (type === "order") {
          const order = data.order as string[];
          console.log(`[${getTimestamp()}] 收到 order, 数量=${order.length}`);
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
                      console.log(`[${getTimestamp()}] 地址 ${addr} 查询超时，标记为失败`);
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
          console.log(`[${getTimestamp()}] 收到 server: ${serverData.ServerAddress} (${serverData.ServerName})`);
          if (pendingTimeoutsRef.current[serverData.ServerAddress]) {
            clearTimeout(pendingTimeoutsRef.current[serverData.ServerAddress]);
            delete pendingTimeoutsRef.current[serverData.ServerAddress];
          }
          setServersMap((prev) => ({
            ...prev,
            [serverData.ServerAddress]: serverData,
          }));
        } else if (type === "done") {
          console.log(`[${getTimestamp()}] 收到 done, total=${data.total}`);
          setLoading(false);
          onLoadingChangeRef.current?.(false);
        } else if (type === "error") {
          const errMsg = data?.error || "连接失败";
          console.error(`[${getTimestamp()}] 收到 error: ${errMsg}`);
          setError(errMsg);
          onErrorRef.current?.(errMsg);
          setLoading(false);
          onLoadingChangeRef.current?.(false);
        } else if (type === "pong") {
          console.log(`[${getTimestamp()}] 收到 pong`);
        } else if (type === "version_update") {
          console.log(`[${getTimestamp()}] 收到 version_update`, data);
          onVersionUpdate?.(data);
        }
      } catch (e) {
        console.error(`[${getTimestamp()}] 消息解析失败:`, e, "原始数据:", event.data);
      }
    };

    ws.onerror = (err) => {
      console.error(`[${getTimestamp()}] WebSocket 错误:`, err);
      const errMsg = "嘀嘀… 通讯已断开";
      setError(errMsg);
      onErrorRef.current?.(errMsg);
      setLoading(false);
      onLoadingChangeRef.current?.(false);
    };

    ws.onclose = (closeEvent) => {
      console.log(`[${getTimestamp()}] WebSocket 关闭: code=${closeEvent.code}, reason="${closeEvent.reason}", wasClean=${closeEvent.wasClean}, readyState=${ws.readyState}`);
      toast.error("嘀嘀… 通讯中断，正在努力重新对接电波中✨");
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (isAutoRefresh && mountedRef.current) {
        const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts.current));
        reconnectAttempts.current++;
        console.log(`[${getTimestamp()}] 计划 ${delay}ms 后重连 (尝试次数=${reconnectAttempts.current})`);
        reconnectTimerRef.current = window.setTimeout(() => {
          if (mountedRef.current && isAutoRefresh) {
            console.log(`[${getTimestamp()}] 触发重连 (connectionKey=${connectionKey + 1})`);
            setConnectionKey((k) => k + 1);
          }
        }, delay);
      }
    };

    return () => {
      console.log(`[${getTimestamp()}] 清理 WebSocket 连接`);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
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
