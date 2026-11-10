"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/format";
import type { Product, ProductVariant } from "@/lib/types";

export function ProductPurchaseBox({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();

  const groups = useMemo(() => {
    const map = new Map<string, ProductVariant[]>();
    for (const variant of product.variants ?? []) {
      const list = map.get(variant.name) ?? [];
      list.push(variant);
      map.set(variant.name, list);
    }
    return Array.from(map.entries());
  }, [product.variants]);

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [name, values] of groups) {
      const first = values.find((value) => value.stock > 0) ?? values[0];
      if (first) initial[name] = first.value;
    }
    return initial;
  });

  const [quantity, setQuantity] = useState(1);

  const selectedVariants = useMemo(
    () =>
      groups
        .map(([name, values]) =>
          values.find((value) => value.value === selected[name]),
        )
        .filter((value): value is ProductVariant => Boolean(value)),
    [groups, selected],
  );

  const availableStock =
    selectedVariants.length > 0
      ? Math.min(
          ...selectedVariants.map(
            (variant) => variant.availableStock ?? variant.stock,
          ),
          product.availableStock ?? product.stock,
        )
      : (product.availableStock ?? product.stock);

  const selectedPrice = product.price;
  const hasStock = availableStock > 0;

  useEffect(() => {
    setQuantity((current) =>
      Math.min(Math.max(1, current), Math.max(1, availableStock)),
    );
  }, [availableStock]);

  const variantLabel =
    groups.length > 0
      ? groups.map(([name]) => `${name}: ${selected[name]}`).join(" · ")
      : undefined;

  async function handleAdd(goToCheckout = false) {
    if (!hasStock) return;

    const ok = await addItem(
      { ...product, price: selectedPrice, stock: availableStock },
      quantity,
      {
        variantLabel,
        variantId: selectedVariants[0]?.id,
      },
    );

    if (ok && goToCheckout) {
      router.push("/checkout");
    }
  }

  return (
    <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
        {product.category?.name ?? "Producto"}
      </p>
      <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
        {product.name}
      </h1>
      <p className="mt-2 line-clamp-2 text-sm text-slate-500">
        {product.description}
      </p>

      <div className="mt-5">
        <p className="text-3xl font-black text-slate-900">
          {formatPrice(selectedPrice)}
        </p>
        <p className="mt-1 text-sm text-emerald-600">
          3 cuotas sin interés de {formatPrice(Number(selectedPrice) / 3)}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Precio final · IVA incluido
        </p>
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            hasStock ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
        <span className={hasStock ? "text-emerald-700" : "text-red-600"}>
          {hasStock ? `Stock disponible: ${availableStock}` : "Sin stock"}
        </span>
      </div>

      {groups.length > 0 && (
        <div className="mt-5 space-y-4">
          {groups.map(([name, values]) => (
            <div key={name}>
              <p className="text-sm font-semibold text-slate-900">{name}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {values.map((variant) => {
                  const active = selected[name] === variant.value;
                  const disabled = variant.stock <= 0;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        setSelected((previous) => ({
                          ...previous,
                          [name]: variant.value,
                        }))
                      }
                      title={disabled ? "Sin stock" : `Stock: ${variant.stock}`}
                      className={`min-w-12 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 text-slate-700 hover:border-slate-400"
                      } ${
                        disabled
                          ? "cursor-not-allowed opacity-40 line-through"
                          : ""
                      }`}
                    >
                      {variant.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-900">Cantidad</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              disabled={quantity <= 1}
              className="p-2.5 text-slate-500 transition hover:text-slate-900 disabled:opacity-40"
              aria-label="Restar"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                setQuantity((current) => Math.min(availableStock, current + 1))
              }
              disabled={quantity >= availableStock}
              className="p-2.5 text-slate-500 transition hover:text-slate-900 disabled:opacity-40"
              aria-label="Sumar"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span className="text-xs text-slate-500">
            {availableStock} disponibles
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={() => handleAdd(true)}
          disabled={!hasStock}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CreditCard className="h-4 w-4" /> Comprar ahora
        </button>
        <button
          type="button"
          onClick={() => handleAdd(false)}
          disabled={!hasStock}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-900 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4" /> Agregar al carrito
        </button>
      </div>

      <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <p className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-emerald-600" /> Envío a domicilio o
          retiro en sucursal
        </p>
        <p className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Compra protegida
          con Mercado Pago
        </p>
      </div>
    </aside>
  );
}
