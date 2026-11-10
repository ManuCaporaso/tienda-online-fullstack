"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";
import { getSessionId } from "@/lib/session";
import type { CartItem, DeliveryType, Product } from "@/lib/types";

const STORAGE_KEY = "patagonia-cart";
export const CART_STORAGE_KEY = STORAGE_KEY;

interface AddItemOptions {
  variantLabel?: string;
  variantId?: string;
}

interface ReservationResponse {
  id: string;
  expiresAt: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  deliveryType: DeliveryType;
  isOpen: boolean;
  setDeliveryType: (type: DeliveryType) => void;
  addItem: (
    product: Product,
    quantity?: number,
    options?: AddItemOptions,
  ) => Promise<boolean>;
  removeItem: (lineId: string) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  clear: (options?: { silent?: boolean }) => Promise<void>;
  expireReservation: (lineId: string) => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function buildLineId(productId: string, variantLabel?: string) {
  return `${productId}::${variantLabel ?? ""}`;
}

async function releaseReservation(
  reservationId: string | undefined,
  sessionId: string,
) {
  if (!reservationId) return;
  try {
    await apiFetch(
      `/api/reservations/${reservationId}?sessionId=${encodeURIComponent(sessionId)}`,
      { method: "DELETE" },
    );
  } catch {
    // La reserva pudo haber expirado; se ignora.
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryType, setDeliveryTypeState] =
    useState<DeliveryType>("PICKUP");
  const [isOpen, setIsOpen] = useState(false);
  // `hydrated` es estado (no ref) a propósito: así el efecto de persistencia no
  // corre en el mismo commit en el que todavía no se leyó localStorage. Con un
  // ref se escribía `{ items: [] }` antes de restaurar el carrito y, al volver
  // desde Mercado Pago, ese carrito vacío podía quedar persistido.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          items?: CartItem[];
          deliveryType?: DeliveryType;
        };
        if (Array.isArray(parsed.items)) {
          setItems(
            parsed.items.map((item) => ({
              ...item,
              lineId:
                item.lineId ?? buildLineId(item.id, item.variantLabel),
            })),
          );
        }
        if (parsed.deliveryType) setDeliveryTypeState(parsed.deliveryType);
      }
    } catch {
      // storage corrupta: se ignora
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items, deliveryType }),
    );
  }, [items, deliveryType, hydrated]);

  const addItem = useCallback(
    async (
      product: Product,
      quantity = 1,
      options?: AddItemOptions,
    ): Promise<boolean> => {
      const productVariants = product.variants ?? [];
      let variantId = options?.variantId;
      let variantLabel = options?.variantLabel;

      // Si el producto tiene una única variante, se usa por defecto.
      if (productVariants.length === 1 && !variantId) {
        const only = productVariants[0];
        variantId = only.id;
        variantLabel = variantLabel ?? `${only.name}: ${only.value}`;
      }

      // Con varias variantes es obligatorio elegir una.
      if (productVariants.length > 1 && !variantId) {
        toast.error("Elegí una variante", {
          description: `${product.name} tiene varias opciones de talle/color.`,
        });
        return false;
      }

      if (
        variantId &&
        productVariants.length > 0 &&
        !productVariants.some((variant) => variant.id === variantId)
      ) {
        toast.error("Variante inválida", {
          description:
            "La opción seleccionada no pertenece a este producto. Volvé a elegirla.",
        });
        return false;
      }

      if (variantId && !variantLabel) {
        const match = productVariants.find(
          (variant) => variant.id === variantId,
        );
        if (match) variantLabel = `${match.name}: ${match.value}`;
      }

      const lineId = buildLineId(product.id, variantLabel);
      const existing = items.find((item) => item.lineId === lineId);
      const currentQty = existing?.quantity ?? 0;
      const newQty = currentQty + quantity;

      if (newQty > product.stock) {
        toast.error("Stock insuficiente", {
          description: `Solo quedan ${product.stock} unidades de ${product.name}.`,
        });
        return false;
      }

      const sessionId = getSessionId();
      await releaseReservation(existing?.reservationId, sessionId);

      let reservation: ReservationResponse;
      try {
        reservation = await apiFetch<ReservationResponse>(
          "/api/reservations",
          {
            method: "POST",
            body: {
              sessionId,
              productId: product.id,
              variantId,
              quantity: newQty,
            },
          },
        );
      } catch (error) {
        toast.error("No se pudo reservar stock", {
          description:
            error instanceof ApiError ? error.message : "Intentá de nuevo.",
        });
        return false;
      }

      const description = variantLabel
        ? `${product.name} (${variantLabel})`
        : product.name;

      if (existing) {
        toast.success("Producto agregado", {
          description: `${description} · ahora tenés ${newQty}.`,
        });
        setItems((prev) =>
          prev.map((item) =>
            item.lineId === lineId
              ? {
                  ...item,
                  quantity: newQty,
                  reservationId: reservation.id,
                  reservationExpiresAt: reservation.expiresAt,
                }
              : item,
          ),
        );
        return true;
      }

      toast.success("Agregado al carrito", { description });
      setItems((prev) => [
        ...prev,
        {
          ...product,
          quantity,
          variantLabel,
          variantId,
          lineId,
          reservationId: reservation.id,
          reservationExpiresAt: reservation.expiresAt,
        },
      ]);
      return true;
    },
    [items],
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      const item = items.find((entry) => entry.lineId === lineId);
      await releaseReservation(item?.reservationId, getSessionId());
      setItems((prev) => prev.filter((entry) => entry.lineId !== lineId));
      toast.info("Producto eliminado del carrito");
    },
    [items],
  );

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      const item = items.find((entry) => entry.lineId === lineId);
      if (!item) return;

      if (quantity <= 0) {
        await removeItem(lineId);
        return;
      }

      if (quantity > item.stock) {
        toast.error("Stock insuficiente", {
          description: `Solo quedan ${item.stock} unidades.`,
        });
        return;
      }

      const sessionId = getSessionId();
      await releaseReservation(item.reservationId, sessionId);

      let reservation: ReservationResponse;
      try {
        reservation = await apiFetch<ReservationResponse>(
          "/api/reservations",
          {
            method: "POST",
            body: {
              sessionId,
              productId: item.id,
              variantId: item.variantId,
              quantity,
            },
          },
        );
      } catch (error) {
        toast.error("No se pudo actualizar la reserva", {
          description:
            error instanceof ApiError ? error.message : "Intentá de nuevo.",
        });
        return;
      }

      setItems((prev) =>
        prev.map((entry) =>
          entry.lineId === lineId
            ? {
                ...entry,
                quantity,
                reservationId: reservation.id,
                reservationExpiresAt: reservation.expiresAt,
              }
            : entry,
        ),
      );
    },
    [items, removeItem],
  );

  /**
   * Limpieza total del carrito: libera las reservas de stock de la sesión y
   * vacía los ítems. Solo debe invocarse:
   *  - cuando el usuario confirma “Vaciar carrito”, o
   *  - cuando `/checkout/success` valida que la orden quedó `APPROVED`.
   * Nunca al crear la preferencia de pago ni al entrar/salir del checkout.
   */
  const clear = useCallback(async (options?: { silent?: boolean }) => {
    const sessionId = getSessionId();
    try {
      await apiFetch(
        `/api/reservations?sessionId=${encodeURIComponent(sessionId)}`,
        { method: "DELETE" },
      );
    } catch {
      // Se ignora si no había reservas.
    }
    setItems([]);
    if (!options?.silent) {
      toast.info("Carrito vaciado");
    }
  }, []);

  const expireReservation = useCallback((lineId: string) => {
    setItems((prev) =>
      prev.map((entry) =>
        entry.lineId === lineId
          ? {
              ...entry,
              reservationId: undefined,
              reservationExpiresAt: undefined,
            }
          : entry,
      ),
    );
  }, []);

  const setDeliveryType = useCallback((type: DeliveryType) => {
    setDeliveryTypeState(type);
    toast.success(
      type === "PICKUP"
        ? "Retiro en sucursal seleccionado"
        : "Envío a domicilio seleccionado",
    );
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      ),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      total,
      deliveryType,
      isOpen,
      setDeliveryType,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      expireReservation,
      openCart,
      closeCart,
    }),
    [
      items,
      itemCount,
      total,
      deliveryType,
      isOpen,
      setDeliveryType,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      expireReservation,
      openCart,
      closeCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return context;
}
