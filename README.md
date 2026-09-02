# Hiring Signal Radar

[View the live dashboard](https://twelfthlabor.github.io/hiring-signal-radar/)

Hiring Signal Radar turns public technology job postings into a simple, inspectable view of where companies are hiring. I built it for people who want a useful signal without a black-box vendor: every role links back to its employer source, and the dashboard shows how fresh the data is.

It is an observation tool, not a count of hires, headcount, or investment advice.

## What it shows

- Current openings across employer-direct career boards
- Hiring mix by company, function, level, location, and remote label
- Roles that recently appeared or disappeared
- Source health, timestamps, and original application links

The collector uses public Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Recruitee, and Workday board APIs. Companies may list multiple boards per provider (`boardToken` accepts an array). It keeps normalized role metadata and compact history; it does not store complete job descriptions.

To expand coverage, feed candidate board tokens into the discovery probe, which validates them against every provider API and reports live job counts:

```bash
npm run discover -- stripe openai anthropic
npm run discover -- --provider greenhouse --file candidate-tokens.txt
```

## Run locally

Requires Node.js 24 and npm 10 or newer.

```bash
npm ci
npm run materialize
npm run dev
```

Useful checks:

```bash
npm test
npm run build
npm run test:e2e
```

`materialize` creates the ignored public data files from the committed snapshot, so a local build does not need to call external services.

## How it works

Durable state lives in `data/`. GitHub Actions refreshes the public boards daily, commits only the normalized state, and deploys the static site. A role needs two successful missed observations before it is marked removed.

## Deploy

GitHub Pages is already configured: enable **Settings → Pages → GitHub Actions**, then run **Collect and deploy** once. To use Vercel, import the repository, keep the default `npm run build` command, and leave `BASE_PATH` empty. Collection should remain in GitHub Actions.

Read the built-in **Methodology** and **Data status** pages for definitions and limitations. Contributions and private security reports are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## License

Code is available under the [MIT License](LICENSE). Job metadata remains subject to the terms of its original public source; see [NOTICE.md](NOTICE.md).
