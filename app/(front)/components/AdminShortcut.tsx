"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Bouton flottant "Dashboard" visible uniquement pour les utilisateurs
 * ayant le rôle "admin". Permet de basculer rapidement du front vers le BO.
 */
export default function AdminShortcut() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      // Vérifie que l'utilisateur a bien le rôle "admin"
      const { data: profile } = await supabase
        .from("profiles")
        .select("roles(name)")
        .eq("id", user.id)
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rolesRaw = profile?.roles as any;
      const role: string | undefined = Array.isArray(rolesRaw) ? rolesRaw[0]?.name : rolesRaw?.name;
      if (role === "admin") setShow(true);
    });
  }, []);

  if (!show) return null;

  return (
    <Link href="/admin" className="admin-shortcut" title="Accéder au tableau de bord admin">
      {/* Grille 2×2 — icône dashboard */}
      <svg
        className="admin-shortcut__icon"
        width="15" height="15"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3"  y="3"  width="7" height="7" rx="1.5" />
        <rect x="14" y="3"  width="7" height="7" rx="1.5" />
        <rect x="3"  y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
      <span>Dashboard</span>
      {/* Flèche sortante */}
      <svg
        className="admin-shortcut__arrow"
        width="11" height="11"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M7 17L17 7M17 7H7M17 7v10" />
      </svg>
    </Link>
  );
}
