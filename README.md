# CarbonWatch Kenya — Community Tracker

A single platform for carbon credit transparency and community empowerment in Northern Kenya conservancies.

## What’s in the platform

- **Home** (`index.html`) — Overview, hero, and links to Community Interface, SCOUT Tool, Public Dashboard, and Sources.

- **Community Interface** (`community-interface.html`) — SMS and IVR mockup. Users can type a message and send; the mockup shows an **acknowledgement reply** (with reference ID) in English or Kiswahili. Language toggle and smartphone/feature-phone views.

- **SCOUT Tool** (`scout-engine.html`) — Survey aligned to WELI-style empowerment dimensions (production, nutrition, resources, income, opportunities, time & workload). Donut chart and dimension strip; 7 questions; indices, red flags, and action prompts. English/Kiswahili.

- **Public Dashboard** (`dashboard.html`) — Kenya Verra projects: project selector (Kenya total, NRT, Komaza, Boomitra, KCSA), big-number stats (credits issued/retired, community share, project count), interactive map (NRT boundary, conservancies, other projects), compare & filter table, verification cycles, data grid (carbon tracker, SCOUT metrics, grievance mechanism), and community benefits.

- **Sources** (`sources.html`) — Citations and methodology: Verra Registry, NRT, WELI/Pro-WEAI, Social CoMMs, VCS 1468 details, dashboard data. Card layout with in-page nav.

## Data

- **Map and stats** use `data/kenya-carbon-harmonized.json` (with fallback to `kenya-carbon-projects.json` and comprehensive JSON). Carbon and community summary data are merged from the primary JSON when available.
- **Scripts** live in `scripts/` (e.g. `dashboard.js`, `community-interface.js`, `scout-engine.js`, `script.js`).

## Run locally

Open `index.html` in a browser, or use **Live Server** in VS Code (right-click `index.html` → “Open with Live Server”).

## End goal

*Our end goal is transparency: communities want to be involved and learn about carbon credit funds and decision-making, but current methods are absent.* Bidirectional communication—including closing the loop with acknowledgements and reference IDs—is the foundation that enables future social objectives.
