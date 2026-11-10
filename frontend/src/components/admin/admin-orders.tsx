"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Check,
  Loader2,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Truck,
  User as UserIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError, resolveImage } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type {
  DeliveryType,
  Order,
  OrderStatus,
  ShippingAddress,
} from "@/lib/types";
import { AdminNav } from "./admin-nav";
import { useAdminGuard } from "./use-admin-guard";

const statusMeta: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Pago aprobado", className: "bg-emerald-100 text-emerald-700" },
  IN_PREPARATION: { label: "En preparación", className: "bg-sky-100 text-sky-700" },
  READY_FOR_PICKUP: {
    label: "Listo para retirar",
    className: "bg-indigo-100 text-indigo-700",
  },
  SHIPPED: { label: "Enviado", className: "bg-violet-100 text-violet-700" },
  DELIVERED: { label: "Entregado", className: "bg-slate-200 text-slate-700" },
  CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-700" },
};

const statusOptions: OrderStatus[] = [
  "PENDING",
  "APPROVED",
  "IN_PREPARATION",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function paymentBadge(status: OrderStatus) {
  if (status === "PENDING") {
    return { label: "Pendiente", className: "bg-amber-100 text-amber-700" };
  }
  if (status === "CANCELLED") {
    return { label: "Cancelado", className: "bg-red-100 text-red-700" };
  }
  return { label: "Pagado", className: "bg-emerald-100 text-emerald-700" };
}

function dispatchLabel(status: OrderStatus) {
  switch (status) {
    case "IN_PREPARATION":
      return "En preparación";
    case "READY_FOR_PICKUP":
      return "Listo para retirar";
    case "SHIPPED":
      return "Enviado";
    case "DELIVERED":
      return "Entregado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return "Sin despachar";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fullAddress(address: ShippingAddress) {
  const parts = [
    `${address.street} ${address.number}`,
    address.apartment ? address.apartment : null,
    address.city,
    address.state,
    `CP ${address.zipCode}`,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function AdminOrders() {
  const { allowed, loading: authLoading } = useAdminGuard();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryType | "">("");

  const [selected, setSelected] = useState<Order | null>(null);
  const [draftStatus, setDraftStatus] = useState<OrderStatus>("PENDING");
  const [draftTracking, setDraftTracking] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (deliveryFilter) params.set("deliveryType", deliveryFilter);
      const query = params.toString();
      const list = await apiFetch<Order[]>(
        `/api/orders/admin${query ? `?${query}` : ""}`,
      );
      setOrders(list);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No pudimos cargar las ventas.";
      setError(message);
      toast.error("Error al cargar ventas", { description: message });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, deliveryFilter]);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  function openDetail(order: Order) {
    setSelected(order);
    setDraftStatus(order.status);
    setDraftTracking(order.trackingNumber ?? "");
  }

  function closeDetail() {
    setSelected(null);
    setSaving(false);
  }

  async function handleSaveStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    setSaving(true);
    try {
      const updated = await apiFetch<Order>(
        `/api/orders/admin/${selected.id}/status`,
        {
          method: "PATCH",
          body: {
            status: draftStatus,
            trackingNumber: draftTracking.trim(),
          },
        },
      );
      setOrders((prev) =>
        prev.map((order) => (order.id === updated.id ? updated : order)),
      );
      setSelected(updated);
      setDraftStatus(updated.status);
      setDraftTracking(updated.trackingNumber ?? "");
      toast.success("Estado del pedido actualizado", {
        description: `Pedido #${updated.id} → ${statusMeta[updated.status].label}`,
      });
    } catch (err) {
      toast.error("No pudimos actualizar el pedido", {
        description:
          err instanceof ApiError ? err.message : "Intentá de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !allowed) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-6 h-96 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            Administración
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Gestión de ventas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Seguí el estado de cada pedido, el pago y el despacho.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
            <ShoppingBag className="h-4 w-4" /> {orders.length} pedidos
          </span>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Actualizar
          </button>
        </div>
      </div>

      <div className="mt-6">
        <AdminNav />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
            <Search className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as OrderStatus | "")
              }
              className="w-full bg-transparent py-2.5 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="">Todos los estados</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusMeta[status].label}
                </option>
              ))}
            </select>
          </div>
          <select
            value={deliveryFilter}
            onChange={(event) =>
              setDeliveryFilter(event.target.value as DeliveryType | "")
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="">Todas las entregas</option>
            <option value="SHIPPING">Envío a domicilio</option>
            <option value="PICKUP">Retiro en local</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-300" />
            <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Reintentar
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              No hay ventas para mostrar
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Probá cambiando los filtros o esperá nuevas compras.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">N° orden</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Entrega</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3">Despacho</th>
                  <th className="px-4 py-3 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const payment = paymentBadge(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        #{order.id}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {order.user?.name ?? "Sin nombre"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.user?.email ?? "—"}
                        </p>
                        {order.user?.phone && (
                          <p className="text-xs text-slate-400">
                            {order.user.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.deliveryType === "PICKUP" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                            <Store className="h-3.5 w-3.5" /> Retiro en local
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                            <Truck className="h-3.5 w-3.5" /> Envío a domicilio
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${payment.className}`}
                        >
                          {payment.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusMeta[order.status].className}`}
                        >
                          {dispatchLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(order)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <OrderDetailDrawer
          order={selected}
          draftStatus={draftStatus}
          draftTracking={draftTracking}
          saving={saving}
          onStatusChange={setDraftStatus}
          onTrackingChange={setDraftTracking}
          onClose={closeDetail}
          onSubmit={handleSaveStatus}
        />
      )}
    </div>
  );
}

function OrderDetailDrawer({
  order,
  draftStatus,
  draftTracking,
  saving,
  onStatusChange,
  onTrackingChange,
  onClose,
  onSubmit,
}: {
  order: Order;
  draftStatus: OrderStatus;
  draftTracking: string;
  saving: boolean;
  onStatusChange: (status: OrderStatus) => void;
  onTrackingChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const isShipping = order.deliveryType === "SHIPPING";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Cerrar detalle"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <aside className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              Detalle de venta
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              Pedido #{order.id}
            </h2>
            <p className="text-xs text-slate-500">
              {new Date(order.createdAt).toLocaleString("es-AR")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <UserIcon className="h-4 w-4" /> Cliente
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {order.user?.name ?? "Sin nombre"}
              </p>
              <p className="text-xs text-slate-500">{order.user?.email ?? "—"}</p>
              {order.user?.phone && (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Phone className="h-3 w-3" /> {order.user.phone}
                </p>
              )}
              {order.user?.documentNumber && (
                <p className="text-xs text-slate-500">
                  DNI {order.user.documentNumber}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                {isShipping ? (
                  <Truck className="h-4 w-4" />
                ) : (
                  <Store className="h-4 w-4" />
                )}
                Entrega
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {isShipping ? "Envío a domicilio" : "Retiro en local"}
              </p>
              {isShipping ? (
                order.shippingAddress ? (
                  <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                    {fullAddress(order.shippingAddress)}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">
                    Sin dirección registrada.
                  </p>
                )
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Avisá al cliente al teléfono{" "}
                  <span className="font-semibold">
                    {order.user?.phone ?? "(sin teléfono)"}
                  </span>{" "}
                  cuando el pedido esté disponible en el local.
                </p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-900">Productos</h3>
            <div className="mt-3 space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.product?.imageUrl ? (
                      <Image
                        src={resolveImage(item.product.imageUrl)}
                        alt={item.product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-slate-400">
                        <Package className="h-5 w-5" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.product?.name ?? "Producto"}
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
            <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">Total:</span>
              <span className="font-black text-slate-900">
                {formatPrice(order.total)}
              </span>
            </div>
          </section>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4"
          >
            <h3 className="text-sm font-bold text-slate-900">
              Actualizar seguimiento
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Cambiá el estado del pedido y guardá los cambios. El cliente verá
              la actualización en “Mis compras”.
            </p>

            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estado del pedido
              </span>
              <select
                value={draftStatus}
                onChange={(event) =>
                  onStatusChange(event.target.value as OrderStatus)
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusMeta[status].label}
                  </option>
                ))}
              </select>
            </label>

            {isShipping && (
              <label className="mt-3 block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Código de seguimiento
                </span>
                <input
                  value={draftTracking}
                  onChange={(event) => onTrackingChange(event.target.value)}
                  placeholder="Ej. 123456789"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
                <span className="mt-1 block text-[11px] text-slate-400">
                  Ingresalo al marcar el pedido como “Enviado”.
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-70"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Guardar cambios
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
