import { ROLE_LEVELS, SECTORS, SECTOR_COLORS, type CompanyProfile, type MarketFile, type MarketSector, type NormalizedJob, type RoleLevel, type Sector } from '../../src/lib/types';
import { median, postingOpenDays } from './metrics';

function remoteShareFor(jobs: NormalizedJob[]): number {
  return jobs.length ? Math.round((jobs.filter((job) => job.remote).length / jobs.length) * 1000) / 10 : 0;
}

export function buildMarketFile(profiles: CompanyProfile[], jobs: NormalizedJob[], day: string, generatedAt: string): MarketFile {
  const currentByCompany = new Map<string, NormalizedJob[]>();
  for (const job of jobs.filter((entry) => entry.current)) {
    const group = currentByCompany.get(job.companyId);
    if (group) group.push(job);
    else currentByCompany.set(job.companyId, [job]);
  }
  const allOpenDays = jobs.map(postingOpenDays).filter((value): value is number => value !== null);
  const published30Total = profiles.reduce((total, profile) => total + profile.published30d, 0);
  const top10Published30 = [...profiles].sort((a, b) => b.published30d - a.published30d).slice(0, 10).reduce((total, profile) => total + profile.published30d, 0);
  const levelCounts = Object.fromEntries(ROLE_LEVELS.map((level) => [level, 0])) as Record<RoleLevel, number>;
  for (const group of currentByCompany.values()) for (const job of group) levelCounts[job.level] += 1;

  const sectors: MarketSector[] = SECTORS.map((name: Sector) => {
    const members = profiles.filter((profile) => profile.sector === name);
    const memberIds = new Set(members.map((member) => member.id));
    const sectorJobs = members.flatMap((member) => currentByCompany.get(member.id) ?? []);
    const openDays = jobs.filter((job) => memberIds.has(job.companyId)).map(postingOpenDays).filter((value): value is number => value !== null);
    const leader = [...members].sort((a, b) => b.currentOpenings - a.currentOpenings)[0];
    return {
      name,
      color: SECTOR_COLORS[name],
      companies: members.length,
      currentOpenings: members.reduce((total, member) => total + member.currentOpenings, 0),
      published7d: members.reduce((total, member) => total + member.published7d, 0),
      publicationDelta7d: members.reduce((total, member) => total + member.publicationDelta7d, 0),
      remoteShare: remoteShareFor(sectorJobs),
      medianOpenDays: median(openDays),
      leader: leader ? { id: leader.id, name: leader.name, ticker: leader.ticker, currentOpenings: leader.currentOpenings } : null
    };
  }).sort((a, b) => b.publicationDelta7d - a.publicationDelta7d || b.published7d - a.published7d);

  return {
    generatedAt,
    day,
    sectors,
    aggregates: {
      currentOpenings: profiles.reduce((total, profile) => total + profile.currentOpenings, 0),
      published7d: profiles.reduce((total, profile) => total + profile.published7d, 0),
      publicationDelta7d: profiles.reduce((total, profile) => total + profile.publicationDelta7d, 0),
      remoteShare: remoteShareFor(jobs.filter((entry) => entry.current)),
      medianOpenDays: median(allOpenDays),
      top10PublicationShare30d: published30Total ? Math.round((top10Published30 / published30Total) * 1000) / 10 : 0,
      levelCounts
    }
  };
}
