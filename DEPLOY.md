# SkillSync deployment guide

This guide deploys the frontend to Vercel, the backend to Render, and the database to MongoDB Atlas.

## 1. MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Add the deployment service IP address under **Network Access**.
4. Copy the driver connection string, for example:

   ```text
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/skillsync
   ```

Do not commit this connection string or any password.

## 2. Deploy the backend to Render

1. Push the repository to GitHub.
2. Create a new Render Web Service.
3. Select the repository and set the root directory to `packages/backend`.
4. Use these commands:

   ```text
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

5. Add these environment variables in Render:

   ```env
   PORT=8000
   MONGO_URI=<your-atlas-connection-string>
   ACCESS_TOKEN_SECRET=<random-secret>
   ACCESS_TOKEN_EXPIRY_JWT=1d
   REFRESH_TOKEN_SECRET=<random-secret>
   REFRESH_TOKEN_EXPIRY_JWT=7d
   CORS_ORIGIN=https://<your-frontend>.vercel.app
   EMAIL_USER=<your-email>
   EMAIL_PASS=<your-email-app-password>
   ```

6. Deploy and copy the backend URL, for example:

   ```text
   https://skillsync-backend.onrender.com
   ```

### Optional Google OAuth

Add these variables if Google login is enabled:

```env
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_CALLBACK_URL=https://skillsync-backend.onrender.com/api/v1/auth/google/callback
```

The callback URL must also be registered in Google Cloud Console.

## 3. Deploy the frontend to Vercel

1. Create a new Vercel project from the repository.
2. Set the root directory to `packages/frontend`.
3. Add this environment variable:

   ```env
   VITE_BACKEND_URL=https://skillsync-backend.onrender.com/api/v1
   ```

4. Deploy and copy the frontend URL.

## 4. Update backend CORS

Update the Render environment variable with the actual Vercel URL:

```env
CORS_ORIGIN=https://<your-frontend>.vercel.app
```

Redeploy the backend after changing it.

## 5. Seed skills

Run this locally with a backend `.env` pointing to the target database:

```bash
cd packages/backend
npm install
npx tsx src/scripts/seedSkills.ts
```

Or build first and run the compiled JavaScript:

```bash
npm run build
node dist/scripts/seedSkills.js
```

## 6. Make a user an admin

In MongoDB Atlas, open the `users` collection and change the user's `role` to `"Admin"`. Log out and log back in afterward so the new role is reflected in the token.

## Local development

Backend terminal:

```bash
cd packages/backend
cp .env.example .env
# Fill in MONGO_URI and the required secrets
npm install
npm run dev
```

Frontend terminal:

```bash
cd packages/frontend
cp .env.example .env
npm install
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Health check: `http://localhost:8000/api/v1/healthcheck`
