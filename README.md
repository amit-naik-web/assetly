# Assetly

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.12.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

Component accessibility tests live in `*.a11y.spec.ts` files and use [axe-core](https://github.com/dequelabs/axe-core) via [vitest-axe](https://github.com/chaance/vitest-axe):

```bash
npm run test:a11y
```

Template accessibility rules run via ESLint on every `src/**/*.html` file (editor + CLI):

```bash
npm run lint
```

## Accessibility

Docs: [automated testing](docs/accessibility-testing.md) · [manual testing](docs/accessibility-manual-testing.md) · [roadmap](docs/accessibility-plan.md)

Three automated layers (all passing locally as of June 2026):

| Command | What it checks |
|---------|----------------|
| `npm run lint` | ESLint template accessibility on `src/**/*.html` |
| `npm run test:a11y` | Six component `*.a11y.spec.ts` files (axe via Vitest) |
| `npm run e2e:a11y` | Six routes in Chromium (axe via Playwright) |

axe-based tests fail on **critical** and **serious** violations only.

```bash
npm run lint && npm run test:a11y && npm run e2e:a11y
npm run a11y:report   # HTML report after E2E
npm run e2e:ui        # Playwright UI mode
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
