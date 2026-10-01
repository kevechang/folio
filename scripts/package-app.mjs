import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { extractFile } from "@electron/asar";

const startedAt = Date.now();
const build = spawnSync("npm", ["run", "build"], { stdio: "inherit" });
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

const electronCache = resolve(".cache/electron");
const builderCache = resolve(".cache/electron-builder");
mkdirSync(electronCache, { recursive: true });
mkdirSync(builderCache, { recursive: true });
if (!existsSync(resolve("node_modules/electron/dist/Electron.app"))) {
  const install = spawnSync(process.execPath, ["node_modules/electron/install.js"], {
    stdio: "inherit",
    env: { ...process.env, electron_config_cache: electronCache },
  });
  if (install.error) throw install.error;
  if (install.status !== 0) process.exit(install.status ?? 1);
}
const result = spawnSync("npx", ["electron-builder", "--mac", "dir", "--arm64"], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_BUILDER_CACHE: builderCache },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
const source = join("dist", "electron-builder", "mac-arm64", "Folio.app");
const destination = join("dist", "Folio.app");
if (!existsSync(source)) throw new Error(`找不到构建产物：${source}`);
rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, { recursive: true, verbatimSymlinks: true });
const rendererEntry = resolve("out/renderer/index.html");
const mainEntry = resolve("out/main/index.js");
for (const entry of [rendererEntry, mainEntry]) {
  if (!existsSync(entry) || statSync(entry).mtimeMs < startedAt) {
    throw new Error(`构建产物不是本次脚本生成的：${entry}`);
  }
  console.log(`新鲜度校验通过：${entry}`);
}
const asarPath = join(destination, "Contents", "Resources", "app.asar");
const hash = (data) => createHash("sha256").update(data).digest("hex");
const localHash = hash(readFileSync(rendererEntry));
const packagedHash = hash(extractFile(asarPath, "out/renderer/index.html"));
if (localHash !== packagedHash) {
  throw new Error(`asar 渲染入口与本地构建产物不一致：${asarPath}`);
}
console.log(`asar 哈希比对通过：${localHash}`);
const verification = spawnSync(
  "codesign",
  ["--verify", "--deep", "--strict", "--verbose=2", destination],
  { stdio: "inherit" },
);
if (verification.error) throw verification.error;
if (verification.status !== 0) {
  console.error(`签名校验失败：${destination}`);
  process.exit(verification.status ?? 1);
}
console.log(`App：${destination}`);
