"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Tags, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { useEscapeKey } from "@/hooks/use-escape-key";
import type { Category } from "@/lib/types";

interface CategoryFormModalProps {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

export function CategoryFormModal({
  open,
  category,
  onClose,
  onSaved,
}: CategoryFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(category);

  useEscapeKey(onClose, open);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setDescription(category?.description ?? "");
    setSubmitting(false);
  }, [open, category]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSubmitting(true);

    try {
      if (category) {
        await apiFetch<Category>(`/api/categories/${category.id}`, {
          method: "PATCH",
          body: { name: name.trim(), description: description.trim() },
        });
        toast.success("Categoría actualizada", { description: name.trim() });
      } else {
        await apiFetch<Category>("/api/categories", {
          method: "POST",
          body: { name: name.trim(), description: description.trim() },
        });
        toast.success("Categoría creada", { description: name.trim() });
      }
      await onSaved();
    } catch (error) {
      toast.error("No pudimos guardar la categoría", {
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
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-200 p-5">
          <div className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900">
              {isEditing ? "Editar categoría" : "Nueva categoría"}
            </h2>
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
              Nombre *
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Ej: Accesorios"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Descripción
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Descripción breve de la categoría"
            />
          </label>

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
                  : "Crear categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
