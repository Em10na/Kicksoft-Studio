"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ParametresPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [newsletter, setNewsletter] = useState(false);
  const [newsletterId, setNewsletterId] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data } = await supabase.from("newsletter_subscribers").select("id, active").eq("email", user.email).single();
      if (data) { setNewsletter(data.active); setNewsletterId(data.id); }
      setLoading(false);
    }
    charger();
  }, []);

  async function toggleNewsletter() {
    const nouvelEtat = !newsletter;
    if (newsletterId) {
      await supabase.from("newsletter_subscribers").update({ active: nouvelEtat }).eq("id", newsletterId);
    } else {
      const { data } = await supabase.from("newsletter_subscribers").insert({ email, active: true }).select("id").single();
      if (data) setNewsletterId(data.id);
    }
    setNewsletter(nouvelEtat);
    setAlert({ message: nouvelEtat ? "Vous etes inscrit a la newsletter !" : "Vous etes desinscrit de la newsletter.", type: "success" });
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  if (loading) return <p style={{ color: "var(--fg-mute)" }}>Chargement...</p>;

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s5)" }}>Parametres</h2>

      {alert.message && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--r)", marginBottom: "var(--s4)", fontSize: "var(--text-sm)",
          background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
          {alert.message}
        </div>
      )}

      {/* Newsletter */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-lg)", padding: "var(--s6)", marginBottom: "var(--s5)" }}>
        <h3 style={{ fontSize: "var(--text-md)", marginBottom: "var(--s4)" }}>Newsletter</h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--fg-soft)", marginBottom: "4px" }}>Recevoir les offres, nouveautes et promotions par email.</p>
            <p style={{ fontSize: "11px", fontFamily: "var(--ff-mono)", color: "var(--fg-mute)" }}>{email}</p>
          </div>
          <button onClick={toggleNewsletter}
            style={{ padding: "8px 20px", borderRadius: "var(--r)", border: "1px solid var(--rule)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer",
              background: newsletter ? "var(--emerald)" : "var(--paper)", color: newsletter ? "white" : "var(--ink)" }}>
            {newsletter ? "Inscrit" : "S'inscrire"}
          </button>
        </div>
      </div>

      {/* Preferences notifications */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-lg)", padding: "var(--s6)", marginBottom: "var(--s5)" }}>
        <h3 style={{ fontSize: "var(--text-md)", marginBottom: "var(--s4)" }}>Notifications</h3>
        {[
          { label: "Confirmation de commande", desc: "Email envoye apres chaque commande passee.", actif: true },
          { label: "Suivi de livraison", desc: "Email envoye quand votre commande est expediee.", actif: true },
          { label: "Offres personnalisees", desc: "Recommandations basees sur vos achats precedents.", actif: false },
        ].map((n) => (
          <div key={n.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--s3) 0", borderBottom: "1px solid var(--rule)" }}>
            <div>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "2px" }}>{n.label}</p>
              <p style={{ fontSize: "11px", color: "var(--fg-mute)" }}>{n.desc}</p>
            </div>
            <div style={{ width: "44px", height: "24px", borderRadius: "12px", background: n.actif ? "var(--emerald)" : "var(--rule)", position: "relative", cursor: "pointer" }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "9px", background: "white", position: "absolute", top: "3px", left: n.actif ? "22px" : "4px", transition: "left 0.2s" }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--rose)", borderRadius: "var(--r-lg)", padding: "var(--s6)" }}>
        <h3 style={{ fontSize: "var(--text-md)", marginBottom: "var(--s3)", color: "var(--rose)" }}>Zone de danger</h3>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--fg-soft)", marginBottom: "var(--s4)" }}>
          La suppression de votre compte est irreversible. Toutes vos donnees seront perdues.
        </p>
        <button style={{ padding: "8px 20px", background: "none", border: "1px solid var(--rose)", borderRadius: "var(--r)", color: "var(--rose)", fontSize: "var(--text-sm)", cursor: "pointer" }}>
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}
