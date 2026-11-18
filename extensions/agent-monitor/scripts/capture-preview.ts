import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

const extensionRoot = resolve(import.meta.dirname, "..");
const outputRoot = resolve(
  extensionRoot,
  "../../docs/specs/008-agent-monitor-ui",
);
const previewUrl = pathToFileURL(
  resolve(extensionRoot, "preview/index.html"),
).href;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [name, width] of [
    ["preview-wide.png", 1440],
    ["preview-narrow.png", 800],
  ] as const) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      colorScheme: "dark",
      reducedMotion: "reduce",
      deviceScaleFactor: 1,
    });
    await page.goto(previewUrl);
    const selectedAgent = page.locator(
      'button[data-node-id="wt-feature-008-reviewer"]',
    );
    await selectedAgent.waitFor();
    await selectedAgent.click();
    await page.screenshot({
      path: resolve(outputRoot, name),
      animations: "disabled",
    });
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(
  `Wrote previews to ${dirname(resolve(outputRoot, "preview-wide.png"))}`,
);
