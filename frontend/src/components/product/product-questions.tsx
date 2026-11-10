"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageCircleQuestion,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import type { ProductQuestion } from "@/lib/types";

export function ProductQuestions({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiFetch<ProductQuestion[]>(
        `/api/products/${productId}/questions`,
      );
      setQuestions(list);
    } catch (error) {
      toast.error("No pudimos cargar las preguntas", {
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
      await apiFetch(`/api/products/${productId}/questions`, {
        method: "POST",
        body: { question },
      });
      toast.success("Pregunta enviada", {
        description: "La tienda te responderá a la brevedad.",
      });
      setQuestion("");
      await load();
    } catch (error) {
      toast.error("No pudimos enviar la pregunta", {
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
        <div className="mt-4 h-24 animate-pulse rounded-2xl bg-slate-100" />
      </section>
    );
  }

  return (
    <section
      id="preguntas"
      className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"
    >
      <div className="flex items-center gap-2">
        <MessageCircleQuestion className="h-5 w-5 text-emerald-600" />
        <h2 className="text-xl font-black text-slate-900">
          Preguntas y respuestas
        </h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        ¿Tenés dudas? Preguntá y la tienda te responde públicamente.
      </p>

      {user ? (
        <form onSubmit={handleSubmit} className="mt-5">
          <textarea
            required
            minLength={5}
            rows={2}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Escribí tu pregunta sobre este producto..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-70"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <HelpCircle className="h-4 w-4" />
            )}
            Enviar pregunta
          </button>
        </form>
      ) : (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          <Link
            href={`/account?redirect=/productos/${productId}`}
            className="font-semibold text-emerald-600 hover:underline"
          >
            Iniciá sesión
          </Link>{" "}
          para hacer una pregunta sobre este producto.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <HelpCircle className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">
              Todavía no hay preguntas. ¡Preguntá primero!
            </p>
          </div>
        ) : (
          questions.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex items-start gap-2">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.question}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.userName} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString("es-AR")}
                  </p>
                </div>
              </div>

              {item.answer ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3">
                  <Store className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Respuesta de la
                      tienda
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {item.answer}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs italic text-slate-400">
                  Esperando respuesta de la tienda...
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
