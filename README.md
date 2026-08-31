# Hiring Signal Radar

Hiring Signal Radar is a small, transparent dashboard for watching hiring activity at technology companies. It turns public employer career-board postings into a readable signal: what is open now, where teams are hiring, which functions are expanding, and which roles recently appeared or disappeared.

This is an observation tool, not a measure of hires, workforce size, or investment advice.

## What you can do with it

- Browse current openings across 145 employer-direct career boards.
- Compare 122 publicly traded technology companies by openings, role mix, publication pace, and removals.
- Search by career area, employer, location, country, experience level, remote label, or publication freshness.
- Open the original employer application page for every role.
- Review source-by-source collection health and the timestamp behind the dashboard.
- Subscribe to a per-company RSS feed when your deployment exposes the generated feeds.

The project intentionally excludes job aggregators, social networks, and third-party resume databases. The collector uses the public Greenhouse Job Board, Lever Postings, and Ashby Job Postings APIs, retaining only normalized role metadata and source timestamps.

## Run it locally

Requirements: Node.js 24 and npm 10 or newer.

```bash
npm ci
npm run materialize
npm run dev
```

Then open the local Astro URL shown in the terminal. `materialize` builds the ignored `public/data/` and `public/rss/` files from the committed snapshot without contacting any external service.

## Useful commands

```bash
npm test                 # deterministic collector and data-model tests
npm run build            # materialize, type-check, and build the static site
npm run collect          # refresh all live employer-direct boards
npm run collect:fixtures # exercise normalization with saved fixtures
npm run preview          # serve the production build with Astro
npm run test:e2e         # Chromium desktop and mobile smoke tests
```

Set `COLLECTOR_NOW` when a deterministic collection timestamp is useful in tests or fixtures.

## How the data is stored

Only durable state is committed:

- `data/state.json` stores the latest normalized role observations, source health, and miss counters.
- `data/history.json` stores compact daily company-level observations for up to five years.

The build derives `public/data/**` and `public/rss/**`; those generated files are ignored so roles are not stored several times in the repository. A role must be absent in two successful observations before it is marked removed. Old removed records are pruned during collection.

The project does not retain complete job descriptions. A generated role contains the employer, title, classification, location label, source URL, source timestamps when supplied, and first/last-seen dates.

## Configuration

The following environment variables are optional:

- `SITE_URL`: the deployed site origin, for example `https://example.com`.
- `PUBLIC_SITE_URL`: the complete public URL used in RSS links.
- `BASE_PATH`: a project subpath such as `/hiring-signal-radar/` for a project GitHub Pages site.
- `PUBLIC_REPOSITORY_URL`: the public repository URL shown in the site footer and collector user-agent.

## Deploy to GitHub Pages

1. Create a public GitHub repository and push this project.
2. In **Settings -> Pages**, choose **GitHub Actions** as the source.
3. Run **Collect and deploy** once from the Actions tab.

The workflow refreshes public employer boards daily at 10:17 UTC, commits only durable state, builds the static site, and deploys the result. Pull requests run the full unit, build, and browser checks through the separate CI workflow.

## Deploy to Vercel

Import the repository into Vercel. The included `vercel.json` selects Astro, runs `npm run build`, and serves `dist`. Set `SITE_URL`, `PUBLIC_SITE_URL`, and (optionally) `PUBLIC_REPOSITORY_URL` in the Vercel project settings; leave `BASE_PATH` empty.

Keep collection in GitHub Actions. Each daily state commit can trigger a fresh Vercel deployment through the Git integration. Vercel's Hobby plan is suitable for a personal, non-commercial static deployment; check current usage limits before sharing it widely.

## Methodology and limitations

Hiring Signal Radar reports published job-board inventory. A posting may be evergreen, duplicated, confidentially replaced, or removed without a hire. Publication pace is reconstructed from official source timestamps attached to roles observed by the collector; roles removed before tracking began cannot be reconstructed. Source health and freshness are shown openly on the status page.

Read the built-in **Methodology** and **Data status** pages for the detailed definitions and limitations.

## Contributing and security

Bug reports and improvements are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), and use [SECURITY.md](SECURITY.md) for private vulnerability reports. Data attribution and third-party terms are documented in [NOTICE.md](NOTICE.md).

## License

The project code is available under the [MIT License](LICENSE). Job metadata remains subject to the terms of its original public source; see [NOTICE.md](NOTICE.md).
