import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const XfMusicPlayer = () => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // --- 1. 判断是不是管理页面（根据你的实际路由修改哦） ---
    const isAdminPage = window.location.host.startsWith("dash.");

    if (isAdminPage) {
      // 如果是管理页面，且之前加载过，就清理掉
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      scriptLoadedRef.current = false;
      return;
    }

    // --- 2. 非管理页面，且没加载过，就开始加载 ---
    if (!scriptLoadedRef.current && containerRef.current) {
      // 第一步：创建播放器的 DIV 容器
      const playerDiv = document.createElement("div");
      playerDiv.id = "xf-MusicPlayer";
      // 这里设置你的参数哦
      playerDiv.setAttribute("data-cdnName", "https://player.xfyun.club/js");
      playerDiv.setAttribute("data-localMusic", "/playlistData.json");

      containerRef.current.appendChild(playerDiv);

      // 第二步：动态加载 JS 文件
      const script = document.createElement("script");
      script.src = "https://player.xfyun.club/js/xf-MusicPlayer/js/xf-MusicPlayer.min.js";
      script.async = true;

      script.onload = () => {
        console.log("云崽的音乐播放器加载成功啦~");
        scriptLoadedRef.current = true;
      };

      document.body.appendChild(script);
    }

    // --- 3. 清理函数（切路由时调用） ---
    return () => {
      // 注意：这个播放器 JS 加载后可能会往页面添加很多元素，
      // 如果需要完全清理可能比较麻烦，这里我们只清理我们创建的容器。
      // 如果只是隐藏的话，管理页面不渲染 container 即可。
    };
  }, [location.pathname]);

  // 管理页面直接返回 null，什么都不渲染
  if (window.location.host.startsWith("dash.")) {
    return null;
  }

  return <div ref={containerRef} />;
};

export default XfMusicPlayer;
