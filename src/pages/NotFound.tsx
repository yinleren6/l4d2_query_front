// // src/pages/NotFound.tsx
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
export default function NotFound() {
  const navigate = useNavigate();

  // 自动判断当前域名，跳正确首页
  const goHome = () => {
    const isPublicDomain = window.location.host.startsWith("l.");
    if (isPublicDomain) {
      // l.xxx 域名 → 404，不跳转，提示一下
      toast.error("呜呜呜~ 首页居然不见啦(╥ω╥`)");
    } else {
      // dash.xxx 域名 → 回后台首页
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-6">页面飞走啦~😱</p>
      <Button className="bg-[#171717]" onClick={() => toast.error("再怎么戳我也找不到啦(╥ω╥`)🥺 页面偷偷跑掉咯~")}>
        戳我试试看✨
      </Button>
      <br />
      <br />
      <br />
      <br />
      <Button className="bg-[#171717]" onClick={goHome}>
        回到首页
      </Button>
    </div>
  );
}
