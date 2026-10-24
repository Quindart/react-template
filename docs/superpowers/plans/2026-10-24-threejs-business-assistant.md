# Three.js Business Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the workspace chatbot with a 3D robot avatar and useful, permission-aware dashboard actions.

**Architecture:** Keep `BusinessChatbot` as the single assistant. Add a client-only lazy Three.js avatar and a pure local intent parser; execute its typed commands through the existing router, access policy, user query, and Excel export utilities.

**Tech Stack:** React 19, React Router 8, Three.js, TypeScript, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-24-threejs-business-assistant-design.md`

## Global Constraints

- The Three.js scene must only load after client mount.
- User search/export is available only to roles allowed by existing access policy.
- Attachments remain unsupported for analysis and must not be described as read.
- Unsupported actions receive an honest response; no LLM connection is configured.

## Review Focus

- SSR must not evaluate browser APIs or Three.js scene setup.
- Unauthorized users must not trigger user search/export.
- Vietnamese intents with/without diacritics should map consistently.
- Unknown commands must not trigger arbitrary navigation or mutations.
- WebGL failure and reduced-motion preference preserve a usable chatbot.

---

### Task 1: Typed local assistant intent parser

**Files:**

- Create: `app/features/chatbot/assistant-intent.ts`

**Interfaces:** `parseAssistantIntent(text: string): AssistantIntent` returns `home`, `users`, `search-users(query)`, `export-users(query?)`, or `question`.

- [ ] Implement normalized, explicit intent patterns; avoid arbitrary URL/action interpretation.

### Task 2: Robot avatar and chatbot action execution

**Files:**

- Create: `app/features/chatbot/assistant-avatar.tsx`
- Create: `app/features/chatbot/assistant-avatar-scene.tsx`
- Modify: `app/features/chatbot/business-chatbot.tsx`
- Modify: `app/features/chatbot/fake-reply.ts`
- Modify: `app/routes/home.tsx` (remove the replaced revenue orbit section)

**Interfaces:** `AssistantAvatar({ mood }: { mood: 'idle' | 'thinking' | 'speaking' })` draws the robot or static fallback. `BusinessChatbot` executes parser commands and renders truthful action results.

- [ ] Implement client-only 3D robot states and cleanup/reduced-motion fallback.
- [ ] Execute only supported intents; check users access before search/export, reuse `queryUsers` and `exportUsers`, and keep questions on the existing sample responder.
- [ ] Remove the previous revenue-orbit visualization from Home.
- [ ] Run typecheck and production build; inspect `git diff --check`.
