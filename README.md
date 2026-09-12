# Rentlord Web

React/Vite web application for Rentlord. Copy `.env.example` to `.env.local`, fill the public Supabase settings and API URL, then run:

Use a modern `sb_publishable_...` value for `VITE_SUPABASE_PUBLISHABLE_KEY`. Never expose a backend `sb_secret_...` key through a `VITE_*` variable.

```bash
npm install
npm run dev
```

LINE Login starts at the backend `/api/v1/auth/line` route. The backend exchanges the LINE authorization code and hands the browser a Supabase session; no LINE secret is exposed to Vite.

Tenant invitations start at `/tenants/invite`. Each invite URL opens the LIFF app, is valid once for three days, and completes at `/tenant-invite/complete`. The same LIFF entry route opens agreement links sent to linked tenants. Configure the LIFF Endpoint URL as `${APP_URL}/tenant-invite`, enable the `openid` and `profile` scopes, set `VITE_LINE_LIFF_ID`, and include `/tenant-invite/complete` in the Supabase Auth redirect allowlist.

## Vercel

Import this directory as a Vercel project using the Vite preset. Add all four `VITE_*` values from `.env.example`; set `VITE_API_URL` to the Azure API URL ending in `/api/v1`. `vercel.json` includes the SPA route fallback.
