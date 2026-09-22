"use client";

// Écran d'entrée : l'invité choisit son nom dans la liste et entre directement
// dans le jeu (le chrono démarre à ce moment-là). Plus de question secrète.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { saveSession } from "@/lib/session";
import type { Guest } from "@/lib/types";
import { Skeleton, SunSpinner } from "@/components/Loader";

type NameRow = { id: string; name: string };

export default function GuestPicker({
  onJoined,
}: {
  onJoined: (guest: Guest) => void;
}) {
  const [guests, setGuests] = useState<NameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Charge la liste des noms au démarrage.
  useEffect(() => {
    supabase
      .from("guests")
      .select("id, name")
      .order("name")
      .then(({ data, error }) => {
        if (error) setError("Impossible de charger la liste des invités.");
        else setGuests(data ?? []);
        setLoading(false);
      });
  }, []);

  async function join(g: NameRow) {
    setJoiningId(g.id);
    setError(null);
    try {
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: g.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur");
      saveSession(json.guest as Guest);
      onJoined(json.guest as Guest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setJoiningId(null);
    }
  }

  const filtered = guests.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-10">
      <header className="mb-8 text-center">
        <p className="text-4xl">☀️</p>
        <h1 className="mt-2 text-3xl font-semibold text-terracotta">
          Le jeu du Voyage 2026
        </h1>
        <p className="mt-2 text-brown-soft">
          Qui es-tu ? Choisis ton nom pour commencer.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-xl bg-terracotta/10 px-4 py-3 text-center text-terracotta">
          {error}
        </p>
      )}

      <input
        type="text"
        inputMode="search"
        placeholder="Cherche ton nom…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-2xl border border-sand bg-white px-4 py-3 text-brown outline-none focus:border-amber"
      />

      {loading ? (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-[58px] w-full" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((g) => (
            <li key={g.id}>
              <button
                onClick={() => join(g)}
                disabled={joiningId !== null}
                className="w-full rounded-2xl border border-sand bg-white px-5 py-4 text-left text-lg text-brown shadow-sm transition active:scale-[0.98] hover:border-amber disabled:opacity-50"
              >
                {joiningId === g.id ? (
                  <span className="flex items-center gap-2 text-brown-soft">
                    <SunSpinner size={20} /> Connexion…
                  </span>
                ) : (
                  g.name
                )}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-brown-soft">Aucun nom trouvé.</p>
          )}
        </ul>
      )}
    </main>
  );
}
