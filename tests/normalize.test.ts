import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { companies } from '../src/data/companies';
import { deduplicateJobs, normalizeAshby, normalizeGreenhouse, normalizeLever, normalizeRecruitee, normalizeSmartRecruiters, normalizeWorkable, normalizeWorkday, parseWorkdayToken } from '../scripts/lib/normalize';

const greenhouseCompany = { ...companies[0], id: 'example', name: 'Example', ticker: 'EXM', boardToken: 'example' };
const leverCompany = { ...greenhouseCompany, provider: 'lever' as const };
const ashbyCompany = { ...greenhouseCompany, provider: 'ashby' as const };
const workdayCompany = { ...greenhouseCompany, provider: 'workday' as const, boardToken: 'wd5/example/Example' };
const smartRecruitersCompany = { ...greenhouseCompany, provider: 'smartrecruiters' as const };
const workableCompany = { ...greenhouseCompany, provider: 'workable' as const };
const recruiteeCompany = { ...greenhouseCompany, provider: 'recruitee' as const };

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

test('parses and rejects Workday board tokens', () => {
  assert.deepEqual(parseWorkdayToken('wd5/example/Example'), { host: 'wd5', tenant: 'example', site: 'Example' });
  assert.throws(() => parseWorkdayToken('example/Example'), /Invalid Workday board token/);
});

test('normalizes saved Workday fixture with structured external path', async () => {
  const fixture = JSON.parse(await fs.readFile(new URL('./fixtures/workday.json', import.meta.url), 'utf8'));
  const job = normalizeWorkday(fixture[0], workdayCompany, '2026-08-09');
  assert.equal(job.id, 'workday:example:/job/Senior-Software-Engineer-Platform_R-1001');
  assert.equal(job.sourceUrl, 'https://example.wd5.myworkdayjobs.com/en-US/Example/job/Senior-Software-Engineer-Platform_R-1001');
  assert.equal(job.function, 'Engineering');
  assert.equal(job.category, 'Software Engineering');
  assert.equal(job.level, 'Senior');
  assert.equal(job.country, 'Canada');
  assert.equal(job.remote, false);
  assert.equal(job.sourcePublishedAt, '2026-08-06T00:00:00.000Z');
  const remoteJob = normalizeWorkday(fixture[1], workdayCompany, '2026-08-09');
  assert.equal(remoteJob.remote, true);
  assert.equal(remoteJob.country, 'United States');
  assert.equal(remoteJob.sourcePublishedAt, '2026-08-09T00:00:00.000Z');
  assert.equal(normalizeWorkday(fixture[2], workdayCompany, '2026-08-09').sourcePublishedAt, '2026-07-10T00:00:00.000Z');
});

test('normalizes saved SmartRecruiters fixture with released date', async () => {
  const fixture = JSON.parse(await fs.readFile(new URL('./fixtures/smartrecruiters.json', import.meta.url), 'utf8'));
  const job = normalizeSmartRecruiters(fixture.content[0], smartRecruitersCompany, '2026-08-09');
  assert.equal(job.id, 'smartrecruiters:example:ABC123');
  assert.equal(job.sourceUrl, 'https://jobs.smartrecruiters.com/example/ABC123');
  assert.equal(job.location, 'Toronto, Ontario, ca');
  assert.equal(job.country, 'Canada');
  assert.equal(job.remote, false);
  assert.equal(job.sourcePublishedAt, '2026-08-01T12:00:00.000Z');
  const remoteJob = normalizeSmartRecruiters(fixture.content[1], smartRecruitersCompany, '2026-08-09');
  assert.equal(remoteJob.remote, true);
});

test('normalizes saved Workable fixture falling back to shortlink slug for IDs', async () => {
  const fixture = JSON.parse(await fs.readFile(new URL('./fixtures/workable.json', import.meta.url), 'utf8'));
  const job = normalizeWorkable(fixture.jobs[0], workableCompany, '2026-08-09');
  assert.equal(job.id, 'workable:example:ABC001');
  assert.equal(job.sourceUrl, 'https://apply.workable.com/example/j/ABC001/');
  assert.equal(job.country, 'Canada');
  assert.equal(job.sourcePublishedAt, '2026-08-02T10:00:00Z');
  const noCode = normalizeWorkable({ ...fixture.jobs[1], code: undefined }, workableCompany, '2026-08-09');
  assert.equal(noCode.id, 'workable:example:DEF002');
});

test('normalizes saved Recruitee fixture with careers URL', async () => {
  const fixture = JSON.parse(await fs.readFile(new URL('./fixtures/recruitee.json', import.meta.url), 'utf8'));
  const job = normalizeRecruitee(fixture.offers[0], recruiteeCompany, '2026-08-09');
  assert.equal(job.id, 'recruitee:example:4401');
  assert.equal(job.sourceUrl, 'https://example.recruitee.com/en/o/product-designer');
  assert.equal(job.location, 'Amsterdam, Netherlands');
  assert.equal(job.country, 'Netherlands');
  assert.equal(job.sourcePublishedAt, '2026-08-03T08:00:00.000Z');
  const fallback = normalizeRecruitee({ ...fixture.offers[1], careers_url: undefined }, recruiteeCompany, '2026-08-09');
  assert.equal(fallback.sourceUrl, 'https://example.recruitee.com/o/4402');
  assert.equal(fallback.remote, true);
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
