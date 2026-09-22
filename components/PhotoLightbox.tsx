"use client";

// Affiche une seule photo en plein écran (sans rognage), façon "lightbox".
// Ouvert en tapant une photo du feed. Pour fermer : tap, croix ✕, swipe
// vertical, ou Échap.
import { useEffect, useRef } from "react";
import Image from "next/image";

export default function PhotoLightbox({
  src,
  title,
  subtitle,
  onClose,
}: {
  src: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  // Blocage du défilement de la page tant que la photo est ouverte.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Échap pour fermer (desktop).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Tap (sans glissement) ou swipe vertical = fermer.
  const start = useRef<{ x: number; y: number } | null>(null);
  function onPointerDown(e: React.PointerEvent) {
    start.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e: React.PointerEvent) {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = Math.abs(e.clientX - s.x);
    const dy = Math.abs(e.clientY - s.y);
    if (dy > 60 || (dx < 30 && dy < 30)) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex touch-none select-none flex-col bg-black"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        aria-label="Fermer"
        className="absolute right-4 top-3 z-10 text-2xl leading-none text-white/90"
      >
        ✕
      </button>

      <div className="relative flex-1">
        <Image
          src={src}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-contain"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-7 pt-16 text-white">
        <p className="text-lg font-semibold">{title}</p>
        {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
      </div>
    </div>
  );
}
