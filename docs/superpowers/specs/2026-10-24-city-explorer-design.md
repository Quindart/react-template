# City Explorer Design

## Intent

Extend `/city` into a useful GRDP explorer while retaining its Leaflet map and Three.js block skylines.

## Goals

- Select between complete, published annual observations for 2024 and 2025.
- Compare two cities, search city names, and focus the map on a selection.
- Switch between street and satellite basemaps with provider attribution.
- Show a city detail and year-over-year observations without inventing unsupported values.

## Approaches

- Rebuild the map for each selected year: simple but interrupts the map and animation.
- Keep Leaflet alive and update marker labels and Three.js tower scale: selected, preserves pan/zoom and creates a smooth data change.
- Build a separate analytical page: duplicates navigation and loses the geographic context.

## Design

Add verified 2024 growth observations alongside 2025 estimates. The year control changes rankings, city detail, comparison, marker tooltip values, and tower heights. Search filters the accessible city list and selecting a result selects it and flies the map to its coordinates. A second city selector drives a side-by-side growth comparison and 2024-to-2025 change. A basemap control switches OSM street tiles and Esri World Imagery while keeping required attribution. City detail shows the selected year's GRDP growth, rank among the six cities, and the two-year change. Population and sector breakdowns are excluded until consistently sourced city data is available.

## Constraints

- Use only 2024 and 2025 annual data in this UI; identify 2025 values as estimates.
- Display sources for both annual datasets and each map provider.
- Preserve SSR safety, reduced-motion behavior, responsive controls, and WebGL fallback.
