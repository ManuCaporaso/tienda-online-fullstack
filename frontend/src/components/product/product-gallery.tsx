"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  X,
  ZoomIn,
} from "lucide-react";
import { resolveImage } from "@/lib/api";
import { useEscapeKey } from "@/hooks/use-escape-key";
import type { Product } from "@/lib/types";

export function ProductGallery({ product }: { product: Product }) {
  const images = useMemo(() => {
    const list = [
      product.imageUrl,
      ...(product.images ?? []).map((image) => image.url),
    ].filter(Boolean) as string[];

    return Array.from(new Set(list));
  }, [product]);

  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEscapeKey(() => setLightbox(false), lightbox);

  useEffect(() => {
    setActive(0);
  }, [product.id]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl border border-slate-200 bg-slate-100 text-slate-400">
        <ShoppingBag className="h-16 w-16" />
      </div>
    );
  }

  const current = images[active] ?? images[0];

  function previous() {
    setActive((index) => (index - 1 + images.length) % images.length);
  }

  function next() {
    setActive((index) => (index + 1) % images.length);
  }

  return (
    <div className="flex gap-4">
      {/* Miniaturas verticales (desktop) */}
      <div className="hidden w-20 shrink-0 flex-col gap-3 sm:flex">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onMouseEnter={() => setActive(index)}
            onClick={() => setActive(index)}
            className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-white transition ${
              index === active
                ? "border-emerald-600"
                : "border-slate-200 hover:border-slate-300"
            }`}
            aria-label={`Ver imagen ${index + 1}`}
          >
            <Image
              src={resolveImage(image)}
              alt={`${product.name} ${index + 1}`}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Imagen principal */}
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="group relative block aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 bg-white"
          aria-label="Ampliar imagen"
        >
          <Image
            src={resolveImage(current)}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-4 transition duration-300 group-hover:scale-105"
          />
          <span className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
            <ZoomIn className="h-3.5 w-3.5" /> Ampliar
          </span>
        </button>

        {/* Miniaturas móviles */}
        <div className="mt-3 flex gap-2 overflow-x-auto sm:hidden">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${
                index === active ? "border-emerald-600" : "border-slate-200"
              }`}
              aria-label={`Ver imagen ${index + 1}`}
            >
              <Image
                src={resolveImage(image)}
                alt={`${product.name} ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {mounted &&
        lightbox &&
        createPortal(
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/90 p-4">
            <button
              type="button"
              className="absolute inset-0"
              onClick={() => setLightbox(false)}
              aria-label="Cerrar imagen"
            />
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={previous}
                  className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div className="relative z-0 h-[80vh] w-full max-w-4xl">
              <Image
                src={resolveImage(current)}
                alt={product.name}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
