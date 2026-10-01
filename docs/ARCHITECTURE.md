# Architecture

Folio is a macOS Electron application with a React renderer.
It opens Excalidraw canvases and Markdown documents in a shared library.
The desktop build uses `electron.vite.config.ts`; `vite.config.ts` serves the browser version and Vitest.

## Processes and platform boundary

- `electron/main/index.ts` acquires a single-instance lock, collects open-file events, installs protocols and creates the window.
- `electron/main/window.ts` configures the BrowserWindow, restores bounds and saves window position and size.
- The window uses context isolation and sandboxing, with Node integration disabled.
- Packaged renderer files load through `app://folio/`; development uses the Electron Vite renderer URL.
- `electron/main/ipc.ts` registers file, asset, dialog, clipboard, upload, menu, theme and PDF operations.
- IPC requests are checked against the application's window before dispatch.
- `electron/main/open-files.ts` queues paths from Finder, command-line arguments and subsequent app instances.
- `electron/main/lifecycle.ts` asks the renderer to handle pending changes before completing close or quit.
- `electron/preload/index.ts` exposes the `window.folio` interface through `contextBridge`.
- The preload wraps IPC calls and subscriptions; it also retrieves paths from dropped native files.
- `src/lib/platform/types.ts` defines the platform contract used by renderer features.
- `src/lib/platform/electron.ts` implements that contract through the preload interface.
- `src/lib/platform/web.ts` provides browser fallbacks, including file downloads when saving.
- `src/lib/platform/index.ts` selects the implementation by the presence of `window.folio`.

## Renderer modules

`src/main.tsx` sets up the renderer and `src/App.tsx` connects the library, document and settings views.
The renderer features are grouped by responsibility:

| Directory                | Responsibility                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `src/features/shell/`    | Opening and creating documents, recent files, drag/drop, app commands, theme and view transitions.                |
| `src/features/library/`  | Recent files, drafts, selected folders, filtering, cards, missing-file state and folder scanning.                 |
| `src/features/document/` | Shared document shell, read/edit mode, document actions, Frame paging, canvas surface, dialogs and persistence.   |
| `src/features/markdown/` | Penna editor and reader, preview, outline, find, formatting, images, canvas insertion and scroll synchronization. |
| `src/features/settings/` | Appearance, autosave and Markdown preferences.                                                                    |
| `src/components/ui/`     | Shared controls, menus, dialogs, feedback and the Folio mark.                                                     |

`src/styles/` contains theme tokens, shell styles, motion rules and Excalidraw styling.
Markdown-specific theme rules live under `src/features/markdown/theme/`.
The development gallery is available through the `?gallery` query parameter.

## Shared libraries and document adapters

`src/lib/commands.ts` and `native-menu.ts` connect keyboard and menu actions.
`frames.ts`, `scene.ts` and `bound-text.ts` handle canvas navigation, fingerprints and imported bound-text placement.
`document-name.ts`, `export-name.ts`, `format.ts` and `drop.ts` provide naming, presentation and file classification helpers.
`theme.ts`, `settings.ts`, `useSetting.ts`, `motion.ts` and `idle.ts` support preferences and scheduling.
`thumbnails.ts` serializes thumbnail jobs and caches canvas previews in IndexedDB.

`src/lib/markdown.ts` defines `DocumentAdapter<M>`: load, serialize, fingerprint and empty-model operations.
The `markdownAdapter` decodes and encodes UTF-8 text and computes a content fingerprint.
It also supplies Markdown metadata and link helpers.

`src/lib/canvas-adapter.ts` implements `canvasAdapter` using Excalidraw's `loadFromBlob` and `serializeAsJSON`.
It accepts canvas JSON and PNG/SVG images containing Excalidraw scene data.
Loaded scenes pass through `inferBoundTextAlign` before entering the document model.
The adapter fingerprints scene content so view-only changes can be distinguished from document edits.

`src/features/shell/openDocument.ts` authorizes the document directory, loads the appropriate adapter and builds document metadata.
Drafts are opened from their stored scene JSON or Markdown text.
Documents normally open in reading mode; the document shell owns the transition to editing.

## Persistence and autosave

