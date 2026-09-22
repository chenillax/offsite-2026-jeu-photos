"use client";

// Composants d'UI pour les états de chargement :
//  - SunSpinner : un soleil qui tourne (réutilisable, taille + teinte au choix)
//  - SunLoader  : le SunSpinner centré avec un libellé (loader principal)
//  - Skeleton   : bloc qui "pulse" (placeholder pendant le chargement)

export function SunSpinner({
  size = 44,
  tone = "brand",
}: {
  size?: number;
  tone?: "brand" | "light";
}) {
  const rays = Array.from({ length: 12 });
  const rayColor = tone === "light" ? "#ffffff" : "#c95e38";
  const coreColor = tone === "light" ? "#ffffff" : "#f2941c";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="animate-spin"
      style={{ animationDuration: "1.6s" }}
      aria-hidden
    >
      <g stroke={rayColor} strokeWidth={5} strokeLinecap="round">
        {rays.map((_, i) => (
          <line
            key={i}
            x1="32"
            y1="6"
            x2="32"
            y2="15"
            transform={`rotate(${i * 30} 32 32)`}
          />
        ))}
      </g>
      <circle cx="32" cy="32" r="10" fill={coreColor} />
    </svg>
  );
}

export function SunLoader({ label }: { label?: string }) {
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-3 py-20 text-brown-soft"
      role="status"
      aria-live="polite"
    >
      <SunSpinner />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-sand ${className}`} />;
}
