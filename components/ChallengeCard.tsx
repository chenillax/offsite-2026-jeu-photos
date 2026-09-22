"use client";

// Une carte de défi. Quatre états selon la validation par Camille :
//   - "à faire"      : bouton appareil photo
//   - "en attente"   : photo envoyée, attend la validation de Camille
//   - "validé"       : Camille a validé
//   - "refusé"       : Camille a refusé -> on peut reprendre une photo
import { useRef, useState } from "react";
import Image from "next/image";
import type { Challenge, Completion } from "@/lib/types";
import { SunSpinner } from "@/components/Loader";

export default function ChallengeCard({
  challenge,
  completion,
  index,
  uploading,
  onPick,
}: {
  challenge: Challenge;
  completion: Completion | undefined;
  index: number;
  uploading: boolean;
  onPick: (challengeId: string, file: File, caption?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Légende (ex. l'œuvre imitée) si ce défi en demande une.
  const [caption, setCaption] = useState(completion?.caption ?? "");

  const status = completion?.status;
  const approved = status === "approved";
  const pending = status === "pending";
  const rejected = status === "rejected";
  const showCamera = !completion || rejected;
  const wantsCaption = Boolean(challenge.caption_label);
  // Pour un défi à légende, on ne peut pas envoyer tant que le champ est vide.
  const captionMissing = wantsCaption && !caption.trim();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onPick(challenge.id, file, wantsCaption ? caption : undefined);
    e.target.value = ""; // permet de re-sélectionner le même fichier
  }

  const badge = approved
    ? { sym: "✓", cls: "bg-sage/20 text-sage" }
    : pending
      ? { sym: "⏳", cls: "bg-amber/15 text-amber-dark" }
      : rejected
        ? { sym: "✕", cls: "bg-terracotta/15 text-terracotta" }
        : { sym: String(index + 1), cls: "bg-amber/15 text-amber-dark" };

  const border = approved
    ? "border-sage/60"
    : pending
      ? "border-amber/40"
      : rejected
        ? "border-terracotta/40"
        : "border-sand";

  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm transition ${border}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${badge.cls}`}
        >
          {badge.sym}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-brown">{challenge.title}</h3>
          <p className="mt-0.5 text-sm text-brown-soft">{challenge.description}</p>
        </div>
      </div>

      <div className="mt-4">
        {completion && (
          <div className="flex items-center gap-3">
            <Image
              src={completion.photo_url}
              alt={challenge.title}
              width={64}
              height={64}
              className={`h-16 w-16 rounded-xl object-cover ${
                rejected ? "opacity-50" : ""
              }`}
            />
            <div className="min-w-0">
              <span
                className={`block font-medium ${
                  approved
                    ? "text-sage"
                    : pending
                      ? "text-amber-dark"
                      : "text-terracotta"
                }`}
              >
                {approved
                  ? "Validé !"
                  : pending
                    ? "En attente de validation…"
                    : "Photo refusée, reprends-en une."}
              </span>
              {wantsCaption && completion.caption && !rejected && (
                <span className="mt-0.5 block truncate text-sm text-brown-soft">
                  🎨 {completion.caption}
                </span>
              )}
            </div>
          </div>
        )}

        {showCamera && (
          <div className={completion ? "mt-3" : ""}>
            {wantsCaption && (
              <label className="mb-2 block">
                <span className="mb-1 block text-sm font-medium text-brown">
                  {challenge.caption_label}
                </span>
                <input
                  type="text"
                  value={caption}
                  maxLength={140}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ex. La Joconde, Le Cri…"
                  className="w-full rounded-xl border border-sand bg-white px-3 py-2 text-brown outline-none focus:border-amber"
                />
              </label>
            )}
            <button
              type="button"
              disabled={uploading || captionMissing}
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3 font-semibold text-white transition active:scale-[0.98] hover:bg-amber-dark disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <SunSpinner size={20} tone="light" /> Envoi en cours…
                </>
              ) : rejected ? (
                "📷 Reprendre la photo"
              ) : (
                "📷 Prendre la photo"
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleChange}
              className="hidden"
            />
            {captionMissing && (
              <p className="mt-2 text-center text-xs text-brown-soft">
                Remplis le champ ci-dessus pour pouvoir envoyer ta photo.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
