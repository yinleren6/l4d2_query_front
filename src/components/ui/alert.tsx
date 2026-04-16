// 简单封装一个 Alert
// 简易 Alert 组件，支持 className 和 variant
const Alert = ({ children, variant, className }: { children: React.ReactNode; variant?: "default" | "destructive"; className?: string }) => {
  const variantClass = variant === "destructive" ? "border-red-500 bg-red-50 text-red-800" : "border-blue-500 bg-blue-50 text-blue-800";
  return <div className={`border-l-4 p-4 rounded ${variantClass} ${className || ""}`}>{children}</div>;
};
const AlertTitle = ({ children }: { children: React.ReactNode }) => <h5 className="font-semibold mb-1">{children}</h5>;
const AlertDescription = ({ children }: { children: React.ReactNode }) => <div className="text-sm">{children}</div>;
export { Alert, AlertTitle, AlertDescription };
