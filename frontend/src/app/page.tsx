import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Headphones,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { HeroFallback } from "@/components/home/hero-fallback";
import { HomeHero } from "@/components/home/home-hero";

const benefits = [
  {
    icon: Truck,
    title: "Envío a domicilio",
    description: "Despachamos a todo el país en 24/48 h.",
  },
  {
    icon: Store,
    title: "Retiro en sucursal",
    description: "Elegí retirar sin costo en Cipolletti.",
  },
  {
    icon: ShieldCheck,
    title: "Compra protegida",
    description: "Tus datos y pagos siempre seguros.",
  },
  {
    icon: Headphones,
    title: "Atención personalizada",
    description: "Te ayudamos a elegir tu equipación.",
  },
];

function CategorySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HeroFallback />}>
        <HomeHero />
      </Suspense>

      <section
        id="categorias"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            Categorías
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            Encontrá tu estilo
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Navegá por nuestras categorías y armá tu equipación ideal.
          </p>
        </div>
        <div className="mt-8">
          <Suspense fallback={<CategorySkeleton />}>
            <CategoriesSection />
          </Suspense>
        </div>
      </section>

      <section
        id="destacados"
        className="border-y border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                Destacados
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                Los más elegidos
              </h2>
            </div>
            <Link
              href="/productos"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Ver catálogo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8">
            <Suspense fallback={<ProductsSkeleton />}>
              <FeaturedProducts />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-emerald-600 px-6 py-12 text-center text-white sm:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.2),_transparent_50%)]" />
          <div className="relative">
            <CreditCard className="mx-auto h-8 w-8 text-emerald-100" />
            <h2 className="mt-4 text-2xl font-black sm:text-3xl">
              ¿Listo para tu próximo entrenamiento?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-emerald-50">
              Creá tu cuenta, agregá productos al carrito y completá el pago de
              forma segura con Mercado Pago.
            </p>
            <Link
              href="/account"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              Crear mi cuenta <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
