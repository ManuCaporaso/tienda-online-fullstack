/**
 * Genera un UUID v4 seguro en cualquier contexto.
 *
 * `crypto.randomUUID()` solo está disponible en contextos seguros (HTTPS o
 * localhost). Al acceder por IP de red local (http://192.168.x.x) el navegador
 * lo deshabilita, por lo que usamos un fallback basado en Math.random.
 */
export function generateUUID(): string {
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
