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

const intersects = (
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
) =>
  Math.max(left.x, right.x) <
    Math.min(left.x + left.width, right.x + right.width) &&
  Math.max(left.y, right.y) <
    Math.min(left.y + left.height, right.y + right.height);

try {
  for (const [name, width, height] of [
    ["preview-wide.png", 1440, 940],
    ["preview-narrow.png", 800, 900],
  ] as const) {
    const page = await browser.newPage({
      viewport: { width, height },
      colorScheme: "dark",
      reducedMotion: "reduce",
      deviceScaleFactor: 2,
    });
    await page.goto(previewUrl);
    const selectedAgent = page.locator(
      'button[data-node-id="wt-chore-shared-agent-flow-stream-test-writer-r2"]',
    );
    await selectedAgent.waitFor();
    await selectedAgent.click();

    const paneBoxes = await Promise.all(
      [".monitor-navigator", ".monitor-graph", ".monitor-inspector"].map(
        async (selector) => {
          const box = await page.locator(selector).boundingBox();
          if (!box)
            throw new Error(`${name}: missing visible pane ${selector}`);
          return box;
        },
      ),
    );
    for (let left = 0; left < paneBoxes.length; left++)
      for (let right = left + 1; right < paneBoxes.length; right++)
        if (intersects(paneBoxes[left], paneBoxes[right]))
          throw new Error(`${name}: workspace panes intersect`);

    const overflow = await page
      .locator("[data-lane-header], [data-node-card], .navigator-identity-row")
      .evaluateAll((items) => {
        const laneCount = items.filter((item) =>
          item.hasAttribute("data-lane-header"),
        ).length;
        const cardCount = items.filter((item) =>
          item.hasAttribute("data-node-card"),
        ).length;
        const invalid = items.filter((item) => {
          const element = item as HTMLElement;
          if (element.scrollWidth <= element.clientWidth) return false;
          const candidates = [element, ...element.querySelectorAll("*")];
          return !candidates.some(
            (candidate) =>
              getComputedStyle(candidate).textOverflow === "ellipsis",
          );
        });
        return { laneCount, cardCount, invalid: invalid.length };
      });
    if (!overflow.laneCount || !overflow.cardCount)
      throw new Error(`${name}: expected lane headers and agent cards`);
    if (overflow.invalid)
      throw new Error(`${name}: ${overflow.invalid} cards or rows overflow`);

    const selectedCard = page.locator(
      '[data-node-card="wt-chore-shared-agent-flow-stream-test-writer-r2"].is-selected',
    );
    if (!(await selectedCard.isVisible()))
      throw new Error(`${name}: selected agent card is not visible`);

    const copy = await page
      .getByRole("button", { name: "Copy full ID" })
      .boundingBox();
    if (
      !copy ||
      copy.x < 0 ||
      copy.y < 0 ||
      copy.x + copy.width > width ||
      copy.y + copy.height > height
    )
      throw new Error(`${name}: copy ID button is outside the viewport`);

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
