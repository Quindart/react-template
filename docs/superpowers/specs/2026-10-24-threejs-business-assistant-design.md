# Three.js Business Assistant Design

## Intent

Turn the existing workspace chatbot into a 3D robot assistant that can answer questions and perform supported dashboard actions through natural-language commands.

## Goals

- Replace the plain chatbot launcher with a small animated Three.js robot avatar.
- Keep the existing conversation drawer and add clear idle, thinking, and speaking states.
- Answer business questions from the app's sample metrics.
- Navigate to Home or Users, search the user directory, and export matching rows to Excel when the current user has access.
- Enforce existing users access policy before search/export and clearly describe unsupported actions.
- Keep the bot client-only, lazy-loaded, usable without WebGL, and respectful of reduced motion.

## Non-goals

- Claiming general AI ability or connecting an LLM service without configured provider credentials.
- Creating, editing, or deleting user records; those operations do not exist in the current app.
- Changing authentication, role policy, dashboard metrics, or user query behavior.

## Approaches

- Upgrade the existing chatbot with a 3D avatar and a deterministic command catalog: selected; it reuses the existing app surface and avoids a second assistant.
- Add a separate robot chatbot: rejected because it duplicates the existing global assistant and splits conversation state.
- Connect an LLM agent: deferred because the app has no provider, server endpoint, or tool authorization layer.

## Design

The existing `BusinessChatbot` remains the single global assistant. Its launcher contains a 3D robot head; the drawer shows the same avatar with idle/thinking/speaking animation states. A local Vietnamese intent parser maps explicit commands to a small typed action set. Navigation and user search use React Router URLs. Excel export reuses the existing query and export utilities after checking `canAccess(subjectFor(user, active), 'users')`. Business questions continue to use sample data. Unsupported requests receive an honest explanation. WebGL failure leaves the normal chatbot controls and a static robot fallback.

## Constraints

- React Router SSR; the Three.js scene must only load after client mount.
- User search/export is available only to roles allowed by existing access policy.
- Attachments remain unsupported for analysis and must not be described as read.
- No secret or OAuth files may be read into logs or modified.
