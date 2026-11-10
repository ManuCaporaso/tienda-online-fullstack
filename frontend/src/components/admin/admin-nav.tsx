"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image as ImageIcon, MessageCircleQuestion, Package, Tags } from "lucide-react";

const items = [
  { href: "/admin", label: "Productos", icon: Package },
  { href: "/admin/categories", label: "Categorías", icon: Tags },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  {
    href: "/admin/questions",
    label: "Preguntas",
    icon: MessageCircleQuestion,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
