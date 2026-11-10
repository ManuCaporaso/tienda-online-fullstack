"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError, resolveImage } from "@/lib/api";
import type { Banner } from "@/lib/types";
import { AdminNav } from "./admin-nav";
import { BannerFormModal } from "./banner-form-modal";
import { useAdminGuard } from "./use-admin-guard";

export function AdminBanners() {
  const { loading: authLoading, allowed } = useAdminGuard();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Banner[]>("/api/banners/admin");
      setBanners(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No pudimos cargar los banners.";
      setError(message);
      toast.error("Error al cargar banners", { description: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(banner: Banner) {
    setEditing(banner);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function handleSaved() {
    await load();
    closeModal();
  }

  async function handleToggle(banner: Banner) {
    try {
      const updated = await apiFetch<Banner>(`/api/banners/${banner.id}`, {
        method: "PATCH",
        body: { isActive: !banner.isActive },
      });
      setBanners((prev) =>
        prev.map((item) => (item.id === banner.id ? updated : item)),
      );
      toast.success(updated.isActive ? "Banner visible" : "Banner oculto", {
        description: banner.title || "Banner",
      });
    } catch (err) {
      toast.error("No pudimos actualizar el banner", {
        description:
          err instanceof ApiError ? err.message : "Intentá de nuevo.",
      });
    }
  }

  async function handleDelete(banner: Banner) {
    const Swal = (await import("sweetalert2")).default;
    const result = await Swal.fire({
      title: "¿Eliminar banner?",
      html: `<p>Vas a eliminar <strong>${banner.title || "este banner"}</strong>.</p>`,
      icon: "warning",
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      await apiFetch(`/api/banners/${banner.id}`, { method: "DELETE" });
      setBanners((prev) => prev.filter((item) => item.id !== banner.id));
      toast.success("Banner eliminado");
    } catch (err) {
      toast.error("No pudimos eliminar el banner", {
        description:
          err instanceof ApiError ? err.message : "Intentá de nuevo.",
      });
    }
  }

  if (authLoading || !allowed) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
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
            Banners de la Home
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Subí imágenes, ordená las diapositivas y activá u ocultá cada
            banner.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Nuevo banner
        </button>
      </div>

      <div className="mt-6">
        <AdminNav />
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-red-300" />
          <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Reintentar
          </button>
        </div>
      ) : banners.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            No hay banners
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Creá el primero para mostrarlo en la Home.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <article
              key={banner.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="relative aspect-[16/9] bg-slate-100">
                {banner.imageUrl ? (
                  <Image
                    src={resolveImage(banner.imageUrl)}
                    alt={banner.title ?? "Banner"}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImageIcon className="h-8 w-8" />
                  </span>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                    banner.isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-700 text-white"
                  }`}
                >
                  {banner.isActive ? "Visible" : "Oculto"}
                </span>
              </div>

              <div className="p-4">
                <p className="truncate text-sm font-bold text-slate-900">
                  {banner.title || "Sin título"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {banner.linkUrl || "Sin enlace"}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    Orden {banner.order}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggle(banner)}
                      className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                      aria-label={banner.isActive ? "Ocultar" : "Mostrar"}
                    >
                      {banner.isActive ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(banner)}
                      className="rounded-xl p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(banner)}
                      className="rounded-xl p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <BannerFormModal
        open={modalOpen}
        banner={editing}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </div>
  );
}
