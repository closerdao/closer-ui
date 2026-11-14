# closer-ui (for agents)

pnpm + Turborepo monorepo of Next.js 15 (pages router) apps that share one package. **Public repo.** Default branch `develop`; `main` is production.

## Commands

```sh
pnpm install
pnpm --filter tdf dev                  # one app; reads apps/tdf/.env.local
pnpm turbo run build --filter=tdf      # build one app, never all of them
pnpm lint                              # turbo, all packages
pnpm typecheck                         # builds locales + config first, then tsc everywhere
pnpm turbo run test --filter=closer    # one package's jest suite
cd packages/closer && pnpm test <path-or-pattern>   # one test file
pnpm format                            # prettier --write
```

Node 24 (`.mise.toml`). The pre-commit hook runs prettier on staged files. CI runs prettier check, lint, typecheck and each package's tests.

## Where things are

- **Shared code is `packages/closer`**: pages, components, hooks, contexts, utils, types, locales. Apps in `apps/<name>` import from it and add only what is specific to them. A change that every community should get goes in `packages/closer`.
- An app page is usually a one-line re-export of the page in `packages/closer/pages`. Look there first.
- Stays (current booking flow): `packages/closer/pages/stay/`. API calls: `packages/closer/utils/stays.api.ts`; generic client: `packages/closer/utils/api.js`.
- Auth: `packages/closer/contexts/auth/auth.tsx`.
- Shared middleware and rewrites used by every app: `packages/closer/next/`.
- Redirects are per app, in `apps/<name>/next.config.js` `redirects()`.
- Translations: `packages/closer/locales/base-<lang>.json`, with per-app overrides in `packages/closer/locales/<app>/`.

## Docs

`docs/README.md` indexes every doc and marks which are reference and which are historical. `CONTEXT.md` at the root is the glossary and the settled decisions; read it before naming anything in domain terms (Village, federation, member journeys).

## Traps

- **Never link to a redirect source path.** Every app has a `middleware.ts`, so Next resolves `redirects()` on the client, and a client-side redirect drops the dynamic params (`/bookings/:slug` → `/stay/:slug` lands on `/stay/undefined`). Point `<Link>`, `router.push` and href builders at the destination. Before adding a link, check the app's `redirects()` for a matching `source`.
- **Validate a route id before fetching with it.** Use `isStayMongoId` / `useStayRouteId` from `packages/closer/utils/stayRouting.helpers.ts`, never `router.query` straight into an API call.
- zsh aborts on an unmatched glob, and Next's `[slug]` paths are globs. Quote them: `"packages/closer/pages/stay/[slug]/index.tsx"`. Search with `git grep`.

## Rules

- Removing something means deleting it, not commenting it out.
- No comments, except the rare one that explains a non-obvious why.
- Component files are camelCase.
- Reuse existing types. New ones go in the relevant file under `types/`, not inline, except a component's `Props`.
- Colours come from the Tailwind config, not ad-hoc values.
- In `flex-col`, space with `gap`, not per-child vertical margins.
- A new next-intl string goes into every language file that exists for that scope.
- `.env*` files: read, never write.
- Hotfix: branch `hotfix/<slug>` from `main`, PR against `main`. Everything else branches from `develop`.
- This repo is public. Never describe a vulnerability in an issue, PR, branch name or commit message here; report it privately to the maintainers.

## Agent skills

### Issue tracker

GitHub Issues in `closerdao/closer-ui`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical labels, unchanged: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
