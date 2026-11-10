"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, ShoppingBag, Star } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { resolveImage } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const singleVariant = variants.length === 1 ? variants[0] : undefined;
  // Con más de una variante el usuario debe elegir talle/color en el detalle.
  const requiresSelection = hasVariants && !singleVariant;

  const availableStock = singleVariant
    ? (singleVariant.availableStock ?? singleVariant.stock)
    : (product.availableStock ?? product.stock);

  async function handleAdd() {
    if (requiresSelection || availableStock <= 0) return;

    if (singleVariant) {
      await addItem({ ...product, stock: availableStock }, 1, {
        variantId: singleVariant.id,
        variantLabel: `${singleVariant.name}: ${singleVariant.value}`,
      });
      return;
    }

    await addItem({ ...product, stock: availableStock });
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-xl">
      <Link
        href={`/productos/${product.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-slate-100"
      >
        {product.imageUrl ? (
          <Image
            src={resolveImage(product.imageUrl)}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-slate-400">
            <ShoppingBag className="h-10 w-10" />
          </span>
        )}
        {product.highlighted && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-950">
            <Star className="h-3 w-3 fill-amber-950" /> Destacado
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
          {product.category?.name ?? "Producto"}
        </p>
        <Link
          href={`/productos/${product.id}`}
          className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 transition hover:text-emerald-600"
        >
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
          {product.description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-black text-slate-900">
            {formatPrice(product.price)}
          </span>
          <span
            className={`text-[11px] font-semibold ${
              availableStock > 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {availableStock > 0 ? `${availableStock} en stock` : "Sin stock"}
          </span>
        </div>

        {requiresSelection ? (
          <Link
            href={`/productos/${product.id}`}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            <Eye className="h-4 w-4" /> Ver opciones
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={availableStock <= 0}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ShoppingBag className="h-4 w-4" /> Agregar al carrito
          </button>
        )}
      </div>
    </article>
  );
}
