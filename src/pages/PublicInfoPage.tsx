import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import request from "@/api/request";

import type { ServerInfo } from "@/components/ServerCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, Download, RefreshCw, ChevronDown } from "lucide-react";
import StreamingServerList, { StreamingServerListRef } from "@/components/StreamingServerList";
const FallingSakura = () => {
  const sakuraCount = 20;
  const sakuraStyles = useMemo(() => {
    return Array.from({ length: sakuraCount }).map(() => ({
      // eslint-disable-next-line react-hooks/purity
      width: `${Math.random() * 12 + 8}px`,
      // eslint-disable-next-line react-hooks/purity
      height: `${Math.random() * 12 + 8}px`,
      // eslint-disable-next-line react-hooks/purity
      left: `${Math.random() * 100}%`,
      // eslint-disable-next-line react-hooks/purity
      duration: `${Math.random() * 10 + 10}s`,
      // eslint-disable-next-line react-hooks/purity
      delay: `${Math.random() * 5}s`,
    }));
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
      <style>{`
        @keyframes sakura-fall {
          0% {
            transform: translateY(-10%) rotate(0deg) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg) translateX(50px);
            opacity: 0;
          }
        }
        .sakura-petal {
          position: absolute;
          top: 0;
          background: #ff8eb8;
          border-radius: 100% 0 100% 0;
          animation: sakura-fall linear infinite;
          opacity: 0;
        }
      `}</style>

      {sakuraStyles.map((style, i) => (
        <div
          key={i}
          className="sakura-petal"
          style={{
            width: style.width,
            height: style.height,
            left: style.left,
            animationDuration: style.duration,
            animationDelay: style.delay,
          }}
        />
      ))}
    </div>
  );
};

export default function PublicServerInfo() {
  const { groupID } = useParams<{ groupID: string }>();
  const [isHidden, setIsHidden] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [errorStats, setErrorStats] = useState("");
  const [onlinePlayerCount, setOnlinePlayerCount] = useState(0);
  const [totalMaxPlayerCount, setTotalMaxPlayerCount] = useState(0);
  const [onlineServerCount, setOnlineServerCount] = useState(0);
  const [totalServerCount, setTotalServerCount] = useState(0);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [showPage, setShowPage] = useState(true);

  const handleVersionUpdate = useCallback(
    (data: any) => {
      setHasNewVersion(true);
      if (!showPage) {
        if (data.force) {
          toast.warning(`服务已更新：${data.version}`);
        } else {
          toast.info(`发现新版本 ${data.version}`);
        }
      }
    },
    [showPage]
  );

  const navigateToDashPage = () => {
    const publicHost = window.location.host.replace("l.", "dash.");
    window.open(`https://${publicHost}/login`, "_blank");
  };

  // 背景图轮播
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const bgImages = [
    "https://uapis.cn/api/v1/random/image?category=acg",
    "https://www.loliapi.com/acg",
    "https://uapis.cn/api/v1/random/image?category=acg",
    "https://www.loliapi.com/acg",
    "https://uapis.cn/api/v1/random/image?category=acg",
    "https://www.loliapi.com/acg",
  ];

  const [bgBlobUrls, setBgBlobUrls] = useState<(string | null)[]>(() => new Array(bgImages.length).fill(null));
  const [bgReady, setBgReady] = useState<boolean[]>(() => new Array(bgImages.length).fill(false));
  const [anyBgReady, setAnyBgReady] = useState(false);
  const blobUrlsRef = useRef<(string | null)[]>(bgBlobUrls);
  const switchTime = 20000;
  const transitionTime = 5000;
  const lastRef = useRef(0);
  const streamingListRef = useRef<StreamingServerListRef>(null);

  const [isNoticeExpanded, setIsNoticeExpanded] = useState(true);

  const toggleNotice = () => setIsNoticeExpanded(!isNoticeExpanded);
  useEffect(() => {
    if (groupID !== "666") {
      setShowPage(true);
    } else {
      setShowPage(false);
    }
  }, [groupID]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNoticeExpanded(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % bgImages.length);
    }, switchTime);
    return () => clearInterval(timer);
  }, [bgImages.length, switchTime]);

  useEffect(() => {
    setAnyBgReady(bgReady.some((ready) => ready));
  }, [bgReady]);

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

  const handleManualRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRef.current < 3000) {
      toast.success("你冲得太快了 喵~");
      return;
    }
    lastRef.current = now;

    if (streamingListRef.current) {
      streamingListRef.current.refresh();
      setErrorStats("");
      toast.success("数据正在飞快赶来哦 喵~");
    } else {
      setRefreshKey((prev) => prev + 1);
      setErrorStats("");
      toast.success("刷新中...");
    }
  }, []);

  const handleServersChange = (servers: ServerInfo[]) => {
    const onlineServers = servers.filter((s) => !s.hasError);
    setOnlineServerCount(onlineServers.length);
    setTotalServerCount(servers.length);
    setOnlinePlayerCount(onlineServers.reduce((sum, s) => sum + (s.Players || 0), 0));
    setTotalMaxPlayerCount(servers.reduce((sum, s) => sum + (s.MaxPlayers || 0), 0));
    setErrorStats("");
  };

  useEffect(() => {
    if (groupID) {
      request.post("/api/public/record", { group_ID: groupID }).catch((err) => console.warn("api访问失败", err));
    }
  }, [groupID]);

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
        newReady[idx] = true;
      });
      setBgBlobUrls(newBlobUrls);
      setBgReady(newReady);
      blobUrlsRef.current = newBlobUrls;
    };
    loadAllImages();
    return () => {
      blobUrlsRef.current.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        fontFamily: "'MaokenZhuyuanTi', 'Microsoft YaHei', sans-serif",
      }}>
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out z-[-15] ${anyBgReady ? "opacity-0" : "opacity-100"}`}
        style={{
          background: "linear-gradient(135deg, #fdf2f8 0%, #fecdd3 30%, #e9d5ff 70%, #ddd6fe 100%)",
        }}>
        <FallingSakura />
      </div>
      {bgImages.map((_, idx) => {
        const bgUrl = bgBlobUrls[idx] || bgImages[idx];
        const isActive = idx === currentBgIndex;
        const isReady = bgReady[idx];
        const shouldShow = isActive && isReady;
        return (
          <div
            key={idx}
            className="absolute inset-0 bg-cover bg-center bg-fixed transition-opacity ease-in-out"
            style={{
              opacity: shouldShow ? 1 : 0,
              backgroundImage: `url("${bgUrl}")`,
              zIndex: -10,
              transitionDuration: `${transitionTime}ms`,
            }}
          />
        );
      })}
      <div className="absolute inset-0 bg-slate-900/30 z-[-5]" />
      <div className={`relative z-10 animate-popBounce transition-opacity duration-1000 grow ${isHidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div
            onClick={toggleNotice}
            className="bg-orange-50/50 dark:bg-slate-900/85 animate-backdrop-blur rounded-xl p-5 shadow-md text-3xl flex items-center justify-between cursor-pointer hover:bg-orange-100/50 dark:hover:bg-slate-800/90 transition-colors">
            {showPage ? <div className="flex">🍊「悠悠・荣誉时刻・求生大佬・荣誉加冕台」</div> : <div className="flex">🍊「悠悠の求生之路纯净多特服务器」</div>}
            <div className="flex items-center gap-4">
              {!showPage && (
                <Button
                  className="flex relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToDashPage();
                  }}>
                  {hasNewVersion ? <span>有更新</span> : <span>管理</span>}
                  {hasNewVersion && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </Button>
              )}
              <div className="transition-transform duration-1000 ease-in-out text-slate-600 dark:text-slate-300">
                <ChevronDown size={18} className={isNoticeExpanded ? "rotate-180" : ""} />
              </div>
            </div>
          </div>
          <div className={`overflow-hidden transition-all duration-1000 ease-in-out ${isNoticeExpanded ? "max-h-500 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"}`}>
            <div className="bg-orange-50/50 dark:bg-slate-900/85 animate-backdrop-blur rounded-xl p-5 shadow-md">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="text-amber-500">🔔</span> 服务器公告
              </h3>
              <div className="space-y-4">
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
          </div>
          {errorStats ? (
            <div className="bg-red-50/80 dark:bg-red-900/30 rounded-xl p-4 text-center text-red-600 mt-3">统计信息加载失败：{errorStats}</div>
          ) : (
            <div className="sticky top-5 z-10 bg-white/60 dark:bg-slate-900/85 animate-backdrop-blur rounded-xl p-4 shadow-md flex items-center justify-between mt-3">
              <div className="flex items-center gap-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium">在线玩家：</span>
                <span className="text-orange-500 dark:text-orange-400 font-bold">
                  {onlinePlayerCount}/{totalMaxPlayerCount}
                </span>
                <Button variant="secondary" size="default" onClick={handleManualRefresh} className="bg-white/80 animate-backdrop-blur shadow-lg hover:bg-white/90">
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
          <div className="mt-3">
            <StreamingServerList ref={streamingListRef} key={refreshKey} groupID={groupID!} isAutoRefresh={true} onServersChange={handleServersChange} onError={setErrorStats} onVersionUpdate={handleVersionUpdate} />
          </div>
        </div>
      </div>
      <div className="fixed top-2 right-3 z-50 flex gap-2">
        {isHidden && (
          <Button variant="secondary" size="default" onClick={handleSaveBackground} className="bg-white/80 animate-backdrop-blur shadow-lg hover:bg-white/90">
            <Download size={18} className="mr-1" />
            保存背景
          </Button>
        )}
        <Button variant="secondary" size="default" onClick={() => setIsHidden(!isHidden)} className="bg-white/80 animate-backdrop-blur shadow-lg hover:bg-white/90">
          {isHidden ? <Eye size={18} className="m-auto" /> : <EyeOff size={18} className="m-auto" />}
        </Button>
      </div>
      <footer className="z-40 opacity-50 hover:opacity-100 transition-all duration-300 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="bg-white/70 dark:bg-slate-900/90 backdrop-blur rounded-lg p-3 text-center shadow-lg">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              萌ICP备20268604号
              <a href="https://github.com/yinleren6" className="hover:text-orange-500 transition-colors">
                ©CCiallo
              </a>
              {new Date().getFullYear()} Powered by React
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
