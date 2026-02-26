# Silverleaf Frontend

React + TypeScript frontend for Silverleaf using:

- React Router for pages (`/feed`, `/profile`, `/map`, `/messages`)
- React Query for API calls and cache
- Tailwind CSS for styling

## Local development

1. Start backend (Spring Boot) on `http://localhost:8080`
2. In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite runs at `http://localhost:5173`.

API requests to `/api/**` and `/uploads/**` are proxied to backend `:8080`.

When built and copied by Gradle, the SPA is served by Spring at:

- `http://localhost:8080/app`

## Build

```bash
cd frontend
npm run build
```
