// 简单封装一个 Badge
// 简易 Badge 组件，支持 className
const Badge = ({ children, variant, className }: { children: React.ReactNode; variant?: "default" | "destructive" | "secondary"; className?: string }) => {
  const variantClass = variant === "destructive" ? "bg-red-100 text-red-800" : variant === "secondary" ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClass} ${className || ""}`}>{children}</span>;
};
export { Badge };
