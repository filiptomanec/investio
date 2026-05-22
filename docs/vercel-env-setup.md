# Vercel env vars — Investio Supabase wiring

Po vytvoření Supabase projektu (`hofakmgvvtajodbcevba`, EU Frankfurt) je třeba nastavit 4 env vars v Vercel dashboardu, aby production deploy přestal hlásit "Backend není nakonfigurován".

## Vercel kroky (5 minut)

1. Otevři [Vercel dashboard → investio-web → Settings → Environment Variables](https://vercel.com/tomanecf-gmailcoms-projects/investio-web/settings/environment-variables)
2. Přidej následující 4 vars pro **Production** + **Preview** + **Development** environments:

### Required vars

| Name | Value | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hofakmgvvtajodbcevba.supabase.co` | Production + Preview + Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZmFrbWd2dnRham9kYmNldmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NzQ0NzYsImV4cCI6MjA5NTA1MDQ3Nn0.HUvq-9kGLgeN0kQCSda0za0RRERBnTjp5MhOQmg6agw` | Production + Preview + Development |
| `NEXT_PUBLIC_SITE_URL` | `https://investio.filiptomanec.cz` | Production (Preview: nech prázdné — Vercel auto-detect) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZmFrbWd2dnRham9kYmNldmJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ3NDQ3NiwiZXhwIjoyMDk1MDUwNDc2fQ.YSJCE9I75bqiNLooy4jZVmsdZrytAGgmluxM0flqGUI` | Production + Preview only (NE Development) — **service role, sensitive** |

### Optional (Prisma direct DB access)

Pokud chceš, aby `/api/scenarios` route handlers fungovaly přes Prisma s RLS (T-006 pattern), přidej taky:

| Name | Value | Scope |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.hofakmgvvtajodbcevba:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` | Production + Preview |
| `DIRECT_URL` | `postgresql://postgres.hofakmgvvtajodbcevba:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres` | Production + Preview |

[PASSWORD] = DB password kterým jsi vytvořil Supabase project (zobrazený jen jednou při vytvoření). Pokud nemáš, [Reset databasse password](https://supabase.com/dashboard/project/hofakmgvvtajodbcevba/settings/database).

## Po nastavení

3. **Redeploy** — Vercel automaticky redeployne při dalším pushi na `main`, ale pro okamžitý redeploy klikni "Redeploy" u nejnovějšího deploymentu.
4. **Verify**:
   - Otevři https://investio.filiptomanec.cz/dashboard — místo "Backend není nakonfigurován" banner uvidíš auth login page (redirect 307 → `/login`).
   - Zkus signup s real emailem — Supabase pošle confirmation email, po kliknutí jsi v dashboardu.

## Supabase project info (pro budoucnost)

- **Project ref**: `hofakmgvvtajodbcevba`
- **Region**: Central EU (Frankfurt)
- **Created**: 2026-05-22
- **Migrations applied**: `20260517000000_initial.sql` + `20260522000000_seed_templates.sql`
- **Templates seeded**: 6 (S&P 500, MSCI World, CZ dividend, CZ apartment, holiday rental, urban flat)
- **Dashboard**: https://supabase.com/dashboard/project/hofakmgvvtajodbcevba

## Změna v `.mcp.json`

`.mcp.json` byl updatován z todo-app project_ref na investio. **Restartuj Claude Code session**, aby MCP server reload-nul s investio project_refem — pak budu mít přímý přístup k Investio Supabase přes MCP (apply_migration, execute_sql, list_tables).
