"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

export function useAdminGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      toast.error("Acceso restringido", {
        description: "Necesitás una cuenta de administrador.",
      });
      router.replace("/");
    }
  }, [user, loading, router]);

  return {
    user,
    loading,
    allowed: !loading && user?.role === "ADMIN",
  };
}
