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

## Accessibility testing (Playwright + axe)

Full documentation: [docs/accessibility-testing.md](docs/accessibility-testing.md) (why, file map, how it works). Roadmap: [docs/accessibility-plan.md](docs/accessibility-plan.md).

E2E accessibility scans use [Playwright](https://playwright.dev/) with [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright). Tests fail on **critical** and **serious** violations only.

Start the app (or let Playwright start it automatically):

```bash
npm start
```

Run route-level accessibility checks:

```bash
npm run e2e:a11y
```

Open the HTML report after a run:

```bash
npm run a11y:report
```

Other Playwright commands:

```bash
npm run e2e       # all e2e tests
npm run e2e:ui    # interactive UI mode
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
