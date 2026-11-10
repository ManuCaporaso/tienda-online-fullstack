"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  RotateCcw,
  ShoppingBag,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { CART_STORAGE_KEY, useCart } from "@/context/cart-context";
import { apiFetch, ApiError } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";

type Variant = "success" | "failure" | "pending";

type Verification = "idle" | "checking" | "approved" | "pending" | "error";

interface Copy {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  swalTitle: string;
  swalText: string;
  swalIcon: "success" | "error" | "info";
  swalColor: string;
}

const copy: Record<Variant, Copy> = {
  success: {
    title: "¡Pago aprobado!",
    description:
      "Tu compra se confirmó correctamente. Te enviaremos los detalles por email.",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    swalTitle: "Pago aprobado",
    swalText: "¡Gracias por tu compra! Ya estamos preparando tu pedido.",
    swalIcon: "success",
    swalColor: "#059669",
  },
  failure: {
    title: "El pago no se completó",
    description:
      "Mercado Pago rechazó o canceló la operación. Podés intentarlo de nuevo.",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    swalTitle: "Pago rechazado",
    swalText:
      "No pudimos procesar el pago. Revisá el medio de pago e intentá otra vez.",
    swalIcon: "error",
    swalColor: "#dc2626",
  },
  pending: {
    title: "Pago pendiente",
    description:
      "Estamos esperando la confirmación de Mercado Pago. Te avisaremos cuando se acredite.",
    icon: Clock3,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    swalTitle: "Pago pendiente",
    swalText:
      "Tu pago está siendo procesado. Podés revisar el estado en Mis pedidos.",
    swalIcon: "info",
    swalColor: "#d97706",
  },
};

// Estados que implican que el pago ya fue confirmado. `APPROVED` es el que
// setea el webhook; los siguientes se incluyen por si el admin ya avanzó el
// pedido antes de que el cliente vuelva a la pantalla de éxito.
const PAID_STATUSES: OrderStatus[] = [
  "APPROVED",
  "IN_PREPARATION",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "DELIVERED",
];

const MAX_ATTEMPTS = 8;
const RETRY_DELAY_MS = 2000;

async function showAlert(info: Copy) {
  const Swal = (await import("sweetalert2")).default;
  await Swal.fire({
    icon: info.swalIcon,
    title: info.swalTitle,
    text: info.swalText,
    allowEscapeKey: true,
    confirmButtonText: "Entendido",
    confirmButtonColor: info.swalColor,
  });
}

