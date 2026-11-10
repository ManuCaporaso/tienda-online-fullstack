import { Suspense } from "react";
import { CheckoutResult } from "@/components/checkout-result";

export const metadata = {
  title: "Pago aprobado | Patagonia Sports",
};

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />
        }
      >
        {/* `verifyApproval` hace que el carrito se vacíe únicamente después de
            consultar la orden y confirmar que quedó en estado APPROVED. */}
        <CheckoutResult variant="success" verifyApproval />
      </Suspense>
    </div>
  );
}
