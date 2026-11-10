"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <Toaster
          richColors
          position="top-right"
          closeButton
          toastOptions={{ duration: 3500 }}
        />
      </CartProvider>
    </AuthProvider>
  );
}
