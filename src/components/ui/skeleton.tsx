import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-xl bg-muted/40 animate-fadeIn transition-opacity duration-300 ease-in-out skeleton-shine", className)} {...props} />;
}
