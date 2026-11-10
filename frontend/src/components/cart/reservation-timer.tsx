"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";

function getRemaining(expiresAt?: string) {
  if (!expiresAt) return 0;
  return Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );
}

export function ReservationTimer({
  expiresAt,
  onExpired,
}: {
  expiresAt?: string;
  onExpired?: () => void;
}) {
  const [remaining, setRemaining] = useState(() => getRemaining(expiresAt));
  const fired = useRef(false);
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    if (!expiresAt) return;

    fired.current = false;
    setRemaining(getRemaining(expiresAt));

    const interval = setInterval(() => {
      const next = getRemaining(expiresAt);
      setRemaining(next);

      if (next <= 0 && !fired.current) {
        fired.current = true;
        toast.warning("La reserva expiró", {
          description:
            "El stock volvió a estar disponible. Volvé a agregar el producto si lo necesitás.",
        });
        onExpiredRef.current?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const urgent = remaining <= 60;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        urgent ? "text-red-600" : "text-amber-600"
      }`}
    >
      <Clock className="h-3.5 w-3.5" />
      Reserva: {String(minutes).padStart(2, "0")}:
      {String(seconds).padStart(2, "0")}
    </span>
  );
}
