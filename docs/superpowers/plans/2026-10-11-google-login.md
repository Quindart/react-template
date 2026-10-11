# Google Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. This plan uses native execution in the current session.

**Goal:** Add real Google sign-in to the existing demo login while retaining username/password accounts and assigning Google identities the employee role.

**Architecture:** Use Google's authorization code flow with server-side code exchange and ID token verification. Store the Google identity in an HttpOnly React Router cookie session; expose only the verified identity needed by the UI through a same-origin session route. Keep demo auth in the existing Zustand store, with the server Google session taking precedence during bootstrap and logout clearing both session sources.

**Tech Stack:** React Router 8 framework loaders/actions and cookie sessions, `google-auth-library`, React, Zustand, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-11-google-login-design.md`

## Global Constraints

- Keep the current SSR configuration.
- Keep the username/password demo accounts `admin` and `employee` working.
- Use OAuth scopes `openid email profile` only.
- Identify Google accounts by the verified `sub` claim; require `email_verified === true`.
- Give each valid Google identity the `employee` role; never infer admin from Google claims or email.
- Do not store Google access tokens, refresh tokens, ID tokens, or client secrets in `localStorage` or client bundles.
- Use an HttpOnly, SameSite=Lax cookie; set Secure when running over HTTPS and load its signing secret from the server environment.
- Treat current client-side route guards and demo data as prototype behavior, not server authorization.

## Review Focus

- Missing or malformed OAuth environment configuration must fail with a retryable login message and never create a session. Pin with a config validation test in Task 1.
- OAuth cancellation or a missing/mismatched state must not create a session. Pin with callback tests in Task 2.
- A code exchange that yields an invalid token, wrong audience/issuer, expired token, or unverified/missing email must not create a session. Pin with identity validation tests in Task 1.
- A persisted demo session and a server Google session must not make the UI show the wrong account; server Google identity wins, and logout clears both. Pin with bootstrap and logout tests in Task 3.
- A Google employee must not gain Users access, while the demo admin keeps its current access. Pin with access policy tests in Task 3.

---

### Task 1: Add Google OAuth verification and cookie session services

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `app/features/auth/google-env.server.ts`
- Create: `app/features/auth/google-oauth.server.ts`
- Create: `app/features/auth/google-session.server.ts`
- Test: `tests/unit/google-oauth.test.ts`
- Test: `tests/unit/google-session.test.ts`

**Interfaces:**
- `GoogleIdentity`: `{ kind: 'google'; subject: string; email: string; name: string | null }`.
- `getGoogleEnvironment(): GoogleEnvironment` loads local `.env` values on the server and validates `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `AUTH_SESSION_SECRET`.
- `getGoogleOAuthClient(): OAuth2Client` validates `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` before creating the Google client.
- `createGoogleAuthorizationUrl(request: Request): Promise<{ url: string; setCookie: string }>` creates cryptographically random state, nonce, and PKCE verifier, saves the flow values in the short-lived OAuth session cookie, and requests only `openid email profile`.
- `completeGoogleAuthorization(request: Request): Promise<{ identity: GoogleIdentity; setCookies: string[] }>` checks state, exchanges the authorization code with the saved PKCE verifier, verifies the ID token against the configured audience, checks issuer, expiry, nonce, `sub`, email, and `email_verified`, clears the flow cookie, then commits the identity to the app session.
- `readGoogleIdentity(request: Request): Promise<GoogleIdentity | null>` returns only the app session identity.
- `destroyGoogleSession(request: Request): Promise<string>` returns the clearing `Set-Cookie` header.

