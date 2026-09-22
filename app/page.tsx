"use client";

// Point d'entrée de l'app :
//   - on regarde si un invité est déjà connecté (session locale)
//   - sinon : écran d'accueil (règles) puis sélection du nom
import { useEffect, useState } from "react";
import { loadSession, clearSession } from "@/lib/session";
import type { Guest } from "@/lib/types";
import Welcome from "@/components/Welcome";
import GuestPicker from "@/components/GuestPicker";
import GameShell from "@/components/GameShell";
import { SunLoader } from "@/components/Loader";

export default function Home() {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [ready, setReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // localStorage n'existe que côté navigateur -> on lit après le montage.
  // (setState au montage est volontaire ici : c'est le pattern standard pour
  //  hydrater depuis localStorage sans casser le rendu serveur.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuest(loadSession());
    setReady(true);
  }, []);

  function handleLogout() {
    clearSession();
    setGuest(null);
  }

  // Pendant qu'on lit la session locale : petit loader plutôt qu'un écran vide.
  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <SunLoader />
      </div>
    );
  }

  if (guest) return <GameShell guest={guest} onLogout={handleLogout} />;
  if (showWelcome) return <Welcome onStart={() => setShowWelcome(false)} />;
  return <GuestPicker onJoined={setGuest} />;
}
