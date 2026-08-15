# Developer Lab

> Small tools for the small engineering decisions that interrupt your flow.

[![Checks](https://github.com/mrnamazbek/developer-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/mrnamazbek/developer-lab/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-63e6e2.svg)](LICENSE)

Developer Lab is a privacy-friendly browser toolkit with six focused surfaces:

- **Regex Playground** — test patterns, inspect matches, and see readable feedback.
- **Compose Builder** — generate a local Docker Compose database service.
- **Tech Radar** — browse a small curated set of tools by category and signal.
- **Cloud Cost Lens** — estimate a rough monthly baseline from CPU, memory, and storage.
- **Agent Brief Builder** — create a concise, repo-specific `AGENTS.md` for coding agents.
- **JSON Contract Lens** — format, minify, and derive starter JSON Schema from a payload.

It also includes **AI Pulse**: a transparent weekly attention proxy for major AI platforms. It uses Wikimedia article pageviews and is explicitly not presented as daily active users, model DAU, market share, or a quality ranking.

The app is plain HTML, CSS, and JavaScript. It has no server, account system, analytics, or runtime dependency. Inputs stay in the browser.

## Run locally

```bash
npm test
npm run check
python3 -m http.server 4173
```

Open <http://localhost:4173>.

## Project shape

```text
index.html                    interface and accessible structure
styles.css                    visual system and responsive layout
src/app.js                    browser interactions
src/toolkit.js                testable, dependency-free tool logic
tests/toolkit.test.js         Node built-in unit tests
scripts/daily-maintenance.mjs transparent maintenance heartbeat
scripts/update_ai_pulse.py    public AI attention proxy refresh
data/site-config.js           safe, public-site configuration
AGENTS.md                     persistent guidance for coding agents
```

## Automation

- `Checks` runs syntax checks and unit tests on pushes and pull requests.
- `Deploy to GitHub Pages` publishes the static site from `main`.
- `Daily maintenance` runs at 09:17 UTC, refreshes the Wikimedia-based AI Pulse, and updates `data/daily-status.json`. The commit is explicitly authored by `github-actions[bot]` and is maintenance metadata—not fabricated human feature work.

The daily workflow is useful for confirming that Actions and Pages remain healthy. It does not create community adoption, usage, or maintainer history by itself.

## AI Pulse methodology

AI vendors generally do not publish comparable daily-active-user counts for every individual model. To avoid inventing numbers, AI Pulse aggregates weekly English Wikipedia article pageviews for each tracked AI platform through the [Wikimedia Pageviews API](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/getting-started/). It is a public attention signal only.

The snapshot updates automatically. The page reads the newest public JSON snapshot from the repository and falls back to the copy deployed with the site, then displays its methodology and source link next to the chart.

## Agent-ready workflow

The Agent Brief Builder reflects a practical agentic-development pattern: concise persistent project context, reliable verification commands, and clear completion criteria. The repository’s own [AGENTS.md](AGENTS.md) applies the same approach without locking the project to a specific AI vendor.

## Support configuration

The visual Buy Me a Coffee section is ready, but it intentionally stays inactive until the creator has a verified public profile URL. When that profile exists, put its exact `https://buymeacoffee.com/<handle>` URL into `buyMeACoffeeUrl` in `data/site-config.js`.

Never add card, bank, payout, API-token, or other personal payment details to this repository. Buy Me a Coffee handles creator payouts through its own secure setup.

## Notes on estimates

Cloud Cost Lens uses illustrative provider-shaped baselines so you can compare scenarios quickly. It is not a billing quote; always check the provider, region, discounts, data transfer, and attached services before making a decision.

## Open-source program note

This repository is an independent open-source project and is not affiliated with Google or OpenAI. OpenAI’s [Codex for Open Source](https://openai.com/form/codex-for-oss/) program describes support for maintainers of active projects with meaningful usage, broad adoption, or clear ecosystem importance. Creating a repository or scheduling maintenance commits does not guarantee selection.

## Contributing

Bug reports, small improvements, and focused pull requests are welcome. Please keep changes dependency-light and preserve the browser-only privacy model.

## License

MIT © 2026 Namazbek Bekzhanov
