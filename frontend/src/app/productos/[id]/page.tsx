import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductDetailView } from "@/components/product/product-detail-view";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await serverFetch<Product>(`/api/products/${id}`);
    return {
      title: `${product.name} | Patagonia Sports`,
      description: product.description ?? undefined,
    };
  } catch {
    notFound();
  }
}

async function ProductDetail({ params }: { params: Params }) {
  const { id } = await params;

  let product: Product;
  try {
    product = await serverFetch<Product>(`/api/products/${id}`);
  } catch {
    notFound();
  }

  return <ProductDetailView product={product} />;
}

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="aspect-square animate-pulse rounded-3xl bg-slate-200" />
        <div className="h-[560px] animate-pulse rounded-3xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}
