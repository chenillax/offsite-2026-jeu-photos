"use client";

// Tableau de validation des photos pour Camille.
// Elle voit toutes les photos (filtre "à valider" par défaut) et clique
// Valider / Refuser. Mise à jour en temps réel.
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import type { Guest, Challenge, Completion } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { SunLoader, SunSpinner } from "./Loader";

type Filter = "pending" | "all";

export default function AdminDashboard() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [processing, setProcessing] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [ch, co, gu] = await Promise.all([
      supabase.from("challenges").select("*").order("position"),
      supabase
        .from("completions")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("guests").select("id, name, started_at, finished_at"),
    ]);
    if (ch.data) setChallenges(ch.data as Challenge[]);
    if (co.data) setCompletions(co.data as Completion[]);
    if (gu.data) setGuests(gu.data as Guest[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Chargement initial + temps réel au montage (volontaire).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
    const channel = supabase
      .channel("admin-photos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "completions" },
        () => fetchAll()
      )
      .subscribe();
    // Filet de sécurité (idem) pour ne jamais rester figé.
    const poll = setInterval(fetchAll, 8000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [fetchAll]);

  const guestName = useMemo(
    () => new Map(guests.map((g) => [g.id, g.name])),
    [guests]
  );
  const challengeTitle = useMemo(
    () => new Map(challenges.map((c) => [c.id, c.title])),
    [challenges]
  );

  const pendingCount = completions.filter((c) => c.status === "pending").length;

  // En attente d'abord, puis le reste (déjà trié du plus récent au plus ancien).
  const sorted = [...completions].sort(
    (a, b) =>
      (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1)
  );
  const visible =
    filter === "pending"
      ? sorted.filter((c) => c.status === "pending")
      : sorted;

  async function review(id: string, decision: "approve" | "reject") {
    setProcessing(id);
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completionId: id, decision }),
      });
      if (!res.ok) throw new Error();
      await fetchAll();
    } catch {
      // silencieux : le temps réel rattrapera de toute façon
    } finally {
      setProcessing(null);
    }
  }

  // Télécharge toutes les photos dans un ZIP (téléchargement natif du navigateur,
  // qui écrit directement sur le disque — adapté aux gros volumes).
  function exportPhotos() {
    if (!completions.length || exporting) return;
    setExportError(null);
    setExporting(true);
    try {
      const a = document.createElement("a");
      a.href = "/api/admin/export";
      a.download = "photos-mariage-marine-clement.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setExportError("Téléchargement impossible. Réessaie.");
    }
    // On ne peut pas détecter la fin d'un téléchargement natif : on réactive
    // le bouton après quelques secondes.
    setTimeout(() => setExporting(false), 5000);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-5 text-center">
        <h1 className="text-3xl font-semibold text-terracotta">
          Validation des photos ☀️
        </h1>
        <p className="mt-1 text-brown-soft">
          Valide ou refuse chaque photo. Les invités attendent ta validation
          pour gagner.
        </p>

        <div className="mt-4 flex flex-col items-center gap-1">
          <button
            onClick={exportPhotos}
            disabled={exporting || completions.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-sand bg-white px-5 py-2.5 text-sm font-semibold text-brown shadow-sm transition active:scale-[0.98] hover:border-amber disabled:opacity-50"
          >
            {exporting ? (
              <>
                <SunSpinner size={18} /> Préparation du ZIP…
              </>
            ) : (
              <>📦 Télécharger toutes les photos ({completions.length})</>
            )}
          </button>
          {exporting && (
            <p className="text-xs text-brown-soft">
              La préparation peut prendre un moment selon le nombre de photos.
            </p>
          )}
          {exportError && (
            <p className="text-xs text-terracotta">{exportError}</p>
          )}
        </div>
      </header>

      {/* Filtre */}
      <div className="mb-5 flex items-center justify-center gap-2">
        <button
          onClick={() => setFilter("pending")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            filter === "pending"
              ? "bg-amber text-white"
              : "border border-sand bg-white text-brown-soft"
          }`}
        >
          À valider ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            filter === "all"
              ? "bg-amber text-white"
              : "border border-sand bg-white text-brown-soft"
          }`}
        >
          Toutes ({completions.length})
        </button>
      </div>

      {loading ? (
        <SunLoader label="Chargement des photos…" />
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-brown-soft">
          {filter === "pending"
            ? "🎉 Aucune photo en attente — tout est à jour !"
            : "Aucune photo pour l'instant."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <article
              key={c.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-sand bg-white shadow-sm"
            >
              <div className="relative aspect-square w-full bg-brown/5">
                <Image
                  src={c.photo_url}
                  alt={challengeTitle.get(c.challenge_id) ?? "Photo"}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-contain"
                />
                <StatusBadge status={c.status} />
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <p className="font-semibold text-brown">
                    {guestName.get(c.guest_id) ?? "Un invité"}
                  </p>
                  <p className="text-sm text-brown-soft">
                    {challengeTitle.get(c.challenge_id) ?? "Défi"} ·{" "}
                    {timeAgo(c.created_at)}
                  </p>
                  {c.caption && (
                    <p className="mt-1 rounded-lg bg-amber/10 px-2.5 py-1.5 text-sm text-brown">
                      🎨 Œuvre imitée : <strong>{c.caption}</strong>
                    </p>
                  )}
                </div>

                <div className="mt-auto">
                  {processing === c.id ? (
                    <div className="flex justify-center py-2">
                      <SunSpinner size={24} />
                    </div>
                  ) : c.status === "pending" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => review(c.id, "reject")}
                        className="rounded-xl bg-[#c0392b] px-3 py-3 font-semibold text-white transition active:scale-[0.98]"
                      >
                        ✕ Refuser
                      </button>
                      <button
                        onClick={() => review(c.id, "approve")}
                        className="rounded-xl bg-[#3f8f4f] px-3 py-3 font-semibold text-white transition active:scale-[0.98]"
                      >
                        ✓ Valider
                      </button>
                    </div>
                  ) : c.status === "approved" ? (
                    <button
                      onClick={() => review(c.id, "reject")}
                      className="w-full rounded-xl border border-sand px-3 py-2 text-sm text-brown-soft transition active:scale-[0.98]"
                    >
                      Finalement, refuser
                    </button>
                  ) : (
                    <button
                      onClick={() => review(c.id, "approve")}
                      className="w-full rounded-xl border border-sand px-3 py-2 text-sm text-brown-soft transition active:scale-[0.98]"
                    >
                      Finalement, valider
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: Completion["status"] }) {
  const map = {
    pending: { label: "En attente", className: "bg-amber text-white" },
    approved: { label: "Validée", className: "bg-[#3f8f4f] text-white" },
    rejected: { label: "Refusée", className: "bg-[#c0392b] text-white" },
  } as const;
  const s = map[status] ?? { label: "—", className: "bg-sand text-brown-soft" };
  return (
    <span
      className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}
    >
      {s.label}
    </span>
  );
}
