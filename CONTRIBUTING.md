# Contributing to Folio

## Requirements

Use Node 22+ and npm. CI uses the latest Node 22 release on macOS.
Desktop development and packaging require macOS; packaging targets Apple Silicon (arm64).

## Development

```sh
npm ci
npm run dev
npm run dev:web
npm run typecheck
npm test
npm run build
```

`dev` starts Electron with HMR. `dev:web` runs the browser version, which downloads saved files and does not export PDF.
`build` produces desktop assets in `out/`. `npm run package:app` builds `dist/Folio.app` locally.
The build copies Excalidraw fonts from the installed dependency into `public/excalidraw-assets/fonts` and the renderer output.
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module responsibilities.

## Before submitting

Run all required checks:

```sh
npm run typecheck && npm test && npm run format:check
```

Also run `npm run build` for changes that affect bundling or dependencies.
Format only the files you changed. Add regression coverage for behavior changes, and describe any macOS checks that need manual verification.

## Pull requests

Keep each PR focused on one problem. Explain the user-visible behavior, the reason for the change and the checks you ran.
Link related issues and include screenshots for visible interface changes when available.
Do not include local documents, personal paths, generated build output or credentials.
Discuss substantial architecture or dependency changes in an issue before implementation.

A Developer Certificate of Origin (DCO) sign-off is not required.
Contributions are provided under Folio's GPL-3.0-or-later license.
Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities using [SECURITY.md](SECURITY.md).
