import { app, net, protocol } from "electron";
import { existsSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveAuthorizedAssetPath } from "./asset-path";
import { authorizedAssetRoots } from "./asset-roots";

export { allowDocumentAssets, allowFolderAssets } from "./asset-roots";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
  {
    scheme: "folio-asset",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

const mime: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};
const csp =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: folio-asset:; font-src 'self' data:; worker-src 'self' blob:; connect-src 'self'; frame-src https:; object-src 'none'; base-uri 'none'";

export function installProtocol() {
  const root = join(app.getAppPath(), "out/renderer");
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    if (url.host !== "folio") return new Response("Not found", { status: 404 });
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    const file = normalize(join(root, relative));
    if (!file.startsWith(root + sep) || !existsSync(file))
      return new Response("Not found", { status: 404 });
    return net.fetch(pathToFileURL(file).toString()).then(async (response) => {
      const headers = new Headers(response.headers);
      headers.set("Content-Security-Policy", csp);
      return new Response(await response.arrayBuffer(), { status: response.status, headers });
    });
  });
  protocol.handle("folio-asset", async (request) => {
    try {
      const url = new URL(request.url);
      if (url.host !== "local") return new Response("Forbidden", { status: 403 });
      const path = decodeURIComponent(url.pathname);
      const real = await resolveAuthorizedAssetPath(path, authorizedAssetRoots());
      if (!real) return new Response("Forbidden", { status: 403 });
      const response = await net.fetch(pathToFileURL(real).toString());
      const headers = new Headers(response.headers);
      headers.set("Content-Type", mime[extname(real).toLowerCase()]);
      headers.set("Content-Security-Policy", "default-src 'none'");
      return new Response(await response.arrayBuffer(), { status: response.status, headers });
    } catch {
      return new Response("Forbidden", { status: 403 });
    }
  });
}
