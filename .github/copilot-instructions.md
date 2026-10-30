# SmartStock repository instructions

## Build, test, and lint

Run frontend commands from `smartstock-frontend/`:

```powershell
npm run dev
npm run build
npm run lint
```

The build runs TypeScript project checks before Vite builds the app. There is
currently no frontend test script or test runner configured, so there is no
single-test command.

The Spring Boot API is a separate repository at `../smartstock/smartstock/`.
From that directory, use the Maven wrapper:

```powershell
.\mvnw.cmd verify
.\mvnw.cmd test
.\mvnw.cmd "-Dtest=UserServiceTest" test
.\mvnw.cmd "-Dtest=UserServiceTest#updateEncodesProvidedPassword" test
```

The backend has no configured lint command.

## Architecture

SmartStock is an inventory-management application split between this React
frontend and a separate Spring Boot API. The frontend is React, TypeScript,
Vite, and React Router. `src/main.tsx` installs the router and the auth and
toast providers; `src/App.tsx` defines public routes, authenticated routes,
and admin-only routes. Protected page content is rendered inside `AppShell`.

Pages call typed domain API modules in `src/api/`. Those modules share
`axiosInstance.ts`, which configures the API base URL, attaches the stored JWT,
and handles expired sessions. Shared API data contracts and auth state are
defined in `src/types/index.ts` and `src/context/`. The backend exposes the
corresponding REST endpoints and DTOs; it uses Spring MVC controllers,
services for business logic, JPA repositories/entities for persistence, and
PostgreSQL. Spring Security validates JWTs and enforces roles; frontend route
guards and role checks are UX controls, not replacements for backend
authorization.

The API also has Redis-backed functionality, scheduled Spring Batch demand
forecasts, Excel import/export, and optional Groq and Twilio integrations.
The backend `docker-compose.yml` runs the API, PostgreSQL, Redis, and this
frontend together. Deployment and environment-variable details are in the
backend's `DEPLOYMENT.md`; frontend `VITE_API_BASE_URL` is embedded at build
time.

## Codebase conventions

- Add or change frontend endpoint calls in the relevant `src/api/*Api.ts`
  module. Use the shared Axios instance and explicit request/response types
  from `src/types/index.ts`; keep endpoint paths and payloads aligned with the
  backend controller and DTO.
- Keep authentication state and role-derived capabilities in the auth
  context. The app uses the roles `ADMIN`, `WAREHOUSE_MGR`, and `VIEWER`;
  backend authorization remains authoritative.
- Keep page-level UI in `src/pages/`, reusable layout and UI in
  `src/components/`, and cross-page feedback in the toast context.
- In the backend, follow the existing controller → service → repository
  layering. Define API payloads with DTOs rather than exposing persistence
  entities as frontend contracts.
- Local development uses Vite on port `5174` and the API on port `8080`.
  Configure environment values through the relevant `.env.example`; do not
  put credentials in source files.
