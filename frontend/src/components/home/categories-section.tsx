import Link from "next/link";
import {
  Dumbbell,
  Flame,
  Footprints,
  Layers,
  Shirt,
  Timer,
  Trophy,
  Wind,
} from "lucide-react";
import { serverFetch } from "@/lib/api";
import type { Category } from "@/lib/types";

const icons = [Shirt, Layers, Dumbbell, Timer, Footprints, Wind, Flame, Trophy];

export async function CategoriesSection() {
  let categories: Category[] = [];

  try {
    categories = await serverFetch<Category[]>("/api/categories");
  } catch {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        No pudimos cargar las categorías. Verificá que el backend esté corriendo.
      </p>
    );
  }

  const visible = categories.filter(
    (category) => category.name.toLowerCase() !== "todas",
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {visible.map((category, index) => {
        const Icon = icons[index % icons.length];
        return (
          <Link
            key={category.id}
            href={`/productos?categoria=${category.id}`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-900">
              {category.name}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {category._count?.products ?? 0} productos
            </p>
          </Link>
        );
      })}
    </div>
  );
}
