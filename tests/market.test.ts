import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMarketFile } from '../scripts/lib/market';
import type { CompanyProfile, NormalizedJob } from '../src/lib/types';

function profile(overrides: Partial<CompanyProfile>): CompanyProfile {
  return {
    id: 'example', name: 'Example', ticker: 'EXM', exchange: 'NASDAQ', provider: 'greenhouse', boardToken: 'example',
    sector: 'Data & AI', headquarters: 'San Francisco, CA', color: '#000000', description: 'Example company.',
    currentOpenings: 0, new7d: 0, published7d: 0, publicationDelta7d: 0, published30d: 0, publicationDelta30d: 0,
    publicationIntensity7d: 0, change7d: 0, change30d: 0, removed7d: 0, remoteShare: 0, medianOpenDays: null,
    stale: false, functionCounts: {} as CompanyProfile['functionCounts'], levelCounts: {} as CompanyProfile['levelCounts'], locationCounts: {},
    ...overrides
  };
}

function job(overrides: Partial<NormalizedJob>): NormalizedJob {
  return {
    id: 'greenhouse:example:1', sourceId: '1', companyId: 'example', company: 'Example', ticker: 'EXM',
    title: 'Engineer', function: 'Engineering', category: 'Software Engineering', level: 'Mid level',
    location: 'San Francisco, CA', country: 'United States', remote: false, sourceUrl: 'https://example.test/1',
    provider: 'greenhouse', firstSeen: '2026-08-01', lastSeen: '2026-08-09', current: true, missingCount: 0,
    ...overrides
  };
}

test('computes remote share, seniority mix, and concentration aggregates', () => {
  const profiles = [
    profile({ id: 'big', name: 'Big', currentOpenings: 60, published30d: 50 }),
    profile({ id: 'small', name: 'Small', sector: 'Fintech & Crypto', currentOpenings: 40, published30d: 10 })
  ];
  const jobs = [
    job({ id: 'j1', companyId: 'big', remote: true, level: 'Senior' }),
    job({ id: 'j2', companyId: 'big', remote: false, level: 'Senior' }),
    job({ id: 'j3', companyId: 'small', remote: false, level: 'Internship' }),
    job({ id: 'j4', companyId: 'small', remote: true, level: 'Mid level', current: false, removedAt: '2026-08-08', sourcePublishedAt: '2026-07-31' })
  ];
  const market = buildMarketFile(profiles, jobs, '2026-08-09', '2026-08-09T12:00:00Z');
  assert.equal(market.aggregates.remoteShare, 33.3);
  assert.equal(market.aggregates.medianOpenDays, 8);
  assert.equal(market.aggregates.top10PublicationShare30d, 100);
  assert.equal(market.aggregates.levelCounts.Senior, 2);
  assert.equal(market.aggregates.levelCounts.Internship, 1);
  const sectors = Object.fromEntries(market.sectors.map((sector) => [sector.name, sector]));
  assert.equal(sectors['Data & AI'].companies, 1);
  assert.equal(sectors['Data & AI'].remoteShare, 50);
  assert.equal(sectors['Data & AI'].leader?.id, 'big');
  assert.equal(sectors['Fintech & Crypto'].medianOpenDays, 8);
  assert.equal(sectors['Consumer & Marketplaces'].companies, 0);
  assert.equal(sectors['Consumer & Marketplaces'].leader, null);
});

test('handles empty data without division errors', () => {
  const market = buildMarketFile([], [], '2026-08-09', '2026-08-09T12:00:00Z');
  assert.equal(market.aggregates.remoteShare, 0);
  assert.equal(market.aggregates.medianOpenDays, null);
  assert.equal(market.aggregates.top10PublicationShare30d, 0);
  assert.equal(market.sectors.length, 9);
});
