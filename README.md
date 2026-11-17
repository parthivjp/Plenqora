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

## Accounts, invitations, and email

- A new, non-invited signup creates a private workspace owned by that account. It does not grant access to another user's workspace.
- Team invitations expire after seven days. Without SMTP settings, the API provides a one-time secure link that an Admin or Manager can share. With SMTP configured, it emails the link as well.
- Passwords must be at least 12 characters and include uppercase, lowercase, and numeric characters. Passwords are hashed with bcrypt; the browser only receives an HTTP-only session cookie.
- Password recovery requires SMTP. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` in `backend\.env`. Until then, the reset endpoint returns an explicit configuration error.
- Workspace roles are `Admin`, `Manager`, `Developer`, and `Viewer`. Project and issue permissions are checked by API middleware/controllers, not only hidden in the UI.
- For a cross-site production deployment, set `FRONTEND_ORIGIN` to the exact frontend origin and configure HTTPS plus `COOKIE_SAME_SITE=none`. Keep the JWT secret private and rotate it if compromised.

## API and data

The backend uses an MVC layout under `backend/src`:

- `models/`: Mongoose schemas for users, workspaces, projects, issues, comments, and invitations.
- `controllers/` and `routes/`: authentication, workspace, project, issue, and threaded-comment endpoints.
- `middleware/`: session authentication, workspace-role checks, CSRF validation, request validation, and centralized errors.
- `validators/`: strict Zod schemas for request bodies, parameters, and filters.

Health check: `GET /api/health`. API routes are under `/api/auth`, `/api/workspace`, `/api/projects`, and `/api/issues`.

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