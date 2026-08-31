import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { companies } from '../src/data/companies';
import type { CollectionStatus, CompanyProfile, NormalizedJob } from '../src/lib/types';

test('expanded coverage has unique identities and generated outputs', () => {
  assert.equal(companies.length, 145);
  assert.equal(companies.filter((company) => !company.jobSeekerOnly).length, 122);
  assert.equal(companies.filter((company) => company.jobSeekerOnly).length, 23);
  assert.equal(new Set(companies.map((company) => company.id)).size, companies.length);
  const investorCompanies = companies.filter((company) => !company.jobSeekerOnly);
  assert.equal(new Set(investorCompanies.map((company) => company.ticker)).size, investorCompanies.length);
  assert.equal(companies.filter((company) => company.jobSeekerOnly && company.ticker).length, 0);

  const profiles = JSON.parse(fs.readFileSync('public/data/companies.json', 'utf8')) as CompanyProfile[];
  const jobs = JSON.parse(fs.readFileSync('public/data/jobs.json', 'utf8')) as NormalizedJob[];
  const status = JSON.parse(fs.readFileSync('public/data/status.json', 'utf8')) as CollectionStatus;
  const publicationHistory = JSON.parse(fs.readFileSync('public/data/publication-history.json', 'utf8')) as { basis: string; companies: Record<string, unknown[]> };
  assert.equal(profiles.length, companies.length);
  assert.equal(profiles.filter((profile) => !Number.isInteger(profile.published7d) || !Number.isInteger(profile.publicationDelta7d) || !Number.isInteger(profile.published30d) || !Number.isFinite(profile.publicationIntensity7d)).length, 0);
  assert.equal(status.totalSources, companies.length);
  assert.equal(status.healthySources, companies.length);
  assert.equal(status.staleSources, 0);
  assert.ok(jobs.filter((job) => job.current).length > 15_000);
  assert.equal(jobs.filter((job) => !job.level).length, 0);
  assert.equal(jobs.filter((job) => !job.category).length, 0);
  assert.equal(jobs.filter((job) => !job.country).length, 0);
  assert.ok(jobs.filter((job) => job.current && job.country === 'Canada' && job.level === 'Entry level').length > 10);
  assert.equal(jobs.filter((job) => !job.sourceUrl.startsWith('https://')).length, 0);
  assert.equal(jobs.filter((job) => !['greenhouse', 'lever', 'ashby'].includes(job.provider)).length, 0);
  assert.ok(jobs.filter((job) => !job.sourcePublishedAt).length < 5);
  assert.equal(jobs.filter((job) => /[?&](utm_|tracking=|indeed-apply-token=)/i.test(job.sourceUrl)).length, 0);
  assert.equal(profiles.filter((profile) => {
    const keys = Object.keys(profile.locationCounts).map((location) => location.toLocaleLowerCase('en-CA'));
    return new Set(keys).size !== keys.length;
  }).length, 0);
  assert.equal(publicationHistory.basis, 'official-publication-timestamps');
  assert.equal(Object.keys(publicationHistory.companies).length, companies.length);

  for (const company of companies) {
    assert.equal(fs.existsSync(`public/data/companies/${company.id}.json`), true);
    assert.equal(fs.existsSync(`public/rss/${company.id}.xml`), true);
  }
});
