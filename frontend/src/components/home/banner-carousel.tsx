"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { resolveImage } from "@/lib/api";
import type { Banner } from "@/lib/types";

function isExternal(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  function previous() {
    setIndex((current) => (current - 1 + banners.length) % banners.length);
  }

  function next() {
    setIndex((current) => (current + 1) % banners.length);
  }

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="relative h-[420px] w-full sm:h-[500px] lg:h-[560px]">
        {banners.map((banner, bannerIndex) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              bannerIndex === index
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={resolveImage(banner.imageUrl)}
              alt={banner.title ?? "Banner"}
              fill
              priority={bannerIndex === 0}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/10" />
            <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Nueva temporada 2026
              </span>
              {banner.title && (
                <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  {banner.title}
                </h1>
              )}
              {banner.linkUrl &&
                (isExternal(banner.linkUrl) ? (
                  <a
                    href={banner.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                  >
                    Ver más <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <Link
                    href={banner.linkUrl}
                    className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                  >
                    Ver más <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={previous}
            aria-label="Banner anterior"
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur transition hover:bg-black/50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Banner siguiente"
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur transition hover:bg-black/50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {banners.map((banner, bannerIndex) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setIndex(bannerIndex)}
                aria-label={`Ir al banner ${bannerIndex + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  bannerIndex === index
                    ? "w-8 bg-emerald-400"
                    : "w-2.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
