"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  RotateCcw,
  ShoppingBag,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { CART_STORAGE_KEY, useCart } from "@/context/cart-context";

type Variant = "success" | "failure" | "pending";

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

export function CheckoutResult({ variant }: { variant: Variant }) {
  const searchParams = useSearchParams();
  const { clear } = useCart();
  const fired = useRef(false);

  const status =
    searchParams.get("status") ??
    searchParams.get("collection_status") ??
    "";
  const paymentId =
    searchParams.get("payment_id") ??
    searchParams.get("collection_id") ??
    "";
  const orderId = searchParams.get("external_reference") ?? "";
  const info = copy[variant];
  const Icon = info.icon;

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    if (variant === "success") {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      clear({ silent: true });
      toast.success(info.title, {
        description: orderId ? `Pedido #${orderId}` : undefined,
      });
    } else if (variant === "failure") {
      toast.error(info.title);
    } else {
      toast.info(info.title);
    }

    void (async () => {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        icon: info.swalIcon,
        title: info.swalTitle,
        text: info.swalText,
        allowEscapeKey: true,
        confirmButtonText: "Entendido",
        confirmButtonColor: info.swalColor,
      });
    })();
  }, [variant, clear, info, orderId]);

  return (
    <div
      className={`rounded-3xl border ${info.border} bg-white p-8 text-center shadow-sm sm:p-12`}
    >
      <span
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${info.bg} ${info.color}`}
      >
        <Icon className="h-10 w-10" />
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
        {variant === "failure" ? (
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <RotateCcw className="h-4 w-4" /> Reintentar pago
          </Link>
        ) : (
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
