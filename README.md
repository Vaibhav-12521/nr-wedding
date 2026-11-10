# Neha's Wedding

*A Celebration of Love, Family & Forever.*

> **New here? Follow [GETTING-STARTED.md](GETTING-STARTED.md)** - step-by-step setup, build and deployment.

A wedding website and a **private, invite-only family photo album** in one app.

- **Public site** (no login): homepage with invitation-opening animation, live countdown, story & timeline,
  events with maps, approved public gallery, digital invitation, families, RSVP, FAQ, contact, privacy policy.
- **Photo album** (invited guests only): upload (drag & drop / phone picker, progress, retry), albums, filters
  (latest, event, date, uploader, favourites, my uploads, selected), search & sort, full-screen viewer,
  favourites, multi-select that syncs across devices, original-quality downloads and streamed ZIP downloads.
- **Admin dashboard**: statistics & storage, upload activity, guest invitations & roles, an **Admins** page to
  add/remove admins, albums with per-person access, public-gallery approvals, **Website photos** (upload or pick
  photos for the homepage slideshow, reorder them), **Blessings** moderation, and every piece of wedding content
  (couple portraits, dates, venue, events, story, families, FAQ, contacts, hero & event photos, RSVPs with CSV export).
- **Extras**: palace-doors opening scene with the couple's seal and falling petals, couple portraits, blessings
  wall, homepage slideshow of featured photos, and add-to-calendar (Google / Apple / Outlook) on every dated event.

Nothing about the couple is invented: the groom's name, the year, venues and times are empty until an admin
fills them in, and the site shows "to be announced" until then.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Framer Motion ·
Supabase (Auth, Postgres with Row Level Security, Storage) · sharp (thumbnails) · client-zip (streaming ZIPs).

---

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com) (pick the Mumbai region for guests in India).
2. **Run the migrations** - either:
   - SQL editor: paste and run, in order, `supabase/migrations/20261110000000_init.sql`,
     `20261110000100_admin_helpers.sql`, `20261111000000_couple_featured_wishes.sql` and
     `20261112000000_wedding_year_2027.sql`; **or**
   - CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`.

   This creates every table, index, policy and function, plus two storage buckets:
   `photos` (**private**) and `site` (public website artwork).
3. **Authentication → Sign In / Providers → Email**
   - Turn **off** "Allow new users to sign up". (Only admins invite people; even if this were left on,
     uninvited accounts are created *inactive* and can't see anything.)
   - Keep "Confirm email" on.
4. **Authentication → URL Configuration**
   - Site URL: your public address, e.g. `https://nehaswedding.in` (or `http://localhost:3000` for development).
   - Redirect URLs: add `https://nehaswedding.in/auth/confirm` and `http://localhost:3000/auth/confirm`.
5. **Authentication → Emails → Templates** - replace the links so they work with server-side sign-in:

   | Template | Put this in the email body |
   |---|---|
   | **Invite user** | `<p>You're invited to the family photo album for Neha's wedding.</p><p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Accept the invitation</a></p>` |
   | **Reset password** | `<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a></p>` |
   | **Magic link** (used for the email *code*) | `<p>Your sign-in code is <strong>{{ .Token }}</strong></p><p>It expires shortly. If you didn't ask for it, ignore this email.</p>` |

6. **Authentication → Emails → SMTP** - before sending real invitations, connect your own SMTP
   (Resend, Brevo, Amazon SES, Gmail Workspace…). Supabase's built-in sender is rate-limited to a few emails per
   hour and is meant for testing only.

## 2. Configure and run locally

```bash
cp .env.example .env.local     # then fill in the three Supabase values (Project Settings → API)
npm install
npm run create-admin -- you@example.com "Your Name" --password   # first admin (or omit --password to get an email)
npm run dev                    # http://localhost:3000
```

Environment variables (see `.env.example`):

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Public anon key; RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Secret. Used only in `src/lib/supabase/admin.ts`, always after a permission check |
| `NEXT_PUBLIC_SITE_URL` | both | Public address; used in emails, share links, redirects |
| `NEXT_PUBLIC_WEDDING_TIMEZONE` | optional | Defaults to `Asia/Kolkata` |
| `STORAGE_QUOTA_GB` | optional | Your plan's storage, for the admin gauge |

Sample data for **development only**: `supabase/seed.sql` (everything is labelled `[Sample]`).

