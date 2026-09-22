"use client";

// Écran d'accueil affiché en arrivant sur le jeu : explique les règles, puis
// un bouton « C'est parti ! » mène à la sélection du nom.
export default function Welcome({ onStart }: { onStart: () => void }) {
  const rules = [
    { icon: "📝", text: "Choisis ton prénom dans la liste pour rejoindre le jeu." },
    { icon: "🎯", text: "Réalise au moins 5 défis sur 7 en prenant les photos demandées." },
    { icon: "🎁", text: "Les 3 plus rapides à valider leurs 5 défis gagnent un prix !" },
    { icon: "🏆", text: "Suis le classement et le mur de photos en direct." },
  ];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-10">
      <header className="mb-8 text-center">
        <p className="text-5xl">☀️</p>
        <h1 className="mt-3 text-3xl font-semibold text-terracotta">
          Le jeu du Voyage 2026
        </h1>
        <p className="mt-3 text-brown-soft">
          Bienvenue ! Pendant la soirée, relève les défis photo : réalises-en au
          moins 5 sur 7 le plus vite possible.
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-3">
        <h2 className="text-center text-xl font-semibold text-brown">
          Comment jouer
        </h2>
        {rules.map((r, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-2xl border border-sand bg-white px-4 py-3 shadow-sm"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber/15 text-lg">
              {r.icon}
            </span>
            <p className="pt-0.5 text-brown">{r.text}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="rounded-2xl bg-amber px-5 py-4 text-lg font-semibold text-white shadow-sm transition active:scale-[0.98] hover:bg-amber-dark"
      >
        C&apos;est parti ! ☀️
      </button>
    </main>
  );
}
