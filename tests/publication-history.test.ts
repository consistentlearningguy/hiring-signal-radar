import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPublicationSeries } from '../src/lib/publication-history';
import type { NormalizedJob } from '../src/lib/types';

test('builds gap-filled historical publication pace from official timestamps', () => {
  const jobs = [
    { sourcePublishedAt: '2026-08-01T12:00:00Z' },
    { sourcePublishedAt: '2026-08-01T18:00:00Z' },
    { sourcePublishedAt: '2026-08-03T12:00:00Z' }
  ] as NormalizedJob[];
  const points = buildPublicationSeries(jobs, '2026-08-04');
  assert.deepEqual(points.map((point) => point.date), ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04']);
  assert.deepEqual(points.map((point) => point.published), [2, 0, 1, 0]);
  assert.equal(points.at(-1)?.rolling7, 3);
});

test('excludes invalid and future timestamps', () => {
  const jobs = [{ sourcePublishedAt: 'not-a-date' }, { sourcePublishedAt: '2026-09-01T00:00:00Z' }] as NormalizedJob[];
  assert.deepEqual(buildPublicationSeries(jobs, '2026-08-09'), []);
});
