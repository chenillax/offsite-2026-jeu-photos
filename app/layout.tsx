import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

// Serif élégant pour les titres, sans-serif lisible pour le texte.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // URL publique de base : sert à rendre l'image d'aperçu (Open Graph) en URL
  // absolue accessible par WhatsApp/iMessage, et non en localhost.
  metadataBase: new URL("https://bingo-challenge-voeux-solaire.vercel.app"),
  title: "Le jeu du Voyage 2026",
  description: "Le jeu des invités du mariage ☀️",
  openGraph: {
    title: "Le jeu du Voyage 2026",
    description: "Le jeu des invités du mariage ☀️",
    type: "website",
  },
};

// Optimisé mobile : largeur = écran, pas de zoom intempestif.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf1e1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
