import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Autorise l'optimiseur d'images Next/Vercel à servir les photos stockées
    // sur Supabase (redimensionnées + WebP + chargement paresseux).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gnozaaqbampisnkvqijd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
