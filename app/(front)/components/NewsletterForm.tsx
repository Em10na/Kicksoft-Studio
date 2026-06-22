"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NewsletterForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [statut, setStatut] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatut("loading");

    const { error } = await supabase.from("newsletter_subscribers").insert({
      email: email.trim().toLowerCase(),
      active: true,
    });

    if (error) {
      if (error.code === "23505") {
        setStatut("success");
        setMessage("Vous etes deja inscrit(e) a notre newsletter !");
      } else {
        setStatut("error");
        setMessage("Erreur lors de l'inscription. Veuillez reessayer.");
      }
    } else {
      setStatut("success");
      setMessage("Inscription reussie ! Vous recevrez bientot nos offres exclusives.");
      setEmail("");
    }

    setTimeout(() => { setStatut("idle"); setMessage(""); }, 5000);
  }

  return (
    <form className="newsletter-form" onSubmit={handleSubmit}>
      {statut === "success" || statut === "error" ? (
        <p style={{ color: statut === "success" ? "var(--emerald)" : "var(--rose)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
          {message}
        </p>
      ) : (
        <>
          <input
            type="email"
            required
            placeholder="Votre adresse email"
            aria-label="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn" type="submit" disabled={statut === "loading"}>
            {statut === "loading" ? "..." : "S'inscrire →"}
          </button>
        </>
      )}
    </form>
  );
}
