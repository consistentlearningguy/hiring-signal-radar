import assert from 'node:assert/strict';
import test from 'node:test';
import { companies } from '../src/data/companies';
import type { CollectorState, HistoryFile } from '../src/lib/types';
import { normalizeGreenhouse } from '../scripts/lib/normalize';
import { mergeFailedSnapshot, mergeSuccessfulSnapshot, pruneExpiredJobs, updateHistory } from '../scripts/lib/state';

const company = { ...companies[0], boardToken: companies[0].boardToken as string };
const job = normalizeGreenhouse({ id: 1, title: 'Software Engineer', absolute_url: 'https://example.test/1', location: { name: 'Toronto, ON' } }, company, '2026-08-01');

test('handles opened, updated, two-miss removal, and recovery', () => {
  const opened = mergeSuccessfulSnapshot(undefined, [job], '2026-08-01T12:00:00Z', '2026-08-01');
  assert.equal(opened.jobs[job.id].current, true);
  assert.equal(opened.jobs[job.id].firstSeen, '2026-08-01');

  const updatedJob = { ...job, title: 'Senior Software Engineer', firstSeen: '2026-08-02', lastSeen: '2026-08-02' };
  const updated = mergeSuccessfulSnapshot(opened, [updatedJob], '2026-08-02T12:00:00Z', '2026-08-02');
  assert.equal(updated.jobs[job.id].title, 'Senior Software Engineer');
  assert.equal(updated.jobs[job.id].firstSeen, '2026-08-01');

  const firstMiss = mergeSuccessfulSnapshot(updated, [], '2026-08-03T12:00:00Z', '2026-08-03');
  assert.equal(firstMiss.jobs[job.id].current, true);
  assert.equal(firstMiss.jobs[job.id].missingCount, 1);

  const failure = mergeFailedSnapshot(firstMiss, '2026-08-04T12:00:00Z', new Error('timeout'));
  assert.equal(failure.jobs[job.id].missingCount, 1);
  assert.equal(failure.jobs[job.id].current, true);
  assert.equal(failure.stale, true);

  const removed = mergeSuccessfulSnapshot(failure, [], '2026-08-05T12:00:00Z', '2026-08-05');
  assert.equal(removed.jobs[job.id].current, false);
  assert.equal(removed.jobs[job.id].removedAt, '2026-08-05');

  const recovered = mergeSuccessfulSnapshot(removed, [{ ...job, firstSeen: '2026-08-06', lastSeen: '2026-08-06' }], '2026-08-06T12:00:00Z', '2026-08-06');
  assert.equal(recovered.jobs[job.id].current, true);
  assert.equal(recovered.jobs[job.id].firstSeen, '2026-08-01');
  assert.equal(recovered.jobs[job.id].removedAt, undefined);
});

test('daily history writes are idempotent', () => {
  const state = mergeSuccessfulSnapshot(undefined, [job], '2026-08-01T12:00:00Z', '2026-08-01');
  const history: HistoryFile = { trackingSince: '2026-08-01', companies: {} };
  updateHistory(history, company, state, '2026-08-01');
  updateHistory(history, company, state, '2026-08-01');
  assert.equal(history.companies[company.id].length, 1);
  assert.equal(history.companies[company.id][0].current, 1);
});

test('historical series retains five years of daily observations', () => {
  const state = mergeSuccessfulSnapshot(undefined, [job], '2026-01-01T12:00:00Z', '2026-01-01');
  const history: HistoryFile = { trackingSince: '2026-01-01', companies: {} };
  for (let offset = 0; offset < 1826; offset += 1) {
    const date = new Date(Date.UTC(2026, 0, 1 + offset)).toISOString().slice(0, 10);
    updateHistory(history, company, state, date);
  }
  assert.equal(history.companies[company.id].length, 1825);
  assert.equal(history.companies[company.id].at(-1)?.date, new Date(Date.UTC(2026, 0, 1 + 1825)).toISOString().slice(0, 10));
});

test('prunes only removed job records older than five years', () => {
  const current = { ...job, current: true, removedAt: undefined };
  const expired = { ...job, id: `${job.id}:expired`, sourceId: 'expired', current: false, removedAt: '2020-01-01' };
  const recent = { ...job, id: `${job.id}:recent`, sourceId: 'recent', current: false, removedAt: '2025-01-01' };
  const state: CollectorState = { version: 1, trackingSince: '2020-01-01', companies: { [company.id]: { consecutiveFailures: 0, stale: false, jobs: { [current.id]: current, [expired.id]: expired, [recent.id]: recent } } } };
  assert.equal(pruneExpiredJobs(state, '2026-08-30'), 1);
  assert.equal(Boolean(state.companies[company.id].jobs[expired.id]), false);
  assert.equal(Boolean(state.companies[company.id].jobs[current.id]), true);
  assert.equal(Boolean(state.companies[company.id].jobs[recent.id]), true);
});
