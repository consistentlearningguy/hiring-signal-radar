import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { companies } from '../src/data/companies';
import { deduplicateJobs, normalizeAshby, normalizeGreenhouse, normalizeLever } from '../scripts/lib/normalize';

const greenhouseCompany = { ...companies[0], id: 'example', name: 'Example', ticker: 'EXM', boardToken: 'example' };
const leverCompany = { ...greenhouseCompany, provider: 'lever' as const };
const ashbyCompany = { ...greenhouseCompany, provider: 'ashby' as const };

test('normalizes saved Greenhouse fixture', async () => {
  const fixture = JSON.parse(await fs.readFile(new URL('./fixtures/greenhouse.json', import.meta.url), 'utf8'));
  const jobs = fixture.jobs.map((job: any) => normalizeGreenhouse(job, greenhouseCompany, '2026-08-09'));
  assert.equal(jobs[0].id, 'greenhouse:example:101');
  assert.equal(jobs[0].function, 'AI / Data');
  assert.equal(jobs[0].category, 'AI & Data');
  assert.equal(jobs[0].level, 'Senior');
  assert.equal(jobs[0].remote, true);
  assert.equal(jobs[0].country, 'Canada');
  assert.equal(jobs[0].firstSeen, '2026-08-09');
  assert.equal(jobs[0].sourcePublishedAt, '2026-07-29T15:00:00Z');
  assert.equal(jobs[1].function, 'Sales / Marketing');
  assert.equal(jobs[1].category, 'Sales & Business Development');
  assert.equal(jobs[1].level, 'Unspecified');
});

test('normalizes saved Lever fixture with direct application URL', async () => {
  const fixture = JSON.parse(await fs.readFile(new URL('./fixtures/lever.json', import.meta.url), 'utf8'));
  const job = normalizeLever(fixture[0], leverCompany, '2026-08-09');
  assert.equal(job.id, 'lever:example:lever-201');
  assert.equal(job.sourceUrl, 'https://jobs.lever.co/example/lever-201/apply');
  assert.equal(job.function, 'Product');
  assert.equal(job.category, 'Design & User Research');
  assert.equal(job.country, 'United States');
  assert.equal(job.level, 'Unspecified');
});

test('normalizes saved Ashby fixture with secondary Canadian locations', async () => {
  const fixture = JSON.parse(await fs.readFile(new URL('./fixtures/ashby.json', import.meta.url), 'utf8'));
  const job = normalizeAshby(fixture.jobs[0], ashbyCompany, '2026-08-09');
  assert.equal(job.id, 'ashby:example:ashby-301');
  assert.equal(job.sourceUrl, 'https://jobs.ashbyhq.com/example/ashby-301/application');
  assert.equal(job.location, 'New York · Toronto');
  assert.equal(job.country, 'Canada');
  assert.equal(job.remote, true);
  assert.equal(job.category, 'AI & Data');
  assert.equal(job.sourcePublishedAt, '2026-08-01T15:30:00.000+00:00');
});

test('deduplicates IDs and exact URLs while retaining distinct gh_jid URLs', () => {
  const a = normalizeGreenhouse({ id: 1, title: 'Engineer', absolute_url: 'https://boards.greenhouse.io/example/jobs?gh_jid=1' }, greenhouseCompany, '2026-08-09');
  const repeatedId = { ...a, sourceUrl: 'https://different.example/apply' };
  const distinctQuery = normalizeGreenhouse({ id: 2, title: 'Engineer II', absolute_url: 'https://boards.greenhouse.io/example/jobs?gh_jid=2' }, greenhouseCompany, '2026-08-09');
  assert.deepEqual(deduplicateJobs([a, repeatedId, distinctQuery]).map((job) => job.sourceId), ['1', '2']);
});

test('upgrades an official HTTP application link without changing its path', () => {
  const job = normalizeGreenhouse({ id: 3, title: 'Engineer', absolute_url: 'http://example.com/careers/jobs/3?gh_jid=3' }, greenhouseCompany, '2026-08-09');
  assert.equal(job.sourceUrl, 'https://example.com/careers/jobs/3?gh_jid=3');
});

test('strips tracking parameters while retaining job identity parameters', () => {
  const job = normalizeGreenhouse({ id: 4, title: 'Engineer', absolute_url: 'https://example.com/jobs/4?utm_source=board&tracking=abc&gh_jid=4' }, greenhouseCompany, '2026-08-09');
  assert.equal(job.sourceUrl, 'https://example.com/jobs/4?gh_jid=4');
});

test('rejects non-HTTP application URLs', () => {
  assert.throws(() => normalizeGreenhouse({ id: 5, title: 'Engineer', absolute_url: 'javascript:alert(1)' }, greenhouseCompany, '2026-08-09'), /Unsupported job URL protocol/);
});
