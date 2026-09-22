"use client";

// Onglet "Live" : le mur des dernières photos validées par tout le monde,
// façon Flash Invaders. Mise à jour en temps réel.
import { useState } from "react";
import Image from "next/image";
import type {
  Guest,
  Challenge,
  Completion,
  ReactionValue,
  ReactionCounts,
} from "@/lib/types";
import { timeAgo } from "@/lib/format";
import PhotoStories from "./PhotoStories";
import PhotoLightbox from "./PhotoLightbox";

type Names = { like: string[]; dislike: string[] };

export default function LiveFeed({
  completions,
  guests,
  challenges,
  reactionCounts,
  reactionNames,
  myReactions,
  onReact,
}: {
  completions: Completion[];
  guests: Guest[];
  challenges: Challenge[];
  reactionCounts: Map<string, ReactionCounts>;
  reactionNames: Map<string, Names>;
  myReactions: Map<string, ReactionValue>;
  onReact: (completionId: string, value: ReactionValue) => void;
}) {
  const guestName = new Map(guests.map((g) => [g.id, g.name]));
  const challengeTitle = new Map(challenges.map((c) => [c.id, c.title]));
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [lightbox, setLightbox] = useState<Completion | null>(null);

  // completions est déjà trié du plus récent au plus ancien.
  return (
    <div className="px-4 py-5">
      <h2 className="mb-1 text-center text-2xl font-semibold text-brown">
        En direct 📸
      </h2>

      {completions.length > 0 && (
        <div className="mb-4 flex justify-center">
          <button
            onClick={() => setStoriesOpen(true)}
            className="rounded-full bg-amber px-5 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:bg-amber-dark"
          >
            ▶ Diaporama
          </button>
        </div>
      )}

      {storiesOpen && (
        <PhotoStories
          completions={completions}
          guests={guests}
          challenges={challenges}
          onClose={() => setStoriesOpen(false)}
        />
      )}

      {lightbox && (
        <PhotoLightbox
          src={lightbox.photo_url}
          title={guestName.get(lightbox.guest_id) ?? "Un invité"}
          subtitle={`${challengeTitle.get(lightbox.challenge_id) ?? "Défi"} · ${timeAgo(
            lightbox.created_at
          )}`}
          onClose={() => setLightbox(null)}
        />
      )}

      {completions.length === 0 ? (
        <p className="text-center text-brown-soft">
          Aucune photo pour l&apos;instant. Sois le premier !
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {completions.map((c) => (
            <article
              key={c.id}
              className="overflow-hidden rounded-2xl border border-sand bg-white shadow-sm"
            >
              <button
                onClick={() => setLightbox(c)}
                aria-label="Voir la photo en grand"
                className="relative block aspect-square w-full bg-sand"
              >
                <Image
                  src={c.photo_url}
                  alt={challengeTitle.get(c.challenge_id) ?? "Défi"}
                  fill
                  sizes="(max-width: 448px) 100vw, 448px"
                  className="object-cover"
                />
              </button>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-brown">
                    {guestName.get(c.guest_id) ?? "Un invité"}
                  </p>
                  <p className="truncate text-sm text-brown-soft">
                    {challengeTitle.get(c.challenge_id) ?? "Défi"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-brown-soft">
                  {timeAgo(c.created_at)}
                </span>
              </div>

              {/* Réactions 👍 / 👎 : boutons + noms de ceux qui ont réagi. */}
              <div className="border-t border-sand px-4 py-2.5">
                <div className="flex gap-2">
                  <ReactionButton
                    emoji="👍"
                    count={reactionCounts.get(c.id)?.like ?? 0}
                    active={myReactions.get(c.id) === "like"}
                    activeClass="border-amber bg-amber/10 text-amber-dark"
                    onClick={() => onReact(c.id, "like")}
                  />
                  <ReactionButton
                    emoji="👎"
                    count={reactionCounts.get(c.id)?.dislike ?? 0}
                    active={myReactions.get(c.id) === "dislike"}
                    activeClass="border-terracotta bg-terracotta/10 text-terracotta"
                    onClick={() => onReact(c.id, "dislike")}
                  />
                </div>
                <NamesLine
                  emoji="👍"
                  names={reactionNames.get(c.id)?.like ?? []}
                />
                <NamesLine
                  emoji="👎"
                  names={reactionNames.get(c.id)?.dislike ?? []}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ReactionButton({
  emoji,
  count,
  active,
  activeClass,
  onClick,
}: {
  emoji: string;
  count: number;
  active: boolean;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2 text-sm font-semibold transition active:scale-[0.97] ${
        active
          ? activeClass
          : "border-sand bg-white text-brown-soft hover:border-amber"
      }`}
    >
      <span className="text-base">{emoji}</span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}

// Ligne des noms qui ont réagi. Au-delà de 6 noms, on tronque avec un bouton
// « +N » qui déplie / replie la liste complète.
const MAX_NAMES = 6;

function NamesLine({ emoji, names }: { emoji: string; names: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (names.length === 0) return null;

  const overflow = names.length - MAX_NAMES;
  const shown = expanded ? names : names.slice(0, MAX_NAMES);

  return (
    <p className="mt-2 text-xs leading-relaxed text-brown-soft">
      <span className="mr-1">{emoji}</span>
      {shown.join(", ")}
      {overflow > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-1 font-semibold text-amber-dark underline"
        >
          {expanded ? "voir moins" : `+${overflow}`}
        </button>
      )}
    </p>
  );
}
