// // src/pages/NotFound.tsx
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-6">页面飞走啦~😱</p>
      <Button onClick={() => toast.error("再怎么戳我也找不到啦(╥ω╥`)🥺 页面偷偷跑掉咯~")}>戳我试试看✨</Button>
    </div>
  );
}
