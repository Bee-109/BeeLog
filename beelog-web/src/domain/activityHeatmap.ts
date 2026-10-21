import type { Devlog } from "./models";

export function countDevlogsByCreationDate(logs: Devlog[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const log of logs) {
    const date = new Date(log.createdAt ?? log.date);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function activityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}
