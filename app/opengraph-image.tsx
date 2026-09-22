import { ImageResponse } from "next/og";

// Image d'aperçu affichée par WhatsApp, iMessage, Facebook, etc. (Open Graph).
// Générée en PNG par Next.js. Le soleil est dessiné en divs (pas de police
// nécessaire) : fond crème, rayons terracotta, cœur orange.
export const alt = "Le jeu du Voyage 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const rays = Array.from({ length: 12 });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf1e1",
        }}
      >
        <div style={{ position: "relative", display: "flex", width: 400, height: 400 }}>
          {rays.map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 22,
                height: 78,
                marginLeft: -11,
                marginTop: -39,
                borderRadius: 11,
                background: "#c95e38",
                transform: `rotate(${i * 30}deg) translateY(-150px)`,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 210,
              height: 210,
              marginLeft: -105,
              marginTop: -105,
              borderRadius: 105,
              background: "#f2941c",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
