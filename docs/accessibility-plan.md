# Accessibility plan — Assetly

Roadmap for finishing and maturing accessibility work after the initial Playwright + axe setup.

**Related docs:** [accessibility-testing.md](./accessibility-testing.md) (what exists today) · [README.md](../README.md) (commands)

**Severity gate (all automated tests):** fail only on axe **critical** and **serious** violations.

---

## Status overview

| Phase | Focus | Status |
|-------|--------|--------|
| 0 | Test infrastructure (Playwright, vitest-axe, scripts, docs) | Done |
| 1 | Green E2E suite (6/6 routes) | In progress — `/overview` failing |
| 2 | Component a11y coverage (high-risk UI) | Not started |
| 3 | CI + lint gates | Not started |
| 4 | Manual QA + ongoing governance | Ongoing |

---

## Phase 0 — Infrastructure (done)

**Goal:** Run automated accessibility checks locally with reports and a documented workflow.

**What was delivered:**

- Playwright + `@axe-core/playwright` E2E scans per route
- Vitest `*.a11y.spec.ts` with `vitest-axe` and shared helpers in `src/testing/`
- npm scripts: `e2e:a11y`, `test:a11y`, `a11y:report`
- [accessibility-testing.md](./accessibility-testing.md) — why / where / how

**Acceptance criteria:** Met — `npm run test:a11y` passes; `npm run e2e:a11y` runs with HTML report.

---

## Phase 1 — Green E2E suite

**Goal:** All six route scans pass with zero critical/serious violations.

### 1.1 Fix overview treemap color contrast

| | |
|---|---|
| **Priority** | P0 — blocks 6/6 E2E |
| **Description** | Treemap loss/gain leaves use dynamic D3 background colors with light text; axe reports **serious** `color-contrast` (e.g. ~1.98:1 vs required 4.5:1 for normal text). |
| **Where** | `src/app/shared/components/treemap/` (TS color scale, `treemap.html`, `treemap.scss`) |
| **Approach** | Use design tokens (`--color-gain`, `--color-loss`, `--color-text-primary`) for leaf fill and label text; ensure computed pairs meet AAA where possible, or minimum AA for chart labels. |
| **Verify** | `npm run e2e:a11y` — `a11y: /overview` passes |

### 1.2 Re-run full E2E and archive baseline

| | |
|---|---|
| **Description** | After treemap fix, run full suite and note any new moderate findings for a backlog (do not block CI on moderate yet). |
| **Verify** | 6/6 passed; open `npm run a11y:report` and confirm clean serious/critical |

---

## Phase 2 — Component a11y coverage

**Goal:** Fast regression tests for the most complex interactive UI, not only full routes.

### 2.1 Holdings table

| | |
|---|---|
| **Priority** | P1 |
| **Description** | Sortable table with keyboard-activatable rows, `aria-sort`, captions, and row labels. High risk for ARIA and focus bugs after the `role="link"` removal. |
| **Where** | `src/app/features/holdings/components/holdings-table/` |
| **Deliverable** | `holdings-table.a11y.spec.ts` — TestBed + mock row data + `runAxe` / `assertNoSeriousViolations` |
| **Verify** | `npm run test:a11y` includes new spec and passes |

### 2.2 Chart page

| | |
|---|---|
| **Priority** | P1 |
| **Description** | Chart must expose `role="application"`, keyboard crosshair, instructions, and `aria-live` announcements per `CLAUDE.md`. |
| **Where** | `src/app/features/chart/` |
| **Deliverable** | `chart.a11y.spec.ts` (may need ChartService / resolver mocks) |
| **Verify** | Component spec passes; optional: extend E2E wait for chart host + axe |

### 2.3 Alert list

| | |
|---|---|
| **Priority** | P2 |
| **Description** | Triggered vs watching states, dismiss actions, and assertive vs polite live regions. |
| **Where** | `src/app/features/alerts/components/alert-list/` |
| **Deliverable** | `alert-list.a11y.spec.ts` with `AlertsStore` seeded alerts |

### 2.4 Price table (live prices)

| | |
|---|---|
| **Priority** | P2 |
| **Description** | Live updating cells and sort controls; ensure prices are not conveyed by color alone. |
| **Where** | `src/app/features/price-feed/` (price table component) |
| **Deliverable** | `*.a11y.spec.ts` for table component |

**Phase 2 acceptance criteria:** At least holdings + chart component specs green; documented in this plan when complete.

---

## Phase 3 — CI and lint gates

**Goal:** Prevent accessibility regressions before merge.

### 3.1 GitHub Actions workflow

| | |
|---|---|
| **Description** | Job on PR/push: install deps, `npx playwright install chromium`, start app or use `webServer`, run `npm run e2e:a11y` and `npm run test:a11y`. |
| **Where** | `.github/workflows/a11y.yml` (new) |
| **Notes** | Set `CI=true` so Playwright does not reuse a stale local server. Upload `playwright-report/` as artifact on failure. |
| **Verify** | PR check fails when a serious/critical violation is introduced |

### 3.2 ESLint template accessibility

| | |
|---|---|
| **Description** | Add `@angular-eslint/template-accessibility` rules to catch missing `alt`, invalid ARIA, and click-only controls without keyboard support at edit time. |
| **Where** | ESLint config (project may need initial ESLint setup if missing) |
| **Verify** | `ng lint` reports template a11y issues |

**Phase 3 acceptance criteria:** CI required check green on main; lint runs in dev workflow.

---

## Phase 4 — Manual QA and governance

**Goal:** Cover what automation cannot detect.

### 4.1 Per-release manual checklist

| Check | Description |
|-------|-------------|
| Keyboard | Tab through each route; Enter/Space activate controls; Escape closes modals/panels |
| Focus | Focus ring visible; order logical; no traps outside dialogs |
| Screen reader | NVDA (Windows) or VoiceOver (Mac) on alerts, holdings, chart |
| Zoom | 200% browser zoom — no clipped or hidden content |
| Motion | Respect `prefers-reduced-motion` if animations added |

### 4.2 PR hygiene

| | |
|---|---|
| **Description** | For UI PRs: run `npm run e2e:a11y` and `npm run test:a11y`; note manual SR pass in PR description for chart/alerts/holdings changes. |

### 4.3 Backlog for moderate/minor axe findings

| | |
|---|---|
| **Description** | Track non-blocking axe issues in GitHub issues or `todo.md`; tackle by area (forms, tables, charts). |

---

## Suggested timeline

| When | Work |
|------|------|
| **Days 1–2** | Phase 1.1 treemap contrast → 6/6 E2E |
| **Days 3–5** | Phase 2.1–2.2 holdings + chart component specs |
| **Week 2** | Phase 2.3–2.4, Phase 3.1 CI |
| **Week 3+** | Phase 3.2 lint, Phase 4 manual pass, moderate backlog |

---

## Commands (quick reference)

```bash
npm run e2e:a11y      # route-level axe (Playwright)
npm run test:a11y       # component *.a11y.spec.ts (Vitest)
npm run a11y:report     # HTML report after E2E
ng test --watch=false   # all unit tests
```

---

## Out of scope (for now)

- WCAG certification or legal audit sign-off
- axe coverage of every shared component
- Failing CI on moderate/minor violations
- `todo.md` item 8 (data validation across screens) — separate workstream

---

## Tracking

Update the **Status overview** table at the top of this file as phases complete. Link PRs/issues next to each task when work starts.

*Last updated: June 2026*
