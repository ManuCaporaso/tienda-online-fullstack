import { serverFetch } from "@/lib/api";
import type { Banner } from "@/lib/types";
import { BannerCarousel } from "./banner-carousel";
import { HeroFallback } from "./hero-fallback";

export async function HomeHero() {
  let banners: Banner[] = [];

  try {
    banners = await serverFetch<Banner[]>("/api/banners");
  } catch {
    return <HeroFallback />;
  }

  if (banners.length === 0) {
    return <HeroFallback />;
  }

  return <BannerCarousel banners={banners} />;
}
