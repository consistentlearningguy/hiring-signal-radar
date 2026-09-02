import fs from 'node:fs/promises';
import { parseWorkdayToken } from './lib/normalize';

interface ProbeResult {
  provider: string;
  token: string;
  valid: boolean;
  jobCount?: number;
  error?: string;
}

const providers = ['greenhouse', 'lever', 'ashby', 'smartrecruiters', 'workable', 'recruitee', 'workday'] as const;
type ProviderName = (typeof providers)[number];

const userAgent = `HiringSignalRadar-discovery/1.0 (+https://github.com)`;

function args(): { tokens: string[]; wanted: Set<ProviderName>; out: string } {
  const argv = process.argv.slice(2);
  const wanted = new Set<ProviderName>();
  let out = 'discovered-boards.json';
  const tokens: string[] = [];
  for (let index = 0; index < argv.length; index++) {
    const value = argv[index];
    if (value === '--provider') {
      for (const name of argv[++index]?.split(',') ?? []) {
        if (!providers.includes(name as ProviderName)) throw new Error(`Unknown provider "${name}" (valid: ${providers.join(', ')})`);
        wanted.add(name as ProviderName);
      }
    } else if (value === '--file') {
      index++;
    } else if (value === '--out') {
      out = argv[++index];
    } else if (!value.startsWith('-')) {
      tokens.push(value);
    }
  }
  return { tokens, wanted, out };
}

async function readTokenFile(tokens: string[]): Promise<string[]> {
  const fileIndex = process.argv.indexOf('--file');
  if (fileIndex === -1) return tokens;
  const file = process.argv[fileIndex + 1];
  if (!file) throw new Error('--file requires a path to a text file with one candidate token per line');
  const lines = (await fs.readFile(file, 'utf8')).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
  return [...tokens, ...lines];
}

async function probe(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    headers: { 'user-agent': userAgent, ...(init?.method === 'POST' ? { 'content-type': 'application/json' } : {}) },
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function jobCount(provider: ProviderName, payload: unknown): number {
  switch (provider) {
    case 'greenhouse': return (payload as { jobs?: unknown[] }).jobs?.length ?? 0;
    case 'lever': return Array.isArray(payload) ? payload.length : 0;
    case 'ashby': return (payload as { jobs?: unknown[] }).jobs?.length ?? 0;
    case 'smartrecruiters': return (payload as { totalCount?: number }).totalCount ?? (payload as { content?: unknown[] }).content?.length ?? 0;
    case 'workable': return (payload as { jobs?: unknown[] }).jobs?.length ?? 0;
    case 'recruitee': return (payload as { offers?: unknown[] }).offers?.length ?? 0;
    case 'workday': return (payload as { total?: number }).total ?? 0;
  }
}

async function probeToken(provider: ProviderName, token: string): Promise<ProbeResult> {
  try {
    let payload: unknown;
    if (provider === 'greenhouse') {
      payload = await probe(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=false`);
    } else if (provider === 'lever') {
      payload = await probe(`https://api.lever.co/v0/postings/${token}?mode=json`);
    } else if (provider === 'ashby') {
      payload = await probe(`https://api.ashbyhq.com/posting-api/job-board/${token}`);
    } else if (provider === 'smartrecruiters') {
      payload = await probe(`https://api.smartrecruiters.com/v1/companies/${token}/postings?limit=1`);
    } else if (provider === 'workable') {
      payload = await probe(`https://apply.workable.com/api/v1/widget/accounts/${token}?details=false`);
    } else if (provider === 'recruitee') {
      payload = await probe(`https://${token}.recruitee.com/api/offers/`);
    } else {
      const { host, tenant, site } = parseWorkdayToken(token);
      payload = await probe(`https://${tenant}.${host}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/jobs`, { method: 'POST', body: JSON.stringify({ appliedFacets: {}, limit: 1, offset: 0 }) });
    }
    return { provider, token, valid: jobCount(provider, payload) > 0, jobCount: jobCount(provider, payload) };
  } catch (error) {
    return { provider, token, valid: false, error: String((error as Error).message ?? error) };
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main(): Promise<void> {
  const { wanted, out } = args();
  const tokens = await readTokenFile(args().tokens);
  if (tokens.length === 0) {
    console.log('Usage: npm run discover -- [--provider greenhouse,lever] [--file tokens.txt] [--out out.json] token1 token2 ...\n');
    console.log(`Providers probed per token: ${providers.join(', ')}. Workday tokens must use "host/tenant/site" format (e.g. "wd5/example/Example").`);
    return;
  }
  const unique = [...new Set(tokens.map((token) => token.trim()).filter(Boolean))];
  const targets: Array<{ provider: ProviderName; token: string }> = [];
  for (const token of unique) {
    for (const provider of providers) {
      if (wanted.size > 0 && !wanted.has(provider)) continue;
      if (provider === 'workday' && token.split('/').length !== 3) continue;
      targets.push({ provider, token });
    }
  }
  console.log(`Probing ${targets.length} provider/token combinations for ${unique.length} candidate tokens...`);
  const results = await mapWithConcurrency(targets, 6, ({ provider, token }) => probeToken(provider, token));
  const valid = results.filter((result) => result.valid).sort((a, b) => (b.jobCount ?? 0) - (a.jobCount ?? 0));

  for (const result of valid) {
    console.log(`✓ ${result.provider.padEnd(16)} ${result.token.padEnd(40)} ${result.jobCount} roles`);
  }
  const failed = results.filter((result) => !result.valid);
  if (process.argv.includes('--verbose')) {
    for (const result of failed) console.log(`× ${result.provider.padEnd(16)} ${result.token.padEnd(40)} ${result.error}`);
  }
  console.log(`\n${valid.length} valid board(s) found; ${failed.length} candidate(s) rejected.`);

  await fs.writeFile(out, `${JSON.stringify({ generatedAt: new Date().toISOString(), valid, rejected: failed }, null, 2)}\n`);
  console.log(`Wrote ${out}. Add entries to src/data/companies.ts as CompanyConfig rows using the provider + boardToken above.`);
}

await main();
