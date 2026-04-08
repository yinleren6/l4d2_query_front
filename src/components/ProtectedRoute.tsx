// src/components/ProtectedRoute.tsx
import { useLocation, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/AuthState";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} />;
  return <>{children}</>;
}
