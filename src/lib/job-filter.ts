import type { NormalizedJob } from './types';

export interface JobFilters {
  title?: string;
  location?: string;
  country?: string;
  function?: string;
  category?: string;
  level?: string;
  companyId?: string;
  remote?: '' | 'remote' | 'onsite';
  newSince?: string;
  publishedSince?: string;
  watchedOnly?: boolean;
  watchedCompanies?: ReadonlySet<string>;
}

export function matchesJobFilters(job: Pick<NormalizedJob, 'title' | 'location' | 'country' | 'function' | 'category' | 'level' | 'remote' | 'firstSeen' | 'sourcePublishedAt' | 'companyId' | 'provider'>, filters: JobFilters): boolean {
  const title = filters.title?.toLowerCase().trim() ?? '';
  const location = filters.location?.toLowerCase().trim() ?? '';
  const country = filters.country?.toLowerCase().trim() ?? '';
  const publishedDay = job.sourcePublishedAt?.slice(0, 10) || job.firstSeen;
  return (!title || job.title.toLowerCase().includes(title))
    && (!location || job.location.toLowerCase().includes(location))
    && (!country || job.country.toLowerCase().startsWith(country))
    && (!filters.function || job.function === filters.function)
    && (!filters.category || job.category === filters.category)
    && (!filters.level || job.level === filters.level)
    && (!filters.companyId || job.companyId === filters.companyId)
    && (!filters.remote || (filters.remote === 'remote' ? job.remote : !job.remote))
    && (!filters.newSince || job.firstSeen >= filters.newSince)
    && (!filters.publishedSince || publishedDay >= filters.publishedSince)
    && (!filters.watchedOnly || Boolean(filters.watchedCompanies?.has(job.companyId)));
}
