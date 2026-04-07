// src/components/LoginForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface LoginFormProps {
  type: "admin" | "token";
  onSubmit: (values: { [key: string]: string }) => Promise<void>;
  loading: boolean;
}

export default function LoginForm({ type, onSubmit, loading }: LoginFormProps) {
  // 初始化状态 – 组件每次重新挂载（key 变化）时都会重新执行
  const [formValues, setFormValues] = useState<{
    id?: string;
    password?: string;
    token?: string;
  }>(() => (type === "admin" ? { id: "", password: "" } : { token: "" }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setFormValues((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const performSubmit = async () => {
    if (loading) return;

    if (type === "admin") {
      if (!formValues.id?.trim() || !formValues.password?.trim()) {
        toast.error("请输入管理员ID和密码");
        return;
      }
    } else {
      if (!formValues.token?.trim()) {
        toast.error("请输入登录Token");
        return;
      }
    }
    await onSubmit(formValues);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      performSubmit();
    }
  };

  return (
    <Card className="w-full max-w-md p-6 shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-6">{type === "admin" ? "账号登录" : "验证Token"}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === "admin" && <Input name="id" value={formValues.id} onChange={(e) => handleInputChange(e, "id")} placeholder="管理员ID" disabled={loading} onKeyDown={handleKeyDown} />}
        <Input
          name={type === "admin" ? "password" : "token"}
          type={type === "admin" ? "password" : "text"}
          value={type === "admin" ? formValues.password : formValues.token}
          onChange={(e) => handleInputChange(e, type === "admin" ? "password" : "token")}
          placeholder={type === "admin" ? "密码" : "登录Token"}
          disabled={loading}
          onKeyDown={handleKeyDown}
        />
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </Button>
      </form>
    </Card>
  );
}
