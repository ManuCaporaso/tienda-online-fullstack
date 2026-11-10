"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Category } from "@/lib/types";

export function CatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") ?? "");

  const activeCategory = searchParams.get("categoria") ?? "";
  const sort = searchParams.get("orden") ?? "asc";

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
    setMinPrice(searchParams.get("min") ?? "");
    setMaxPrice(searchParams.get("max") ?? "");
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Category[]>("/api/categories")
      .then((data) => {
        if (!cancelled) {
          setCategories(
            data.filter((category) => category.name.toLowerCase() !== "todas"),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams({
      q: search.trim() || null,
      min: minPrice || null,
      max: maxPrice || null,
    });
  }

  function handleClear() {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    router.push(pathname);
  }

  const hasFilters = Boolean(
    searchParams.get("q") ||
      searchParams.get("min") ||
      searchParams.get("max") ||
      searchParams.get("categoria"),
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar productos..."
              className="w-full bg-transparent py-2.5 text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 px-3">
              <span className="text-xs text-slate-400">$</span>
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Mín"
                className="w-20 bg-transparent py-2.5 text-sm outline-none"
              />
            </div>
            <span className="text-slate-400">—</span>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 px-3">
              <span className="text-xs text-slate-400">$</span>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Máx"
                className="w-20 bg-transparent py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Aplicar
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => updateParams({ categoria: null })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              activeCategory === ""
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todas
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => updateParams({ categoria: String(category.id) })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activeCategory === String(category.id)
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {category.name}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <select
              value={sort}
              onChange={(event) => updateParams({ orden: event.target.value })}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="asc">Menor precio</option>
              <option value="desc">Mayor precio</option>
            </select>
            {hasFilters && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <X className="h-4 w-4" /> Limpiar
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
