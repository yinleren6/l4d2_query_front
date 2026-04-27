// src/components/ServerCard.tsx
import { useState } from "react";
import { Copy, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export interface Player {
  score: number;
  time: string;
  name: string;
}

export interface ServerInfo {
  ServerName: string;
  ServerAddress: string;
  Map: string;
  Mode: string;
  Players: number;
  MaxPlayers: number;
  PlayersList: Player[];
  hasError?: boolean;
  failCount?: number;
}

interface ServerCardProps {
  server: ServerInfo;
  onJoin?: (address: string) => void;
  onCopy?: (address: string) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export default function ServerCard({ server, onJoin, onCopy, className = "" }: ServerCardProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    return server.PlayersList && server.PlayersList.length > 0;
  });

  const playersCount = `${server.Players}/${server.MaxPlayers}`;
  const isFull = server.Players >= server.MaxPlayers;
  const hasError = server.hasError || !server.ServerName;
  const playersPercent = server.MaxPlayers > 0 ? (server.Players / server.MaxPlayers) * 100 : 0;

  const joinUrl = `steam://connect/${server.ServerAddress}?appid=550`;

  const handleJoin = () => {
    if (onJoin) {
      onJoin(server.ServerAddress);
    } else {
      window.open(joinUrl, "_blank");
    }
  };

  const handleCopy = async () => {
    const text = `connect ${server.ServerAddress}`;
    if (onCopy) {
      onCopy(server.ServerAddress);
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("地址已复制");
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`relative min-h-[120] p-4 rounded-xl flex flex-col transition-all duration-300 hover:shadow-xl bg-white/60 backdrop-blur-sm dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:-translate-y-1 opacity-0 animate-fadeIn ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 font-bold text-lg wrap-break-words text-slate-800 dark:text-slate-100">{server.ServerName || server.ServerAddress}</div>
        <div className="flex gap-1">
          <button onClick={handleCopy} className="px-3 py-1.5 bg-green-400 text-white rounded-md text-xs font-medium hover:bg-green-500 transition flex items-center gap-1" title="复制连接地址">
            <Copy size={12} />
          </button>
          <button onClick={handleJoin} className="px-4 py-1.5 bg-sky-500 text-white rounded-md text-xs font-medium hover:bg-sky-600 transition">
            加入
          </button>
          <div className="my-auto">
            <div className={`w-8 h-5 rounded-full relative ${hasError ? "bg-red-400" : isFull ? "bg-orange-400" : "bg-green-500"}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${hasError ? "left-0.5" : "left-[14.5px]"}`} />
            </div>
          </div>
        </div>
      </div>
      {!hasError && (
        <div className="flex items-center text-sm mt-2 font-medium px-1">
          <span className="flex-1 truncate text-emerald-600 dark:text-emerald-400">{server.Map}</span>
          <span className="mx-1 text-amber-500 dark:text-amber-400 whitespace-nowrap">[{server.Mode}]</span>
        </div>
      )}
      <div className="mt-2">
        {!hasError && (
          <button
            onClick={toggleExpand}
            className="w-full h-12 flex items-center justify-between text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-1 px-2 rounded-md bg-slate-100/50 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition">
            <div className="flex flex-col px-3 py-1.5 overflow-hidden gap-1 w-full flex-1">
              <span className="text-left text-xs font-medium text-slate-700 dark:text-slate-200">玩家列表 ({playersCount})</span>
              <div className="h-2 w-full bg-linear-to-r from-emerald-500 to-sky-500 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${playersPercent}%` }} />
            </div>
            <div className="transition-transform duration-300 ease-in-out">
              <ChevronDown size={14} className={isExpanded ? "rotate-180" : ""} />
            </div>
          </button>
        )}
        {!hasError && (
          <div
            className={`
        overflow-hidden transition-all duration-500 ease
        ${isExpanded ? "max-h-125 opacity-100 mt-2" : "max-h-0 opacity-0"}
      `}>
            <div className="bg-blue-50/50 dark:bg-slate-800/30 p-2 rounded-lg">
              {server.PlayersList && server.PlayersList.length > 0 ? (
                <div className="space-y-1">
                  {server.PlayersList.map((player, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs h-6 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60">
                      <span className="w-7 shrink-0 text-slate-600 dark:text-slate-400">[{player.score}]</span>
                      <span className="w-16 shrink-0 text-left text-slate-500 dark:text-slate-500">{player.time}</span>
                      <div className="flex-1 overflow-hidden text-slate-700 dark:text-slate-300">
                        <div className="whitespace-nowrap overflow-x-auto">{player.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-center py-2 text-xs">没有玩家在线</div>
              )}
            </div>
          </div>
        )}

        {hasError && <div className="text-red-500 text-center py-2 text-xs font-medium bg-red-50/60 rounded-lg mt-2">查询失败！</div>}
      </div>
    </div>
  );
}
