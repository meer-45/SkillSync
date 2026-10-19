# SkillSync

SkillSync is a skill-sharing platform where users learn new skills by connecting with others and teach skills they are proficient in.

## Features

- User registration, login, logout, and password recovery
- Skill discovery and user skill management
- Learning requests and scheduled sessions
- Progress tracking, XP, wallet tokens, badges, and notifications
- Reviews and ratings
- Real-time chat with Socket.IO
- Optional Google OAuth login

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS, JavaScript
- **Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose
- **Authentication:** JWT, bcrypt, Passport, optional Google OAuth
- **Real-time communication:** Socket.IO

## Prerequisites

- Node.js 18 or newer
- npm
- A MongoDB database, such as MongoDB Atlas

## Local installation

```bash
git clone https://github.com/meer-45/SkillSync.git
cd SkillSync

cd packages/backend
npm install
cp .env.example .env
```

Fill in `packages/backend/.env`, then open a second terminal:

```bash
cd packages/frontend
npm install
cp .env.example .env
```

## Environment variables

Configure `packages/backend/.env`:

```env
PORT=8000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/skillsync
ACCESS_TOKEN_SECRET=your-access-token-secret
ACCESS_TOKEN_EXPIRY_JWT=1d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRY_JWT=7d
CORS_ORIGIN=http://localhost:5173
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

Google OAuth is optional:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback
```

Configure `packages/frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:8000/api/v1
```

Never commit `.env` files or database credentials.

## Run locally

Start the backend:

```bash
cd packages/backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd packages/frontend
npm run dev
```

Open the frontend at [http://localhost:5173](http://localhost:5173).

The backend runs at [http://localhost:8000](http://localhost:8000). Verify it with:

```bash
curl http://localhost:8000/api/v1/healthcheck
```

## Build and production start

```bash
cd packages/backend
npm run typecheck
npm run build
npm start
```

Build and preview the frontend:

```bash
cd packages/frontend
npm run build
npm run preview
```

## Seed skills

With a configured backend `.env`:

```bash
cd packages/backend
npx tsx src/scripts/seedSkills.ts
```

After building, the compiled script can be run with:

```bash
node dist/scripts/seedSkills.js
```

## API

The backend API base path is `/api/v1`.

| Area | Path |
| --- | --- |
| Authentication | `/api/v1/auth` |
| Users | `/api/v1/users` |
| User skills | `/api/v1/user-skills` |
| Skills | `/api/v1/skills` |
| Requests | `/api/v1/requests` |
| Sessions | `/api/v1/sessions` |
| Wallet | `/api/v1/wallet` |
| Feedback | `/api/v1/feedback` |
| Progress | `/api/v1/progress` |
| Badges | `/api/v1/badges` |
| Matchmaking | `/api/v1/matchmaking` |
| Notifications | `/api/v1/notifications` |
| Chat | `/api/v1/chat` |
| Uploads | `/api/v1/upload` |

Health check:

```text
GET /api/v1/healthcheck
```

## Project structure

```text
SkillSync/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/
│       ├── src/
│       └── package.json
├── DEPLOY.md
└── README.md
```

See [DEPLOY.md](./DEPLOY.md) for production deployment instructions.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Commit and push your branch.
5. Open a pull request.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

