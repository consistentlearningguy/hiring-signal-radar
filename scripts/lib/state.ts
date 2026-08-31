import type { CollectorState, CompanyConfig, CompanyState, DailyCompanyPoint, HistoryFile, NormalizedJob } from '../../src/lib/types';

export function emptyState(day: string): CollectorState {
  return { version: 1, trackingSince: day, companies: {} };
}

export function emptyCompanyState(): CompanyState {
  return { consecutiveFailures: 0, stale: false, jobs: {} };
}

export function mergeSuccessfulSnapshot(
  prior: CompanyState | undefined,
  incoming: NormalizedJob[],
  timestamp: string,
  day: string
): CompanyState {
  const previous = prior ?? emptyCompanyState();
  const nextJobs: Record<string, NormalizedJob> = {};
  const incomingIds = new Set(incoming.map((job) => job.id));

  for (const job of incoming) {
    const existing = previous.jobs[job.id];
    nextJobs[job.id] = {
      ...existing,
      ...job,
      firstSeen: existing?.firstSeen ?? day,
      lastSeen: day,
      current: true,
      missingCount: 0,
      removedAt: undefined
    };
  }

  for (const [id, job] of Object.entries(previous.jobs)) {
    if (incomingIds.has(id)) continue;
    if (!job.current) {
      nextJobs[id] = job;
      continue;
    }
    const missingCount = job.missingCount + 1;
    nextJobs[id] = {
      ...job,
      missingCount,
      current: missingCount < 2,
      removedAt: missingCount >= 2 ? (job.removedAt ?? day) : undefined
    };
  }

  return {
    lastAttempt: timestamp,
    lastSuccess: timestamp,
    consecutiveFailures: 0,
    stale: false,
    jobs: nextJobs
  };
}

export function mergeFailedSnapshot(prior: CompanyState | undefined, timestamp: string, error: unknown): CompanyState {
  const previous = prior ?? emptyCompanyState();
  return {
    ...previous,
    lastAttempt: timestamp,
    consecutiveFailures: previous.consecutiveFailures + 1,
    stale: true,
    error: error instanceof Error ? error.message : String(error)
  };
}

export function updateHistory(history: HistoryFile, company: CompanyConfig, state: CompanyState, day: string): void {
  const jobs = Object.values(state.jobs);
  const point: DailyCompanyPoint = {
    date: day,
    current: jobs.filter((job) => job.current).length,
    opened: jobs.filter((job) => job.firstSeen === day).length,
    removed: jobs.filter((job) => job.removedAt === day).length,
    stale: state.stale
  };
  const points = history.companies[company.id] ?? [];
  const withoutToday = points.filter((candidate) => candidate.date !== day);
  // Retain five years of compact daily company-level observations.
  history.companies[company.id] = [...withoutToday, point].sort((a, b) => a.date.localeCompare(b.date)).slice(-1825);
}

export function pruneExpiredJobs(state: CollectorState, day: string): number {
  const cutoff = new Date(`${day}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 1825);
  const cutoffDay = cutoff.toISOString().slice(0, 10);
  let removed = 0;
  for (const company of Object.values(state.companies)) {
    for (const [id, job] of Object.entries(company.jobs)) {
      if (!job.current && job.removedAt && job.removedAt < cutoffDay) {
        delete company.jobs[id];
        removed += 1;
      }
    }
  }
  return removed;
}
