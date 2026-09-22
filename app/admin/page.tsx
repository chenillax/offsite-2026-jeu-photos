"use client";

// Page /admin : connexion par mot de passe, puis tableau de validation.
import { useEffect, useState } from "react";
import AdminDashboard from "@/components/AdminDashboard";
import { SunLoader, SunSpinner } from "@/components/Loader";

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Au montage : déjà connectée ? (cookie)
  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((j) => setAuthed(Boolean(j.authed)))
      .catch(() => setAuthed(false));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur");
      setAuthed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setSubmitting(false);
    }
  }

  if (authed === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <SunLoader />
      </div>
    );
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
        <header className="mb-8 text-center">
          <p className="text-4xl">☀️</p>
          <h1 className="mt-2 text-2xl font-semibold text-terracotta">
            Espace Camille
          </h1>
          <p className="mt-2 text-brown-soft">
            Entre le mot de passe pour valider les photos.
          </p>
        </header>

        {error && (
          <p className="mb-4 rounded-xl bg-terracotta/10 px-4 py-3 text-center text-terracotta">
            {error}
          </p>
        )}

        <form onSubmit={login} className="flex flex-col gap-4">
          <input
            autoFocus
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-sand bg-white px-4 py-3 text-brown outline-none focus:border-amber"
          />
          <button
            type="submit"
            disabled={submitting || !password}
            className="flex items-center justify-center gap-2 rounded-2xl bg-amber px-5 py-4 text-lg font-semibold text-white shadow-sm transition active:scale-[0.98] hover:bg-amber-dark disabled:opacity-50"
          >
            {submitting ? (
              <>
                <SunSpinner size={20} tone="light" /> Connexion…
              </>
            ) : (
              "Entrer"
            )}
          </button>
        </form>
      </main>
    );
  }

  return <AdminDashboard />;
}
