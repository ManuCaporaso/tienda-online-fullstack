"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import type { ReviewsSummary } from "@/lib/types";

function Stars({
  value,
  size = "h-4 w-4",
}: {
  value: number;
  size?: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300"
          }`}
        />
      ))}
    </span>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<ReviewsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const summary = await apiFetch<ReviewsSummary>(
        `/api/products/${productId}/reviews`,
      );
      setData(summary);
    } catch (error) {
      toast.error("No pudimos cargar las reseñas", {
        description:
          error instanceof ApiError ? error.message : "Intentá de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        body: { rating, comment },
      });
      toast.success("¡Gracias por tu reseña!");
      setComment("");
      setRating(5);
      await load();
    } catch (error) {
      toast.error("No pudimos publicar la reseña", {
        description:
          error instanceof ApiError ? error.message : "Intentá de nuevo.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-28 animate-pulse rounded-2xl bg-slate-100" />
      </section>
    );
  }

  if (!data) return null;

  return (
    <section
      id="resenas"
      className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"
    >
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
        <h2 className="text-xl font-black text-slate-900">
          Opiniones de compradores
        </h2>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="rounded-2xl bg-slate-50 p-5 text-center">
          <p className="text-4xl font-black text-slate-900">
            {data.average.toFixed(1)}
          </p>
          <div className="mt-1 flex justify-center">
            <Stars value={data.average} size="h-5 w-5" />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {data.total} {data.total === 1 ? "reseña" : "reseñas"}
          </p>
        </div>

        <div className="space-y-2">
          {data.distribution.map((entry) => {
            const percentage =
              data.total > 0 ? (entry.count / data.total) * 100 : 0;
            return (
              <div key={entry.stars} className="flex items-center gap-2">
                <span className="flex w-10 items-center gap-1 text-xs font-semibold text-slate-600">
                  {entry.stars} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs text-slate-500">
                  {entry.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {user && data.canReview && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4"
        >
          <p className="text-sm font-bold text-slate-900">
            Dejá tu reseña de comprador verificado
          </p>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`${star} estrellas`}
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            required
            minLength={3}
            rows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Contá tu experiencia con el producto..."
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-70"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star className="h-4 w-4" />
            )}
            Publicar reseña
          </button>
        </form>
      )}

      {data.myReview && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            Tu reseña
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Stars value={data.myReview.rating} />
            <span className="text-xs text-slate-500">
              {new Date(data.myReview.createdAt).toLocaleDateString("es-AR")}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-700">{data.myReview.comment}</p>
        </div>
      )}

      {user && !data.canReview && !data.myReview && (
        <p className="mt-6 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          Solo podés reseñar productos que hayas comprado y recibido.
        </p>
      )}

      {!user && (
        <p className="mt-6 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          <Link
            href={`/account?redirect=/productos/${productId}`}
            className="font-semibold text-emerald-600 hover:underline"
          >
            Iniciá sesión
          </Link>{" "}
          para dejar tu reseña si compraste este producto.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {data.reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">
              Todavía no hay reseñas. ¡Sé el primero en opinar!
            </p>
          </div>
        ) : (
          data.reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold uppercase text-white">
                    {review.userName.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {review.userName}
                    </p>
                    <Stars value={review.rating} size="h-3.5 w-3.5" />
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(review.createdAt).toLocaleDateString("es-AR")}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {review.comment}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
