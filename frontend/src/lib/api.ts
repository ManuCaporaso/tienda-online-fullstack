export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030";

export const SERVER_API_URL = process.env.API_URL ?? API_URL;

/**
 * URL base para las llamadas a la API.
 *
 * En el navegador usamos una URL relativa (`""`) para que Next.js reescriba
 * `/api/*` hacia NestJS (mismo origen). Así la cookie httpOnly queda en el
 * host del frontend y `proxy.ts` puede leerla.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return SERVER_API_URL;
}

const BACKEND_IMAGE_PATH = "/assets/images/";

/**
 * Resuelve la URL de una imagen del backend a una **ruta relativa**.
 *
 * Usamos rutas relativas (`/assets/images/<archivo>`) a propósito: el HTML que
 * renderiza el servidor y el que hidrata el cliente quedan idénticos, sin
 * importar si se accede por `localhost`, por la IP de la LAN o por un dominio.
 * Next reescribe `/assets/*` hacia NestJS (ver `next.config.ts`).
 *
 * También normaliza URLs absolutas viejas del backend
 * (`http://localhost:3030/assets/images/x.png`) a su pathname relativo.
 */
export function resolveImage(imageUrl?: string | null): string {
  if (!imageUrl) return "";

  // Previews locales del formulario de admin.
  if (imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) {
    return imageUrl;
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    try {
      const { pathname } = new URL(imageUrl);
      if (pathname.startsWith(BACKEND_IMAGE_PATH)) {
        return pathname;
      }
    } catch {
      // URL inválida: se devuelve tal cual.
    }
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) return imageUrl;
  if (imageUrl.startsWith("assets/")) return `/${imageUrl}`;

  return `${BACKEND_IMAGE_PATH}${imageUrl.replace(/^\/+/, "")}`;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const isFormData = body instanceof FormData;

  const requestBody: BodyInit | undefined = isFormData
    ? (body as FormData)
    : body !== undefined
      ? JSON.stringify(body)
      : undefined;

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(headers ?? {}),
    },
    body: requestBody,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Ocurrió un error inesperado";
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export async function serverFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${SERVER_API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Error ${res.status} al consultar ${path}`);
  }
  return (await res.json()) as T;
}
