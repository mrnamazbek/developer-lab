# Developer Lab agent guide

## Project map

- `index.html` contains the accessible single-page structure.
- `styles.css` owns the visual system and responsive behavior.
- `src/toolkit.js` contains pure, unit-tested tool logic.
- `src/app.js` wires the UI to that logic.
- `data/` contains transparent, static site data.

## Commands

- Verify: `npm test && npm run check`
- Preview: `python3 -m http.server 4173`

## Working agreement

- Keep the project dependency-free and browser-first.
- Do not send user-entered tool data to external services.
- Keep AI Pulse labeled as a Wikimedia pageview attention proxy, never as unique active users.
- Do not add financial details, secrets, or personal payment data to source control.
- For UI work, preserve keyboard access, readable states, and the small-screen layout.