`src/lib/persistence.ts` wraps `idb-keyval` access with fallbacks for storage errors.
IndexedDB stores recent-file metadata, selected folders, drafts and thumbnail records.
Recent-file updates deduplicate by path and retain at most 50 entries.
Settings use `localStorage` through `src/lib/useSetting.ts`.
Window bounds and asset authorizations are stored separately in Electron's user-data directory.

Both document types use `src/features/document/useDocumentPersistence.ts`.
Its context tracks the current model, fingerprint baseline, path, modification time, save state and pending action.
`persistence/usePersistenceOperations.ts` implements save, save-as, reload, restore and rename.
`persistence/usePersistenceLifecycle.ts` coordinates draft storage, conflicts and close/quit dialogs.

Model changes are fingerprinted on an animation frame.
Dirty drafts without a file path are persisted after an 800 ms debounce.
With autosave enabled, edits to a file-backed document are saved after a 1200 ms debounce.
Returning to reading mode or closing can flush pending changes.
Changes arriving during a save can schedule another save.

`electron/main/ipc-fs.ts` writes through a temporary file, flushes it and renames it into place.
An expected modification time detects conflicting changes before overwriting.
When the window regains focus, persistence checks for external modifications.
Clean documents can reload; dirty documents enter a conflict state.

## Local assets and network access

`electron/main/asset-roots.ts` maintains authorized parent directories of documents and library folders.
It persists those roots in `authorized-asset-roots.json` under Electron's user-data directory.
Removing a library folder removes its folder authorization.

`electron/main/protocol.ts` serves bundled application files and local images through `folio-asset://local/`.
`electron/main/ipc.ts` also exposes `asset:read` for image data used by exports and clipboard operations.
Both paths call `resolveAuthorizedAssetPath` in `electron/main/asset-path.ts`.
This checks the image extension, authorized directory boundary and resolved filesystem path, including symlinks.
These restrictions apply to image asset reads; document file operations use separate IPC methods.

`src/features/markdown/render/paths.ts` resolves relative paths against a document.
`render/pipeline.ts` sanitizes Markdown output and creates placeholders for local formulas, diagrams, charts and canvases.
`render/hydrate.ts` loads KaTeX, Mermaid and embedded canvases, normally using an intersection observer for lazy rendering.
`render/chart.ts` renders ECharts and constrains chart options.
Fonts are copied from the installed Excalidraw package by both Vite configurations.
The build aliases `elkjs` and its subpaths to `src/lib/vendor/elk-stub.ts`; ELK requests reject explicitly.
Mermaid's default layouts remain available.

## Export pipelines

`src/lib/exporting.ts` exports canvases through Excalidraw's PNG/SVG helpers with embedded editable scene data.
PNG clipboard copy first uses Excalidraw and falls back to Electron's image clipboard operation.
`src/features/document/useCanvasExports.ts` connects those operations to document actions.

Markdown exports start in `src/features/markdown/export/useMarkdownExports.ts`.
`export/render.ts` builds a temporary light-theme article and hydrates all render placeholders.
`export/assets.ts` handles authorized local images and reports images that cannot be included.
`export/html.ts` sanitizes the article, adds styles and embeds required KaTeX fonts for standalone HTML.
Remote image URLs can remain in exported HTML.
`export/wechat.ts` inlines styles and converts formulas and diagrams for the WeChat clipboard format.

PDF export passes the prepared HTML to `electron/main/pdf.ts` for an isolated print window.
`pdf-options.ts` configures A4 output and filters requests: remote images are allowed, remote scripts, styles and fonts are blocked.
The main process writes the result of Electron's `printToPDF` to the selected file.

## Tests and builds

`tests/` contains Vitest unit tests and React/jsdom tests for document, library and Markdown behavior.
`tests/electron/` covers filesystem, asset authorization, menus, open-file handling, uploads and PDF rules with Electron mocks.
`tests/fixtures/` contains synthetic regression data; `docs/samples/` supplies example documents used by tests.
Module graph tests guard process-independent source structure and platform imports.
`npm run typecheck`, `npm test` and `npm run format:check` are the required contribution checks.
CI also runs `npm run build` on macOS with Node 22.
`electron-builder.yml` packages the desktop output and includes project and third-party license resources.
`scripts/package-app.mjs` builds `dist/Folio.app`, checks output freshness and the packaged renderer hash, and verifies the local signature.
