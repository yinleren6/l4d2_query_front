import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import request from "@/api/request";
import StreamingServerList from "@/components/StreamingServerList";
import type { ServerInfo } from "@/components/ServerCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, Download, RefreshCw } from "lucide-react";

export default function PublicServerInfo() {
  const { groupID } = useParams<{ groupID: string }>();
  const [isHidden, setIsHidden] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorStats, setErrorStats] = useState("");
  const [onlinePlayerCount, setOnlinePlayerCount] = useState(0);
  const [totalMaxPlayerCount, setTotalMaxPlayerCount] = useState(0);
  const [onlineServerCount, setOnlineServerCount] = useState(0);
  const [totalServerCount, setTotalServerCount] = useState(0);

  // 背景图轮播
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const bgImages = [
    "https://www.dmoe.cc/random.php",
    "https://uapis.cn/api/v1/random/image?category=acg&type=pc",
    "https://www.loliapi.com/acg",
    "https://www.dmoe.cc/random.php",
    "https://uapis.cn/api/v1/random/image?category=acg&type=pc",
    "https://www.loliapi.com/acg",
    "https://www.dmoe.cc/random.php",
    "https://uapis.cn/api/v1/random/image?category=acg&type=pc",
  ];
  // 存储每个背景图片的 Blob URL 和加载状态
  const [bgBlobUrls, setBgBlobUrls] = useState<(string | null)[]>(() => new Array(bgImages.length).fill(null));
  const [bgReady, setBgReady] = useState<boolean[]>(() => new Array(bgImages.length).fill(false));
  // 使用 ref 存储最新的 blob URLs，以便在卸载时释放
  const blobUrlsRef = useRef<(string | null)[]>(bgBlobUrls);
  const switchTime = 20000;
  const transitionTime = 5000;

  // 轮播定时器
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % bgImages.length);
    }, switchTime);
    return () => clearInterval(timer);
  }, [bgImages.length, switchTime]);

  // 保存当前背景图
  const handleSaveBackground = () => {
    const blobUrl = bgBlobUrls[currentBgIndex];
    if (blobUrl) {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `background_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("哎呀，背景图加载失败了！");
    }
  };

  // 手动刷新
  const handleManualRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    setLoadingStats(true); // ✅ 启用加载状态
    setErrorStats("");
    toast.success("已请求刷新数据");
  };

  const handleServersChange = (servers: ServerInfo[]) => {
    const onlineServers = servers.filter((s) => !s.hasError);
    setOnlineServerCount(onlineServers.length);
    setTotalServerCount(servers.length);
    setOnlinePlayerCount(onlineServers.reduce((sum, s) => sum + (s.Players || 0), 0));
    setTotalMaxPlayerCount(servers.reduce((sum, s) => sum + (s.MaxPlayers || 0), 0));
    setLoadingStats(false); // ✅ 数据到达后结束加载
    setErrorStats("");
  };

  //统计
  useEffect(() => {
    if (groupID) {
      request.post("/api/public/record", { group_id: groupID }).catch((err) => console.warn("记录访问失败", err));
    }
  }, [groupID]);
  // 预加载所有背景图片并生成 Blob URL（并发）
  useEffect(() => {
    const loadAllImages = async () => {
      blobUrlsRef.current.forEach((url) => url && URL.revokeObjectURL(url));
      const promises = bgImages.map(async (url, idx) => {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          return { idx, blobUrl, success: true };
        } catch (err) {
          console.warn(`预加载背景图 ${idx} 失败，将使用原始 URL`, err);
          return { idx, blobUrl: null, success: false };
        }
      });
      const results = await Promise.all(promises);
      const newBlobUrls = [...bgBlobUrls];
      const newReady = [...bgReady];
      results.forEach(({ idx, blobUrl }) => {
        newBlobUrls[idx] = blobUrl;
        // 无论是否成功，都标记为就绪（失败时使用原始 URL 显示）
        newReady[idx] = true;
      });
      setBgBlobUrls(newBlobUrls);
      setBgReady(newReady);
      blobUrlsRef.current = newBlobUrls;
    };
    loadAllImages();
    return () => {
      // 释放所有已创建的 Blob URL
      blobUrlsRef.current.forEach((url) => url && URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 仅在挂载时执行一次

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        fontFamily: "'MaokenZhuyuanTi', 'Microsoft YaHei', sans-serif",
      }}>
      {/* 背景轮播 - 优先使用预加载的 Blob URL，否则使用原始 URL */}
      {bgImages.map((_, idx) => {
        const bgUrl = bgBlobUrls[idx] || bgImages[idx];
        const isActive = idx === currentBgIndex;
        const isReady = bgReady[idx];
        // 只要图片就绪（预加载完成或失败降级），就显示
        const shouldShow = isActive && isReady;
        return (
          <div
            key={idx}
            className="absolute inset-0 bg-cover bg-center bg-fixed transition-opacity ease-in-out"
            style={{
              opacity: shouldShow ? 1 : 0,
              backgroundImage: `url("${bgUrl}")`,
              backgroundColor: "#f9f9f980",
              zIndex: -10,
              transitionDuration: `${transitionTime}ms`,
            }}
          />
        );
      })}

      {/* 遮罩 */}
      <div className="absolute inset-0 bg-slate-900/30 z-[-5]" />

      {/* 主内容区 */}
      <div className={`relative z-10 animate-popBounce transition-opacity animate-backdrop-blur duration-300 ${isHidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          {/* 公告 */}
          <div className="bg-orange-50/50 dark:bg-slate-900/85 backdrop-blur-sm rounded-xl p-5 shadow-md">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="text-amber-500">🔔</span> 服务器公告
            </h3>
            <div className="space-y-4">
              {/* 公告内容（省略，与原代码相同） */}
              <div>
                <h3 className="notice text-xl text-amber-500 font-bold">⭐萌新首次游玩如何进服⭐</h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  加入悠悠
                  <a href="https://qm.qq.com/q/ErkMWZ9G6s" className="text-sky-500" rel="noopener noreferrer">
                    Q群1067085569
                  </a>
                  ，点击右侧按钮即可全自动进入！但还是建议新人先看悠悠进服向导»
                </p>
              </div>
              <div>
                <h3 className="notice text-xl text-amber-500 font-bold">⭐为什么进服后皮肤没了⭐</h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">进服速度太快导致模组来不及加载！建议先启动游戏等模组全部加载完毕，再切屏回来点击进服按钮</p>
              </div>
              <div>
                <h3 className="notice text-xl text-amber-500 font-bold">⭐进服显示尚未安装战役⭐</h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">请检查指定三方图是否安装完毕！若是工坊订阅的请看进度条是否走完，先进游戏再切屏回来点按钮</p>
              </div>
              <div>
                <h3 className="notice text-xl text-amber-500 font-bold">⭐点击进服按钮没有反应⭐</h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">你是直接在微信或QQ内打开的进站吗？请将链接复制到浏览器访问，或点击右上角地球图标跳转浏览器内</p>
              </div>
              <div>
                <h3 className="notice text-xl text-amber-500 font-bold">⭐进服显示会话已不可用⭐</h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">大概率是同时进入的人太多服务器处理不过来，请稍等几秒后重新进吧，或者进入其他子服试试</p>
              </div>
              <div>
                <h3 className="notice text-xl text-amber-500 font-bold">⭐服务器指定的app id无效⭐</h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">Steam偶尔抽风导致的！建议将窗口里的IP地址复制下来，然后再手动connect IP即可进服</p>
              </div>
            </div>
          </div>
          {/* 服务器信息 */}
          {errorStats ? (
            <div className="bg-red-50/80 dark:bg-red-900/30 rounded-xl p-4 text-center text-red-600">统计信息加载失败：{errorStats}</div>
          ) : loadingStats ? (
            <div className="bg-white/60 dark:bg-slate-900/85 rounded-xl p-4 text-center">加载中...</div>
          ) : (
            <div className="bg-white/60 dark:bg-slate-900/85 backdrop-blur-sm rounded-xl p-4 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium">在线玩家：</span>
                <span className="text-orange-500 dark:text-orange-400 font-bold">
                  {onlinePlayerCount}/{totalMaxPlayerCount}
                </span>
                <Button variant="secondary" size="default" onClick={handleManualRefresh} className="bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90">
                  <RefreshCw size={18} />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium">在线服务器：</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {onlineServerCount}/{totalServerCount}
                </span>
              </div>
            </div>
          )}

          {/* 服务器列表 */}
          <StreamingServerList
            key={refreshKey}
            groupId={groupID!}
            token={undefined}
            isAutoRefresh={true}
            onLoadingChange={setLoadingStats}
            onServersChange={handleServersChange} // 新增
            onError={setErrorStats}
          />
        </div>
      </div>

      {/* 右上角浮动按钮组 */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {isHidden && (
          <Button variant="secondary" size="default" onClick={handleSaveBackground} className="bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90">
            <Download size={18} className="mr-1" />
            保存背景
          </Button>
        )}
        <Button variant="secondary" size="default" onClick={() => setIsHidden(!isHidden)} className="bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90">
          {isHidden ? <Eye size={18} className="m-auto" /> : <EyeOff size={18} className="m-auto" />}
        </Button>
      </div>
    </div>
  );
}
