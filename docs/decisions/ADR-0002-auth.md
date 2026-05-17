# ADR-0002 — Authentication & Session Strategy

- **Status**: accepted
- **Date**: 2026-05-17
- **Tags**: auth, security
- **Deciders**: architect

## Kontext

Investio je public web + mobile aplikace s per-user persistent scénáři. Potřebujeme:
1. Friction-low signup (hobby projekt, žádné placené auth providery).
2. Sdílenou auth napříč web a mobile (jeden účet ⇒ scénáře viditelné na obou).
3. RLS-enforced datovou izolaci na úrovni Postgresu — žádný "trust the API layer".
4. Free-tier compatible.

Supabase Auth je v defaultním stacku z ADR-0001, takže auth provider = Supabase. Otázka je: které **metody** povolíme (email/password? magic link? OAuth?), jak držet session na webu vs mobile, a jak strukturovat RLS.

## Rozhodnutí

**Provider**: Supabase Auth. **Primary metody**: email + password (default) **a** Google OAuth (sekundární, jeden klik). **Magic link nepovolujeme v MVP** — UX is messy s mobile deeplinky, password reset stačí.

**Session storage**:
- **Web**: `@supabase/ssr` s **httpOnly secure cookies** (auto-refresh na Route Handler boundary). Žádný localStorage token leak.
- **Mobile**: `@supabase/supabase-js` s custom storage adapter používající **`expo-secure-store`** (Keychain na iOS, EncryptedSharedPreferences na Androidu). Token refresh background přes built-in `autoRefreshToken`.

**Shared auth package** (`packages/auth`): ANO. Exportuje tři factory funkce:
- `createBrowserClient()` — pro web client komponenty
- `createServerClient(cookies)` — pro web Route Handlers + Server Components
- `createNativeClient()` — pro Expo, používá `expo-secure-store`

Shared package zajišťuje konzistentní `Session` a `User` typing a centralizuje Supabase URL/anon key config (oba pochází z env varů, jen kde je čte se liší).

**RLS pattern**:
- Každá uživatelská tabulka má sloupec `user_id uuid not null references auth.users(id) on delete cascade`.
- Default deny — `alter table X enable row level security` + žádný `grant`.
- 4 policies per uživatelská tabulka: `select`, `insert`, `update`, `delete`, všechny s `using/with check (auth.uid() = user_id)`.
- Templates tabulka: `select` pro `anon` + `authenticated` (public read), žádný insert/update/delete pro běžné uživatele.

### Kontrolní RLS query příklad

```sql
-- Scenario tabulka
alter table public.scenario enable row level security;

-- SELECT: jen vlastní + ne-archivované, archivované také jen vlastníkovi
create policy "scenario_select_own"
  on public.scenario for select
  to authenticated
  using (auth.uid() = user_id);

-- INSERT: může vytvořit jen pro sebe
create policy "scenario_insert_own"
  on public.scenario for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE: může upravit jen vlastní (and check že nezmění user_id)
create policy "scenario_update_own"
  on public.scenario for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: může smazat jen vlastní
create policy "scenario_delete_own"
  on public.scenario for delete
  to authenticated
  using (auth.uid() = user_id);

-- Template (read-only public)
alter table public.template enable row level security;
create policy "template_select_public"
  on public.template for select
  to anon, authenticated
  using (true);
-- žádné insert/update/delete policies → default deny
```

### Auth flows

| Flow | Web | Mobile |
|---|---|---|
| Signup email | `/signup` → Supabase `signUp({email, password})` → email confirmation link → middleware redirect na dashboard | `(auth)/signup` screen → stejné API, deeplink přes `expo-linking` na `investio://auth/confirm` |
| Login email | `/login` → `signInWithPassword` → cookies session set | `(auth)/login` → secure store session set |
| Login Google | `signInWithOAuth({provider: 'google', redirectTo})` → Google consent → Supabase callback `/auth/callback` Route Handler → cookie session | `signInWithOAuth` přes `expo-auth-session` → custom URI scheme callback |
| Logout | `signOut()` clears cookies | `signOut()` clears secure store |
| Password reset | `resetPasswordForEmail(email)` → email s reset linkem na `/auth/reset` | Stejné, deeplink na `investio://auth/reset` |
| Token refresh | Automatic on Route Handler boundary (`@supabase/ssr` middleware) | Automatic via `autoRefreshToken: true` |

### Email confirmation

- **Required ON** (Supabase default). Důvod: spam prevention + audit. Trade-off: friction pro nového usera (musí ověřit email před první kalkulačkou). Mitigace: middleware nepushuje na `/dashboard` před confirmation, ukáže info screen "Ověř svůj email".
- Customizovaný email template (CZ + EN) — Supabase template editor. **Lokalizace dle Accept-Language při signupu** (uložené v user_metadata).

### Vercel + Supabase cookie config

- `@supabase/ssr` automaticky řeší `httpOnly`, `secure`, `sameSite=lax`.
- Cookie name: `sb-<project-ref>-auth-token`.
- Domain: production = `.investio.app` (TBD), preview = Vercel auto (`.vercel.app` — Supabase callback URL whitelist musí pokrývat preview URL pattern).

## Důsledky

- **Plus**:
  - Free-tier (Supabase Auth has unlimited MAU na free).
  - Email + Google = pokrývá 90 %+ user preference, žádné OAuth providers maintenance navíc.
  - RLS-enforced isolation = i kdyby fullstack udělal chybu v Route Handler (např. zapomenul where user_id), DB to neumožní.
  - Shared `packages/auth` zajišťuje typed Session napříč platformami.

- **Mínus**:
  - Google OAuth setup = vyžaduje Google Cloud Console project + OAuth consent screen (10–15 min one-time setup, ale s hobby provozem stačí "External, Testing" mode pro <100 users, jinak verification process).
  - Email confirmation friction. Mitigace: jasná UX zpráva + možnost resend.
  - Mobile deeplink setup vyžaduje custom URI scheme + Universal/App Links (pro produkci). Pro MVP custom scheme stačí (testing přes Expo Go nebo preview build).

- **Neutral**:
  - Žádný "anonymous mode" v MVP (žádné scénáře bez signup). Pokud user feedback ukáže drop-off na signupu, můžeme přidat Supabase anonymous auth později.

## Alternativy zvažované

- **Magic link primary**: super UX na desktopu, ale mobile deeplink z emailu na produkční build (nevyžadující Universal Links setup) je gotcha-heavy. Skip pro MVP.
- **Clerk**: lepší UX out-of-the-box (org, MFA, social), ale free tier 10k MAU + extra service. Supabase už máme, no need.
- **NextAuth.js (Auth.js)**: skvělé pro web, ale ne pro Expo native (musíme stejně řešit mobile session separately). Supabase je multi-platform native.
- **Email/password only (no OAuth)**: jednodušší, ale Google sign-in je expectation pro hobby app v 2026. 1 hodina setup za >50 % adoption boost.
- **Anonymous sessions** (Supabase anonymous auth): zajímavé pro "try before signup", ale komplikuje RLS (musí rozlišovat anonymous vs real user pro merge scenarios při upgrade). Defer.

## Reference

- Supabase Auth docs: https://supabase.com/docs/guides/auth
- `@supabase/ssr` (web cookie strategy): https://supabase.com/docs/guides/auth/server-side
- Expo + Supabase guide: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- ADR-0001 (stack — `packages/auth` decision)
