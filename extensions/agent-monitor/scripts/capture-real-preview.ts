import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

import { createSourceController } from "../src/host/sourceReader";

const sourceArgument = process.argv[2];
if (!sourceArgument)
  throw new Error("Usage: npm run preview:real -- <path-to-jsonl>");

const extensionRoot = resolve(import.meta.dirname, "..");
const source = resolve(sourceArgument);
const outputRoot = resolve(
  process.env.AGENT_MONITOR_PREVIEW_OUTPUT ??
    join(extensionRoot, ".preview-real"),
);
const temporaryRoot = await mkdtemp(join(tmpdir(), "agent-monitor-preview-"));
const previewPage = join(temporaryRoot, "index.html");
const stylesheet = pathToFileURL(join(extensionRoot, "media/styles.css")).href;
const webviewBundle = pathToFileURL(
  join(extensionRoot, "media/webview.js"),
).href;

await mkdir(outputRoot, { recursive: true });
await writeFile(
  previewPage,
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="${stylesheet}">
    <style>
      :root {
        color-scheme: dark;
        --vscode-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        --vscode-editor-font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
        --vscode-font-size: 13px;
        --vscode-foreground: #d4d4d4;
        --vscode-descriptionForeground: #a7a7a7;
        --vscode-editor-background: #181818;
        --vscode-editorWidget-background: #202124;
        --vscode-input-background: #242529;
        --vscode-input-foreground: #f1f1f1;
        --vscode-panel-border: #3a3a3a;
        --vscode-focusBorder: #4daafc;
      }
    </style>
    <script>window.acquireVsCodeApi = () => ({ postMessage: () => undefined });</script>
  </head>
  <body class="vscode-dark">
    <main id="app"></main>
    <script src="${webviewBundle}"></script>
  </body>
</html>`,
);

const controller = createSourceController();
await controller.selectSource(pathToFileURL(source));
const state = controller.getState();
controller.dispose();
if (state.reader !== "following")
  throw new Error(state.error ?? "The selected JSONL could not be parsed");

const browser = await chromium.launch({ headless: true });
try {
  for (const [size, width, height] of [
    ["wide", 1440, 940],
    ["narrow", 800, 900],
  ] as const) {
    for (const range of ["last24h", "all-runs"] as const) {
      const page = await browser.newPage({
        viewport: { width, height },
        colorScheme: "dark",
        reducedMotion: "reduce",
        deviceScaleFactor: 2,
      });
      await page.goto(pathToFileURL(previewPage).href);
      await page.evaluate((nextState) => {
        window.postMessage({
          type: "state",
          generation: 1,
          ...nextState,
        });
      }, state);
      await page.locator(".monitor-workspace").waitFor();
      if (range === "all-runs")
        await page.getByRole("button", { name: "All runs" }).click();
      await page.screenshot({
        path: join(outputRoot, `real-${size}-${range}.png`),
        animations: "disabled",
        fullPage: width < 960,
      });
      await page.close();
    }
  }
} finally {
  await browser.close();
  await rm(temporaryRoot, { recursive: true, force: true });
}

console.log(
  `Wrote four real-data previews for ${basename(source)} to ${outputRoot}`,
);
