# City GRDP Growth Design

## Intent

Add `/city`, a Three.js view comparing the latest official annual GRDP growth estimates for Vietnam's six centrally governed cities.

## Goals

- Add an authenticated workspace route and sidebar link named “Tăng trưởng thành phố”.
- Present 2025 estimated GRDP growth on a Leaflet street map with animated Three.js block-city skylines anchored to each city's longitude/latitude.
- Let users select city markers or accessible HTML city buttons to inspect the rate.
- Keep all six values visible in HTML and label the metric, year, estimate status, and source.
- Load Three.js client-side only, provide a static fallback, and respect reduced motion.

## Non-goals

- Showing all 34 province-level localities; this view is limited to the six centrally governed cities.
- Claiming nominal GRDP size, per-capita GDP, or forecasting.
- Fetching live data or creating a general GIS system.

## Approaches

- 3D geographic columns: selected; keeps relative city placement while making growth magnitude easy to compare.
- 3D bar ranking: simpler to compare, but loses city geography.
- 3D polygon choropleth: more map-like, but needs administrative-boundary data not present in the app.

## Design

Use the six-city 2025 estimated GRDP growth values published by Vietnam's National Statistics Office: Hanoi 8.16%, Ho Chi Minh City 7.53%, Hai Phong 11.81%, Da Nang 9.18%, Can Tho 7.23%, and Hue 8.50%. Render an OpenStreetMap street layer with Leaflet and place a small animated skyline of box-shaped towers at each city's geographic coordinates. Tower heights vary with growth; selecting a city marker or accessible city-list button updates the summary and highlights its skyline. Keep the city list readable without WebGL. The page includes a source link and explicitly says the values are estimates. If WebGL fails, the Leaflet map and all city values remain available.

## Constraints

- Existing app uses React Router Framework Mode with SSR and Three.js is already installed.
- Leaflet and Three.js setup must run only in the browser and dispose their resources; show visible OpenStreetMap attribution.
- Do not change existing chatbot, authorization policy, or sample business metrics.
