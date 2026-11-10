"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError, resolveImage } from "@/lib/api";
import { useEscapeKey } from "@/hooks/use-escape-key";
import type { Banner } from "@/lib/types";

interface BannerFormModalProps {
  open: boolean;
  banner: Banner | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

export function BannerFormModal({
  open,
  banner,
  onClose,
  onSaved,
}: BannerFormModalProps) {
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [order, setOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(banner);

  useEscapeKey(onClose, open);

  useEffect(() => {
    if (!open) return;
    setTitle(banner?.title ?? "");
    setLinkUrl(banner?.linkUrl ?? "");
    setOrder(String(banner?.order ?? 0));
    setIsActive(banner?.isActive ?? true);
    setImageFile(null);
    setSubmitting(false);
  }, [open, banner]);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(banner?.imageUrl ? resolveImage(banner.imageUrl) : null);
  }, [imageFile, banner]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isEditing && !imageFile) {
      toast.error("La imagen es obligatoria para crear un banner");
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append("title", title.trim());
      data.append("linkUrl", linkUrl.trim());
      data.append("order", order || "0");
      data.append("isActive", String(isActive));
      if (imageFile) {
        data.append("image", imageFile);
      }

      if (banner) {
        await apiFetch<Banner>(`/api/banners/${banner.id}`, {
          method: "PATCH",
          body: data,
        });
        toast.success("Banner actualizado", {
          description: title.trim() || "Banner",
        });
      } else {
        await apiFetch<Banner>("/api/banners", {
          method: "POST",
          body: data,
        });
        toast.success("Banner creado", {
          description: title.trim() || "Banner",
        });
      }

      await onSaved();
    } catch (error) {
      toast.error("No pudimos guardar el banner", {
        description:
          error instanceof ApiError ? error.message : "Revisá los datos.",
      });
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {isEditing ? "Editar banner" : "Nuevo banner"}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing
                ? "Actualizá la imagen, el enlace o la visibilidad."
                : "Subí una imagen y configurá el banner de la Home."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Título
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Ej: Nueva temporada 2026"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Enlace (opcional)
            </span>
            <input
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="/productos?categoria=2"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Orden
              </span>
              <input
                type="number"
                min={0}
                value={order}
                onChange={(event) => setOrder(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-5 w-5 accent-emerald-600"
              />
              <span className="text-sm font-semibold text-slate-700">
                Visible en la Home
              </span>
            </label>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Imagen {isEditing ? "(opcional)" : "*"}
            </span>
            <div className="mt-1 flex items-center gap-4">
              <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Vista previa del banner"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImagePlus className="h-6 w-6" />
                  </span>
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <ImagePlus className="h-4 w-4" />
                {imageFile ? "Cambiar imagen" : "Subir imagen"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setImageFile(event.target.files?.[0] ?? null)
                  }
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Crear banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
