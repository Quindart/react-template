# City Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add year selection, city comparison, details, map styles, and search to `/city`.

**Architecture:** Keep Leaflet mounted and update its tiles, markers, and Three.js buildings from selected year and basemap state. Keep accessible search, year controls, comparison, and details in React HTML.

**Tech Stack:** React Router, React, Leaflet, Three.js, TypeScript, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-10-24-city-explorer-design.md`

## Global Constraints

- Use only the complete 2024 and 2025 annual data included in the spec.
- Mark 2025 values as estimates and link both data sources.
- Preserve attribution for OSM and Esri tiles.
- Preserve SSR safety, reduced motion, and WebGL fallback.

## Review Focus

- Changing year updates every displayed growth value and 3D tower scale.
- Switching basemaps retains attribution and current map position.
- Search has an empty state and selecting a city flies the map to it.
- Comparison handles the same city selected twice.
- Reduced motion and unavailable WebGL do not disable data controls.

---

### Task 1: Annual data and accessible controls

**Files:** `app/features/city/city-grdp-data.ts`, `app/features/city/city-growth-view.tsx`

- [x] Add typed 2024/2025 observations and source link; derive all visible values from selected year.
- [x] Add year control, city search, comparison selector, details and comparison panel.
- [x] Add explicit 2025 estimate label and no-results search state.

### Task 2: Map integration

**Files:** `app/features/city/city-growth-map.tsx`, `app/features/city/city-growth-view.tsx`

- [x] Pass selected year and basemap into the persistent map component.
- [x] Update marker tooltip values and tower heights when year changes.
- [x] Add street/satellite layer switching with visible provider attribution.
- [x] Preserve search/selection fly-to, reduced motion and WebGL fallback.

### Task 3: Page summaries and verification

**Files:** `app/routes/city.tsx`, design docs

- [x] Keep summary cards explicitly labeled for 2025 and make route-level sources clear.
- [x] Run typecheck, build, route smoke check and diff whitespace check.
