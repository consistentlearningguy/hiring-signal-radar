import type { CompanyConfig, NormalizedJob } from '../../src/lib/types';
import { classifyJobCategory, classifyLevel, classifyRole, inferCountry, isRemoteLocation } from './classification';

export type BoardCompany = Omit<CompanyConfig, 'boardToken'> & { boardToken: string };

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

export interface WorkdayJob {
  title: string;
  externalPath: string;
  locationsText?: string;
  postedOn?: string;
}

export interface SmartRecruitersJob {
  id: string;
  name: string;
  releasedDate?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    remote?: boolean;
  };
}

export interface WorkableJob {
  title: string;
  shortlink: string;
  code?: string;
  created_at?: string;
  department?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface RecruiteeJob {
  id: number | string;
  title: string;
  location?: string;
  country?: string;
  published_at?: string;
  careers_url?: string;
}

export function parseWorkdayToken(token: string): { host: string; tenant: string; site: string } {
  const parts = token.split('/');
  if (parts.length !== 3 || parts.some((part) => !part.trim())) {
    throw new Error(`Invalid Workday board token "${token}" (expected "host/tenant/site", e.g. "wd5/example/Example")`);
  }
  const [host, tenant, site] = parts.map((part) => part.trim());
  return { host, tenant, site };
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

function baseJob(company: BoardCompany, sourceId: string, day: string) {
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

export function normalizeGreenhouse(job: GreenhouseJob, company: BoardCompany, day: string): NormalizedJob {
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

export function normalizeLever(job: LeverJob, company: BoardCompany, day: string): NormalizedJob {
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

export function normalizeAshby(job: AshbyJob, company: BoardCompany, day: string): NormalizedJob {
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

function approximateWorkdayPublished(postedOn: string | undefined, day: string): string | undefined {
  const match = postedOn?.match(/Posted\s+(Today|Yesterday|(\d+)\+?\s+Days?\s+Ago)/i);
  if (!match) return undefined;
  const date = new Date(`${day}T00:00:00Z`);
  if (match[1].toLowerCase() === 'today') return date.toISOString();
  const days = match[1].toLowerCase() === 'yesterday' ? 1 : parseInt(match[2] ?? '', 10);
  if (!Number.isFinite(days)) return undefined;
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

export function normalizeWorkday(job: WorkdayJob, company: BoardCompany, day: string): NormalizedJob {
  const { host, tenant, site } = parseWorkdayToken(company.boardToken);
  const location = clean(job.locationsText);
  const origin = `https://${tenant}.${host}.myworkdayjobs.com/en-US/${site}`;
  return {
    ...baseJob(company, job.externalPath, day),
    title: clean(job.title, 'Untitled role'),
    function: classifyRole(job.title),
    category: classifyJobCategory(job.title),
    level: classifyLevel(job.title),
    location,
    country: inferCountry(location),
    remote: isRemoteLocation(location),
    sourceUrl: normalizeSourceUrl(`${origin}${job.externalPath}`),
    sourcePublishedAt: approximateWorkdayPublished(job.postedOn, day)
  };
}

export function normalizeSmartRecruiters(job: SmartRecruitersJob, company: BoardCompany, day: string): NormalizedJob {
  const { city, region, country, remote } = job.location ?? {};
  const location = clean([city, region, country].filter(Boolean).join(', '));
  return {
    ...baseJob(company, String(job.id), day),
    title: clean(job.name, 'Untitled role'),
    function: classifyRole(job.name),
    category: classifyJobCategory(job.name),
    level: classifyLevel(job.name),
    location,
    country: inferCountry(location),
    remote: remote === true || isRemoteLocation(location),
    sourceUrl: normalizeSourceUrl(`https://jobs.smartrecruiters.com/${company.boardToken}/${job.id}`),
    sourcePublishedAt: job.releasedDate
  };
}

export function normalizeWorkable(job: WorkableJob, company: BoardCompany, day: string): NormalizedJob {
  const { city, state, country } = job.location ?? {};
  const location = clean([city, state, country].filter(Boolean).join(', '));
  const sourceId = job.code || decodeURIComponent(new URL(job.shortlink).pathname.split('/').filter(Boolean).at(-1) ?? job.shortlink);
  return {
    ...baseJob(company, sourceId, day),
    title: clean(job.title, 'Untitled role'),
    function: classifyRole(job.title, job.department ?? ''),
    category: classifyJobCategory(job.title, job.department ?? ''),
    level: classifyLevel(job.title),
    location,
    country: inferCountry(location),
    remote: isRemoteLocation(location),
    sourceUrl: normalizeSourceUrl(job.shortlink),
    sourcePublishedAt: job.created_at
  };
}

export function normalizeRecruitee(job: RecruiteeJob, company: BoardCompany, day: string): NormalizedJob {
  const location = clean(job.country && job.location && !job.location.includes(job.country) ? `${job.location}, ${job.country}` : job.location);
  return {
    ...baseJob(company, String(job.id), day),
    title: clean(job.title, 'Untitled role'),
    function: classifyRole(job.title),
    category: classifyJobCategory(job.title),
    level: classifyLevel(job.title),
    location,
    country: inferCountry(location),
    remote: isRemoteLocation(location),
    sourceUrl: normalizeSourceUrl(job.careers_url || `https://${company.boardToken}.recruitee.com/o/${job.id}`),
    sourcePublishedAt: job.published_at
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
