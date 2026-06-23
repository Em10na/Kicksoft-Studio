export const LOYALTY = {
  POINTS_PER_DT: 1,
  POINTS_EXPIRY_DAYS: 365,
  BONUS_SIGNUP: 50,
  BONUS_FIRST_ORDER: 100,
  TIERS: [
    { name: "Bronze", slug: "bronze", min: 0, discount: 0, freeShipping: false, color: "#CD7F32", icon: "🥉" },
    { name: "Argent", slug: "argent", min: 500, discount: 5, freeShipping: false, color: "#9CA3AF", icon: "🥈" },
    { name: "Or", slug: "or", min: 1500, discount: 10, freeShipping: true, color: "#F59E0B", icon: "🥇" },
    { name: "Platine", slug: "platine", min: 3000, discount: 15, freeShipping: true, color: "#818CF8", icon: "💎" },
  ],
} as const;

export type LoyaltyTier = (typeof LOYALTY.TIERS)[number];

export function getUserTier(lifetimePoints: number): LoyaltyTier {
  const tiers = [...LOYALTY.TIERS].sort((a, b) => b.min - a.min);
  return tiers.find((t) => lifetimePoints >= t.min) ?? LOYALTY.TIERS[0];
}

export function getNextTier(lifetimePoints: number): LoyaltyTier | null {
  const current = getUserTier(lifetimePoints);
  const idx = LOYALTY.TIERS.findIndex((t) => t.slug === current.slug);
  return idx < LOYALTY.TIERS.length - 1 ? LOYALTY.TIERS[idx + 1] : null;
}

export function getProgressToNext(lifetimePoints: number): number {
  const current = getUserTier(lifetimePoints);
  const next = getNextTier(lifetimePoints);
  if (!next) return 100;
  const range = next.min - current.min;
  const progress = lifetimePoints - current.min;
  return Math.min(100, Math.round((progress / range) * 100));
}
