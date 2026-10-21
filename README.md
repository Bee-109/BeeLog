# BeeLog

BeeLog's React + TypeScript + Vite application is in [`beelog-web`](beelog-web/README.md).

To run it in mock public read-only mode:

```sh
cd beelog-web
npm install
npm run dev
```

The application uses mock public data until Supabase is configured. Supabase Auth, persistent content, and database/Storage RLS require the environment variables and migrations described in the [application setup guide](beelog-web/README.md). No real credentials are included in this repository.
