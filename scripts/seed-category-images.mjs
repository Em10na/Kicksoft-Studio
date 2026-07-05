// One-off: gives each seeded category a themed image (only when image_url
// is still empty, so uploads done from the admin are never overwritten).
// Run with: node scripts/seed-category-images.mjs
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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const u = (id) => `https://images.unsplash.com/photo-${id}?w=300&q=80&auto=format&fit=crop`;

const IMAGES = {
  "drones": u("1473968512647-3e447244af8f"),
  "cameras-daction": u("1508444845599-5c89863b1c44"),
  "stabilisateurs-gimbals": u("1527977966376-1c8408f9f108"),
  "cameras-embarquees": u("1516035069371-29a1b244cc32"),
  "batteries": u("1619641805634-b867f535071c"),
  "helices": u("1507582020474-9a35b7d455d9"),
  "telecommandes": u("1521405924368-64c5b84bec60"),
  "chargeurs-et-stations-de-charge": u("1619641805634-b867f535071c"),
  "filtres-dobjectif": u("1519558260268-cde7e03a0152"),
  "sacs-et-etuis": u("1553062407-98eeb64c6a62"),
  "pieces-de-rechange": u("1579829366248-204fe8413f31"),
  "accessoires": u("1608043152269-423dbba4e7e1"),
};

let done = 0;
for (const [slug, image_url] of Object.entries(IMAGES)) {
  const { data, error } = await supabase
    .from("categories")
    .update({ image_url })
    .eq("slug", slug)
    .is("image_url", null)
    .select("name");
  if (error) {
    console.error(`${slug} : ${error.message}`);
    process.exit(1);
  }
  if (data && data.length > 0) {
    console.log(`Image ajoutée : ${data[0].name}`);
    done++;
  }
}
console.log(done === 0 ? "Rien à faire (images déjà définies)." : `${done} image(s) attribuée(s).`);
