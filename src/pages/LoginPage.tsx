import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/AuthState";
import request from "@/api/request";
import { toast } from "sonner";
import axios from "axios";
import UnifiedLoginForm from "@/components/UnifiedLoginForm";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      abortControllerRef.current?.abort();
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const hasToken = !!user?.jwtToken;
    if (hasToken) {
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, navigate]);

  // 管理员登录
  const handleAdminLogin = async (values: Record<string, string>) => {
    const id = values.id;
    const password = values.password;

    if (!id || !password) {
      toast.error("管理员ID和密码不能为空");
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const { data } = await request.post("/api/login", { userID: id.trim(), password: password.trim() }, { signal: controller.signal });

      setUser({ id: data.userID, jwtToken: data.token, role: data.role });
      toast.success("管理员登录成功");
      navigate("/dashboard");
    } catch (err) {
      if (axios.isCancel(err) || (err as Error).name === "AbortError") return;
      let errorMsg = "登录失败，请检查账号密码";
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Token 登录
  const handleTokenLogin = async (values: Record<string, string>) => {
    const token = values.token;
    if (!token?.trim()) {
      toast.error("请输入有效的Token");
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const { data } = await request.post("/api/auth", { token: token.trim() }, { signal: controller.signal });

      setUser({ id: data.userID, jwtToken: data.token, role: "user" });
      toast.success("Token 登录成功");
      navigate("/dashboard/serverconfig");
    } catch (err) {
      if (axios.isCancel(err) || (err as Error).name === "AbortError") return;
      let errorMsg = "Token 登录失败，请检查 Token 是否有效";
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <UnifiedLoginForm onAdminLogin={handleAdminLogin} onTokenLogin={handleTokenLogin} loading={loading} />
    </div>
  );
}