## 3. First steps as admin

1. **Admin → Wedding details**: bride & groom portraits, wedding date & time (starts the countdown), venue, hero photo,
   story, families, FAQ, contacts, RSVP deadline.
2. **Admin → Events**: set the year/time/venue for "31 January Celebration" and "Wedding Day", add more.
3. **Admin → Albums**: "Add suggested albums" creates the seven albums from the brief in one click.
4. **Admin → Guests**: invite family and friends. Each gets an email to set a password; they can also sign in
   with a one-time email code.

## 4. Deploy (Vercel)

1. Push the repository to GitHub and import it in Vercel.
2. Add the environment variables above (Production + Preview). Set `NEXT_PUBLIC_SITE_URL` to the real domain
   and add that domain's `/auth/confirm` to Supabase's redirect URLs.
3. Deploy. `sharp` is supported on Vercel's Node runtime.
4. ZIP downloads stream for up to 300 s (`maxDuration` in `src/app/api/photos/zip/route.ts`); check your plan's
   function duration limit. Selections larger than 500 photos / 2 GB are automatically offered as several parts.

Any Node host works too: `npm run build && npm start`.

## 5. Security model

- **Row Level Security on every table** decides who sees what - the UI never enforces permissions on its own.
  Policies live in `supabase/migrations/20261110000000_init.sql` and are covered by 32 tests
  (`tests/db/security.test.ts`) that run the real migration in Postgres.
- **Private photos never have public URLs.** The `photos` bucket has no storage policies at all; the server
  checks access with the visitor's own RLS-scoped query and only then mints a signed URL (1 h for previews,
  5 min for original downloads).
- **Public gallery** = photos that are `public` **and** admin-`approved` (a database constraint makes the first
  impossible without the second).
- **Album access:** `members` (all invited guests), `restricted` (only people granted on the album page - a link
  to it 404s for anyone else), `public` (also listed on the public site; still only approved photos are public).
- **No self-registration or self-promotion:** profiles get their role and active status from the admin's
  invitation, never from user-supplied metadata; guests can only change their own name.
- **Uploads are verified on the server:** the file is decoded with sharp, so its real content decides the type
  (JPG/PNG/WebP, ≤ 50 MB); anything else is deleted. Previews are re-encoded with metadata (GPS) stripped.
- **Rate limits** (stored in Postgres): sign-in, email codes, password resets, RSVPs, upload signing, downloads, ZIPs.
- The service-role key is imported only in server modules marked `server-only`.

## 6. Limits & performance

| | |
|---|---|
| Photo size | 50 MB per original (JPG, PNG, WebP). iPhone Safari converts HEIC to JPEG automatically. |
| Thumbnails | 600 px WebP for grids, 1920 px WebP for the viewer; originals are never loaded in lists. |
| Gallery | 60 photos per page, infinite scroll, lazy-loaded images, indexed queries. |
| ZIP | up to 500 photos / 2 GB per file, streamed (constant memory), exact size so browsers show progress. |
| Storage | Supabase Free = 1 GB (testing). For a real wedding collection use Pro (100 GB included). |

## 7. Tests

```bash
npm test            # unit tests + database security tests (no Supabase needed)
npm run test:e2e    # end-to-end against the Supabase project in .env.local (uses installed Edge/Chrome)
```

The end-to-end suite creates its own throw-away accounts (`@e2e.test`) and `e2e-` albums and deletes them
afterwards. It covers: public access, guest login, single and multiple upload (and rejection of fake images),
selection, original download, bulk ZIP, private-album authorisation, admin permissions & approvals, and mobile.
**Run it against a development project**, not the live wedding project.

## Project structure

```
supabase/migrations/   schema, RLS policies, functions, buckets
supabase/seed.sql      development sample data
scripts/create-admin.ts
src/middleware.ts      session refresh + redirect for signed-out visitors
src/lib/               supabase clients, auth guards, storage, image processing, queries, rate limiting
src/app/(site)/        public website
src/app/(auth)/        login, password reset, set password
src/app/(app)/         private album: photos, albums, upload, selection, account, admin/*
src/app/api/           uploads, photo list, downloads, ZIP, favourites, selection, CSV export
src/components/        design system (decor), gallery/lightbox, photo browser, admin editors
tests/                 unit, database security (PGlite), end-to-end (Playwright)
```
