"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/cart-context";
import { resolveImage } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { ReservationTimer } from "@/components/cart/reservation-timer";

export default function CartPage() {
  const {
    items,
    itemCount,
    total,
    updateQuantity,
    removeItem,
    clear,
    deliveryType,
    setDeliveryType,
    expireReservation,
  } = useCart();

  async function handleClear() {
    if (items.length === 0) return;
    const Swal = (await import("sweetalert2")).default;
    const result = await Swal.fire({
      title: "¿Vaciar el carrito?",
      text: "Se eliminarán todos los productos seleccionados.",
      icon: "warning",
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: "Sí, vaciar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      clear({ silent: true });
      toast.success("Carrito vaciado");
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <ShoppingBag className="h-10 w-10 text-slate-400" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-slate-900">
          Tu carrito está vacío
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Agregá productos desde el catálogo para empezar tu compra.
        </p>
        <Link
          href="/productos"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          Ver productos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            Carrito
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Tu compra</h1>
          <p className="mt-1 text-sm text-slate-500">
            {itemCount} {itemCount === 1 ? "producto" : "productos"}
          </p>
        </div>
        <Link
          href="/productos"
          className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          Seguir comprando
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.lineId}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {item.imageUrl ? (
                  <Image
                    src={resolveImage(item.imageUrl)}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-400">
                    <ShoppingBag className="h-8 w-8" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">{item.name}</p>
                {item.variantLabel && (
                  <p className="text-xs font-medium text-emerald-600">
                    {item.variantLabel}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {item.category?.name ?? "Producto"}
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-600">
                  {formatPrice(item.price)}
                </p>
                <div className="mt-1">
                  <ReservationTimer
                    expiresAt={item.reservationExpiresAt}
                    onExpired={() => expireReservation(item.lineId)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="flex items-center rounded-full border border-slate-200">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                    className="p-2 text-slate-500 transition hover:text-slate-900"
                    aria-label="Restar"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                    className="p-2 text-slate-500 transition hover:text-slate-900"
                    aria-label="Sumar"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="w-24 text-right text-sm font-black text-slate-900">
                  {formatPrice(Number(item.price) * item.quantity)}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.lineId)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-semibold text-red-600 transition hover:text-red-700"
          >
            Vaciar carrito
          </button>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">Resumen</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Envío</span>
              <span>
                {deliveryType === "PICKUP" ? "Retiro gratis" : "A coordinar"}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryType("HOME_DELIVERY")}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                deliveryType === "HOME_DELIVERY"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <Truck className="h-4 w-4" /> Envío
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType("PICKUP")}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                deliveryType === "PICKUP"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <Store className="h-4 w-4" /> Retiro
            </button>
          </div>

          <Link
            href="/checkout"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Ir al checkout <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-center text-[11px] text-slate-400">
            Pago seguro con Mercado Pago
          </p>
        </aside>
      </div>
    </div>
  );
}
