import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { ProductGallery } from "./product-gallery";
import { ProductPurchaseBox } from "./product-purchase-box";
import { ProductReviews } from "./product-reviews";
import { ProductQuestions } from "./product-questions";
import type { Product } from "@/lib/types";

function formatSpecValue(value: unknown): string {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return JSON.stringify(value);
}

export function ProductDetailView({ product }: { product: Product }) {
  const specEntries = Object.entries(product.specs ?? {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
        <Link href="/" className="transition hover:text-emerald-600">
          Inicio
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/productos" className="transition hover:text-emerald-600">
          Productos
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link
              href={`/productos?categoria=${product.category.id}`}
              className="transition hover:text-emerald-600"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="truncate font-semibold text-slate-700">
          {product.name}
        </span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <ProductGallery product={product} />
        <ProductPurchaseBox product={product} />
      </div>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-black text-slate-900">
            Lo que tenés que saber de este producto
          </h2>
        </div>

        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
          {product.description}
        </p>

        {specEntries.length > 0 && (
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {specEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"
              >
                <dt className="text-sm text-slate-500">{key}</dt>
                <dd className="text-right text-sm font-semibold text-slate-900">
                  {formatSpecValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <ProductReviews productId={product.id} />
      <ProductQuestions productId={product.id} />
    </div>
  );
}
