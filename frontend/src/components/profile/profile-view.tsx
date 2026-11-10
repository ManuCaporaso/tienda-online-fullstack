"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Check,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Plus,
  Save,
  Star,
  Store,
  Trash2,
  Truck,
  User as UserIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError, resolveImage } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Address, MyReview, Order, User } from "@/lib/types";

type Tab = "datos" | "direcciones" | "compras";

interface AddressForm {
  street: string;
  number: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

const emptyAddress: AddressForm = {
  street: "",
  number: "",
  apartment: "",
  city: "",
  state: "",
  zipCode: "",
  isDefault: false,
};

const statusStyles: Record<
  Order["status"],
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pendiente de pago",
    className: "bg-amber-100 text-amber-700",
  },
  APPROVED: {
    label: "Pago aprobado",
    className: "bg-emerald-100 text-emerald-700",
  },
  IN_PREPARATION: {
    label: "En preparación",
    className: "bg-sky-100 text-sky-700",
  },
  READY_FOR_PICKUP: {
    label: "Listo para retirar",
    className: "bg-indigo-100 text-indigo-700",
  },
  SHIPPED: {
    label: "Enviado",
    className: "bg-violet-100 text-violet-700",
  },
  DELIVERED: {
    label: "Entregado",
    className: "bg-slate-200 text-slate-700",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-red-100 text-red-700",
  },
};

const reviewableStatuses = new Set<Order["status"]>([
  "APPROVED",
  "IN_PREPARATION",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "DELIVERED",
]);

