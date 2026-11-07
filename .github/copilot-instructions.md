# Number Garden — workspace notes

- Stack: React 19, TypeScript, Vite, CSS, Vitest.
- Keep game rules and state transitions in `src/game/`; UI belongs in `src/App.tsx`.
- Keep the interface Japanese-first, responsive, keyboard accessible, and dependency-light.
- Run `npm test`, `npm run lint`, and `npm run build` after game or UI changes.
- Best score is stored locally in the browser; this MVP has no server or online leaderboard.
