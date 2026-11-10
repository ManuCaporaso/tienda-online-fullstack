import { serverFetch } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

export async function FeaturedProducts() {
  let products: Product[] = [];

  try {
    products = await serverFetch<Product[]>("/api/products?highlighted=true");
  } catch {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        No pudimos cargar los productos destacados. Verificá que el backend esté
        corriendo.
      </p>
    );
  }

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Todavía no hay productos destacados.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.slice(0, 3).map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
