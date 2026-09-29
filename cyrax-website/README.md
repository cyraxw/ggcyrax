# CYRAX//GG — CODM Loadout Website

## Quick publish (Supabase + Netlify)
1. Create a free Supabase project at https://supabase.com.
2. In SQL Editor, run all of `supabase.sql`.
3. In Authentication > Users, create your admin account. Copy its UUID.
4. In SQL Editor, run `insert into public.admins(user_id) values ('YOUR_AUTH_USER_UUID');` with the real UUID.
5. In Project Settings > API, copy Project URL and anon/public key into `SUPABASE_URL` and `SUPABASE_ANON_KEY` at the top of `app.js`. Never use the service-role key in frontend code.
6. Publish the folder to Netlify: https://app.netlify.com/drop (or connect a Git repository). No build command required; publish directory is the project root.
7. Open the website, click ADMIN LOGIN, and sign in. Only UUIDs added to `public.admins` can write/delete due to Supabase RLS.

## Features
- Responsive purple tactical UI, animated topographic background, cards and mobile nav.
- Public searchable loadouts with copy-to-clipboard attachments.
- HUD, sensitivity, and graphics presets with copy button.
- Featured image or video URL.
- Admin login and content create/delete panel.
- Supabase online database with row-level security.

## Content JSON examples
Attachments: `[{"slot":"Muzzle","name":"Monolithic Suppressor"},{"slot":"Barrel","name":"OWC Marksman"}]`
HUD: `{"layoutCode":"paste code here","buttons":4}`
Sensitivity: `{"camera":{"standard":90,"ads":110},"firing":{"standard":95}}`
Graphics: `{"quality":"Low","frameRate":"Max","colorHex":"#A855F7"}`

For hosted media, upload image/video to a public storage bucket or a video host, then paste its public URL into Featured media. Keep public read access limited to content intended for the public. For production, add rate limiting and review user submissions before publishing.
