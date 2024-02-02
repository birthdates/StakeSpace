import { Case } from "../cases";

export const MAX_CASES = 5;
export const MAX_CASE_PER_BATTLE = 75;

export function getWeight(crate: Case, itemId: string): number {
  const item = crate.items.find((x) => x.id === itemId);
  if (!item) return 0;
  return item.weight;
}

export function getWeightString(crate: Case, itemId: string): string {
  return (getWeight(crate, itemId) / 100).toFixed(2) + "%";
}
