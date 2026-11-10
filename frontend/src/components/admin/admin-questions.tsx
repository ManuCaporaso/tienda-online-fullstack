"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Loader2,
  MessageCircleQuestion,
  Package,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError, resolveImage } from "@/lib/api";
import type { AdminQuestion } from "@/lib/types";
import { AdminNav } from "./admin-nav";
import { useAdminGuard } from "./use-admin-guard";

type Filter = "pending" | "answered" | "all";

const filters: { key: Filter; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "answered", label: "Respondidas" },
  { key: "all", label: "Todas" },
];

export function AdminQuestions() {
  const { allowed, loading: authLoading } = useAdminGuard();
  const [filter, setFilter] = useState<Filter>("pending");
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async (current: Filter) => {
    setLoading(true);
    try {
      const query =
        current === "all" ? "" : `?answered=${current === "answered"}`;
      const list = await apiFetch<AdminQuestion[]>(`/api/questions${query}`);
      setQuestions(list);
      setDrafts(
        Object.fromEntries(list.map((item) => [item.id, item.answer ?? ""])),
      );
    } catch (error) {
      toast.error("No pudimos cargar las preguntas", {
        description:
          error instanceof ApiError ? error.message : "Intentá de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) void load(filter);
  }, [allowed, filter, load]);

  async function handleAnswer(question: AdminQuestion) {
    const answer = (drafts[question.id] ?? "").trim();
    if (answer.length < 2) {
      toast.error("Escribí una respuesta válida");
      return;
    }

    setSavingId(question.id);
    try {
      await apiFetch(`/api/questions/${question.id}/answer`, {
        method: "PATCH",
        body: { answer },
      });
      toast.success("Respuesta publicada", {
        description: question.product.name,
      });
      await load(filter);
    } catch (error) {
      toast.error("No pudimos publicar la respuesta", {
        description:
          error instanceof ApiError ? error.message : "Intentá de nuevo.",
      });
    } finally {
      setSavingId(null);
    }
  }

  if (authLoading || !allowed) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-6 h-80 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
          Administración
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Preguntas de clientes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Respondé las dudas pendientes. Las respuestas se publican en la página
          del producto.
        </p>
      </div>

      <div className="mt-6">
        <AdminNav />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === key
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <MessageCircleQuestion className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            No hay preguntas en esta bandeja
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Cuando un cliente pregunte, la vas a ver acá.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {questions.map((question) => (
            <article
              key={question.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {question.product.imageUrl ? (
                      <Image
                        src={resolveImage(question.product.imageUrl)}
                        alt={question.product.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-slate-400">
                        <Package className="h-5 w-5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {question.product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {question.user?.email ?? question.userName} ·{" "}
                      {new Date(question.createdAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                </div>

                {question.answer ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> Respondida
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase text-amber-700">
                    Pendiente
                  </span>
                )}
              </div>

              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                {question.question}
              </p>

              <div className="mt-3">
                <textarea
                  rows={2}
                  value={drafts[question.id] ?? ""}
                  onChange={(event) =>
                    setDrafts((previous) => ({
                      ...previous,
                      [question.id]: event.target.value,
                    }))
                  }
                  placeholder="Escribí la respuesta oficial..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                <button
                  type="button"
                  onClick={() => handleAnswer(question)}
                  disabled={savingId === question.id}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-70"
                >
                  {savingId === question.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {question.answer ? "Actualizar respuesta" : "Responder"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
