// // src/pages/NormalLoginPage.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import request from "@/api/request";
import { toast } from "sonner";
import axios from "axios";
import LoginForm from "@/components/LoginForm";

export default function NormalLoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const cancelPendingRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleTokenLogin = async (values: Record<string, string>) => {
    const token = values.token;
    if (!token || !token.trim()) {
      toast.error("请输入有效的Token");
      return;
    }

    cancelPendingRequest();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const { data } = await request.post<{
        userID: string;
        token: string;
        role: string;
      }>("/api/auth", { token: token.trim() }, { signal: controller.signal });

      if (mountedRef.current) {
        setUser({ id: data.userID, token: data.token, role: "user" });
        toast.success("Token登录成功");
        navigate("/dashboard/serverconfig");
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error).name === "AbortError") {
        return;
      }

      let errorMsg = "Token登录失败，请检查Token是否有效";
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.error) {
          errorMsg = err.response.data.error;
        } else if (!err.response) {
          errorMsg = "网络连接失败，请检查网络";
        }
      }
      if (mountedRef.current) {
        toast.error(errorMsg);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <LoginForm
        type="token"
        onSubmit={handleTokenLogin} // 类型完全匹配，无需断言
        loading={loading}
      />
    </div>
  );
}
