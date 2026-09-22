"use client";

// Barre de navigation fixée en bas (ergonomie mobile : le pouce y accède
// facilement).
export type Tab = "defis" | "classement" | "live";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "defis", label: "Défis", icon: "🎯" },
  { id: "classement", label: "Classement", icon: "🏆" },
  { id: "live", label: "Live", icon: "📸" },
];

export default function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav className="sticky bottom-0 z-10 border-t border-sand bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {TABS.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition ${
                isActive ? "text-amber-dark" : "text-brown-soft"
              }`}
            >
              <span className={`text-xl ${isActive ? "" : "opacity-60"}`}>
                {t.icon}
              </span>
              <span className={isActive ? "font-semibold" : ""}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
