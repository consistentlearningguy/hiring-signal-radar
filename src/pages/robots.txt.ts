export const prerender = true;

export function GET({ site }: { site?: URL }) {
  const origin = site ?? new URL('http://localhost:4321');
  const sitemap = new URL(`${import.meta.env.BASE_URL}sitemap.xml`, origin);
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
