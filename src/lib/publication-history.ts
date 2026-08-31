import type { NormalizedJob, PublicationPoint } from './types';

const DAY_MS = 86_400_000;

function safeDay(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : undefined;
}

export function buildPublicationSeries(jobs: NormalizedJob[], endDay: string, maxDays = 1825): PublicationPoint[] {
  const end = Date.parse(`${endDay}T00:00:00Z`);
  const floor = end - (maxDays - 1) * DAY_MS;
  const publishedByDay = new Map<string, number>();

  for (const job of jobs) {
    const day = safeDay(job.sourcePublishedAt);
    if (!day) continue;
    const timestamp = Date.parse(`${day}T00:00:00Z`);
    if (timestamp < floor || timestamp > end) continue;
    publishedByDay.set(day, (publishedByDay.get(day) ?? 0) + 1);
  }

  if (!publishedByDay.size) return [];
  const earliest = Math.max(Math.min(...[...publishedByDay.keys()].map((day) => Date.parse(`${day}T00:00:00Z`))), floor);
  const daily: Array<{ date: string; published: number }> = [];
  for (let timestamp = earliest; timestamp <= end; timestamp += DAY_MS) {
    const date = new Date(timestamp).toISOString().slice(0, 10);
    daily.push({ date, published: publishedByDay.get(date) ?? 0 });
  }

  return daily.map((point, index) => {
    const rolling7 = daily.slice(Math.max(0, index - 6), index + 1).reduce((sum, candidate) => sum + candidate.published, 0);
    const rolling30 = daily.slice(Math.max(0, index - 29), index + 1).reduce((sum, candidate) => sum + candidate.published, 0);
    return { ...point, rolling7, rolling30Weekly: Math.round((rolling30 * 7 / Math.min(index + 1, 30)) * 10) / 10 };
  });
}
