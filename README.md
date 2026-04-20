# Eightfold AI Compliance Dashboard

A prototype compliance & quality dashboard for Eightfold AI's Responsible AI monitoring surface. Covers four model families — Resume Parsing, AI Interviewer, Match Score Quality, and Recommendation Quality — with per-module validation workflows, request lifecycles, and downloadable PDF quality reports.

## What's inside

- **Overview** — cross-module health summary
- **Resume Parsing** — request-based validation workflow with stratified sampling, side-by-side parser-vs-human comparisons, and a downloadable PDF quality report
- **AI Interviewer** — three-tab module for interview quality monitoring
- **Match Score Quality** — three-tab module for match-quality auditing
- **Recommendation Quality** — recommendation accuracy and drift monitoring
- **Tweaks panel** — adjust density, data state (healthy → stressed), brand gradient, alert severity

Data is generated deterministically from the selected filters — same filters always produce the same numbers, so reports are reproducible.

## Running locally

Because the app loads JSX via Babel-standalone at runtime, it just needs to be served over HTTP (not opened via `file://`). Any static server works:

```bash
# Python 3
python3 -m http.server 8000

# Node (npx)
npx serve .
```

Then open `http://localhost:8000/` (or `/index.html`).

## Project structure

```
.
├── index.html                      # Entry point (same as AI Compliance Dashboard.html)
├── AI Compliance Dashboard.html    # Original filename, kept for compatibility
├── assets/
│   ├── eightfold-logo.svg
│   └── eightfold-mark.svg
├── styles/
│   ├── colors_and_type.css         # Octuple design system tokens
│   └── app.css                     # App-specific styles
└── src/
    ├── data.js                     # Deterministic data generators
    ├── primitives.jsx              # Icon, Chip, Button, etc.
    ├── charts.jsx                  # Inline SVG charts
    ├── filters.jsx                 # Filter bar + multiselect
    ├── shell.jsx                   # App shell (sidebar + topbar)
    ├── overview.jsx                # Overview tab
    ├── resume.jsx                  # Resume Parsing module
    ├── interviewer.jsx             # AI Interviewer module
    ├── match.jsx                   # Match Score Quality module
    ├── recs.jsx                    # Recommendation Quality module
    ├── tweaks.jsx                  # Tweaks panel
    └── app.jsx                     # Root React component
```

## Tech

- React 18 (UMD build)
- Babel-standalone 7.29 (in-browser JSX transpilation — no build step)
- Vanilla CSS tokens from Eightfold's Octuple design system
- No npm dependencies, no bundler

## Deploying to GitHub Pages

1. Push this repo to GitHub
2. In **Settings → Pages**, set Source to `main` branch, root (`/`)
3. Your dashboard will be available at `https://<user>.github.io/<repo>/`

## Notes

- Candidate names, companies, and example resumes in the PDF report are generated deterministically from the request ID. They are **synthetic** and do not correspond to real candidates.
- All metrics shown are simulated from a single parameter (`bias`) that moves the system across the healthy → stressed spectrum.