- [ ] **Step 1: Add server environment loading and auth dependencies**

  Add `google-auth-library` and `dotenv` to runtime dependencies; keep both imports server-only. `google-auth-library` provides the OAuth client and ID token verification used by this task. See [Google Auth Library for Node.js](https://googleapis.dev/nodejs/google-auth-library/latest/OAuth2Client.html).

- [ ] **Step 2: Add failing tests for OAuth configuration and verified identities**

  In `tests/unit/google-oauth.test.ts`, cover missing env values, expected scope and redirect URI, state/nonce/PKCE creation, valid identity payload, and rejection of invalid signature/audience/issuer/expiry, nonce mismatch, missing `sub`/email, and `email_verified !== true`. Mock the OAuth client so tests do not contact Google.

- [ ] **Step 3: Implement `google-env.server.ts`**

  Import `dotenv/config` in this server-only module, validate all four environment values, and return a typed `GoogleEnvironment`. Never export these values from a client-reachable module.

- [ ] **Step 4: Implement `google-oauth.server.ts`**

  Use `OAuth2Client.generateAuthUrl`, `generateCodeVerifierAsync`, `getToken`, and `verifyIdToken`; validate token claims before returning `GoogleIdentity`. Do not request offline access or retain Google API tokens.

- [ ] **Step 5: Add failing tests for the cookie session service**

  In `tests/unit/google-session.test.ts`, cover session read, commit, clear, HttpOnly and SameSite=Lax attributes, Secure under HTTPS, and failure when `AUTH_SESSION_SECRET` is missing.

- [ ] **Step 6: Implement `google-session.server.ts`**

  Use `createCookieSessionStorage` from `react-router`. Store only `kind`, `subject`, `email`, and `name`, use a seven-day session max age, and source secrets from `AUTH_SESSION_SECRET`. Keep OAuth flow state and app identity in separate cookies so an unfinished OAuth request cannot overwrite an active app session.

- [ ] **Step 7: Run the focused service tests**

  Run: `pnpm test -- tests/unit/google-oauth.test.ts tests/unit/google-session.test.ts`

  Expected: both files pass; the tests make no outbound requests.

### Task 2: Add server OAuth routes

**Files:**
- Modify: `app/routes.ts`
- Create: `app/routes/auth.google.tsx`
- Create: `app/routes/auth.google.callback.tsx`
- Test: `tests/unit/google-oauth-routes.test.ts`

**Interfaces:**
- `GET /auth/google` calls `createGoogleAuthorizationUrl`, returns a redirect to Google, and attaches the short-lived OAuth cookie.
- `GET /auth/google/callback` calls `completeGoogleAuthorization`, attaches its flow-clearing and app-session cookies, and redirects to `/home`.
- Both route loaders return a safe redirect to `/login?auth_error=google` for provider errors, cancellation, invalid state, invalid code, missing config, or token validation failure; errors never include provider response bodies or credentials.

- [ ] **Step 1: Add failing route tests**

  Verify the start route redirects to the generated Google URL and sets the OAuth cookie; verify a valid callback redirects to `/home` and commits the app cookie; verify cancellation, provider errors, missing code, and state mismatch redirect to login without setting an app session.

- [ ] **Step 2: Register both routes in `app/routes.ts`**

  Add `auth/google` and `auth/google/callback` before the workspace layout routes.

- [ ] **Step 3: Implement the start and callback loaders**

  Keep token exchange and identity verification in the server-only service from Task 1. Set the cookie headers returned by the services on redirects. Do not return token material in loader data.

- [ ] **Step 4: Run route tests**

  Run: `pnpm test -- tests/unit/google-oauth-routes.test.ts`

  Expected: success and failure redirects match the route interfaces; no provider credentials appear in response bodies.

### Task 3: Synchronize Google sessions with the existing auth UI

**Files:**
- Modify: `app/features/auth/auth-service.ts`
- Create: `app/features/auth/auth-types.ts`
- Modify: `app/features/auth/auth-store.ts`
- Modify: `app/features/auth/session-bootstrap.tsx`
- Modify: `app/features/auth/access-policy.ts`
- Modify: `app/features/auth/use-logout.ts`
- Modify: `app/features/auth/use-login.ts`
- Modify: `app/routes.ts`
- Modify: `app/routes/home.tsx`
- Create: `app/routes/auth.session.tsx`
- Test: `tests/unit/auth-store.test.ts`
- Test: `tests/unit/auth.test.ts`
- Test: `tests/unit/google-session-route.test.ts`
- Test: `tests/unit/session-bootstrap.test.tsx`
- Test: `tests/unit/session-revocation.test.tsx`
- Test: `tests/unit/access-policy.test.ts`
- Test: `tests/unit/use-login.test.tsx`
- Test: `tests/unit/use-logout.test.tsx`

**Interfaces:**
- Extend `AuthUser` in client-safe `auth-types.ts` to a discriminated union: demo identities use `{ kind: 'demo'; username: 'admin' | 'employee' }`; Google identities use `GoogleIdentity` from Task 1. Server-only modules import the type without making OAuth code client-reachable.
- `GET /auth/session` returns `{ user: GoogleIdentity | null }` from the server cookie only; `POST /auth/session` destroys the Google cookie and returns `{ ok: true }`.
- Change `AuthState.hydrate()` to restore local demo state without marking the app ready; add `finishHydration(googleIdentity: GoogleIdentity | null): void` to apply the server identity if present and only then release route guards.
- `subjectFor()` maps demo admin to admin, demo employee to the existing fixture active state, and Google identity to active employee.

- [x] **Step 1: Add failing auth-store, auth-service, session route, revocation, and policy tests**

  Cover valid Google identity persistence for UI state, migration of existing `{ username }` demo sessions, malformed Google identity rejection, Google-to-employee policy, Google denial from Users, unchanged demo login, safe session route results, same-origin logout, and unchanged employee revocation.

- [x] **Step 2: Update `AuthUser` and auth-store validation**

  Keep the versioned local storage envelope. Validate the discriminated union; do not trust any stored role. Demo roles remain derived in `access-policy.ts`. Google session claims from local storage are only a cache and are replaced by the server identity during bootstrap.

- [x] **Step 3: Add the `/auth/session` loader/action**

  The loader returns only safe identity fields from `readGoogleIdentity`. The action accepts same-origin POST logout, calls `destroyGoogleSession`, and returns the clearing cookie header. No raw session cookie contents or OAuth tokens leave the server.

- [x] **Step 4: Coordinate local and server hydration**

  Update `SessionBootstrap` to await both local demo hydration and `GET /auth/session`, call `finishHydration` once both settle, and give a valid server Google identity precedence over persisted demo state. Preserve current employee-account revocation for the demo employee only.

- [x] **Step 5: Update access policy and its tests**

  Derive the role from `AuthUser.kind`; only the existing admin demo can access Users and update the employee fixture. All Google identities are active employee subjects.

- [x] **Step 6: Clear both session sources on logout and before a different demo login**

  Make `useLogout` POST to `/auth/session`, then clear Zustand and navigate to `/login`. If the request fails, keep the current UI session and show a retryable error so a surviving Google cookie cannot silently restore the user. Make successful demo authentication clear any Google cookie before persisting its demo identity; if the server clear request fails, do not create a conflicting demo session and show the generic retryable login error.

- [x] **Step 7: Run focused auth tests**

  Run: `pnpm test -- tests/unit/auth-store.test.ts tests/unit/auth.test.ts tests/unit/google-session-route.test.ts tests/unit/session-bootstrap.test.tsx tests/unit/session-revocation.test.tsx tests/unit/access-policy.test.ts tests/unit/use-login.test.tsx tests/unit/use-logout.test.tsx`

  Expected: tests cover hydration precedence, logout clearing, switching providers, and unchanged demo behavior.

### Task 4: Add the Google button and account presentation

**Files:**
- Modify: `app/features/auth/login-form.tsx`
- Modify: `app/features/auth/auth-messages.ts`
- Modify: `app/components/layout/app-header.tsx`
- Test: `tests/e2e/auth.spec.ts`

**Interfaces:**
- The login form exposes a “Tiếp tục với Google” link/button to `GET /auth/google` while retaining the existing username/password form.
- The Google control is disabled during active form submission and has a visible pending state and accessible name.
- The login route maps the safe `auth_error=google` query value to a Vietnamese retryable error; never render arbitrary query strings.
- The account menu shows a Google user's name and email; demo accounts continue to show their usernames.

- [ ] **Step 1: Add Google login UI behavior checks**

  Extend `tests/e2e/auth.spec.ts` to verify the existing demo login still renders and works, the Google button is keyboard accessible and targets `/auth/google`, and the known `auth_error=google` value shows the generic error. OAuth callback success and failure are covered by the route tests from Task 2; do not require a real Google account in automated tests.

- [ ] **Step 2: Add safe Google error messages**

  Add a single generic login message for Google provider/configuration/callback failures and map only the known `auth_error=google` value.

- [ ] **Step 3: Add the Google action to `LoginForm`**

  Add a divider and provider button below the current submit button. Preserve the current field validation, submit messages, card layout, and mobile behavior.

- [ ] **Step 4: Render the authenticated identity in the account menu**

  Show `name` and `email` for Google users and the existing username for demo accounts; keep a neutral avatar fallback.

- [ ] **Step 5: Run focused login E2E checks**

  Run: `pnpm test:e2e -- tests/e2e/auth.spec.ts`

  Expected: demo login remains unchanged and the controlled Google flow reaches the workspace without external Google credentials.

### Task 5: Document Google Cloud and environment setup

**Files:**
- Create: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Environment values: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `AUTH_SESSION_SECRET`.
- Local callback URI: `http://localhost:5173/auth/google/callback`.

- [ ] **Step 1: Document the required Google Cloud setup**

  Explain how to create a Web OAuth client, register localhost and deployed callback URLs, configure the consent screen and test users where applicable, copy `.env.example` to `.env`, and keep secrets out of source control. State that runtime Google login requires user-supplied Google Cloud credentials.

- [ ] **Step 2: Add `.env.example`**

  Include placeholder values only, no real credentials, and retain `.env` in `.gitignore`.

- [ ] **Step 3: Confirm the end-to-end setup instructions**

  Review the documented redirect URI, scope, environment names, OAuth test setup, and known prototype authorization limitation against the implementation and spec.

### Final review

- [ ] Review all changed files against the spec, especially session precedence, error redaction, and the client-side authorization limitation.
- [ ] Confirm no OAuth token, client secret, or raw provider error is stored or rendered in the browser.
- [ ] Confirm missing credentials produce a safe login error and do not break the demo login flow.
- [ ] Run `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`; report any checks that cannot run because Google Cloud credentials are unavailable. Automated tests must mock Google and must not require a real Google account.
