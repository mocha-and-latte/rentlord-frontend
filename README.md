# Rentlord Web

React/Vite web application for Rentlord. Copy `.env.example` to `.env.local`, fill the public Supabase settings and API URL, then run:

Use a modern `sb_publishable_...` value for `VITE_SUPABASE_PUBLISHABLE_KEY`. Never expose a backend `sb_secret_...` key through a `VITE_*` variable.

```bash
npm install
npm run dev
```

## Vercel

Import this directory as a Vercel project using the Vite preset. Add all four `VITE_*` values from `.env.example`; set `VITE_API_URL` to the Azure API URL ending in `/api/v1`. `vercel.json` includes the SPA route fallback.
