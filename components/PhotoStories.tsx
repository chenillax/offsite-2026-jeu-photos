"use client";

// Mode "Stories" plein écran : les photos validées défilent toutes seules en
// ordre aléatoire (~4s chacune), comme sur Instagram.
//   - tap à droite = suivante · tap à gauche = précédente
//   - appui maintenu = pause (reprend au relâchement)
//   - swipe vers le haut = quitter (croix ✕ aussi disponible)
//   - clavier : ←/→ naviguer, Espace pause, Échap quitter
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Guest, Challenge, Completion } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { shuffle } from "@/lib/shuffle";

const DURATION_MS = 4000; // durée d'affichage d'une photo
const TICK_MS = 50; // fréquence de mise à jour de la barre de progression

export default function PhotoStories({
  completions,
  guests,
  challenges,
  onClose,
}: {
  completions: Completion[];
  guests: Guest[];
  challenges: Challenge[];
  onClose: () => void;
}) {
  const guestName = new Map(guests.map((g) => [g.id, g.name]));
  const challengeTitle = new Map(challenges.map((c) => [c.id, c.title]));

  // Ordre aléatoire figé à l'ouverture ; on re-mélange à chaque tour de boucle.
  const [order, setOrder] = useState<Completion[]>(() => shuffle(completions));
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  // Dernière liste de photos connue (pour inclure les nouvelles au re-mélange).
  const latest = useRef(completions);
  useEffect(() => {
    latest.current = completions;
  }, [completions]);

  const current = order[idx];

  const next = useCallback(() => {
    setProgress(0);
    setIdx((i) => {
      if (i < order.length - 1) return i + 1;
      // Fin du tour : on re-mélange (en intégrant d'éventuelles nouvelles
      // photos) et on repart du début.
      setOrder(shuffle(latest.current));
      return 0;
    });
  }, [order.length]);

  const prev = useCallback(() => {
    setProgress(0);
    setIdx((i) => Math.max(0, i - 1));
  }, []);

  // Avancement automatique de la barre de progression.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setProgress((p) => Math.min(1, p + TICK_MS / DURATION_MS));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [paused, idx]);

  // Quand la barre est pleine, on passe à la photo suivante.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (progress >= 1) next();
  }, [progress, next]);

  // Préchargement de la photo suivante pour une transition fluide.
  useEffect(() => {
    const nextPhoto = order[idx + 1] ?? order[0];
    if (nextPhoto && typeof window !== "undefined") {
      const img = new window.Image();
      img.src = nextPhoto.photo_url;
    }
  }, [idx, order]);

  // Blocage du défilement de la page tant que le mode est ouvert.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Raccourcis clavier (desktop).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  // Gestes tactiles / souris : appui = pause ; au relâchement on décide
  // (swipe haut = quitter, sinon tap gauche/droite = naviguer).
  const start = useRef<{ x: number; y: number } | null>(null);
  function onPointerDown(e: React.PointerEvent) {
    start.current = { x: e.clientX, y: e.clientY };
    setPaused(true);
  }
  function onPointerUp(e: React.PointerEvent) {
    setPaused(false);
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) {
      onClose(); // swipe vertical (haut OU bas)
      return;
    }
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
      // tap : tiers gauche = précédente, reste = suivante
      if (e.clientX < window.innerWidth / 3) prev();
      else next();
    }
  }
  function onPointerCancel() {
    setPaused(false);
    start.current = null;
  }

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex touch-none select-none flex-col bg-black"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Barre de progression de la photo en cours + compteur + fermer */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-3 px-4 pt-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-white/80">
          {idx + 1}/{order.length}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          aria-label="Fermer"
          className="shrink-0 text-2xl leading-none text-white/90"
        >
          ✕
        </button>
      </div>

      {/* Photo (entière, sans rognage) */}
      <div className="relative flex-1">
        <Image
          key={current.id}
          src={current.photo_url}
          alt={challengeTitle.get(current.challenge_id) ?? "Photo"}
          fill
          priority
          draggable={false}
          sizes="100vw"
          className="pointer-events-none select-none object-contain [-webkit-touch-callout:none]"
        />
      </div>

      {/* Infos en bas : qui + quel défi + quand */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-7 pt-16 text-white">
        <p className="text-lg font-semibold">
          {guestName.get(current.guest_id) ?? "Un invité"}
        </p>
        <p className="text-sm text-white/80">
          {challengeTitle.get(current.challenge_id) ?? "Défi"} ·{" "}
          {timeAgo(current.created_at)}
        </p>
        <p className="mt-2 text-xs text-white/50">
          Tape pour avancer · glisse vers le haut ou le bas pour quitter
        </p>
      </div>
    </div>
  );
}
