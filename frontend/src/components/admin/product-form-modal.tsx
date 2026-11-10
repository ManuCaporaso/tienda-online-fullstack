"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ImagePlus, Loader2, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError, resolveImage } from "@/lib/api";
import { generateUUID } from "@/lib/uuid";
import type { Category, Product } from "@/lib/types";
import { useEscapeKey } from "@/hooks/use-escape-key";

interface ProductFormModalProps {
  open: boolean;
  product: Product | null;
  categories: Category[];
  highlightedCount: number;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  highlighted: boolean;
}

interface VariantRow {
  key: string;
  name: string;
  value: string;
  stock: string;
  price: string;
}

interface ImagePreview {
  id: string;
  /** Ruta relativa guardada en el backend, o blob URL si es un archivo nuevo. */
  url: string;
  file?: File;
}

const MAX_IMAGES = 10;

function createPreviewId() {
  return Math.random().toString(36).substring(2, 10);
}

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  categoryId: "",
  highlighted: false,
};

export function ProductFormModal({
  open,
  product,
  categories,
  highlightedCount,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const isEditing = Boolean(product);
  const canHighlight = product?.highlighted || highlightedCount < 3;

  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? "",
        price: String(product.price),
        stock: String(product.stock),
        categoryId: String(product.categoryId),
        highlighted: product.highlighted,
      });
    } else {
      setForm(emptyForm);
    }
    setVariants(
      (product?.variants ?? []).map((variant) => ({
        key: variant.id,
        name: variant.name,
        value: variant.value,
        stock: String(variant.stock),
        price: variant.price != null ? String(variant.price) : "",
      })),
    );
    const initialImages: ImagePreview[] = [];
    if (product) {
      if (product.imageUrl) {
        initialImages.push({ id: "main", url: product.imageUrl });
      }
      (product.images ?? []).forEach((image, index) => {
        if (image.url !== product.imageUrl) {
          initialImages.push({ id: `gal-${index}`, url: image.url });
        }
      });
    }
    setImagePreviews(initialImages);
    setDragActive(false);
    setSubmitting(false);
  }, [open, product]);

  // Libera todas las object URLs creadas para los archivos nuevos.
  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEscapeKey(onClose, open);

  if (!open) return null;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      {
        key: generateUUID(),
        name: "",
        value: "",
        stock: "0",
        price: "",
      },
    ]);
  }

  function updateVariant(
    key: string,
    field: "name" | "value" | "stock" | "price",
    value: string,
  ) {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.key === key ? { ...variant, [field]: value } : variant,
      ),
    );
  }

  function removeVariant(key: string) {
    setVariants((prev) => prev.filter((variant) => variant.key !== key));
  }

  function addImageFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (incoming.length === 0) {
      toast.error("Seleccioná archivos de imagen válidos");
      return;
    }

    const available = MAX_IMAGES - imagePreviews.length;
    if (available <= 0) {
      toast.warning("Máximo 10 imágenes por producto");
      return;
    }

    if (incoming.length > available) {
      toast.warning("Máximo 10 imágenes por producto");
    }

    const newItems = incoming.slice(0, available).map((file) => {
      const url = URL.createObjectURL(file);
      objectUrlsRef.current.add(url);
      return { id: createPreviewId(), url, file };
    });

    // Se agregan al final, sin reemplazar las imágenes ya cargadas.
    setImagePreviews((previous) => [...previous, ...newItems]);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addImageFiles(event.target.files);
    }
    // Permite volver a seleccionar el mismo archivo si se quitó antes.
    event.target.value = "";
  }

  function removeImage(id: string) {
    const target = imagePreviews.find((item) => item.id === id);
    if (target?.file) {
      URL.revokeObjectURL(target.url);
      objectUrlsRef.current.delete(target.url);
    }

    setImagePreviews((previous) =>
      previous.filter((item) => item.id !== id),
    );
  }

  const totalVariantStock = variants.reduce(
    (sum, variant) => sum + (Number(variant.stock) || 0),
    0,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!form.price || Number(form.price) < 0) {
      toast.error("Ingresá un precio válido");
      return;
    }
    if (!form.categoryId) {
      toast.error("Elegí una categoría");
      return;
    }
    if (form.highlighted && !canHighlight) {
      toast.error("Límite de destacados", {
        description: "Solo podés destacar hasta 3 productos.",
      });
      return;
    }

    const cleanedVariants = variants.map((variant) => ({
      name: variant.name.trim(),
      value: variant.value.trim(),
      stock: Number(variant.stock) || 0,
      price: variant.price ? Number(variant.price) : undefined,
    }));

    if (cleanedVariants.some((variant) => !variant.name || !variant.value)) {
      toast.error("Completá nombre y valor de cada variante");
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append("name", form.name.trim());
      data.append("description", form.description.trim());
      data.append("price", form.price);
      data.append(
        "stock",
        String(
          cleanedVariants.length > 0
            ? cleanedVariants.reduce(
                (sum, variant) => sum + variant.stock,
                0,
              )
            : Number(form.stock) || 0,
        ),
      );
      data.append("variants", JSON.stringify(cleanedVariants));
      data.append("categoryId", form.categoryId);
      data.append("highlighted", String(form.highlighted));

      const newFiles = imagePreviews.filter(
        (item): item is ImagePreview & { file: File } => Boolean(item.file),
      );
      const existingUrls = imagePreviews
        .filter((item) => !item.file)
        .map((item) => item.url);

      newFiles.forEach((item) => data.append("images", item.file));

      // Al editar, el backend conserva las URLs existentes y usa la primera
      // imagen de la lista como principal.
      if (product) {
        data.append("existingImages", JSON.stringify(existingUrls));
        const first = imagePreviews[0];
        if (first && !first.file) {
          data.append("mainImage", first.url);
        }
      }

      if (product) {
        await apiFetch<Product>(`/api/products/${product.id}`, {
          method: "PUT",
          body: data,
        });
        toast.success("Producto actualizado", {
          description: form.name.trim(),
        });
      } else {
        await apiFetch<Product>("/api/products", {
          method: "POST",
          body: data,
        });
        toast.success("Producto creado", { description: form.name.trim() });
      }

      await onSaved();
    } catch (error) {
      toast.error("No pudimos guardar el producto", {
        description:
          error instanceof ApiError
            ? error.message
            : "Revisá los datos e intentá de nuevo.",
      });
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {isEditing ? "Editar producto" : "Nuevo producto"}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing
                ? "Actualizá los datos del producto."
                : "Completá los datos para agregar un producto."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nombre *
              </span>
              <input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Remera deportiva"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Descripción
              </span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  update("description", event.target.value)
                }
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Descripción breve del producto"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Precio *
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(event) => update("price", event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="29999"
              />
            </label>

            {variants.length === 0 ? (
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock *
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(event) => update("stock", event.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="20"
                />
              </label>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Stock total (suma de variantes)
                </p>
                <p className="text-2xl font-black text-emerald-700">
                  {totalVariantStock} unidades
                </p>
                <p className="text-xs text-emerald-600">
                  {variants.length} variantes cargadas
                </p>
              </div>
            )}

            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Categoría *
              </span>
              <select
                value={form.categoryId}
                onChange={(event) => update("categoryId", event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">Elegí una categoría</option>
                {categories
                  .filter(
                    (category) => category.name.toLowerCase() !== "todas",
                  )
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Variantes y stock
                </p>
                <p className="text-xs text-slate-500">
                  Definí talle, color, etc. El stock total se calcula
                  automáticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar variante
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                Sin variantes. Se usa el stock del campo “Stock”.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {variants.map((variant) => (
                  <div
                    key={variant.key}
                    className="grid gap-2 sm:grid-cols-[1fr_1fr_90px_110px_36px]"
                  >
                    <input
                      value={variant.name}
                      onChange={(event) =>
                        updateVariant(variant.key, "name", event.target.value)
                      }
                      placeholder="Nombre (Talle)"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                    <input
                      value={variant.value}
                      onChange={(event) =>
                        updateVariant(variant.key, "value", event.target.value)
                      }
                      placeholder="Valor (S)"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                    <input
                      type="number"
                      min={0}
                      value={variant.stock}
                      onChange={(event) =>
                        updateVariant(variant.key, "stock", event.target.value)
                      }
                      placeholder="Stock"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                    <input
                      type="number"
                      min={0}
                      value={variant.price}
                      onChange={(event) =>
                        updateVariant(variant.key, "price", event.target.value)
                      }
                      placeholder="Precio (opc.)"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.key)}
                      className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Quitar variante"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <p className="text-xs text-slate-500">
                  Stock total:{" "}
                  <span className="font-bold text-emerald-600">
                    {totalVariantStock} unidades
                  </span>
                </p>
              </div>
            )}
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              addImageFiles(event.dataTransfer.files);
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Imágenes del producto
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {imagePreviews.length}/{MAX_IMAGES} · la primera será la
                principal
              </span>
            </div>

            {imagePreviews.length === 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                <ImagePlus className="h-4 w-4" /> Todavía no hay imágenes
                seleccionadas.
              </div>
            )}

            <div className="mt-3 grid grid-cols-4 gap-3">
              {imagePreviews.map((item, index) => (
                <GalleryThumb
                  key={item.id}
                  item={item}
                  index={index}
                  onRemove={removeImage}
                />
              ))}

              {imagePreviews.length < MAX_IMAGES && (
                <label
                  className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-2 text-center transition ${
                    dragActive
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/40"
                  }`}
                >
                  <Plus className="h-5 w-5 text-emerald-600" />
                  <span className="text-[11px] font-semibold leading-tight text-slate-600">
                    Agregar más imágenes
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <p className="mt-2 text-[11px] text-slate-400">
              Arrastrá archivos sobre esta zona o usá “Agregar más imágenes”.
              Hasta {MAX_IMAGES} archivos JPG, PNG o WebP.
            </p>
          </div>

          <label
            className={`flex items-center justify-between rounded-xl border p-4 ${
              form.highlighted
                ? "border-amber-300 bg-amber-50"
                : "border-slate-200"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Star
                className={`h-4 w-4 ${
                  form.highlighted
                    ? "fill-amber-400 text-amber-500"
                    : "text-slate-400"
                }`}
              />
              Destacar producto
            </span>
            <input
              type="checkbox"
              checked={form.highlighted}
              onChange={(event) =>
                update("highlighted", event.target.checked)
              }
              disabled={!canHighlight}
              className="h-5 w-5 accent-amber-500 disabled:opacity-50"
            />
          </label>
          <p className="text-xs text-slate-500">
            {highlightedCount}/3 destacados.{" "}
            {!canHighlight &&
              "Quitá uno para poder destacar este producto."}
          </p>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Crear producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GalleryThumb({
  item,
  index,
  onRemove,
}: {
  item: ImagePreview;
  index: number;
  onRemove: (id: string) => void;
}) {
  // Las URLs de archivos nuevos ya son blob URLs; las existentes son rutas
  // relativas que hay que resolver contra el backend.
  const src = item.file ? item.url : resolveImage(item.url);

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Imagen ${index + 1}`}
        className="h-full w-full object-cover"
      />

      {index === 0 && (
        <span className="absolute left-1 top-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
          Principal
        </span>
      )}

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white transition hover:bg-red-600"
        aria-label={`Quitar imagen ${index + 1}`}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
