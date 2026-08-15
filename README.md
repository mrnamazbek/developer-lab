# Developer Lab

> Small tools for the small engineering decisions that interrupt your flow.

[![Checks](https://github.com/mrnamazbek/developer-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/mrnamazbek/developer-lab/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-63e6e2.svg)](LICENSE)

Developer Lab is a privacy-friendly browser toolkit with four focused surfaces:

- **Regex Playground** — test patterns, inspect matches, and see readable feedback.
- **Compose Builder** — generate a local Docker Compose database service.
- **Tech Radar** — browse a small curated set of tools by category and signal.
- **Cloud Cost Lens** — estimate a rough monthly baseline from CPU, memory, and storage.

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
```

## Automation

- `Checks` runs syntax checks and unit tests on pushes and pull requests.
- `Deploy to GitHub Pages` publishes the static site from `main`.
- `Daily maintenance` runs at 09:17 UTC and updates `data/daily-status.json` only when the calendar date changes. The commit is explicitly authored by `github-actions[bot]` and is maintenance metadata—not fabricated human feature work.

The daily workflow is useful for confirming that Actions and Pages remain healthy. It does not create community adoption, usage, or maintainer history by itself.

## Notes on estimates

Cloud Cost Lens uses illustrative provider-shaped baselines so you can compare scenarios quickly. It is not a billing quote; always check the provider, region, discounts, data transfer, and attached services before making a decision.

## Open-source program note

This repository is an independent open-source project and is not affiliated with Google or OpenAI. OpenAI’s [Codex for Open Source](https://openai.com/form/codex-for-oss/) program describes support for maintainers of active projects with meaningful usage, broad adoption, or clear ecosystem importance. Creating a repository or scheduling maintenance commits does not guarantee selection.

## Contributing

Bug reports, small improvements, and focused pull requests are welcome. Please keep changes dependency-light and preserve the browser-only privacy model.

## License

MIT © 2026 Namazbek Bekzhanov
