"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
  Tags,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError, resolveImage } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { ProductFormModal } from "./product-form-modal";
import { AdminNav } from "./admin-nav";

const PAGE_SIZE = 8;

export function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      toast.error("Acceso restringido", {
        description: "Necesitás una cuenta de administrador.",
      });
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Product[]>("/api/products");
      setProducts(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No pudimos cargar los productos.";
      setError(message);
      toast.error("Error al cargar productos", { description: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      void loadProducts();
    }
  }, [user, loadProducts]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    apiFetch<Category[]>("/api/categories")
      .then(setCategories)
      .catch(() =>
        toast.error("No pudimos cargar las categorías"),
      );
  }, [user]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        (product.category?.name ?? "").toLowerCase().includes(term);
      const matchesCategory =
        !categoryFilter || String(product.categoryId) === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const highlightedCount = products.filter(
    (product) => product.highlighted,
  ).length;
  const lowStockCount = products.filter((product) => product.stock < 5).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryChange(value: string) {
    setCategoryFilter(value);
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  async function openEdit(product: Product) {
    try {
      const full = await apiFetch<Product>(`/api/products/${product.id}`);
      setEditing(full);
      setModalOpen(true);
    } catch (error) {
      toast.error("No pudimos cargar el producto", {
        description:
          error instanceof ApiError ? error.message : "Intentá de nuevo.",
      });
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function handleSaved() {
    await loadProducts();
    closeModal();
  }

  async function handleToggleHighlight(product: Product) {
    if (!product.highlighted && highlightedCount >= 3) {
      toast.error("Límite de destacados", {
        description:
          "Solo podés destacar hasta 3 productos. Quitá uno primero.",
      });
      return;
    }

    try {
      const updated = await apiFetch<Product>(
        `/api/products/${product.id}`,
        {
          method: "PUT",
          body: { highlighted: !product.highlighted },
        },
      );
      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? updated : item)),
      );
      toast.success(
        updated.highlighted
          ? "Producto destacado"
          : "Producto quitado de destacados",
        { description: product.name },
      );
    } catch (err) {
      toast.error("No pudimos actualizar el destacado", {
        description:
          err instanceof ApiError ? err.message : "Intentá de nuevo.",
      });
    }
  }

  async function handleDelete(product: Product) {
    const Swal = (await import("sweetalert2")).default;
    const result = await Swal.fire({
      title: "¿Eliminar producto?",
      html: `<p>Vas a eliminar <strong>${product.name}</strong>.</p><p class="mt-1 text-xs text-slate-500">Esta acción no se puede deshacer.</p>`,
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
      await apiFetch(`/api/products/${product.id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      toast.success("Producto eliminado", { description: product.name });
    } catch (err) {
      toast.error("No pudimos eliminar el producto", {
        description:
          err instanceof ApiError ? err.message : "Intentá de nuevo.",
      });
    }
  }

  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
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
            Panel de productos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestioná el catálogo, el stock y los destacados de la tienda.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Nuevo producto
        </button>
      </div>

      <div className="mt-6">
        <AdminNav />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Productos" value={products.length} />
        <StatCard
          icon={Star}
          label="Destacados"
          value={`${highlightedCount}/3`}
          tone="amber"
        />
        <StatCard
          icon={AlertTriangle}
          label="Stock bajo"
          value={lowStockCount}
          tone="red"
        />
        <StatCard
          icon={Tags}
          label="Categorías"
          value={categories.length}
          tone="emerald"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Buscar por nombre o categoría..."
              className="w-full bg-transparent py-2.5 text-sm outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="">Todas las categorías</option>
            {categories
              .filter((category) => category.name.toLowerCase() !== "todas")
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-300" />
            <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void loadProducts()}
              className="mt-4 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              No hay productos
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Probá con otra búsqueda o creá un producto nuevo.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Destacado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                            {product.imageUrl ? (
                              <Image
                                src={resolveImage(product.imageUrl)}
                                alt={product.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-slate-400">
                                <Package className="h-5 w-5" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {product.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {product.description || "Sin descripción"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {product.category?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            product.stock === 0
                              ? "bg-red-100 text-red-700"
                              : product.stock < 5
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleHighlight(product)}
                          aria-label={
                            product.highlighted
                              ? "Quitar destacado"
                              : "Destacar producto"
                          }
                          className={`relative flex h-6 w-11 items-center rounded-full transition ${
                            product.highlighted ? "bg-amber-400" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`h-5 w-5 rounded-full bg-white shadow transition ${
                              product.highlighted
                                ? "translate-x-5"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 p-4 sm:flex-row">
              <p className="text-xs text-slate-500">
                Mostrando{" "}
                <span className="font-semibold text-slate-700">
                  {filtered.length === 0 ? 0 : start + 1}–
                  {Math.min(start + PAGE_SIZE, filtered.length)}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-slate-700">
                  {filtered.length}
                </span>{" "}
                productos
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                        pageNumber === currentPage
                          ? "bg-emerald-600 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ProductFormModal
        open={modalOpen}
        product={editing}
        categories={categories}
        highlightedCount={highlightedCount}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "slate",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "slate" | "amber" | "red" | "emerald";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}
