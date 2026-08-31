import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesJobFilters } from '../src/lib/job-filter';
import type { NormalizedJob } from '../src/lib/types';

const job = {
  companyId: 'cloudflare', title: 'Machine Learning Engineer', location: 'Toronto, ON (Remote)', country: 'Canada', function: 'AI / Data', category: 'AI & Data', level: 'Senior', remote: true, provider: 'greenhouse', firstSeen: '2026-08-08', sourcePublishedAt: '2026-08-07T12:00:00Z'
} as NormalizedJob;

test('matches title, location, remote, freshness, and watchlist filters', () => {
  assert.equal(matchesJobFilters(job, { title: 'learning', location: 'toronto', remote: 'remote' }), true);
  assert.equal(matchesJobFilters(job, { title: 'sales' }), false);
  assert.equal(matchesJobFilters(job, { location: 'new york' }), false);
  assert.equal(matchesJobFilters(job, { country: 'ca' }), true);
  assert.equal(matchesJobFilters(job, { country: 'United States' }), false);
  assert.equal(matchesJobFilters(job, { remote: 'onsite' }), false);
  assert.equal(matchesJobFilters(job, { level: 'Senior' }), true);
  assert.equal(matchesJobFilters(job, { level: 'Entry level' }), false);
  assert.equal(matchesJobFilters(job, { category: 'AI & Data', companyId: 'cloudflare' }), true);
  assert.equal(matchesJobFilters(job, { category: 'Software Engineering' }), false);
  assert.equal(matchesJobFilters(job, { publishedSince: '2026-08-07' }), true);
  assert.equal(matchesJobFilters(job, { publishedSince: '2026-08-08' }), false);
  assert.equal(matchesJobFilters(job, { newSince: '2026-08-09' }), false);
  assert.equal(matchesJobFilters(job, { watchedOnly: true, watchedCompanies: new Set(['cloudflare']) }), true);
  assert.equal(matchesJobFilters(job, { watchedOnly: true, watchedCompanies: new Set(['figma']) }), false);
});
