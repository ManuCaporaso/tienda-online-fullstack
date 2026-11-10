"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { apiFetch, ApiError, resolveImage } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { getSessionId } from "@/lib/session";
import type { Address, Order } from "@/lib/types";

interface PreferenceResponse {
  preferenceId?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
}

export default function CheckoutPage() {
  const { items, total, deliveryType, setDeliveryType } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;

    apiFetch<Address[]>("/api/users/me/addresses")
      .then((list) => {
        if (!active) return;
        setAddresses(list);
        setSelectedAddressId(
          list.find((address) => address.isDefault)?.id ?? list[0]?.id ?? "",
        );
      })
      .catch(() => {
        // Sin direcciones: el checkout sigue funcionando.
      });

    return () => {
      active = false;
    };
  }, [user]);

  const selectedAddress =
    addresses.find((address) => address.id === selectedAddressId) ?? null;

  async function handleCheckout() {
    if (items.length === 0) {
      toast.error("Tu carrito está vacío", {
        description: "Agregá productos antes de pagar.",
      });
      return;
    }

    if (!user) {
      router.push("/account?redirect=/checkout");
      return;
    }

    const Swal = (await import("sweetalert2")).default;
    const confirmation = await Swal.fire({
      title: "¿Confirmar compra?",
      html: `<p class="text-sm">Total: <strong>${formatPrice(total)}</strong></p><p class="mt-1 text-sm">${
        deliveryType === "PICKUP" ? "Retiro en sucursal" : "Envío a domicilio"
      }</p>`,
      icon: "question",
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: "Ir a pagar",
      cancelButtonText: "Revisar carrito",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });
    if (!confirmation.isConfirmed) return;

    setProcessing(true);

    try {
      const order = await apiFetch<Order>("/api/orders", {
        method: "POST",
        body: {
          deliveryType,
          shippingAddress:
            deliveryType === "SHIPPING" && selectedAddress
              ? {
                  street: selectedAddress.street,
                  number: selectedAddress.number,
                  apartment: selectedAddress.apartment ?? "",
                  city: selectedAddress.city,
                  state: selectedAddress.state,
                  zipCode: selectedAddress.zipCode,
                }
              : undefined,
          sessionId: getSessionId(),
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            variantId: item.variantId,
            variantLabel: item.variantLabel,
          })),
        },
      });

      const preference = await apiFetch<PreferenceResponse>(
        "/api/payments/preference",
        { method: "POST", body: { orderId: order.id } },
      );

      const checkoutUrl = preference.initPoint ?? preference.sandboxInitPoint;
      if (!checkoutUrl) {
        throw new Error("Mercado Pago no devolvió una URL de pago.");
      }

      toast.success("Redirigiendo a Mercado Pago...", {
        description: `Pedido #${order.id}`,
      });
      window.location.assign(checkoutUrl);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "No pudimos iniciar el pago.";
      toast.error("No se pudo procesar la compra", { description: message });
      setProcessing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <ShoppingBag className="h-10 w-10 text-slate-400" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-slate-900">
          No hay productos para pagar
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Agregá productos al carrito para continuar con el checkout.
        </p>
        <Link
          href="/productos"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          Ver productos <ShoppingBag className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al carrito
      </Link>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
          Checkout
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Finalizá tu compra
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Revisá los datos y pagá de forma segura con Mercado Pago.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-900">Productos</h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.lineId} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.imageUrl ? (
                      <Image
                        src={resolveImage(item.imageUrl)}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-slate-400">
                        <ShoppingBag className="h-5 w-5" />
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
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-900">Entrega</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeliveryType("SHIPPING")}
                className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition ${
                  deliveryType === "SHIPPING"
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Truck className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Envío a domicilio
                </span>
                <span className="text-xs text-slate-500">
                  Coordinamos la entrega por email
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType("PICKUP")}
                className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition ${
                  deliveryType === "PICKUP"
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Store className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Retiro en sucursal
                </span>
                <span className="text-xs text-slate-500">
                  Cipolletti · Lun a Vie 8-18 h
                </span>
              </button>
            </div>
            {deliveryType === "SHIPPING" && (
              <div className="mt-4 rounded-xl border border-slate-200 p-3">
                {addresses.length > 0 ? (
                  <>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dirección de envío
                    </label>
                    <select
                      value={selectedAddressId}
                      onChange={(event) =>
                        setSelectedAddressId(event.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"
                    >
                      {addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.street} {address.number}
                          {address.apartment ? `, ${address.apartment}` : ""} —{" "}
                          {address.city}
                        </option>
                      ))}
                    </select>
                    {selectedAddress && (
                      <p className="mt-2 text-xs text-slate-500">
                        {selectedAddress.street} {selectedAddress.number}
                        {selectedAddress.apartment
                          ? `, ${selectedAddress.apartment}`
                          : ""}{" "}
                        · {selectedAddress.city}, {selectedAddress.state} · CP{" "}
                        {selectedAddress.zipCode}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-500">
                    No tenés direcciones cargadas.{" "}
                    <Link
                      href="/profile"
                      className="font-semibold text-emerald-600 hover:underline"
                    >
                      Agregá una en tu perfil
                    </Link>{" "}
                    para el envío a domicilio.
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {deliveryType === "PICKUP"
                ? "Retiro en Calle Las Petunias 5617, Cipolletti. Te avisaremos cuando el pedido esté listo."
                : selectedAddress
                  ? `${selectedAddress.street} ${selectedAddress.number}, ${selectedAddress.city}, ${selectedAddress.state}.`
                  : "El envío se coordina por email una vez acreditado el pago."}
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">Resumen del pedido</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Productos</span>
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

          {user && (
            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              Sesión:{" "}
              <span className="font-semibold text-slate-700">{user.email}</span>
            </p>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={processing || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {processing ? "Procesando..." : "Pagar con Mercado Pago"}
          </button>
          <p className="flex items-center justify-center gap-1 text-center text-[11px] text-slate-400">
            <Lock className="h-3 w-3" /> Pago protegido por Mercado Pago
          </p>
        </aside>
      </div>
    </div>
  );
}
