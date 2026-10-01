# Third-party notices

Folio is licensed under GPL-3.0-or-later. Third-party software and fonts retain their own licenses.
The versions below were audited against `package-lock.json` and the installed `node_modules` packages.
Full installed license and notice texts, including copyright statements, are collected in [licenses/production-dependencies.txt](licenses/production-dependencies.txt) and shipped with the app.
This inventory includes declared production dependencies and their transitive dependencies, even when a particular package is not reachable in the final renderer bundle.

## Main components

| Package                 | Installed version | License | Attribution / source                                                                                                                                                                                                                                                                                                                        |
| ----------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @excalidraw/excalidraw  | 0.18.1            | MIT     | Copyright (c) 2020 Excalidraw; installed metadata and [upstream LICENSE](https://github.com/excalidraw/excalidraw/blob/v0.18.1/LICENSE). The npm package omits the license file; its upstream text is included in the license collection.                                                                                                   |
| penna-markdown          | 0.2.6             | MIT     | Copyright (c) 2026 AnkioTomas; installed LICENSE.                                                                                                                                                                                                                                                                                           |
| katex (including fonts) | 0.18.9            | MIT     | Copyright (c) 2013–2020 Khan Academy and other contributors; installed LICENSE. Mermaid also installs KaTeX 0.16.47.                                                                                                                                                                                                                        |
| mermaid                 | 12.0.0            | MIT     | Copyright (c) 2014–2022 Knut Sveidqvist; installed LICENSE.                                                                                                                                                                                                                                                                                 |
| react / react-dom       | 19.3.0            | MIT     | Meta Platforms, Inc. and affiliates; installed LICENSE files.                                                                                                                                                                                                                                                                               |
| motion                  | 13.4.1            | MIT     | Copyright (c) 2024 Motion B.V.; installed LICENSE.md.                                                                                                                                                                                                                                                                                       |
| @radix-ui/react-dialog  | 1.1.23            | MIT     | Copyright (c) 2022 WorkOS; installed LICENSE.                                                                                                                                                                                                                                                                                               |
| zustand                 | 5.0.15            | MIT     | Copyright (c) 2019 Paul Henschel; installed LICENSE.                                                                                                                                                                                                                                                                                        |
| khroma                  | 2.1.0             | MIT     | Copyright (c) 2019–present Fabio Spampinato, Andrew Maney. The package.json omits `license`; its installed `license` file and [upstream v2.1.0 license](https://github.com/fabiospampinato/khroma/blob/v2.1.0/license) confirm MIT.                                                                                                         |
| fuzzy                   | 0.1.3             | MIT     | Matt York; legacy `licenses` metadata and installed LICENSE-MIT.                                                                                                                                                                                                                                                                            |
| electron                | 44.4.5            | MIT     | Electron contributors; GitHub Inc. The installed distribution's LICENSE is included in the license collection. Electron's LICENSE and Chromium third-party notices are supplied with the Electron distribution and copied into the app at packaging time, as described below. Electron is a development dependency used as the app runtime. |

Electron's MIT license is copied verbatim at packaging time from `node_modules/electron/dist/LICENSE` to `Contents/Resources/licenses/Electron-LICENSE` in the app. Chromium and other bundled components' third-party notices are supplied with the Electron distribution and copied verbatim from `node_modules/electron/dist/LICENSES.chromium.html` to `Contents/Resources/licenses/Electron-LICENSES.chromium.html`. The Chromium notice file is not stored in this source repository.

## Non-MIT production dependencies

The audit covers 342 installed production package instances (326 distinct name/version pairs).
The table includes every non-MIT package/version pair except the explicitly excluded ELK package.
DOMPurify is offered under MPL-2.0 OR Apache-2.0; Folio selects **Apache-2.0**.
Pako requires **both MIT and Zlib**; the collection includes its root LICENSE and `lib/zlib/README` with the Zlib terms.
`robust-predicates` uses the Unlicense and `fractional-indexing` uses CC0-1.0.

| Package                   | Version | License used                                     | Installed license / notice   |
| ------------------------- | ------- | ------------------------------------------------ | ---------------------------- |
| @chevrotain/cst-dts-gen   | 11.0.3  | Apache-2.0                                       | `LICENSE.txt`                |
| @chevrotain/cst-dts-gen   | 11.1.2  | Apache-2.0                                       | `LICENSE.txt`                |
| @chevrotain/gast          | 11.0.3  | Apache-2.0                                       | `LICENSE.txt`                |
| @chevrotain/gast          | 11.1.2  | Apache-2.0                                       | `LICENSE.txt`                |
| @chevrotain/regexp-to-ast | 11.0.3  | Apache-2.0                                       | `LICENSE.txt`                |
| @chevrotain/regexp-to-ast | 11.1.2  | Apache-2.0                                       | `LICENSE.txt`                |
| @chevrotain/types         | 11.0.3  | Apache-2.0                                       | `LICENSE.txt`                |
| @chevrotain/types         | 11.1.2  | Apache-2.0                                       | `LICENSE.txt`                |
| @chevrotain/utils         | 11.0.3  | Apache-2.0                                       | `LICENSE.txt`                |
| @chevrotain/utils         | 11.1.2  | Apache-2.0                                       | `LICENSE.txt`                |
| anymatch                  | 3.1.3   | ISC                                              | `LICENSE`                    |
| browser-fs-access         | 0.29.1  | Apache-2.0                                       | `LICENSE`                    |
| chevrotain                | 11.0.3  | Apache-2.0                                       | `LICENSE.txt`                |
| chevrotain                | 11.1.2  | Apache-2.0                                       | `LICENSE.txt`                |
| crc-32                    | 0.3.0   | Apache-2.0                                       | `LICENSE`                    |
| d3                        | 7.9.0   | ISC                                              | `LICENSE`                    |
| d3-array                  | 2.12.1  | BSD-3-Clause                                     | `LICENSE`                    |
| d3-array                  | 3.2.4   | ISC                                              | `LICENSE`                    |
| d3-axis                   | 3.0.0   | ISC                                              | `LICENSE`                    |
| d3-brush                  | 3.0.0   | ISC                                              | `LICENSE`                    |
| d3-chord                  | 3.0.1   | ISC                                              | `LICENSE`                    |
| d3-color                  | 3.1.0   | ISC                                              | `LICENSE`                    |
| d3-contour                | 4.0.2   | ISC                                              | `LICENSE`                    |
| d3-delaunay               | 6.0.4   | ISC                                              | `LICENSE`                    |
| d3-dispatch               | 3.0.1   | ISC                                              | `LICENSE`                    |
| d3-drag                   | 3.0.0   | ISC                                              | `LICENSE`                    |
| d3-dsv                    | 3.0.1   | ISC                                              | `LICENSE`                    |
| d3-ease                   | 3.0.1   | BSD-3-Clause                                     | `LICENSE`                    |
| d3-fetch                  | 3.0.1   | ISC                                              | `LICENSE`                    |
| d3-force                  | 3.0.0   | ISC                                              | `LICENSE`                    |
| d3-format                 | 3.1.2   | ISC                                              | `LICENSE`                    |
| d3-geo                    | 3.1.1   | ISC                                              | `LICENSE`                    |
| d3-hierarchy              | 3.1.2   | ISC                                              | `LICENSE`                    |
| d3-interpolate            | 3.0.1   | ISC                                              | `LICENSE`                    |
| d3-path                   | 1.0.9   | BSD-3-Clause                                     | `LICENSE`                    |
| d3-path                   | 3.1.0   | ISC                                              | `LICENSE`                    |
| d3-polygon                | 3.0.1   | ISC                                              | `LICENSE`                    |
| d3-quadtree               | 3.0.1   | ISC                                              | `LICENSE`                    |
| d3-random                 | 3.0.1   | ISC                                              | `LICENSE`                    |
| d3-sankey                 | 0.12.3  | BSD-3-Clause                                     | `LICENSE`                    |
| d3-scale                  | 4.0.2   | ISC                                              | `LICENSE`                    |
| d3-scale-chromatic        | 3.1.0   | ISC                                              | `LICENSE`                    |
| d3-selection              | 3.0.0   | ISC                                              | `LICENSE`                    |
| d3-shape                  | 1.3.7   | BSD-3-Clause                                     | `LICENSE`                    |
| d3-shape                  | 3.2.0   | ISC                                              | `LICENSE`                    |
| d3-time                   | 3.1.0   | ISC                                              | `LICENSE`                    |
| d3-time-format            | 4.1.0   | ISC                                              | `LICENSE`                    |
| d3-timer                  | 3.0.1   | ISC                                              | `LICENSE`                    |
| d3-transition             | 3.0.1   | ISC                                              | `LICENSE`                    |
| d3-zoom                   | 3.0.0   | ISC                                              | `LICENSE`                    |
| delaunator                | 5.1.0   | ISC                                              | `LICENSE`                    |
| dompurify                 | 3.4.16  | Apache-2.0 (selected from MPL-2.0 OR Apache-2.0) | `LICENSE`, `LICENSE-MPL`     |
| echarts                   | 6.1.0   | Apache-2.0                                       | `LICENSE`, `NOTICE`          |
| entities                  | 6.0.1   | BSD-2-Clause                                     | `LICENSE`                    |
| fractional-indexing       | 3.2.0   | CC0-1.0                                          | `LICENSE`                    |
| glob-parent               | 5.1.2   | ISC                                              | `LICENSE`                    |
| highlight.js              | 11.11.1 | BSD-3-Clause                                     | `LICENSE`                    |
| idb-keyval                | 6.3.0   | Apache-2.0                                       | `LICENCE`                    |
| inherits                  | 2.0.4   | ISC                                              | `LICENSE`                    |
| internmap                 | 1.0.1   | ISC                                              | `LICENSE`                    |
| internmap                 | 2.0.3   | ISC                                              | `LICENSE`                    |
| isexe                     | 2.0.0   | ISC                                              | `LICENSE`                    |
| lucide-react              | 1.47.0  | ISC                                              | `LICENSE`                    |
| pako                      | 2.0.3   | MIT AND Zlib                                     | `LICENSE`, `lib/zlib/README` |
| pwacompat                 | 2.0.17  | Apache-2.0                                       | `LICENSE`                    |
| robust-predicates         | 3.0.3   | Unlicense                                        | `LICENSE`                    |
| rw                        | 1.3.3   | BSD-3-Clause                                     | `LICENSE`                    |
| source-map-js             | 1.2.1   | BSD-3-Clause                                     | `LICENSE`                    |
| tslib                     | 2.3.0   | 0BSD                                             | `LICENSE.txt`                |
| tslib                     | 2.8.1   | 0BSD                                             | `LICENSE.txt`                |
| which                     | 2.0.2   | ISC                                              | `LICENSE`                    |
| yaml                      | 2.9.1   | ISC                                              | `LICENSE`                    |
| zrender                   | 6.1.0   | BSD-3-Clause                                     | `LICENSE`                    |

All table entries refer to full texts in [licenses/production-dependencies.txt](licenses/production-dependencies.txt), rather than relying on `node_modules` being present in the app.
The remaining production packages declare MIT (including fuzzy's legacy metadata and khroma's verified license file); their available license/notice files are also included in that collection.

### Excluded ELK implementation

Mermaid declares `elkjs` 0.9.3 under EPL-2.0 without a GPL secondary-license designation.
It remains in the dependency lockfile, but the Electron renderer and web build alias `elkjs` and all subpaths, including Mermaid's actual `elkjs/lib/elk.bundled.js` import, to `src/lib/vendor/elk-stub.ts`.
That class rejects layout requests with “ELK layout is not available in Folio builds”. The ELK implementation is excluded from the renderer and the application package; Mermaid's ordinary default layouts remain available.

## Fonts

All Excalidraw font files are excluded from this source repository. They are copied from the `@excalidraw/excalidraw` npm package at build time; `public/excalidraw-assets/` is ignored by `.gitignore`.

The build copies the following nine font families from `@excalidraw/excalidraw` 0.18.1 into `public/excalidraw-assets/fonts` and the renderer bundle.
Their copyright statements and reserved names are preserved in [licenses/font-attributions.txt](licenses/font-attributions.txt).
The complete SIL OFL 1.1 text is in [licenses/OFL-1.1.txt](licenses/OFL-1.1.txt).
ComicShanns is an exception: its complete MIT license with all bundled copyright lines is in [licenses/ComicShanns-MIT.txt](licenses/ComicShanns-MIT.txt).

| Font family                     | Copyright holders / attribution                                                                                        | License and verification source                                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assistant                       | The Assistant Project Authors (2020); The Source Sans Pro Authors (2010); Ben Nathan / Paul Hunt                       | SIL OFL 1.1; [upstream OFL](https://github.com/google/fonts/blob/main/ofl/assistant/OFL.txt) and bundled name table. Reserved name: Source.                                                                                                                                                                                      |
| Cascadia (Cascadia Code)        | Microsoft Corporation (2020, embedded copyright); Aaron Bell / Saja Typeworks                                          | Version 2005.150: embedded nameID 13 contains a license based on SIL OFL permitting bundling and redistribution with any software, provided the copyright notice and license are included. Distributed under these terms; see [raw name table](licenses/Cascadia-embedded-name-table.txt).                                       |
| ComicShanns (Comic Shanns Mono) | Shannon Miwa (2018), Jesus Gonzalez (2023), Rodrigo Batista de Moraes (2023), Fini Jastrow (2024), Kyle Beechly (2024) | MIT; [Excalidraw v0.18.1 font source](https://github.com/excalidraw/excalidraw/blob/v0.18.1/packages/excalidraw/fonts/ComicShanns/index.ts) and bundled copyright/license text.                                                                                                                                                  |
| Excalifont                      | Excalidraw (2024); Your Own Font Foundry; Ján Filípek / DizajnDesign (modifications)                                   | SIL OFL 1.1; [Excalidraw v0.18.1 font source with full license](https://github.com/excalidraw/excalidraw/blob/v0.18.1/packages/excalidraw/fonts/Excalifont/index.ts).                                                                                                                                                            |
| Liberation (Liberation Sans)    | Ascender Corporation (2007, embedded copyright); Steve Matteson                                                        | GPL-2.0 with font exception; version 1.05 [official release](https://releases.pagure.org/liberation-fonts/liberation-fonts-1.05.tar.gz), `License.txt`. Full terms: [Liberation license](licenses/Liberation-1.x-license.txt) and [GPL-2.0](licenses/GPL-2.0.txt). Shipped as independent fonts; not included in the repository. |
| Lilita (Lilita One)             | Juan Montoreano (2011)                                                                                                 | SIL OFL 1.1; [upstream OFL](https://github.com/google/fonts/blob/main/ofl/lilitaone/OFL.txt) and bundled copyright. Reserved names in source notices: Lilita / Lilita One.                                                                                                                                                       |
| Nunito                          | The Nunito Project Authors (2014)                                                                                      | SIL OFL 1.1; [upstream OFL](https://github.com/google/fonts/blob/main/ofl/nunito/OFL.txt) and bundled copyright.                                                                                                                                                                                                                 |
| Virgil                          | Bundled font: Your Own Font Foundry (2011); current upstream: Ellinor Rapp (2021–present)                              | SIL OFL 1.1; bundled full OFL text and [official font repository LICENSE](https://github.com/excalidraw/virgil/blob/main/LICENSE.md). Reserved name: Virgil.                                                                                                                                                                     |
| Xiaolai                         | LXGW (bundled copyright 2020; upstream 2020–2024); Nozomi Seto (2014)                                                  | SIL OFL 1.1; [upstream OFL](https://github.com/lxgw/kose-font/blob/main/OFL.txt) and [Excalidraw v0.18.1 font source](https://github.com/excalidraw/excalidraw/blob/v0.18.1/packages/excalidraw/fonts/Xiaolai/index.ts).                                                                                                         |

### Embedded font license records

The following findings come directly from the actual files in `out/renderer/excalidraw-assets/fonts`, using their embedded name tables. The linked records preserve nameIDs 0, 13 and 14 verbatim, along with the version and SHA-256 of each file.

- **Cascadia 2005.150:** embedded nameID 13 contains a license based on SIL OFL that permits bundling and redistribution with any software, provided each copy includes the copyright notice and that license. Folio bundles this font under those terms. The original text is preserved in [the full embedded record](licenses/Cascadia-embedded-name-table.txt) and [the complete embedded license description](licenses/Cascadia-embedded-license.txt). nameID 14 is `https://scripts.sil.org/OFL`.
- **Liberation 1.05:** embedded nameID 13 refers to Ascender's Liberation license agreement; nameID 14 is `http://www.ascendercorp.com/liberation.html`. The official [Liberation 1.05 release archive](https://releases.pagure.org/liberation-fonts/liberation-fonts-1.05.tar.gz), `liberation-fonts-1.05/License.txt`, confirms **GPL-2.0 with font exception** (the Liberation special exceptions). The official [1.x repository license history](https://github.com/liberationfonts/liberation-1.7-fonts/blob/liberation-fonts-1_07_3/README.rst) distinguishes this license from the OFL used since version 2.00.0. [Excalidraw v0.18.1's font source](https://github.com/excalidraw/excalidraw/blob/v0.18.1/packages/excalidraw/fonts/Liberation/index.ts) identifies the bundled Liberation Sans file but does not state its license. Folio distributes this font with App binaries under its original GPL-2.0 with font exception terms, aggregated as an independent font file. Font binaries are **not included in this source repository**; they are copied from the npm package at build time. The complete original agreement, including both special exceptions, is preserved in [Liberation-1.x-license.txt](licenses/Liberation-1.x-license.txt); the verbatim [GNU GPL version 2](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt) is in [GPL-2.0.txt](licenses/GPL-2.0.txt). See also [the full embedded record](licenses/Liberation-embedded-name-table.txt).

No font binaries have been replaced or relicensed by this preparation.
KaTeX's separate mathematical fonts are covered by its MIT license in the software license collection above.
