# CarbonWatch Kenya — Community Tracker

An independent, community-facing transparency platform: public-good technical infrastructure for carbon credit transparency and community voice across Kenya’s conservancies.

## Project scope

- **Scope:** Independent community-facing platform for carbon project reporting in Kenya, built as **public-good infrastructure** for the entire country.
- **Research & partnership (home page):** CarbonWatch Kenya is being built from research by **SMART** in partnership with **Agency for Inclusive Innovation Development (AIID-Africa)**—stated on `index.html` with partner logos (Cornell, Dyson, **AIID-Africa logo**) in the footer site-wide. Other pages use page-specific intros only.
- **Long-term vision:** The system is designed for **long-term incubation and scaling** beyond carbon projects: governance, livelihoods, and conservancy monitoring at national scale.

## What’s in the platform

(Site navigation order: **Home** → **Public Dashboard** → **Community Interface** → **SCOUT Tool** → **Sources**.)

- **Home** (`index.html`) — Overview, hero, research context, and platform tool cards in that order.

- **Public Dashboard** (`dashboard.html`) — **Front-end interface for data description and analysis.** Kenya Verra projects: project selector (Kenya total and example projects such as NRT, Komaza, Boomitra, KCSA), big-number stats (credits issued/retired, community share, project count), interactive map (NRT boundary, conservancies, other projects), single project selector (key metrics for one project at a time), verification cycles, **carbon credit buyers** (Verra-linked project names; data from `buyers-*.json`), data grid (carbon tracker, SCOUT metrics, grievance mechanism), and community benefits.

- **Community Interface** (`community-interface.html`) — **SMS/IVR and USSD** on one page (same bidirectional channels). A workflow diagram shows SMS/IVR and USSD feeding the central repository; a switch toggles between **SMS** (mockup, channels, process) and **USSD** (menu, request/response). Users can send or request data via either channel.

- **SCOUT Tool** (`scout-engine.html`) — Survey aligned to WELI-style empowerment dimensions (production, nutrition, resources, income, opportunities, time & workload). Donut chart and dimension strip; 7 questions; indices, red flags, and action prompts. English/Kiswahili.

- **Sources** (`sources.html`) — Citations and methodology: Verra Registry, NRT, SCOUT/WELI/Pro-WEAI, VCS 1468 detail, dashboard data, and **buyer retirement** data files. Card layout with in-page nav.

## Data workflow

**SMS/IVR** and **USSD** are the same bidirectional channels: users can **send** data (reports, feedback) and **request** data (carbon payment status, grievance tracking) via either channel. Both feed a **single central repository**; the dashboard is the front-end for viewing and analyzing that data.

```
┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────────────────┐
│  SMS / IVR          │     │  USSD               │     │  Central data repository  │
│  (send & request    │────▶│  (short code;       │────▶│  (harmonized datasets,   │
│   messages)         │     │   send & request)   │     │   kenya-carbon-*.json)   │
└─────────────────────┘     └─────────────────────┘     └────────────┬─────────────┘
                                                                      │
                                                                      ▼
                                                          ┌──────────────────────────┐
                                                          │  Public Dashboard         │
                                                          │  (front-end interface     │
                                                          │   for description &       │
                                                          │   analysis)               │
                                                          └──────────────────────────┘
```

- **Inputs:** Community messages (SMS/IVR) and USSD sessions (send and request) are ingested and stored; SCOUT and other manual entries also feed the repository.
- **Repository:** A single central repository holds harmonized project and conservancy data (e.g. `kenya-carbon-harmonized.json`, `kenya-carbon-projects.json`).
- **Front-end:** The **Public Dashboard** is the **front-end interface for data description and analysis**—maps, stats, tables, and exports.

## Data

- **Map and stats** use `data/kenya-carbon-harmonized.json` (with fallback to `kenya-carbon-projects.json` and comprehensive JSON). Carbon and community summary data are merged from the primary JSON when available.
- **Buyer retirements (dashboard)** — **Authoritative source: [Verra Registry](https://registry.verra.org)** (public credit retirements, VCS IDs, VCUs, dates, project names). The site loads `data/buyers-transactions.json`, `data/buyers-summary.json`, and `data/buyers-coverage.json` (generated from `data/MASTER BUYERS CLEAN.xlsx`); JSON `meta` fields credit the Registry.
- **Scripts** live in `scripts/` (e.g. `dashboard.js`, `community-interface.js`, `scout-engine.js`, `script.js`).

## Run locally

Open `index.html` in a browser, or use **Live Server** in VS Code (right-click `index.html` → “Open with Live Server”).

## End goal

*Our end goal is transparency: communities want to be involved and learn about carbon credit funds and decision-making, but current methods are absent.* Bidirectional communication—including closing the loop with acknowledgements and reference IDs—is the foundation that enables future social objectives. The platform is built as **public-good technical infrastructure** for the whole country, with **long-term incubation and scaling** beyond carbon projects.
