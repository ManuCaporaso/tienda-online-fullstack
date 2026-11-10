"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import type { Category } from "@/lib/types";
import { AdminNav } from "./admin-nav";
import { CategoryFormModal } from "./category-form-modal";
import { useAdminGuard } from "./use-admin-guard";

export function AdminCategories() {
  const { loading: authLoading, allowed } = useAdminGuard();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Category[]>("/api/categories");
      setCategories(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No pudimos cargar las categorías.";
      setError(message);
      toast.error("Error al cargar categorías", { description: message });
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

  function openEdit(category: Category) {
    setEditing(category);
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

  async function handleDelete(category: Category) {
    if (category.name.toLowerCase() === "todas") {
      toast.error("No se puede eliminar", {
        description: "Es una categoría del sistema.",
      });
      return;
    }
    if ((category._count?.products ?? 0) > 0) {
      toast.error("No se puede eliminar", {
        description: "La categoría tiene productos asociados.",
      });
      return;
    }

    const Swal = (await import("sweetalert2")).default;
    const result = await Swal.fire({
      title: "¿Eliminar categoría?",
      html: `<p>Vas a eliminar <strong>${category.name}</strong>.</p>`,
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
      await apiFetch(`/api/categories/${category.id}`, { method: "DELETE" });
      setCategories((prev) =>
        prev.filter((item) => item.id !== category.id),
      );
      toast.success("Categoría eliminada", { description: category.name });
    } catch (err) {
      toast.error("No pudimos eliminar la categoría", {
        description:
          err instanceof ApiError ? err.message : "Intentá de nuevo.",
      });
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
            Categorías
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestioná las categorías del catálogo.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Nueva categoría
        </button>
      </div>

      <div className="mt-6">
        <AdminNav />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <Tags className="mx-auto h-10 w-10 text-red-300" />
            <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Reintentar
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center">
            <Tags className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              No hay categorías
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Productos</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => {
                  const productCount = category._count?.products ?? 0;
                  const isSystem = category.name.toLowerCase() === "todas";

                  return (
                    <tr key={category.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <Tags className="h-5 w-5" />
                          </span>
                          <span className="font-semibold text-slate-900">
                            {category.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {category.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          <Package className="h-3.5 w-3.5" /> {productCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(category)}
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            disabled={isSystem || productCount > 0}
                            title={
                              isSystem
                                ? "Categoría del sistema"
                                : productCount > 0
                                  ? "Tiene productos asociados"
                                  : "Eliminar"
                            }
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CategoryFormModal
        open={modalOpen}
        category={editing}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </div>
  );
}
