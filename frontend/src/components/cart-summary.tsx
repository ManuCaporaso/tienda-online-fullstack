"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/cart-context";
import { resolveImage } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { ReservationTimer } from "@/components/cart/reservation-timer";

export function CartSummary() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    total,
    itemCount,
    deliveryType,
    setDeliveryType,
    clear,
    expireReservation,
  } = useCart();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEscapeKey(closeCart, isOpen);

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      {/* Panel lateral fijo */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className="fixed inset-y-0 right-0 z-[1000] w-full max-w-md bg-white shadow-2xl flex flex-col h-full"
      >
        {/* HEADER fijo */}
        <div className="flex-none p-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Tu carrito</h2>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {itemCount}
            </span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Cerrar carrito"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-8 w-8 text-slate-400" />
            </span>
            <p className="text-sm font-semibold text-slate-900">
              Tu carrito está vacío
            </p>
            <p className="text-sm text-slate-500">
              Agregá productos desde el catálogo para empezar.
            </p>
            <Link
              href="/productos"
              onClick={closeCart}
              className="mt-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            {/* BODY scrolleable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.lineId}
                  className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.imageUrl ? (
                      <Image
                        src={resolveImage(item.imageUrl)}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-slate-400">
                        <ShoppingBag className="h-6 w-6" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    {item.variantLabel && (
                      <p className="truncate text-xs font-medium text-emerald-600">
                        {item.variantLabel}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {formatPrice(item.price)} c/u
                    </p>
                    <div className="mt-1">
                      <ReservationTimer
                        expiresAt={item.reservationExpiresAt}
                        onExpired={() => expireReservation(item.lineId)}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-full border border-slate-200">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.lineId, item.quantity - 1)
                          }
                          className="p-1.5 text-slate-500 transition hover:text-slate-900"
                          aria-label="Restar"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.lineId, item.quantity + 1)
                          }
                          className="p-1.5 text-slate-500 transition hover:text-slate-900"
                          aria-label="Sumar"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {formatPrice(Number(item.price) * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.lineId)}
                          className="rounded-full p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
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

            {/* FOOTER fijo */}
            <div className="flex-none p-4 border-t border-gray-200 bg-white space-y-3">
              <div className="grid w-full grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType("SHIPPING")}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                    deliveryType === "SHIPPING"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-slate-600 hover:border-gray-300"
                  }`}
                >
                  <Truck className="h-4 w-4" /> Envío a domicilio
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("PICKUP")}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                    deliveryType === "PICKUP"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-slate-600 hover:border-gray-300"
                  }`}
                >
                  <Store className="h-4 w-4" /> Retiro en sucursal
                </button>
              </div>

              <div className="flex w-full items-center justify-between">
                <span className="text-sm text-slate-500">Total</span>
                <span className="text-xl font-black text-slate-900">
                  {formatPrice(total)}
                </span>
              </div>

              <Link
                href="/cart"
                onClick={closeCart}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ver carrito completo
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Finalizar compra <ShoppingBag className="h-4 w-4" />
              </Link>
              <p className="text-center text-[11px] text-slate-400">
                Pago seguro con Mercado Pago
              </p>
            </div>
          </>
        )}
      </aside>
    </div>,
    document.body,
  );
}
