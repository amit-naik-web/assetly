# Accessibility plan — Assetly

Roadmap for finishing and maturing accessibility work after the initial Playwright + axe setup.

**Related docs:** [accessibility-testing.md](./accessibility-testing.md) (automated setup) · [accessibility-manual-testing.md](./accessibility-manual-testing.md) (hand testing) · [README.md](../README.md) (commands)

**Severity gate (all automated tests):** fail only on axe **critical** and **serious** violations.

---

## Status overview

| Phase | Focus | Status |
|-------|--------|--------|
| 0 | Test infrastructure (Playwright, vitest-axe, scripts, docs) | Done |
| 1 | Green E2E suite (6/6 routes) | Done |
| 2 | Component a11y coverage (high-risk UI) | Done |
| 3 | CI + lint gates | Partial — ESLint done; CI workflow optional |
| 4 | Manual QA + ongoing governance | Ongoing |

**Next (recommended):** Phase 4 manual pass · optional Phase 3.1 CI · `todo.md` item 8 (data validation)

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

### 1.1 Fix overview treemap color contrast — done

| | |
|---|---|
| **Priority** | P0 — blocked 6/6 E2E |
| **Description** | Treemap loss/gain leaves used low-contrast color pairs; axe reported serious `color-contrast` on `/overview`. |
| **Where** | `src/app/shared/components/treemap/treemap.scss` (token-based leaf/header colors) |
| **Verify** | `npm run e2e:a11y` — `a11y: /overview` passes |

### 1.2 Re-run full E2E and archive baseline — done

| | |
|---|---|
| **Description** | Full suite green on critical/serious; moderate findings optional backlog (Phase 4.3). |
| **Verify** | 6/6 E2E passed; `npm run a11y:report` for HTML report |

---

## Phase 2 — Component a11y coverage

**Goal:** Fast regression tests for the most complex interactive UI, not only full routes.

### 2.1 Holdings table — done

| | |
|---|---|
| **Priority** | P1 |
| **Description** | Sortable table with keyboard-activatable rows, `aria-sort`, captions, and row labels. High risk for ARIA and focus bugs after the `role="link"` removal. |
| **Where** | `src/app/features/holdings/components/holdings-table/` |
| **Deliverable** | `holdings-table.a11y.spec.ts` — TestBed + mock row data + `runAxe` / `assertNoSeriousViolations` |
| **Verify** | `npm run test:a11y` — includes holdings-table (6 specs total) |

### 2.2 Chart page — done

| | |
|---|---|
| **Priority** | P1 |
| **Description** | Chart must expose `role="application"`, keyboard crosshair, instructions, and `aria-live` announcements per `CLAUDE.md`. |
| **Where** | `src/app/features/chart/` |
| **Deliverable** | `chart.a11y.spec.ts` — mocked route, candles, holdings, and price feed |
| **Verify** | `npm run test:a11y` — includes chart (6 specs total) |

### 2.3 Alert list — done

| | |
|---|---|
| **Priority** | P2 |
| **Description** | Triggered vs watching states, dismiss actions, and assertive vs polite live regions. |
| **Where** | `src/app/features/alerts/components/alert-list/` |
| **Deliverable** | `alert-list.a11y.spec.ts` with `AlertsStore` seeded alerts |
| **Verify** | `npm run test:a11y` — includes alert-list |

### 2.4 Price table (live prices) — done

| | |
|---|---|
| **Priority** | P2 |
| **Description** | Live updating cells and sort controls; ensure prices are not conveyed by color alone. |
| **Where** | `src/app/features/price-feed/components/price-table/` |
| **Deliverable** | `price-table.a11y.spec.ts` |
| **Verify** | `npm run test:a11y` — includes price-table |

**Phase 2 acceptance criteria:** Met — six component specs (holdings, chart, alert-list, price-table, alert-builder, not-found).

---

## Phase 3 — CI and lint gates

**Goal:** Prevent accessibility regressions before merge.

### 3.1 GitHub Actions workflow — optional

| | |
|---|---|
| **Description** | Job on PR/push: install deps, `npx playwright install chromium`, start app or use `webServer`, run `npm run lint`, `npm run e2e:a11y`, and `npm run test:a11y`. |
| **Where** | `.github/workflows/a11y.yml` (not in repo yet) |
| **Notes** | Set `CI=true` so Playwright does not reuse a stale local server. Upload `playwright-report/` as artifact on failure. Skip if you are solo and run checks locally. |
| **Verify** | PR check fails when lint or axe (critical/serious) regresses |

### 3.2 ESLint template accessibility — done

| | |
|---|---|
| **Description** | Add `@angular-eslint/template-accessibility` rules to catch missing `alt`, invalid ARIA, and click-only controls without keyboard support at edit time. |
| **Where** | [`eslint.config.js`](../eslint.config.js) — `templateRecommended` + `templateAccessibility` on `**/*.html` |
| **Verify** | `npm run lint` — all files pass; template rules run on every `src/**/*.html` |

**Phase 3 acceptance criteria:** Lint in dev workflow (met). CI on main is optional until you want automated PR gates.

---

## Phase 4 — Manual QA and governance

**Goal:** Cover what automation cannot detect.

### 4.1 Per-release manual checklist

Full step-by-step guide: **[accessibility-manual-testing.md](./accessibility-manual-testing.md)** (per-route checklists, NVDA/VoiceOver, PR template).

| Check | Description |
|-------|-------------|
| Keyboard | Tab through each route; Enter/Space activate controls; Escape closes modals/panels |
| Focus | Focus ring visible; order logical; no traps outside dialogs |
| Screen reader | NVDA (Windows) or VoiceOver (Mac) on alerts, holdings, chart |
| Zoom | 200% browser zoom — no clipped or hidden content |
| Motion | Respect `prefers-reduced-motion` if animations added |

### 4.2 PR hygiene (or pre-commit habit)

| | |
|---|---|
| **Description** | Before merging UI work: `npm run lint`, `npm run test:a11y`, `npm run e2e:a11y`. Note manual SR pass for chart/alerts/holdings changes. |

### 4.3 Backlog for moderate/minor axe findings

| | |
|---|---|
| **Description** | Track non-blocking axe issues in GitHub issues or `todo.md`; tackle by area (forms, tables, charts). |

---

## Suggested timeline (remaining)

| When | Work |
|------|------|
| **Now** | Phase 4.1 manual checklist ([accessibility-manual-testing.md](./accessibility-manual-testing.md)) |
| **Optional** | Phase 3.1 GitHub Actions if you push to GitHub and want PR checks |
| **Ongoing** | Phase 4.3 moderate/minor axe backlog; `todo.md` item 8 data validation |

---

## Commands (quick reference)

```bash
npm run lint          # ESLint incl. template accessibility on *.html
npm run e2e:a11y      # route-level axe (Playwright)
npm run test:a11y     # component *.a11y.spec.ts (Vitest)
npm run a11y:report   # HTML report after E2E
ng test --watch=false # all unit tests
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

*Last updated: June 2026 — Phases 0–2 and 3.2 complete; 6/6 E2E and component specs green.*
