# BeeLog

BeeLog's React + TypeScript + Vite public portfolio and admin CMS are in [`beelog-web`](beelog-web/README.md). The current implementation includes repository-backed mock mode, dynamic homepage content, devlog filters, project detail routes, contribution items, and a date-driven activity heatmap.

To run it in mock public read-only mode:

```sh
cd beelog-web
npm install
npm run dev
```

The application uses mock public data until Supabase is configured. Demo mode is read-only. Supabase Auth, persistent content, Storage, Realtime, and database RLS require the environment variables and three ordered migrations described in the [application setup guide](beelog-web/README.md). Supabase has not yet been connected or integration-tested. No real credentials are included in this repository.
