"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MailX, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";

type VerifyState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setState("error");
      setMessage(
        "El enlace no contiene un token de verificación. Revisá el correo que te enviamos.",
      );
      return;
    }

    let active = true;
    apiFetch<{ message: string }>(
      `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
    )
      .then((result) => {
        if (!active) return;
        setState("success");
        setMessage(result.message);
        toast.success("¡Cuenta verificada!", {
          description: "Ya podés iniciar sesión.",
        });
        setTimeout(() => router.push("/account"), 2800);
      })
      .catch((error) => {
        if (!active) return;
        setState("error");
        const text =
          error instanceof ApiError
            ? error.message
            : "No pudimos verificar la cuenta. Intentá de nuevo.";
        setMessage(text);
        toast.error("No se pudo verificar la cuenta", { description: text });
      });

    return () => {
      active = false;
    };
  }, [token, router]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center px-4 py-12">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        {state === "loading" && (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Loader2 className="h-7 w-7 animate-spin" />
            </span>
            <h1 className="mt-4 text-2xl font-black text-slate-900">
              Verificando tu cuenta...
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Estamos activando tu cuenta, esperá un segundo.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-2xl font-black text-slate-900">
              ¡Cuenta verificada!
            </h1>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <p className="mt-4 text-xs text-slate-400">
              Te estamos redirigiendo al inicio de sesión...
            </p>
            <Link
              href="/account"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <ShieldCheck className="h-4 w-4" /> Ir a iniciar sesión
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <MailX className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-2xl font-black text-slate-900">
              No pudimos verificar tu cuenta
            </h1>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
            <Link
              href="/account"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
            >
              Volver al inicio de sesión
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70vh] items-center justify-center px-4">
          <div className="h-64 w-full max-w-lg animate-pulse rounded-3xl bg-slate-200" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