export function CheckoutResult({
  variant,
  verifyApproval = variant === "success",
}: {
  variant: Variant;
  verifyApproval?: boolean;
}) {
  const searchParams = useSearchParams();
  const { clear } = useCart();
  const started = useRef(false);
  const cancelled = useRef(false);
  const [verification, setVerification] = useState<Verification>(
    verifyApproval ? "checking" : "idle",
  );
  const [retryToken, setRetryToken] = useState(0);

  const status =
    searchParams.get("status") ??
    searchParams.get("collection_status") ??
    "";
  const paymentId =
    searchParams.get("payment_id") ??
    searchParams.get("collection_id") ??
    "";
  const orderId = searchParams.get("external_reference") ?? "";

  useEffect(() => {
    // Las pantallas de rechazo/pendiente nunca tocan el carrito.
    if (!verifyApproval) {
      if (started.current) return;
      started.current = true;
      if (variant === "failure") {
        toast.error(copy.failure.title);
      } else {
        toast.info(copy.pending.title);
      }
      void showAlert(copy[variant]);
      return;
    }

    if (started.current) return;
    started.current = true;
    cancelled.current = false;

    if (!orderId) {
      setVerification("error");
      toast.error("No pudimos verificar el pago", {
        description:
          "Falta el identificador del pedido. Tu carrito sigue guardado.",
      });
      return;
    }

    void (async () => {
      setVerification("checking");

      // El webhook de Mercado Pago puede demorar unos segundos: reintentamos
      // la consulta del estado antes de dar el pago por pendiente.
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        if (cancelled.current) return;

        try {
          const order = await apiFetch<Order>(`/api/orders/${orderId}`);

          if (PAID_STATUSES.includes(order.status)) {
            if (cancelled.current) return;
            // ÚNICO punto donde se vacía el carrito: compra confirmada.
            window.localStorage.removeItem(CART_STORAGE_KEY);
            await clear({ silent: true });
            setVerification("approved");
            toast.success(copy.success.title, {
              description: `Pedido #${order.id}`,
            });
            void showAlert(copy.success);
            return;
          }
        } catch (error) {
          const fatal =
            error instanceof ApiError &&
            [401, 403, 404].includes(error.status);
          if (fatal) {
            if (!cancelled.current) {
              setVerification("error");
              toast.error("No pudimos verificar el pago", {
                description: error.message,
              });
            }
            return;
          }
          // Error de red: se reintenta.
        }

        if (attempt < MAX_ATTEMPTS) {
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), RETRY_DELAY_MS);
          });
        }
      }

      if (!cancelled.current) {
        setVerification("pending");
        toast.info("Pago en proceso", {
          description:
            "Todavía no recibimos la confirmación. Tu carrito sigue guardado.",
        });
      }
    })();

    return () => {
      cancelled.current = true;
    };
  }, [variant, verifyApproval, orderId, clear, retryToken]);

  function handleRetry() {
    started.current = false;
    setVerification("checking");
    setRetryToken((value) => value + 1);
  }

  const info = useMemo<Copy>(() => {
    if (!verifyApproval) return copy[variant];
    if (verification === "approved") return copy.success;
    if (verification === "pending") {
      return {
        ...copy.pending,
        title: "Pago en proceso",
        description:
          "Todavía no recibimos la confirmación de Mercado Pago. Tu carrito sigue guardado por si necesitás reintentar.",
      };
    }
    if (verification === "error") {
      return {
        ...copy.failure,
        title: "No pudimos verificar el pago",
        description:
          "No confirmamos la orden, así que tu carrito sigue intacto. Podés revisarlo o intentar de nuevo.",
        icon: AlertTriangle,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
      };
    }
    return {
      ...copy.success,
      title: "Verificando el pago...",
      description:
        "Estamos confirmando la operación con Mercado Pago. No vaciamos tu carrito hasta que la orden esté aprobada.",
      icon: Loader2,
      color: "text-slate-600",
      bg: "bg-slate-100",
      border: "border-slate-200",
    };
  }, [variant, verifyApproval, verification]);

  const Icon = info.icon;
  const checking = verifyApproval && verification === "checking";
  const canRetryVerification =
    verifyApproval &&
    (verification === "pending" || verification === "error");

  return (
    <div
      className={`rounded-3xl border ${info.border} bg-white p-8 text-center shadow-sm sm:p-12`}
    >
      <span
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${info.bg} ${info.color}`}
      >
        <Icon className={`h-10 w-10 ${checking ? "animate-spin" : ""}`} />
      </span>
      <h1 className={`mt-5 text-2xl font-black sm:text-3xl ${info.color}`}>
        {info.title}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {info.description}
      </p>

      {(orderId || paymentId || status) && (
        <dl className="mx-auto mt-6 grid max-w-md gap-2 rounded-2xl bg-slate-50 p-4 text-left text-xs">
          {orderId && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Pedido</dt>
              <dd className="font-semibold text-slate-900">#{orderId}</dd>
            </div>
          )}
          {paymentId && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Pago</dt>
              <dd className="font-semibold text-slate-900">{paymentId}</dd>
            </div>
          )}
          {status && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Estado</dt>
              <dd className="font-semibold text-slate-900">{status}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {canRetryVerification && (
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <RotateCcw className="h-4 w-4" /> Reintentar verificación
          </button>
        )}
        {variant === "failure" ? (
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <RotateCcw className="h-4 w-4" /> Reintentar pago
          </Link>
        ) : canRetryVerification ? null : (
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <ShoppingBag className="h-4 w-4" /> Ver mis pedidos
          </Link>
        )}
        <Link
          href="/productos"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Volver a la tienda <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
