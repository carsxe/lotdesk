export type BetaFeature = {
  key: string;
  name: string;
  summary: string;
  href: string;
};

export const BETA_FEATURES: BetaFeature[] = [
  {
    key: "lot-assistant",
    name: "Lot Assistant",
    summary: "In-app assistant for routine inventory tasks and AI descriptions.",
    href: "/app/assistant",
  },
  {
    key: "promo-studio",
    name: "Promo Studio",
    summary: "Automated text and image overlays for CPO, warranty, and feature callouts.",
    href: "/app/promo-studio",
  },
  {
    key: "spin-view",
    name: "Spin View",
    summary: "Interactive 360 merchandising from uploaded frame sequences.",
    href: "/app/spin",
  },
  {
    key: "condition-book",
    name: "Condition Book",
    summary: "Attach exterior inspection imagery and damage tags to appraisals.",
    href: "/app/condition",
  },
];

export function isFlagOn(
  flags: { key: string; enabled: boolean }[],
  key: string,
  fallback = true,
): boolean {
  const found = flags.find((flag) => flag.key === key);
  return found ? found.enabled : fallback;
}