function statusMessage(order: Order): { text: string; className: string } | null {
  switch (order.status) {
    case "PENDING":
      return {
        text: "Estamos esperando la confirmación del pago. Te avisaremos cuando se acredite.",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "APPROVED":
      return {
        text: "¡Pago acreditado! Estamos preparando tu pedido.",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "IN_PREPARATION":
      return {
        text: "Estamos preparando tu pedido.",
        className: "border-sky-200 bg-sky-50 text-sky-700",
      };
    case "READY_FOR_PICKUP":
      return {
        text: "Tu pedido está listo para ser retirado por el local.",
        className: "border-indigo-200 bg-indigo-50 text-indigo-700",
      };
    case "SHIPPED":
      return {
        text: order.trackingNumber
          ? `Tu paquete fue enviado — Seguimiento: #${order.trackingNumber}`
          : "Tu paquete fue enviado.",
        className: "border-violet-200 bg-violet-50 text-violet-700",
      };
    case "DELIVERED":
      return {
        text: "Tu pedido fue entregado. ¡Gracias por tu compra!",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "CANCELLED":
      return {
        text: "Este pedido fue cancelado.",
        className: "border-red-200 bg-red-50 text-red-700",
      };
    default:
      return null;
  }
}

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300"
          }`}
        />
      ))}
    </span>
  );
}

export function ProfileView() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("datos");
  const [profile, setProfile] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [phone, setPhone] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [addressForm, setAddressForm] = useState<AddressForm | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const [reviewTarget, setReviewTarget] = useState<{
    productId: string;
    productName: string;
  } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Iniciá sesión", {
        description: "Necesitás una cuenta para ver tu perfil.",
      });
      router.replace("/account?redirect=/profile");
    }
  }, [user, loading, router]);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [me, addressList, orderList, reviewList] = await Promise.all([
        apiFetch<User>("/api/users/me"),
        apiFetch<Address[]>("/api/users/me/addresses"),
        apiFetch<Order[]>("/api/orders"),
        apiFetch<MyReview[]>("/api/users/me/reviews"),
      ]);
      setProfile(me);
      setPhone(me.phone ?? "");
      setDocumentNumber(me.documentNumber ?? "");
      setAddresses(addressList);
      setOrders(orderList);
      setMyReviews(reviewList);
    } catch (error) {
      toast.error("No pudimos cargar tu perfil", {
        description:
          error instanceof ApiError ? error.message : "Intentá de nuevo.",
      });
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user) void loadData();
  }, [user, loadData]);

  const reviewedProductIds = useMemo(
    () => new Set(myReviews.map((review) => review.productId)),
    [myReviews],
  );

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await apiFetch<User>("/api/users/me", {
        method: "PATCH",
        body: { phone, documentNumber },
      });
      setProfile(updated);
      await refresh();
      toast.success("Datos actualizados");
    } catch (error) {
      toast.error("No pudimos guardar tus datos", {
        description:
          error instanceof ApiError ? error.message : "Intentá de nuevo.",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  function startNewAddress() {
    setEditingAddressId(null);
    setAddressForm({ ...emptyAddress, isDefault: addresses.length === 0 });
  }

  function startEditAddress(address: Address) {
    setEditingAddressId(address.id);
    setAddressForm({
      street: address.street,
      number: address.number,
      apartment: address.apartment ?? "",
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      isDefault: address.isDefault,
    });
  }

  async function handleSaveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!addressForm) return;

    setSavingAddress(true);
    try {
      const body = {
        street: addressForm.street,
        number: addressForm.number,
        apartment: addressForm.apartment,
        city: addressForm.city,
        state: addressForm.state,
        zipCode: addressForm.zipCode,
        isDefault: addressForm.isDefault,
      };

      if (editingAddressId) {
        await apiFetch(`/api/users/me/addresses/${editingAddressId}`, {
          method: "PATCH",
          body,
        });
        toast.success("Dirección actualizada");
      } else {
        await apiFetch("/api/users/me/addresses", { method: "POST", body });
        toast.success("Dirección agregada");
      }

      setAddressForm(null);
      setEditingAddressId(null);
      const list = await apiFetch<Address[]>("/api/users/me/addresses");
      setAddresses(list);
    } catch (error) {
      toast.error("No pudimos guardar la dirección", {
        description:
          error instanceof ApiError ? error.message : "Intentá de nuevo.",
      });
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleSetDefault(address: Address) {
    try {
      await apiFetch(`/api/users/me/addresses/${address.id}`, {
        method: "PATCH",
        body: { isDefault: true },
      });
      const list = await apiFetch<Address[]>("/api/users/me/addresses");
      setAddresses(list);
      toast.success("Dirección predeterminada actualizada");
    } catch (error) {
      toast.error("No pudimos actualizar la dirección", {
        description:
          error instanceof ApiError ? error.message : "Intentá de nuevo.",
      });
    }
  }

  async function handleDeleteAddress(address: Address) {
    const Swal = (await import("sweetalert2")).default;
    const result = await Swal.fire({
      title: "¿Eliminar dirección?",
      html: `<p>Vas a eliminar <strong>${address.street} ${address.number}</strong>.</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      await apiFetch(`/api/users/me/addresses/${address.id}`, {
        method: "DELETE",
      });
      const list = await apiFetch<Address[]>("/api/users/me/addresses");
      setAddresses(list);
      toast.success("Dirección eliminada");
    } catch (error) {
      toast.error("No pudimos eliminar la dirección", {
        description:
          error instanceof ApiError ? error.message : "Intentá de nuevo.",
      });
    }
  }

  async function handleSubmitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewTarget) return;

    setSubmittingReview(true);
    try {
      await apiFetch(`/api/products/${reviewTarget.productId}/reviews`, {
        method: "POST",
        body: { rating, comment },
      });
      toast.success("¡Gracias por tu reseña!", {
        description: reviewTarget.productName,
      });
      setReviewTarget(null);
      setRating(5);
      setComment("");
      const list = await apiFetch<MyReview[]>("/api/users/me/reviews");
      setMyReviews(list);
    } catch (error) {
      toast.error("No pudimos publicar la reseña", {
        description:
          error instanceof ApiError ? error.message : "Intentá de nuevo.",
      });
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading || loadingData) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-6 h-72 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            Mi cuenta
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Mi perfil</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestioná tus datos, tus direcciones de envío y tus compras.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
          <BadgeCheck className="h-4 w-4" /> {user.email}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            { key: "datos", label: "Mis datos", icon: UserIcon },
            { key: "direcciones", label: "Mis direcciones", icon: MapPin },
            { key: "compras", label: "Mis compras", icon: Package },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === key
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "datos" && (
        <section className="mt-6 max-w-2xl rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-900">Datos personales</h2>
          <p className="mt-1 text-sm text-slate-500">
            Completá tus datos para agilizar tus compras.
          </p>

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </span>
              <input
                value={profile?.email ?? user.email}
                disabled
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Teléfono
                </span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="299 123 4567"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  DNI
                </span>
                <input
                  value={documentNumber}
                  onChange={(event) => setDocumentNumber(event.target.value)}
                  placeholder="30.111.222"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-70"
            >
              {savingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar cambios
            </button>
          </form>
        </section>
      )}

      {tab === "direcciones" && (
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Mis direcciones
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                La dirección predeterminada se usa para el envío a domicilio.
              </p>
            </div>
            <button
              type="button"
              onClick={startNewAddress}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" /> Agregar dirección
            </button>
          </div>

          {addressForm && (
            <form
              onSubmit={handleSaveAddress}
              className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingAddressId ? "Editar dirección" : "Nueva dirección"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setAddressForm(null);
                    setEditingAddressId(null);
                  }}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900"
                  aria-label="Cancelar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Calle
                  </span>
                  <input
                    required
                    value={addressForm.street}
                    onChange={(event) =>
                      setAddressForm({
                        ...addressForm,
                        street: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    Número
                  </span>
                  <input
                    required
                    value={addressForm.number}
                    onChange={(event) =>
                      setAddressForm({
                        ...addressForm,
                        number: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    Piso / Depto (opcional)
                  </span>
                  <input
                    value={addressForm.apartment}
                    onChange={(event) =>
                      setAddressForm({
                        ...addressForm,
                        apartment: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    Ciudad
                  </span>
                  <input
                    required
                    value={addressForm.city}
                    onChange={(event) =>
                      setAddressForm({
                        ...addressForm,
                        city: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    Provincia
                  </span>
                  <input
                    required
                    value={addressForm.state}
                    onChange={(event) =>
                      setAddressForm({
                        ...addressForm,
                        state: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    Código postal
                  </span>
                  <input
                    required
                    value={addressForm.zipCode}
                    onChange={(event) =>
                      setAddressForm({
                        ...addressForm,
                        zipCode: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(event) =>
                      setAddressForm({
                        ...addressForm,
                        isDefault: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-emerald-600"
                  />
                  Usar como predeterminada
                </label>
              </div>

              <button
                type="submit"
                disabled={savingAddress}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-70"
              >
                {savingAddress ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Guardar dirección
              </button>
            </form>
          )}

          {addresses.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <MapPin className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                Todavía no tenés direcciones
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Agregá una para recibir tus pedidos a domicilio.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {addresses.map((address) => (
                <article
                  key={address.id}
                  className={`rounded-2xl border bg-white p-5 ${
                    address.isDefault
                      ? "border-emerald-500 ring-1 ring-emerald-200"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {address.street} {address.number}
                        {address.apartment ? `, ${address.apartment}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {address.city}, {address.state} · CP {address.zipCode}
                      </p>
                    </div>
                    {address.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">
                        <Check className="h-3 w-3" /> Predeterminada
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Hacer predeterminada
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditAddress(address)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(address)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "compras" && (
        <section className="mt-6">
          <h2 className="text-lg font-black text-slate-900">Mis compras</h2>
          <p className="mt-1 text-sm text-slate-500">
            Historial de pedidos y reseñas de productos comprados.
          </p>

          {reviewTarget && (
            <form
              onSubmit={handleSubmitReview}
              className="mt-5 rounded-3xl border border-amber-200 bg-amber-50/60 p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Reseñar: {reviewTarget.productName}
                </h3>
                <button
                  type="button"
                  onClick={() => setReviewTarget(null)}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900"
                  aria-label="Cancelar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={`${star} estrellas`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                required
                minLength={3}
                rows={3}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Contá tu experiencia con el producto..."
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-70"
              >
                {submittingReview ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
                Publicar reseña
              </button>
            </form>
          )}

          {orders.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Package className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                Todavía no hiciste compras
              </p>
              <Link
                href="/productos"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Ver productos
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {orders.map((order) => {
                const status = statusStyles[order.status];
                const message = statusMessage(order);
                return (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Pedido #{order.id}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString(
                            "es-AR",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {order.deliveryType === "PICKUP" ? (
                            <Store className="h-3.5 w-3.5" />
                          ) : (
                            <Truck className="h-3.5 w-3.5" />
                          )}
                          {order.deliveryType === "PICKUP"
                            ? "Retiro"
                            : "Envío"}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {message && (
                      <p
                        className={`mt-3 rounded-xl border px-3 py-2 text-xs font-semibold ${message.className}`}
                      >
                        {message.text}
                      </p>
                    )}

                    <div className="mt-3 space-y-3">
                      {order.items.map((item) => {
                        const canReview =
                          reviewableStatuses.has(order.status) &&
                          !reviewedProductIds.has(item.productId);

                        return (
                          <div
                            key={item.id}
                            className="flex flex-wrap items-center gap-3"
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
                              <Link
                                href={`/productos/${item.productId}`}
                                className="truncate text-sm font-semibold text-slate-900 transition hover:text-emerald-600"
                              >
                                {item.product?.name ?? "Producto"}
                              </Link>
                              {item.variantLabel && (
                                <p className="truncate text-xs font-medium text-emerald-600">
                                  {item.variantLabel}
                                </p>
                              )}
                              <p className="text-xs text-slate-500">
                                {item.quantity} × {formatPrice(item.price)}
                              </p>
                            </div>
                            {canReview ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setReviewTarget({
                                    productId: item.productId,
                                    productName:
                                      item.product?.name ?? "Producto",
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                              >
                                <Star className="h-3.5 w-3.5" /> Dejar reseña
                              </button>
                            ) : reviewedProductIds.has(item.productId) ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                <Check className="h-3.5 w-3.5" /> Reseñado
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 text-sm">
                      <span className="text-slate-500">Total:&nbsp;</span>
                      <span className="font-black text-slate-900">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
