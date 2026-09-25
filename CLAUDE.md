# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product

Riven is an independent verification and institutional-memory layer for AI-built software. It captures a code change, runs it in an isolated sandbox, verifies it independently, remembers confirmed bugs, turns them into regression locks, and links requirement → change → module → bug → fix → test in a causal graph. **Core principle: Riven never approves its own work** — the producer of a change is never its verifier. The UI must always show who produced a change and who verified it.

This repo is the dashboard. The API, pipeline and all business rules live in [Riven-Backend](https://github.com/Riven-Org/Riven-Backend); the frontend displays and edits through the API and never re-implements verdict, permission or tenancy logic client-side.

What users do here: follow a verification live (pipeline stages, logs, findings on the diff), review "Needs Review" runs, browse bug memory and regression locks, explore the causal graph ("why does this code exist?"), manage org, members, roles and API keys, and read insights.

Domain terms: **change** (commit/PR), **producer** (human / ai_agent / bot), **verdict** (passed / failed / needs_review), **finding** (one reported problem with severity), **regression lock** (test guarding a fixed bug), **causal graph** (linked requirements, changes, bugs, fixes, tests).

## Current state

Only a start page exists (`src/App.tsx`) that shows whether the backend is reachable. Router, data layer, design system and tests are introduced by their tickets (below) — do not add them ad hoc in unrelated tickets.

## Commands

```bash
npm install
npm run dev        # :5173; /api/* is proxied to the backend on :8000 (vite.config.ts)
npm run lint       # oxlint
npm run build      # tsc -b (type check) + vite build — CI runs lint + build
```

Run the backend (`make api` in Riven-Backend) to see live data. No test runner exists yet; the first ticket that needs component tests adds Vitest + Testing Library, and S21.2 adds Playwright for end-to-end tests. Once added, document the single-test command here.

## Architecture and conventions

- React 19 + TypeScript (strict null checks on by default) + Vite; lint with oxlint (`.oxlintrc.json`).
- All backend calls go to relative `/api/...` paths; never hard-code `localhost:8000`. The API contract is the backend's OpenAPI (`/openapi.json`); prefer generated types (e.g. `openapi-typescript`) over hand-written response types.
- Planned stack, introduced by its ticket: design system with tokens, dark mode and Storybook (S10.1: Tailwind + shadcn/ui, axe checks in CI); server state via TanStack Query; live pipeline progress via Server-Sent Events (S10.3); large logs virtualized (S10.3.2); causal graph explorer with Cytoscape.js (S09.4). Until S10.1 lands, style with the CSS variables in `src/index.css` (light and dark).
- Permissions: hide or disable actions the user's role can't perform (S03.3.3), but treat the backend as the authority — always handle 401/403.
- Accessibility is an acceptance criterion (WCAG 2.1 AA on core pages, E10): keyboard reachable, labelled controls, sufficient contrast in both themes.
- Cost: the org is on free plans (GitHub Free). Use free/open-source libraries only; no paid SaaS, licensed GitHub Actions, or larger runners. If a ticket suggests a paid tool, use the free alternative and say so in the PR.

## Guardrails (enforced)

`.claude/hooks/guard.py` runs before every shell command and file edit and blocks: force push (`-f`, `--force`, `--force-with-lease`, `+refspec`), pushing to or deleting `main`, `--no-verify`, `git reset --hard`, `gh pr merge --admin`, opening pull requests (`gh pr create` — the user opens PRs), changing repo visibility, deleting/archiving repos, Codespaces, changing branch protection or rulesets, editing `docs/tickets/`, and in workflows any licensed action (e.g. `gitleaks/gitleaks-action`) or non-standard (paid, larger) runner. `.claude/settings.json` also denies reading `.env` and always asks the user before `git push` and `gh pr merge`. If a guard blocks something the task genuinely needs, stop and ask the user; never work around it.

The guard matches the whole command text, so a commit message or heredoc that merely mentions a blocked flag is also blocked; put such text in a file (`git commit -F <file>`).

## Implementing a ticket

Ticket details live in `docs/tickets/`: `INDEX.md` lists every epic and story; `<story-id>.md` holds its description, acceptance criteria, dependencies, tech notes and tasks. A task ID like `S10.3.2` is inside `S10.3.md`. Each task is labelled **Repo: backend / frontend / both**.

When asked to do a ticket (e.g. "do S10.5" or "S10.3.2"):

1. **Read** the story file, the epic context at its end, and the backend ADRs if the ticket touches API shape.
2. **Check the repo label.** Implement only tasks labelled `frontend` or `both` (UI half). If nothing is for this repo, stop and say it belongs to Riven-Backend.
3. **Check dependencies**, especially the backend endpoints the UI needs: `gh pr list -R Riven-Org/Riven-Backend --state merged --search "<DEP-ID>"` and the backend's `/openapi.json`. If an endpoint doesn't exist yet, stop and report it; do not invent the API or mock it permanently. A temporary typed mock is acceptable only if the user agrees, and it must be listed as a follow-up.
4. **Plan** by mapping every acceptance criterion to the screen or behaviour that satisfies it and how it is verified. Fill gaps in the terse task lines with the story description and epic context, never by widening scope.
5. **Branch** — every ticket starts from the latest main on a new branch: `git switch main && git pull --ff-only origin main && git switch -c <ID>-<short-slug>`. Never commit on main or reuse another ticket's branch.
6. **Implement** only what the criteria require; record out-of-scope needs as follow-ups with their ticket IDs from `INDEX.md`.
7. **Verify**: `npm run lint && npm run build`, tests for the behaviour once a runner exists, and run the dev server against the backend to check the flow in a browser in both light and dark mode.
8. **Commit** as `<ID>: <summary>`.
9. **Sync with main before every push**: `git fetch origin && git merge origin/main`. Resolve any conflicts by keeping both sides' intent (never drop the other change to make yours apply), re-run `npm run lint && npm run build`, and commit the merge. Use merge, not rebase, once the branch is pushed — rewriting pushed history would need a force push, which is blocked.
10. **Push** the branch: `git push -u origin <branch>`. **Do not open a pull request** — the user opens it. CI runs on every branch push; watch it with `gh run watch $(gh run list --branch <branch> -L1 --json databaseId -q '.[0].databaseId')` and fix until green.
11. **Report**: branch name, compare link `https://github.com/Riven-Org/Riven-Frontend/compare/main...<branch>?expand=1`, a ready-to-paste PR description (ticket ID, acceptance-criteria checklist ticked only if proven, how it was tested, follow-ups including the backend half of `both` tasks), which criteria are met or not and why, and a reminder to move the ClickUp ticket. Never merge.

Ticket files are generated from the product backlog (also in ClickUp). Do not edit them by hand; if a ticket looks wrong, say so and ask.
