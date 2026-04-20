// src/components/tabs/ServerConfigTab.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Form from "@rjsf/shadcn";
import validator from "@rjsf/validator-ajv8";
import request from "@/api/request";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ServerFormData, FormSchema } from "@/types";
import { toast } from "sonner";
import { deepTrim, isEqual } from "@/lib/utils";
import { useAuthStore } from "@/store/AuthState";
import LoadingGif from "@/components/ui/loadinggif";
export default function ServerConfigTab() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const groupParam = searchParams.get("group");

  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [formData, setFormData] = useState<ServerFormData | undefined>(undefined);
  const [originalData, setOriginalData] = useState<ServerFormData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [users, setUsers] = useState<
    {
      user_id: string;
    }[]
  >([]);
  const [currentGroupId, setCurrentGroupId] = useState<string>(() => {
    if (user?.role === "admin") return groupParam || "";
    return user?.id || "";
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    if (user?.role !== "admin" || currentGroupId === "") return;
    const fetchGroups = async () => {
      try {
        const res = await request.get("/api/admin/groups");
        if (mountedRef.current) {
          const enabledGroups = (res.data || []).filter((g: any) => {
            return g.enabled === true || g.enabled === 1 || g.enabled === "true";
          });
          setUsers(enabledGroups);
        }
      } catch (err) {
        toast.error("加载群组列表失败");
      }
    };
    fetchGroups();
  }, [user]);
  const loadData = useCallback(async () => {
    if (user?.role === "admin" && !currentGroupId) {
      setLoading(false);
      return;
    }
    if (!currentGroupId) return;
    setLoading(true);
    setError("");
    try {
      const [schemaRes, dataRes] = await Promise.all([
        request.get("/api/config-schema"),
        user?.role === "admin" && currentGroupId !== user.id ? request.get(`/api/admin/config/${currentGroupId}`) : request.get("/api/get-user-config"),
      ]);
      if (!mountedRef.current) return;
      setSchema(schemaRes.data);
      const configData = dataRes?.data || {};
      setFormData(configData);
      setOriginalData(configData);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError("加载配置失败");
      toast.error("加载配置失败");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line
  }, [currentGroupId, user?.role]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => {
      mountedRef.current = false;
    };
  }, [loadData]);

  const handleSubmit = async ({ formData: rawFormData }: { formData?: ServerFormData }) => {
    if (!rawFormData || submitting) return;
    const trimmedData = deepTrim(rawFormData);
    const finalData = {
      ...trimmedData,
      version: trimmedData["version"] || "0",
      last_update: "",
      server_list: trimmedData["server_list"] || [],
    };
    if (originalData && isEqual(finalData, deepTrim(originalData))) {
      toast.info("内容无变化，无需保存");
      return;
    }
    setSubmitting(true);
    try {
      let response;
      console.log(user?.role === "admin");
      console.log(currentGroupId !== user?.id);
      console.log(user?.role === "admin" && currentGroupId !== user.id);

      if (user?.role === "admin" && currentGroupId !== user.id) {
        console.log("分支 1 ");
        response = await request.post(`/api/admin/config/${currentGroupId}`, finalData);
      } else {
        console.log("分支 2 ");
        response = await request.post("/api/save-user-config", finalData);
      }
      const savedData = response.data;
      setFormData(savedData || finalData);
      setOriginalData(savedData || finalData);
      toast.success("保存成功！");
    } catch (err) {
      console.error("保存失败:", err);
      toast.error("保存失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full p-8 text-center">
        <LoadingGif />
        加载中...
      </div>
    );
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
  if (!schema)
    return (
      <div className="flex justify-center items-center h-full p-8 text-center">
        <LoadingGif />
        请选择配置
      </div>
    );

  return (
    <Card className="p-6 animate-fade-slide">
      {user?.role === "admin" && users.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium">选择群组：</label>
          <select value={currentGroupId} onChange={(e) => setCurrentGroupId(e.target.value)} className="px-2 py-1 border rounded-md bg-background text-sm" disabled={loading}>
            {users.map((g) => (
              <option key={g.user_id} value={g.user_id}>
                {g.user_id} {g.user_id === user.id ? "(当前用户)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      <h2 className="text-lg font-semibold mb-4">服务器列表配置 {currentGroupId && currentGroupId !== user?.id ? `- ${currentGroupId}` : ""}</h2>
      <Form schema={schema} formData={formData} validator={validator} onSubmit={({ formData }: { formData?: ServerFormData }) => handleSubmit({ formData })} liveValidate>
        <div className="mt-4">
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {submitting ? "保存中..." : "保存配置"}
          </Button>
        </div>
      </Form>
    </Card>
  );
}
