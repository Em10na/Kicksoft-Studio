"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0, background: "#f8f9fa" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Une erreur est survenue</h2>
          <p style={{ color: "#6c757d", marginBottom: "1.5rem" }}>{error.message || "Quelque chose s'est mal passe."}</p>
          <button
            onClick={() => unstable_retry()}
            style={{ padding: "10px 24px", background: "#4F46E5", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
          >
            Reessayer
          </button>
        </div>
      </body>
    </html>
  );
}
