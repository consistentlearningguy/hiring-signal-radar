import { companies } from '@/data/companies';

export const prerender = true;

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]!);

export function GET({ site }: { site?: URL }) {
  const origin = site ?? new URL('http://localhost:4321');
  const base = import.meta.env.BASE_URL;
  const paths = ['', 'jobs/', 'methodology/', 'status/', ...companies.map((company) => `companies/${company.id}/`)];
  const urls = paths.map((path) => `<url><loc>${escapeXml(new URL(`${base}${path}`, origin).toString())}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
}
