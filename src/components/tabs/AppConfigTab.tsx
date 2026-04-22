// src/components/tabs/AppVersionTab.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import Form from "@rjsf/shadcn";
import validator from "@rjsf/validator-ajv8";
import request from "@/api/request";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppVersionFormData, FormSchema } from "@/types";
import { toast } from "sonner";
import { deepTrim, isEqual } from "@/lib/utils";
import LoadingGif from "@/components/ui/loadinggif";

export default function AppVersionTab() {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [formData, setFormData] = useState<AppVersionFormData | undefined>(undefined);
  const [originalData, setOriginalData] = useState<AppVersionFormData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const mountedRef = useRef(true);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try {
      if (!mountedRef.current) return;
      setLoading(true);
      setError("");
      const [schemaRes, dataRes] = await Promise.all([request.get("/api/app-schema", { signal }), request.get("/api/get-app-config", { signal })]);
      const hasValidData = dataRes.data && typeof dataRes.data === "object" && "app_version" in dataRes.data;
      const configData = hasValidData
        ? dataRes.data
        : {
            app_version: "0.0.0",
            download_url: "",
            last_update: "",
            changelog: "",
          };
      console.log(configData);
      setFormData(configData);
      setOriginalData(configData);
      setSchema(schemaRes.data);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      if (err instanceof Error && err.name === "AbortError") return;
      const errorMsg = "加载版本配置失败，请刷新重试";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("加载版本配置失败:", err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    loadData(controller.signal);
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [loadData]);

  if (loading)
    return (
      <div className="p-8 text-center">
        <LoadingGif />
        加载中...
      </div>
    );
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
  if (!schema)
    return (
      <div className="p-8 text-center">
        <LoadingGif />
        加载中...
      </div>
    );

  const handleSubmit = async ({ formData: rawFormData }: { formData?: AppVersionFormData }) => {
    if (!rawFormData || submitting) return;

    const trimmedData = deepTrim(rawFormData);
    const finalData = {
      ...trimmedData,
      app_version: trimmedData["app_version"] || "0.0.0",
      download_url: trimmedData["download_url"] || "",
      changelog: trimmedData["changelog"] || "",
    };

    if (originalData && isEqual(finalData, deepTrim(originalData))) {
      toast.info("内容没有变化，无需保存");
      return;
    }

    setSubmitting(true);
    try {
      const response = await request.post("/api/admin/save-app-config", finalData);
      const savedData = response.data;

      if (!mountedRef.current) return;
      setFormData(savedData || finalData);
      setOriginalData(savedData || finalData);
      toast.success("✅ App版本配置保存成功！");
    } catch (err: unknown) {
      console.error("保存失败:", err);
      if (mountedRef.current) {
        toast.error("❌ 保存失败，请重试");
      }
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };
  return (
    <Card className="p-6 animate-fade-slide">
      <h2 className="text-lg font-semibold mb-4">App版本配置</h2>
      <Form schema={schema} formData={formData} validator={validator} onSubmit={({ formData }: { formData?: AppVersionFormData }) => handleSubmit({ formData })} liveValidate>
        <div className="mt-4">
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {submitting ? "保存中..." : "保存版本配置"}
          </Button>
        </div>
      </Form>
    </Card>
  );
}
