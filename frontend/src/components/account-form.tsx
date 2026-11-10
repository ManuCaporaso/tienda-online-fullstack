"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  Loader2,
  Lock,
  LogIn,
  Mail,
  MailCheck,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, type RegisterResult } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

export function AccountForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState<RegisterResult | null>(null);
  const { login, register } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "login") {
        const account = await login(email, password);
        toast.success("¡Bienvenido de nuevo!", {
          description: account.email,
        });

        if (account.role === "ADMIN") {
          // Recarga completa: asegura que el navegador aplique la cookie
          // antes de que el proxy evalúe /admin.
          window.location.href = "/admin";
        } else {
          window.location.href =
            redirect && !redirect.startsWith("/admin") ? redirect : "/";
        }
        return;
      }

      const result = await register(email, password);
      setRegistered(result);
      toast.success("Cuenta creada", {
        description: "Revisá tu correo para confirmar la cuenta.",
      });
      setPassword("");
    } catch (error) {
      toast.error("No pudimos completar la operación", {
        description:
          error instanceof ApiError
            ? error.message
            : "Revisá los datos e intentá de nuevo.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (registered) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <MailCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-black text-slate-900">
            Te enviamos un correo de confirmación
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Enviamos el enlace de activación a{" "}
            <span className="font-semibold text-slate-800">
              {registered.user.email}
            </span>
            . Revisá tu bandeja de entrada (y la carpeta de spam) para activar
            tu cuenta.
          </p>

          {registered.devVerificationUrl && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                Modo desarrollo
              </p>
              <p className="mt-1 text-xs text-amber-700">
                No hay SMTP configurado. Podés confirmar la cuenta con este
                enlace:
              </p>
              <a
                href={registered.devVerificationUrl}
                className="mt-2 inline-flex items-center gap-1 break-all text-xs font-semibold text-emerald-700 underline"
              >
                Abrir enlace de verificación <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setRegistered(null);
              setMode("login");
            }}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
          >
            Ir a iniciar sesión <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-black text-slate-900">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "login"
              ? "Accedé para comprar y ver tus pedidos."
              : "Registrate y confirmá tu correo para empezar."}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LogIn className="h-4 w-4" /> Ingresar
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              mode === "register"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <UserPlus className="h-4 w-4" /> Registrarme
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </span>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 px-3 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
              <Mail className="h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-transparent py-2.5 text-sm outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contraseña
            </span>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 px-3 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
              <Lock className="h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent py-2.5 text-sm outline-none"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "login" ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {submitting
              ? "Procesando..."
              : mode === "login"
                ? "Ingresar"
                : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Credenciales de prueba</p>
          <p className="mt-1">Admin: admin@admin.com / admin</p>
          <p>Cliente: cliente@cliente.com / cliente</p>
        </div>
      </div>
    </div>
  );
}
