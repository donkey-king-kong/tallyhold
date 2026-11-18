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

const requireLayout = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

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

    const [navigatorBox, canvasBox, inspectorBox] = await Promise.all(
      [".monitor-navigator", ".monitor-graph", ".monitor-inspector"].map(
        async (selector) => {
          const box = await page.locator(selector).boundingBox();
          if (!box)
            throw new Error(`${name}: missing visible pane ${selector}`);
          return box;
        },
      ),
    );
    const paneBoxes = [navigatorBox, canvasBox, inspectorBox];
    for (let left = 0; left < paneBoxes.length; left++) {
      for (let right = left + 1; right < paneBoxes.length; right++) {
        if (intersects(paneBoxes[left], paneBoxes[right])) {
          throw new Error(`${name}: workspace panes intersect`);
        }
      }
    }

    if (width === 1440) {
      requireLayout(
        navigatorBox.x < canvasBox.x && canvasBox.x < inspectorBox.x,
        `${name}: panes are not navigator, canvas, inspector columns`,
      );
      requireLayout(
        navigatorBox.width >= 240 && navigatorBox.width <= 300,
        `${name}: navigator width is outside the target band`,
      );
      requireLayout(
        inspectorBox.width >= 330 && inspectorBox.width <= 390,
        `${name}: inspector width is outside the target band`,
      );
      requireLayout(
        canvasBox.width >= 700 && canvasBox.height >= 700,
        `${name}: canvas does not retain the primary workspace area`,
      );
    } else {
      requireLayout(
        navigatorBox.y < canvasBox.y && canvasBox.y < inspectorBox.y,
        `${name}: narrow panes are not stacked in task order`,
      );
      for (const [pane, box] of [
        ["navigator", navigatorBox],
        ["canvas", canvasBox],
        ["inspector", inspectorBox],
      ] as const) {
        requireLayout(
          box.width >= width - 32,
          `${name}: ${pane} is not a full-width narrow section`,
        );
        requireLayout(
          box.y >= 0 && box.y + box.height <= height,
          `${name}: ${pane} is outside the viewport`,
        );
      }
      requireLayout(
        navigatorBox.height >= 120 && canvasBox.height >= 240,
        `${name}: narrow navigator or canvas is unusably small`,
      );
    }

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
          const style = getComputedStyle(element);
          return !(
            style.textOverflow === "ellipsis" &&
            ["hidden", "clip"].includes(style.overflowX) &&
            style.whiteSpace === "nowrap"
          );
        });
        return { laneCount, cardCount, invalid: invalid.length };
      });
    requireLayout(
      overflow.laneCount === 3,
      `${name}: expected three visible lane headers`,
    );
    requireLayout(
      overflow.cardCount === 8,
      `${name}: expected orchestrator and seven visible agent cards`,
    );
    requireLayout(
      overflow.invalid === 0,
      `${name}: ${overflow.invalid} cards or rows overflow without local ellipsis`,
    );

    const visiblePopulation = await page.evaluate(() => ({
      navigatorRows: document.querySelectorAll(".navigator-identity-row")
        .length,
      navigatorGroups: document.querySelectorAll(".navigator-worktree").length,
      ungrouped: document.querySelectorAll('[data-worktree="ungrouped"]')
        .length,
      bus: document.querySelectorAll("[data-connector-bus]").length,
      rails: document.querySelectorAll("[data-lane-rail]").length,
      rootCards: document.querySelectorAll(
        [
          '[data-node-card="wt-chore-shared-agent-flow-stream"]',
          '[data-node-card="wt-feature-007-transactions"]',
          '[data-node-card="wt-main"]',
        ].join(","),
      ).length,
    }));
    requireLayout(
      visiblePopulation.navigatorRows === 7 &&
        visiblePopulation.navigatorGroups === 3 &&
        visiblePopulation.ungrouped === 0,
      `${name}: navigator does not show three worktrees and seven current agents`,
    );
    requireLayout(
      visiblePopulation.bus === 1 && visiblePopulation.rails === 3,
      `${name}: graph lacks one connector bus and three lane rails`,
    );
    requireLayout(
      visiblePopulation.rootCards === 0,
      `${name}: structural worktree roots render as agent cards`,
    );

    const laneBoxes = await page
      .locator("[data-lane-header]")
      .evaluateAll((items) =>
        items.map((item) => {
          const box = item.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        }),
      );
    requireLayout(
      laneBoxes.every(
        (box) =>
          Math.abs(box.y - laneBoxes[0].y) <= 2 &&
          Math.abs(box.width - laneBoxes[0].width) <= 2 &&
          box.width >= 190 &&
          box.width <= 280,
      ),
      `${name}: lane headers do not share a fixed aligned width`,
    );

    const orchestratorBox = await page
      .locator('[data-node-card="orchestrator"]')
      .boundingBox();
    requireLayout(
      Boolean(orchestratorBox) &&
        Math.abs(
          orchestratorBox!.x +
            orchestratorBox!.width / 2 -
            (canvasBox.x + canvasBox.width / 2),
        ) <= 80,
      `${name}: orchestrator is not centered above the lanes`,
    );

    requireLayout(
      (await page.locator(".range-control").count()) === 1 &&
        (await page.locator(".zoom-control").count()) === 1,
      `${name}: segmented range or grouped zoom control is missing`,
    );

    const selectedCard = page.locator(
      '[data-node-card="wt-chore-shared-agent-flow-stream-test-writer-r2"].is-selected',
    );
    requireLayout(
      await selectedCard.isVisible(),
      `${name}: selected agent card is not visible`,
    );

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
