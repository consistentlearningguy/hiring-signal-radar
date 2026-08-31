import { ROLE_FUNCTIONS, type CompanyConfig, type CompanyProfile, type CompanyState, type DailyCompanyPoint, type NormalizedJob, type RoleFunction } from '../../src/lib/types';

function dayDiff(from: string, to: string): number {
  return Math.floor((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

function cutoff(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function changeFor(points: DailyCompanyPoint[], day: string, days: number): number | null {
  if (!points.length || dayDiff(points[0].date, day) < days) return null;
  const target = cutoff(day, days);
  const baseline = [...points].reverse().find((point) => point.date <= target);
  const latest = [...points].reverse().find((point) => point.date <= day);
  return baseline && latest ? latest.current - baseline.current : null;
}

function publicationCount(jobs: NormalizedJob[], from: string, through: string): number {
  return jobs.filter((job) => {
    const published = job.sourcePublishedAt?.slice(0, 10);
    return Boolean(published && published >= from && published <= through);
  }).length;
}

export function profileFor(company: CompanyConfig, state: CompanyState, points: DailyCompanyPoint[], day: string): CompanyProfile {
  const jobs = Object.values(state.jobs);
  const current = jobs.filter((job) => job.current);
  const functionCounts = Object.fromEntries(ROLE_FUNCTIONS.map((role) => [role, 0])) as Record<RoleFunction, number>;
  const locationGroups = new Map<string, { label: string; count: number }>();
  for (const job of current) {
    functionCounts[job.function] += 1;
    const key = job.location.toLocaleLowerCase('en-CA');
    const group = locationGroups.get(key);
    if (group) group.count += 1;
    else locationGroups.set(key, { label: job.location, count: 1 });
  }
  const enough7 = dayDiff(points[0]?.date ?? day, day) >= 7;
  const recentPublicationStart = cutoff(day, 6);
  const priorPublicationStart = cutoff(day, 13);
  const priorPublicationEnd = cutoff(day, 7);
  const published7d = publicationCount(jobs, recentPublicationStart, day);
  const publishedPrior7d = publicationCount(jobs, priorPublicationStart, priorPublicationEnd);
  const published30d = publicationCount(jobs, cutoff(day, 29), day);
  const publishedPrior30d = publicationCount(jobs, cutoff(day, 59), cutoff(day, 30));
  return {
    ...company,
    currentOpenings: current.length,
    new7d: enough7 ? jobs.filter((job) => job.firstSeen >= cutoff(day, 7)).length : null,
    published7d,
    publicationDelta7d: published7d - publishedPrior7d,
    published30d,
    publicationDelta30d: published30d - publishedPrior30d,
    publicationIntensity7d: current.length ? Math.round((published7d / current.length) * 1000) / 10 : 0,
    removed7d: enough7 ? jobs.filter((job) => job.removedAt && job.removedAt >= cutoff(day, 7)).length : null,
    change7d: changeFor(points, day, 7),
    change30d: changeFor(points, day, 30),
    stale: state.stale,
    lastSuccess: state.lastSuccess,
    functionCounts,
    locationCounts: Object.fromEntries([...locationGroups.values()].sort((a, b) => b.count - a.count).slice(0, 12).map(({ label, count }) => [label, count]))
  };
}
