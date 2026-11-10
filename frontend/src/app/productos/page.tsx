import { Suspense } from "react";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { ProductResults } from "@/components/catalog/product-results";

export const metadata = {
  title: "Productos | Patagonia Sports",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function FiltersSkeleton() {
  return (
    <div className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" />
  );
}

function ProductsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

export default function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
          Catálogo
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
          Todos los productos
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Filtrá por categoría, buscá por nombre y ajustá tu presupuesto.
        </p>
      </div>

      <div className="mt-6">
        <Suspense fallback={<FiltersSkeleton />}>
          <CatalogFilters />
        </Suspense>
      </div>

      <div className="mt-8">
        <Suspense fallback={<ProductsSkeleton />}>
          <ProductResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
