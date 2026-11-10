import { generateUUID } from "@/lib/uuid";

const SESSION_KEY = "patagonia-session";

/**
 * ID de sesión estable para asociar reservas temporales de stock.
 * Se guarda en localStorage para sobrevivir recargas.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = generateUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
