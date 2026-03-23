# backend

Backend API for Volunteer Management System, built with Express and TypeScript.

To install dependencies:

```bash
bun install
```

To run locally:

```bash
bun run dev
```

Server starts at `http://localhost:3001` (configurable via `BACKEND_PORT` env var)

To generate Vercel function:

```bash
bun run build:vercel
```

Creates deployable Express handler at `api/[...route].js`.

## Environment Variables

- `BACKEND_PORT` - Server port (default: 3001)
- `FRONTEND_PATH` - Allowed CORS origin (default: http://localhost:3000)

This project was created using `bun init` in bun v1.3.9. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
