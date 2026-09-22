"use client";

// Coquille principale une fois l'invité authentifié.
// Responsabilités :
//   - charger défis / invités / validations
//   - écouter le temps réel (toute nouvelle validation rafraîchit les données)
//   - afficher l'onglet actif (Défis / Classement / Live)
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Guest, Challenge, Completion, ReactionValue } from "@/lib/types";
import {
  countByCompletion,
  namesByCompletion,
  nextReaction,
} from "@/lib/reactions";
import TabBar, { type Tab } from "./TabBar";
import DefisPanel from "./DefisPanel";
import Leaderboard from "./Leaderboard";
import LiveFeed from "./LiveFeed";
import { Skeleton } from "./Loader";

export default function GameShell({
  guest,
  onLogout,
}: {
  guest: Guest;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>("defis");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  // Réactions brutes (phase 2 : guest_id lisible) → tout le reste en découle.
  const [reactions, setReactions] = useState<
    { completion_id: string; guest_id: string; value: ReactionValue }[]
  >([]);

  const fetchAll = useCallback(async () => {
    const [ch, co, gu, re] = await Promise.all([
      supabase.from("challenges").select("*").order("position"),
      supabase
        .from("completions")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("guests")
        .select("id, name, started_at, submitted_all_at, finished_at"),
      // Phase 2 : on lit aussi guest_id (pour afficher les noms).
      supabase.from("reactions").select("completion_id, guest_id, value"),
    ]);
    if (ch.data) setChallenges(ch.data as Challenge[]);
    if (co.data) setCompletions(co.data as Completion[]);
    if (gu.data) setGuests(gu.data as Guest[]);
    if (re.data)
      setReactions(
        re.data as {
          completion_id: string;
          guest_id: string;
          value: ReactionValue;
        }[]
      );
    setLoading(false);
  }, []);

  // Tout dérive des réactions brutes : compteurs, noms, et MA réaction.
  const guestName = useMemo(
    () => new Map(guests.map((g) => [g.id, g.name])),
    [guests]
  );
  const reactionCounts = useMemo(
    () => countByCompletion(reactions),
    [reactions]
  );
  const reactionNames = useMemo(
    () => namesByCompletion(reactions, (id) => guestName.get(id) ?? "Un invité"),
    [reactions, guestName]
  );
  const myReactions = useMemo(() => {
    const map = new Map<string, ReactionValue>();
    for (const r of reactions)
      if (r.guest_id === guest.id) map.set(r.completion_id, r.value);
    return map;
  }, [reactions, guest.id]);

  // Pose / bascule / annule ma réaction, avec mise à jour optimiste immédiate
  // (on modifie la liste brute → compteurs et noms se recalculent tout seuls).
  const react = useCallback(
    async (completionId: string, value: ReactionValue) => {
      const current =
        reactions.find(
          (r) => r.guest_id === guest.id && r.completion_id === completionId
        )?.value ?? null;
      const target = nextReaction(current, value);

      setReactions((prev) => {
        const without = prev.filter(
          (r) =>
            !(r.guest_id === guest.id && r.completion_id === completionId)
        );
        return target === null
          ? without
          : [...without, { completion_id: completionId, guest_id: guest.id, value: target }];
      });

      try {
        await fetch("/api/react", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId: guest.id, completionId, value }),
        });
      } catch {
        // l'optimiste reste affiché ; le rechargement ci-dessous réconcilie
      }
      fetchAll(); // recale depuis le serveur (réactions des autres)
    },
    [reactions, guest.id, fetchAll]
  );

  useEffect(() => {
    // Chargement initial + branchement du temps réel au montage (volontaire).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();

    // Temps réel : dès qu'une validation, un invité ou une réaction change,
    // on recharge.
    const channel = supabase
      .channel("jeu-mariage")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "completions" },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guests" },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reactions" },
        () => fetchAll()
      )
      .subscribe();

    // Filet de sécurité : si le temps réel rate un événement, on recharge
    // périodiquement pour que le classement/feed ne restent jamais figés.
    const poll = setInterval(fetchAll, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [fetchAll]);

  const myCompletions = completions.filter((c) => c.guest_id === guest.id);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* En-tête */}
      <header className="flex items-center justify-between border-b border-sand px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-amber-dark">
            Bienvenue
          </p>
          <p className="truncate font-semibold text-brown">{guest.name}</p>
        </div>
        <button
          onClick={onLogout}
          className="shrink-0 text-sm text-brown-soft underline"
        >
          Changer
        </button>
      </header>

      {/* Contenu */}
      <main className="flex-1">
        {loading ? (
          <div className="flex flex-col gap-4 px-4 py-5">
            <Skeleton className="h-16 w-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : tab === "defis" ? (
          <DefisPanel
            challenges={challenges}
            myCompletions={myCompletions}
            guestId={guest.id}
            onChanged={fetchAll}
          />
        ) : tab === "classement" ? (
          <Leaderboard
            guests={guests}
            completions={completions}
            totalChallenges={challenges.length}
            meId={guest.id}
          />
        ) : (
          <LiveFeed
            completions={completions.filter((c) => c.status !== "rejected")}
            guests={guests}
            challenges={challenges}
            reactionCounts={reactionCounts}
            reactionNames={reactionNames}
            myReactions={myReactions}
            onReact={react}
          />
        )}
      </main>

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
