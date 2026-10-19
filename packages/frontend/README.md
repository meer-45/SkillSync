# SkillSync frontend

The SkillSync frontend is a React and Vite application for browsing skills, managing learning requests, scheduling sessions, tracking progress, and chatting with other users.

## Requirements

- Node.js 18 or newer
- npm
- The SkillSync backend running locally or a deployed backend URL

## Installation

From the repository root:

```bash
cd packages/frontend
npm install
cp .env.example .env
```

Set the backend API URL in `.env`:

```env
VITE_BACKEND_URL=http://localhost:8000/api/v1
```

For a deployed backend:

```env
VITE_BACKEND_URL=https://your-backend.onrender.com/api/v1
```

## Development

Start the Vite development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The backend should be running separately at [http://localhost:8000](http://localhost:8000) during local development.

## Production build

Create a production build:

```bash
npm run build
```

Preview the build locally:

```bash
npm run preview
```

Run linting with:

```bash
npm run lint
```

## Backend health check

The frontend uses the backend API under `/api/v1`. Verify the local backend before testing frontend features:

```bash
curl http://localhost:8000/api/v1/healthcheck
```
