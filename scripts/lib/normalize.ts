import type { CompanyConfig, NormalizedJob } from '../../src/lib/types';
import { classifyJobCategory, classifyLevel, classifyRole, inferCountry, isRemoteLocation } from './classification';

export interface GreenhouseJob {
  id: number | string;
  title: string;
  absolute_url: string;
  updated_at?: string;
  first_published?: string;
  location?: { name?: string };
  departments?: Array<{ name?: string }>;
  offices?: Array<{ name?: string; location?: string }>;
}

export interface LeverJob {
  id: string;
  text: string;
  hostedUrl?: string;
  applyUrl?: string;
  createdAt?: number;
  categories?: {
    location?: string;
    allLocations?: string[];
    team?: string;
    department?: string;
    commitment?: string;
  };
}

export interface AshbyJob {
  id: string;
  title: string;
  department?: string;
  team?: string;
  location?: string;
  secondaryLocations?: Array<{ location?: string }>;
  publishedAt?: string;
  isListed?: boolean;
  isRemote?: boolean | null;
  workplaceType?: 'OnSite' | 'Remote' | 'Hybrid' | string | null;
  jobUrl?: string;
  applyUrl?: string;
}

function clean(value: string | undefined, fallback = 'Location not listed'): string {
  return value?.replace(/\s+/g, ' ').trim() || fallback;
}

export function normalizeSourceUrl(value: string): string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsupported job URL protocol: ${url.protocol}`);
  url.protocol = 'https:';
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|source$|ref$|tracking|indeed-apply-token)/i.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}

function baseJob(company: CompanyConfig, sourceId: string, day: string) {
  return {
    id: `${company.provider}:${company.id}:${sourceId}`,
    sourceId,
    companyId: company.id,
    company: company.name,
    ticker: company.ticker,
    provider: company.provider,
    firstSeen: day,
    lastSeen: day,
    current: true,
    missingCount: 0
  } as const;
}

export function normalizeGreenhouse(job: GreenhouseJob, company: CompanyConfig, day: string): NormalizedJob {
  const location = clean(job.location?.name ?? job.offices?.map((office) => office.location || office.name).filter(Boolean).join(' · '));
  const team = job.departments?.map((department) => department.name).filter(Boolean).join(' ') ?? '';
  return {
    ...baseJob(company, String(job.id), day),
    title: clean(job.title, 'Untitled role'),
    function: classifyRole(job.title, team),
    category: classifyJobCategory(job.title, team),
    level: classifyLevel(job.title),
    location,
    country: inferCountry(location),
    remote: isRemoteLocation(location),
    sourceUrl: normalizeSourceUrl(job.absolute_url),
    sourceUpdatedAt: job.updated_at,
    sourcePublishedAt: job.first_published
  };
}

export function normalizeLever(job: LeverJob, company: CompanyConfig, day: string): NormalizedJob {
  const listedLocations = job.categories?.allLocations?.filter(Boolean).join(' · ');
  const location = clean(listedLocations || job.categories?.location);
  const team = `${job.categories?.team ?? ''} ${job.categories?.department ?? ''}`;
  return {
    ...baseJob(company, String(job.id), day),
    title: clean(job.text, 'Untitled role'),
    function: classifyRole(job.text, team),
    category: classifyJobCategory(job.text, team),
    level: classifyLevel(job.text),
    location,
    country: inferCountry(location),
    remote: isRemoteLocation(location),
    sourceUrl: normalizeSourceUrl(job.applyUrl || job.hostedUrl || `https://jobs.lever.co/${company.boardToken}/${job.id}`),
    sourcePublishedAt: job.createdAt ? new Date(job.createdAt).toISOString() : undefined
  };
}

export function normalizeAshby(job: AshbyJob, company: CompanyConfig, day: string): NormalizedJob {
  const locations = [job.location, ...(job.secondaryLocations ?? []).map((entry) => entry.location)]
    .map((location) => location?.replace(/\s+/g, ' ').trim())
    .filter((location): location is string => Boolean(location));
  const location = clean([...new Set(locations)].join(' · '));
  const team = `${job.department ?? ''} ${job.team ?? ''}`;
  return {
    ...baseJob(company, String(job.id), day),
    title: clean(job.title, 'Untitled role'),
    function: classifyRole(job.title, team),
    category: classifyJobCategory(job.title, team),
    level: classifyLevel(job.title),
    location,
    country: inferCountry(location),
    remote: job.isRemote === true || job.workplaceType === 'Remote' || isRemoteLocation(location),
    sourceUrl: normalizeSourceUrl(job.applyUrl || job.jobUrl || `https://jobs.ashbyhq.com/${company.boardToken}/${job.id}`),
    sourcePublishedAt: job.publishedAt
  };
}

export function deduplicateJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  return jobs.filter((job) => {
    // Some Greenhouse boards use one shared path and distinguish roles with
    // `gh_jid`, so the query string is part of the canonical application URL.
    const canonicalUrl = job.sourceUrl.replace(/#.*$/, '').replace(/\/$/, '').toLowerCase();
    if (seenIds.has(job.id) || seenUrls.has(canonicalUrl)) return false;
    seenIds.add(job.id);
    seenUrls.add(canonicalUrl);
    return true;
  });
}
