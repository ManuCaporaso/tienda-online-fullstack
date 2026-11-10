import Link from "next/link";
import {
  ArrowRight,
  Dumbbell,
  Shirt,
  Sparkles,
  Trophy,
  Wind,
} from "lucide-react";

const heroCategories = [
  { icon: Shirt, label: "Remeras" },
  { icon: Dumbbell, label: "Musculosas" },
  { icon: Wind, label: "Buzos" },
  { icon: Trophy, label: "Camisetas" },
];

export function HeroFallback() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.35),_transparent_55%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" /> Nueva temporada 2026
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Equipate para{" "}
            <span className="text-emerald-400">rendir al máximo</span>.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300">
            Remeras, buzos, camperas y camisetas de las mejores marcas. Elegí
            envío a domicilio o retiro en sucursal y pagá con Mercado Pago.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
            >
              Ver productos <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#categorias"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explorar categorías
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 text-center">
            <div>
              <dt className="text-2xl font-black text-white">20+</dt>
              <dd className="text-xs text-slate-400">Productos</dd>
            </div>
            <div>
              <dt className="text-2xl font-black text-white">8</dt>
              <dd className="text-xs text-slate-400">Categorías</dd>
            </div>
            <div>
              <dt className="text-2xl font-black text-white">24 h</dt>
              <dd className="text-xs text-slate-400">Despacho</dd>
            </div>
          </dl>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute -inset-6 rounded-[2rem] bg-emerald-500/20 blur-3xl" />
          <div className="relative grid grid-cols-2 gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            {heroCategories.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white/5 p-6 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-semibold text-white">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
