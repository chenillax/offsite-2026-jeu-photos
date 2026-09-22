"use client";

// Onglet "Défis" : les défis de l'invité + l'envoi de photos.
// Une photo envoyée passe "en attente" jusqu'à la validation de Camille.
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import type { Challenge, Completion } from "@/lib/types";
import { compressImage } from "@/lib/image";
import { supabase } from "@/lib/supabaseClient";
import { requiredToFinish } from "@/lib/rules";
import ChallengeCard from "./ChallengeCard";

export default function DefisPanel({
  challenges,
  myCompletions,
  guestId,
  onChanged,
}: {
  challenges: Challenge[];
  myCompletions: Completion[];
  guestId: string;
  onChanged: () => void;
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byChallenge = new Map(myCompletions.map((c) => [c.challenge_id, c]));
  const total = challenges.length;
  // Il faut réaliser 5 défis sur 7 (borné au nombre de défis existants).
  const required = requiredToFinish(total);

  const approvedCount = myCompletions.filter(
    (c) => c.status === "approved"
  ).length;
  // "soumis" = une photo en attente OU validée (un refus ne compte pas).
  const submittedCount = challenges.filter((c) => {
    const s = byChallenge.get(c.id)?.status;
    return s === "pending" || s === "approved";
  }).length;
  const pendingCount = submittedCount - approvedCount;

  // Progression bornée à l'objectif (5) : au-delà, ce sont des défis bonus.
  const doneTowardGoal = Math.min(submittedCount, required);
  const enoughCovered = required > 0 && submittedCount >= required;
  const enoughApproved = required > 0 && approvedCount >= required;
  const waiting = enoughCovered && !enoughApproved; // assez soumis, pas encore validé

  // Confettis quand l'invité vient d'atteindre assez de défis validés.
  const firedRef = useRef(false);
  useEffect(() => {
    if (enoughApproved && !firedRef.current) {
      firedRef.current = true;
      const end = Date.now() + 1500;
      const colors = ["#f2941c", "#e0640f", "#c95e38", "#faf1e1"];
      (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors });
        confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
    if (!enoughApproved) firedRef.current = false;
  }, [enoughApproved]);

  async function handlePick(challengeId: string, file: File, caption?: string) {
    setError(null);
    setUploadingId(challengeId);
    try {
      const compressed = await compressImage(file);
      const path = `${guestId}/${challengeId}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("photos")
        .upload(path, compressed, {
          upsert: true,
          contentType: compressed.type || "image/jpeg",
        });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("photos").getPublicUrl(path);

      const res = await fetch("/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          challengeId,
          photoUrl: pub.publicUrl,
          caption,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur");
      }
      onChanged();
    } catch {
      setError("L'envoi a échoué. Vérifie ta connexion et réessaie.");
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      {/* Progression : objectif = 5 défis sur 7 */}
      <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-brown">Ta progression</span>
          <span className="text-amber-dark">
            {doneTowardGoal} / {required}
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-amber transition-all"
            style={{ width: required ? `${(doneTowardGoal / required) * 100}%` : "0%" }}
          />
        </div>
        <p className="mt-2 text-xs text-brown-soft">
          Objectif : {required} défis sur {total}
          {enoughCovered && submittedCount < total
            ? " · atteint ! Tu peux tenter les défis bonus 🌟"
            : ""}
          {pendingCount > 0 && (
            <>
              {" · "}
              {approvedCount} validé{approvedCount > 1 ? "s" : ""} · {pendingCount}{" "}
              en attente
            </>
          )}
        </p>
      </div>

      {/* Victoire : assez de défis validés par Camille */}
      {enoughApproved && (
        <div className="rounded-2xl border border-amber bg-amber/10 p-5 text-center">
          <p className="text-3xl">🎉</p>
          <h2 className="mt-1 text-2xl font-semibold text-brown">
            Bravo, tes défis sont validés !
          </h2>
          <p className="mt-2 text-sm text-brown-soft">
            Tu as atteint les {required} défis. Va voir ta position au classement
            🏆
          </p>
        </div>
      )}

      {/* En attente : assez soumis mais pas encore assez validé */}
      {waiting && (
        <div className="rounded-2xl border border-amber bg-amber/10 p-5 text-center">
          <p className="text-3xl">⏳</p>
          <h2 className="mt-1 text-xl font-semibold text-brown">
            Tu as soumis assez de défis !
          </h2>
          <p className="mt-2 text-brown-soft">
            Veuillez vous rapprocher de <strong>Camille Juliard</strong>{" "}
            ou d&apos;un invité d&apos;honneur pour faire valider tes photos.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-terracotta/10 px-4 py-3 text-center text-terracotta">
          {error}
        </p>
      )}

      {/* Liste des défis */}
      <div className="flex flex-col gap-3">
        {challenges.map((c, i) => (
          <ChallengeCard
            key={c.id}
            challenge={c}
            completion={byChallenge.get(c.id)}
            index={i}
            uploading={uploadingId === c.id}
            onPick={handlePick}
          />
        ))}
      </div>
    </div>
  );
}
