// src/components/StreamingServerList.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import ServerList from "./ServerList";
import { ServerInfo } from "./ServerCard";

interface StreamingServerListProps {
  groupId: string;
  token?: string;
  isAutoRefresh?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: string) => void;
  onServersChange?: (servers: ServerInfo[]) => void;
}

export default function StreamingServerList({ groupId, isAutoRefresh = true, onLoadingChange, onError, onServersChange }: StreamingServerListProps) {
  const [serversMap, setServersMap] = useState<Record<string, ServerInfo>>({});
  const [serverOrder, setServerOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true); // 初始加载中
  const [error, setError] = useState("");
  const mountedRef = useRef(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const refreshingRef = useRef(false); // 防止并发刷新
  const initialLoadRef = useRef(false); // 标记是否已执行初始加载
  const servers = serverOrder.map((key) => serversMap[key]).filter(Boolean);

  useEffect(() => {
    onServersChange?.(servers);
  }, [servers, onServersChange]);

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connectStream = useCallback(() => {
    if (!groupId) return;
    const url = `/api/public/stream/${groupId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("order", (event) => {
      try {
        const data = JSON.parse(event.data);
        const order = data.order as string[];
        if (!mountedRef.current) return;
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
            }
          });
          return newMap;
        });
      } catch (e) {
        console.error("解析 order 事件失败", e);
      }
    });

    es.addEventListener("server", (event) => {
      try {
        const serverData = JSON.parse(event.data) as ServerInfo;
        if (!mountedRef.current) return;
        setServersMap((prev) => ({
          ...prev,
          [serverData.ServerAddress]: serverData,
        }));
      } catch (e) {
        console.error("解析 server 事件失败", e);
      }
    });

    es.addEventListener("done", () => {
      if (!mountedRef.current) return;
      setLoading(false);
      onLoadingChange?.(false);
      closeEventSource();
      refreshingRef.current = false;
    });

    es.addEventListener("error", (event) => {
      if (!mountedRef.current) return;
      console.error("SSE 错误", event);
      const errMsg = "连接失败，请重试";
      setError(errMsg);
      onError?.(errMsg);
      setLoading(false);
      onLoadingChange?.(false);
      closeEventSource();
      refreshingRef.current = false;
    });
  }, [groupId, onLoadingChange, onError, closeEventSource]);
  // 新增 effect 用于同步 loading 到父组件
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);
  // 初始加载 effect 中只负责连接，不再设置状态
  useEffect(() => {
    if (isAutoRefresh && groupId && !initialLoadRef.current) {
      initialLoadRef.current = true;
      connectStream();
    }
    return () => closeEventSource();
  }, [groupId, isAutoRefresh, connectStream, closeEventSource]);

  return (
    <ServerList
      servers={servers}
      loading={loading}
      error={error}
      emptyMessage="暂无服务器信息"
      placeholderCount={4}
      containerClassName="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 w-full"
      cardClassName="w-full"
    />
  );
}
