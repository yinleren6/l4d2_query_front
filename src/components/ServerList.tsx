// src/components/ServerList.tsx
import ServerCard, { ServerInfo } from "@/components/ServerCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface ServerListProps {
  servers: ServerInfo[];
  loading: boolean;
  error?: string | null;
  emptyMessage?: string;
  placeholderCount?: number;
  containerClassName?: string;
  cardClassName?: string; // 新增：传递给 ServerCard 的类名
}

export default function ServerList({
  servers,
  loading,
  error,
  emptyMessage = "暂无服务器信息",
  placeholderCount = 3,
  containerClassName = "flex flex-wrap justify-center gap-4 p-4",
  cardClassName = "",
}: ServerListProps) {
  if (loading) {
    return (
      <div className={containerClassName}>
        {Array.from({ length: placeholderCount }).map((_, i) => (
          <Skeleton key={i} className={`rounded-2xl ${cardClassName || "w-full"} h-36`} />
        ))}
      </div>
    );
  }
  if (error) {
    return <Card className="p-8 text-center text-destructive">{error}</Card>;
  }

  if (servers.length === 0) {
    return <Card className="p-8 text-center text-muted-foreground">{emptyMessage}</Card>;
  }

  return (
    <div className={containerClassName}>
      {servers.map((server, idx) => (
        <ServerCard key={idx} server={server} className={cardClassName} />
      ))}
    </div>
  );
}
