# Getting started - step by step

Follow these in order. Commands are typed in a terminal opened in the `nehas-wedding` folder
(e.g. `cd D:\Project\nehas-wedding`).

## A. Preview the site right now (no setup, ~2 minutes)

1. Install Node.js 20 or newer from <https://nodejs.org> (check with `node -v`).
2. Install the project's packages:
   ```
   npm install
   ```
3. Start it:
   ```
   npm run dev
   ```
4. Open <http://localhost:3000>. The opening doors, homepage, events (31 Jan & 15 Feb 2027),
   countdown, and a gallery of **demo photos** all work. Sign-in, uploads and the admin
   dashboard need step B.

> On a phone on the same Wi-Fi, open the "Network" address the terminal prints
> (e.g. `http://192.168.31.73:3000`). If it doesn't load, allow Node.js through Windows Firewall
> or set your Wi-Fi to *Private*.

## B. Connect the real backend (Supabase, ~15 minutes)

1. **Create a project** at <https://supabase.com> → New project. Region: *Mumbai*. Save the database password.
2. **Create the tables (one paste)**: open **SQL Editor** → New query, paste the whole of
   `supabase/setup-all.sql`, press **Run** once. It should say *Success. No rows returned*.
   (It's the four files in `supabase/migrations/` combined in order - use those instead if you
   prefer the Supabase CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`.)
3. **Lock down sign-ups**: *Authentication → Sign In / Providers → Email*: turn **off**
   "Allow new users to sign up". Keep "Confirm email" on.
4. **Set the addresses**: *Authentication → URL Configuration*:
   - Site URL: `http://localhost:3000` (change to your real domain when you deploy)
   - Redirect URLs: add `http://localhost:3000/auth/confirm`
5. **Email templates**: *Authentication → Emails → Templates* - paste the three templates from the
   README ("Invite user", "Reset password", "Magic link").
6. **Copy the keys**: *Project Settings → API*. In the project folder, copy `.env.example` to a new
   file named `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...        (Project URL)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...   (anon / public key)
   SUPABASE_SERVICE_ROLE_KEY=...       (service_role key - keep secret)
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
7. **Create yourself as admin**:
   ```
   npm run create-admin -- your@email.com "Your Name" --password
   ```
   (type a password of at least 10 characters when asked)
8. **Optional - demo photos in the real database** (to see the gallery & slideshow working end to end):
   ```
   npm run demo:seed
   ```
9. Restart `npm run dev`, open <http://localhost:3000/login> and sign in.

## C. Fill in the wedding (in the browser, as admin)

Open **Photos → Admin** (or `/admin`):

1. **Wedding details** - upload Neha's and Rudra's portraits and a homepage background, add the
   wedding time, venue, story, families, FAQ, contacts, RSVP deadline. Press **Save all changes**.
2. **Events** - set the time and venue for both celebrations (the calendar buttons appear once a time is set).
3. **Albums** - press **Add suggested albums**.
4. **Website photos** - upload or pick the photos for the homepage slideshow.
5. **Admins** - invite anyone else who should manage the site.
6. **Guests** - invite family & friends (each gets an email to set a password).

## D. Build and check before going live

```
npm run typecheck     # no type errors
npm test              # unit + database security tests (50)
npm run build         # production build
npm start             # run the production build at http://localhost:3000
```

If `npm run build` fails on Windows with *"Cannot find module for page …"*, just run it again
(a file-system race on Windows; it doesn't happen on the hosting servers).

Optional, against a **test** Supabase project: `npm run test:e2e` (real-browser end-to-end tests).

## E. Put it online (Vercel, free)

1. Create a GitHub repository and push the project:
   ```
   git add -A
   git commit -m "Neha's wedding site"
   git remote add origin https://github.com/<you>/nehas-wedding.git
   git push -u origin main
   ```
2. On <https://vercel.com> → **Add New → Project** → import the repository.
3. Add the same four environment variables (with `NEXT_PUBLIC_SITE_URL` set to your real address,
   e.g. `https://nehaswedding.vercel.app` or your own domain) → **Deploy**.
4. Back in Supabase *Authentication → URL Configuration*: set the Site URL to the real address and add
   `https://<your-address>/auth/confirm` to Redirect URLs.
5. Supabase *Authentication → Emails → SMTP*: connect a real email sender (Resend, Brevo, Gmail
   Workspace…) before inviting guests - the built-in one only sends a few emails per hour.
6. Storage: the free plan holds 1 GB. For the full wedding collection, upgrade the Supabase project to Pro.

## F. Before sharing with guests

```
npm run demo:remove
```
removes the demo photos from the database. (When Supabase is connected, the built-in demo
images are never shown on the public site anyway.)
