# Plenqora

Plenqora is a React project-management workspace backed by an Express/Mongoose API and MongoDB. User accounts, workspaces, projects, issues, comments, invitations, and authorization are stored and enforced on the server; the browser does not persist accounts or workspace records.

## Requirements

- Node.js 20 or newer
- MongoDB running locally or a MongoDB connection string
- Two terminals for the API and Vite development server

## Local setup

1. Configure the API:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

   Put the generated value in `backend\.env` as `JWT_SECRET`. Set `MONGODB_URI` to your MongoDB database (the example uses `mongodb://127.0.0.1:27017/plenqora`). Do not commit `backend\.env`.

2. Install and start the backend:

   ```powershell
   cd backend
   npm ci
   npm run dev
   ```

3. In a second terminal, install and start the frontend:

   ```powershell
   cd frontend
   npm ci
   npm run dev
   ```

   Open the Vite URL (normally `http://localhost:5173`). Vite proxies `/api` requests to `http://127.0.0.1:4000`.

## Production deployment (Vercel + Render)

- Configure the Vercel project root directory as `frontend`, with `npm run build` as the build command and `dist` as the output directory. `frontend/vercel.json` rewrites client routes such as `/login` to `index.html`, so refreshing those routes loads the SPA.
- In Vercel project settings, set `VITE_API_URL` to `https://plenqora.onrender.com` for Production (and Preview too, if preview deployments should use this API). The frontend appends `/api` to this origin for all API and CSRF requests. Do not include a trailing slash or `/api`.
- In the Render backend service settings, set `NODE_ENV=production`, `FRONTEND_ORIGIN=https://plenqora.vercel.app`, and `COOKIE_SAME_SITE=none`. `FRONTEND_ORIGIN` must exactly match the browser's frontend origin, including scheme and without a trailing slash; add comma-separated origins if using additional frontend domains.
- The API trusts one proxy hop for Render's forwarded client IP, which lets `express-rate-limit` identify clients without trusting arbitrary forwarded addresses.
- Authenticated Server-Sent Events notify connected workspace members after successful changes, and clients reload the updated workspace data without a page refresh. The in-memory event broadcaster assumes a single backend instance; use shared pub/sub before scaling the API horizontally.
- Keep `JWT_SECRET` and `MONGODB_URI` configured privately in Render. The backend already enables credentialed CORS for `FRONTEND_ORIGIN` and marks cookies `Secure` in production; `COOKIE_SAME_SITE=none` allows the session and CSRF cookies on cross-site frontend-to-API requests.
- After changing Vercel's `VITE_API_URL`, trigger a new frontend deployment because Vite embeds it at build time. Confirm `https://plenqora.onrender.com/api/health` reports a connected database, then refresh `https://plenqora.vercel.app/login`.

## Accounts, invitations, and email

- A new, non-invited signup creates a private workspace owned by that account. It does not grant access to another user's workspace.
- Team invitations expire after seven days. Without Brevo settings, or if email delivery fails, the API provides a one-time secure link that an Admin or Manager can share. Delivery failures are logged by the API and shown by the UI as a warning.
- Passwords must be at least 12 characters and include uppercase, lowercase, and numeric characters. Passwords are hashed with bcrypt; the browser only receives an HTTP-only session cookie.
- Password recovery sends email only when Brevo is configured. In local development without email settings, the UI explicitly says that no email was sent and provides a one-time reset link for a registered account. Production returns a delivery/configuration error rather than claiming that an email was sent.
- For Render, configure `BREVO_API_KEY` and `BREVO_FROM` in the backend service environment. `BREVO_FROM` must be a sender address authorized and verified in Brevo. Email is sent over Brevo's HTTPS Transactional Email API; SMTP credentials are not used.
- Workspace roles are `Admin`, `Manager`, `Developer`, and `Viewer`. Project and issue permissions are checked by API middleware/controllers, not only hidden in the UI.
- For a cross-site production deployment, set `FRONTEND_ORIGIN` to the exact frontend origin and configure HTTPS plus `COOKIE_SAME_SITE=none`. Keep the JWT secret private and rotate it if compromised.

## API and data

The backend uses an MVC layout under `backend/src`:

- `models/`: Mongoose schemas for users, workspaces, projects, issues, comments, and invitations.
- `controllers/` and `routes/`: authentication, workspace, project, issue, and threaded-comment endpoints.
- `middleware/`: session authentication, workspace-role checks, CSRF validation, request validation, and centralized errors.
- `validators/`: strict Zod schemas for request bodies, parameters, and filters.

Health check: `GET /api/health`. API routes are under `/api/auth`, `/api/workspace`, `/api/projects`, and `/api/issues`.
Workspace Admins can export a workspace-scoped JSON snapshot containing workspace details, members, projects, issues, and comments.

## Validation

Run the backend integration tests against the local MongoDB service:

```powershell
cd backend
npm test
```

Tests use a unique temporary database name and remove only that database afterward. Check the frontend with:

```powershell
cd frontend
npm run lint
npm run build
```