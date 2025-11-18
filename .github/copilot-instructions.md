## Repo snapshot

- Framework: Next.js (App Router) using the `app/` directory.
- Package manager: pnpm.
- DB: uses the `postgres` npm package and expects `POSTGRES_URL` in env.

## High-level architecture (what to know first)

- Entry points live in `app/` (server components by default). Example: `app/layout.tsx`, `app/page.tsx`.
- UI components are under `app/ui/`. Examples:
  - Side navigation and nav links: `app/ui/dashboard/sidenav.tsx`, `app/ui/dashboard/nav-links.tsx`
  - Reusable utilities and styles: `app/ui/global.css` and `app/ui/acme-logo.tsx`.
- Data access is centralized in `app/lib/`:
  - SQL queries and DB client: `app/lib/data.ts` (uses `postgres` and tagged template queries `sql`)
  - Types: `app/lib/definitions.ts` (canonical TypeScript shapes used across the app)
  - Helpers: `app/lib/utils.ts` (e.g. `formatCurrency`, `formatDateToLocal`)
  - Placeholder/seed data used for demos: `app/lib/placeholder-data.ts`.

Why this matters for AI edits
- Most data fetching happens server-side (in `app/lib/*`) and is imported into server components. Changes to UI often require matching type/shape updates in `definitions.ts` and formatting helpers in `utils.ts`.
- SQL is written with the `postgres` client and uses tag templates (e.g. ``sql`SELECT ...` ``). Keep interpolation secure and follow existing patterns for parameterization.

## Developer workflows & commands

- Install dependencies: `pnpm install`.
- Local dev: `pnpm dev` — this runs `next dev --turbopack` (note the repo enables Turbopack by default).
- Build: `pnpm build` → `next build`.
- Production start: `pnpm start` → `next start`.

Quick checks an AI agent can assume
- If you touch DB code, `POSTGRES_URL` must be present in the environment for local runs. Many functions in `app/lib/data.ts` will throw if the DB is unreachable.
- Amounts in the DB are stored in cents. Look at `app/lib/data.ts` and `app/lib/utils.ts` — `formatCurrency` divides by 100 when presenting amounts.

Project-specific conventions and patterns

- Types: `app/lib/definitions.ts` is the single source of truth for shape names (e.g. `Invoice`, `CustomersTableType`). When adding fields, update these types first.
- DB error handling: data functions catch errors, `console.error`, then `throw new Error('Failed to ...')`. Keep this pattern for consistent messages.
- Pagination: `app/lib/utils.ts` provides `generatePagination`. Follow the same signature and return conventions when adding pagination elsewhere.
- UI styling: Tailwind utility classes are used inline in components. Prefer altering classes in components under `app/ui/` rather than central CSS for small changes.

Integration points worth noting

- `app/lib/data.ts` imports `postgres` directly and constructs `sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })`. This means server runtime must supply `POSTGRES_URL` and might require SSL depending on env.
- Images and static assets: `public/customers/*` contains customer images referenced by `image_url` in placeholder data.
- Auth: `next-auth` is listed in `package.json`. The repository may expect auth routes or middleware in a larger version — be careful when adding pages that assume authenticated user context.

Examples to reference when making edits

- Add a dashboard nav item: edit `app/ui/dashboard/nav-links.tsx` (the `links` array).
- Change currency formatting: edit `app/lib/utils.ts::formatCurrency` and confirm callers in `app/lib/data.ts` and UI components.
- Add/modify a DB query: edit `app/lib/data.ts`. Follow the existing pattern of a try/catch, `console.error`, and throwing a friendly error message.

Quick rules for AI agents (do this, not that)

- Do: Update `app/lib/definitions.ts` when you change data shape. Then update any DB queries and UI components that consume that type.
- Do: Use the `sql` tagged templates the same way: parameterize user input via `${...}` inserted into the template as shown.
- Do: Mention required env vars (`POSTGRES_URL`) in PR descriptions for DB-related changes.
- Don't: Assume client-side fetching for server-only helpers — many helpers are intended to run server-side in the App Router.
