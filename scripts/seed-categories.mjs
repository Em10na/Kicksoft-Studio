// One-off seed: inserts the DJI category list into public.categories.
// Skips any category whose name already exists (case-insensitive).
// Run with: node scripts/seed-categories.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants dans .env.local");
  process.exit(1);
}
const supabase = createClient(url, key);

// Same slug rule as the admin page, plus accent stripping for clean slugs
function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const CATEGORIES = [
  ["Drones", "Tous les drones DJI destinés à la photographie aérienne, à la vidéo, aux loisirs et aux usages professionnels."],
  ["Caméras d'action", "Caméras compactes conçues pour capturer des vidéos et des photos de haute qualité lors d'activités sportives et d'aventure."],
  ["Stabilisateurs (Gimbals)", "Stabilisateurs pour smartphones, appareils photo et caméras offrant des vidéos fluides et stables."],
  ["Caméras embarquées", "Caméras et nacelles compatibles avec les drones pour la photographie et la vidéographie aériennes."],
  ["Batteries", "Batteries intelligentes et accessoires d'alimentation pour prolonger l'autonomie des appareils DJI."],
  ["Hélices", "Hélices de remplacement ou de rechange pour les différents modèles de drones DJI."],
  ["Télécommandes", "Radiocommandes et contrôleurs permettant de piloter les drones avec précision."],
  ["Chargeurs et stations de charge", "Chargeurs, hubs de recharge et adaptateurs pour batteries et télécommandes."],
  ["Filtres d'objectif", "Filtres ND, CPL et UV destinés à améliorer la qualité des images et vidéos."],
  ["Sacs et étuis", "Sacs, valises et étuis de protection pour le transport sécurisé des équipements DJI."],
  ["Pièces de rechange", "Composants de remplacement tels que moteurs, protections d'hélices, câbles et autres pièces détachées."],
  ["Accessoires", "Ensemble des accessoires complémentaires : protections, supports, câbles, cartes mémoire, etc."],
];

const { data: existing, error: readErr } = await supabase.from("categories").select("name");
if (readErr) {
  console.error("Lecture impossible :", readErr.message);
  process.exit(1);
}
const have = new Set((existing ?? []).map((c) => c.name.trim().toLowerCase()));

const rows = CATEGORIES.filter(([name]) => !have.has(name.toLowerCase())).map(([name, description]) => ({
  name,
  slug: slugify(name),
  description,
  image_url: null,
}));

if (rows.length === 0) {
  console.log("Rien à faire : les 12 catégories existent déjà.");
  process.exit(0);
}

const { error } = await supabase.from("categories").insert(rows);
if (error) {
  console.error("Insertion échouée :", error.message);
  process.exit(1);
}
console.log(`${rows.length} catégorie(s) insérée(s) :`);
rows.forEach((r) => console.log(`  - ${r.name} (${r.slug})`));
const skipped = CATEGORIES.length - rows.length;
if (skipped > 0) console.log(`${skipped} déjà présente(s), ignorée(s).`);
