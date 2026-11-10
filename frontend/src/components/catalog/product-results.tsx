import { PackageSearch, SearchX } from "lucide-react";
import { serverFetch } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function ProductResults({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  const categoria = first(params.categoria);
  const q = first(params.q);
  const min = first(params.min);
  const max = first(params.max);
  const orden = first(params.orden) === "desc" ? "desc" : "asc";

  if (categoria) query.set("categoryId", categoria);
  if (q) query.set("search", q);
  if (min) query.set("minPrice", min);
  if (max) query.set("maxPrice", max);
  query.set("sort", orden);

  let products: Product[] = [];
  let failed = false;

  try {
    products = await serverFetch<Product[]>(
      `/api/products?${query.toString()}`,
    );
  } catch {
    failed = true;
  }

  if (failed) {
    return (
      <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-10 text-center">
        <PackageSearch className="mx-auto h-10 w-10 text-red-300" />
        <p className="mt-3 text-sm font-semibold text-red-700">
          No pudimos cargar el catálogo
        </p>
        <p className="mt-1 text-xs text-red-500">
          Verificá que el backend esté corriendo en el puerto 3030.
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <SearchX className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-900">
          Sin resultados
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Probá con otros filtros o limpiá la búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate-500">
        <span className="font-semibold text-slate-900">{products.length}</span>{" "}
        {products.length === 1 ? "producto encontrado" : "productos encontrados"}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
