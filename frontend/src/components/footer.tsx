import Link from "next/link";
import {
  CreditCard,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

export function Footer() {
  return (
    <footer
      id="contacto"
      className="border-t border-slate-800 bg-slate-950 text-slate-300"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span className="text-sm font-black uppercase tracking-wide text-white">
              Patagonia Sports
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            Indumentaria deportiva para entrenar, jugar y rendir. Envíos a todo
            el país y retiro en sucursal.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-emerald-500" /> Envíos nacionales
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Compra
              protegida
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-500" /> Mercado Pago
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">
            Navegación
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/" className="transition hover:text-emerald-400">
                Inicio
              </Link>
            </li>
            <li>
              <Link
                href="/productos"
                className="transition hover:text-emerald-400"
              >
                Productos
              </Link>
            </li>
            <li>
              <Link
                href="/#categorias"
                className="transition hover:text-emerald-400"
              >
                Categorías
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                className="transition hover:text-emerald-400"
              >
                Mi cuenta
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">
            Contacto
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" /> Cipolletti, Río
              Negro
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-500" /> (299) 456-7890
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-500" />{" "}
              hola@patagoniasports.com
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500">
        © 2026 Patagonia Sports · Proyecto Final
        Diplomatura Full Stack ICARO
      </div>
    </footer>
  );
}
