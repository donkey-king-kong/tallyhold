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
      'button[data-node-id$="-test-writer-r2"]',
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
        navigatorBox.width >= 290 && navigatorBox.width <= 310,
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
      const resizer = page.locator(
        '[role="separator"][aria-label="Resize agent navigator"]',
      );
      requireLayout(
        (await resizer.count()) === 1 &&
          (await resizer.getAttribute("aria-valuemin")) === "240" &&
          (await resizer.getAttribute("aria-valuemax")) === "480" &&
          (await resizer.getAttribute("aria-valuenow")) === "300",
        `${name}: navigator lacks its bounded resize handle`,
      );
      await resizer.press("ArrowRight");
      const resizedNavigator = await page
        .locator(".monitor-navigator")
        .boundingBox();
      requireLayout(
        Boolean(resizedNavigator) &&
          resizedNavigator!.width > navigatorBox.width &&
          resizedNavigator!.width <= 480,
        `${name}: navigator does not resize from the keyboard`,
      );
      await resizer.press("ArrowLeft");
      const dragHandle = await resizer.boundingBox();
      if (!dragHandle)
        throw new Error(`${name}: navigator resize handle is not visible`);
      await page.mouse.move(
        dragHandle.x + dragHandle.width / 2,
        dragHandle.y + dragHandle.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(2_000, dragHandle.y + dragHandle.height / 2);
      await page.mouse.up();
      const maximumNavigator = await page
        .locator(".monitor-navigator")
        .boundingBox();
      requireLayout(
        Boolean(maximumNavigator) &&
          maximumNavigator!.width >= 479 &&
          maximumNavigator!.width <= 480 &&
          (await resizer.getAttribute("aria-valuenow")) === "480",
        `${name}: pointer resize does not clamp at 480px`,
      );
      const maximumHandle = await resizer.boundingBox();
      await page.mouse.move(
        maximumHandle!.x + maximumHandle!.width / 2,
        maximumHandle!.y + maximumHandle!.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        -2_000,
        maximumHandle!.y + maximumHandle!.height / 2,
      );
      await page.mouse.up();
      const minimumNavigator = await page
        .locator(".monitor-navigator")
        .boundingBox();
      requireLayout(
        Boolean(minimumNavigator) &&
          minimumNavigator!.width >= 240 &&
          minimumNavigator!.width <= 241 &&
          (await resizer.getAttribute("aria-valuenow")) === "240",
        `${name}: pointer resize does not clamp at 240px`,
      );
      const minimumHandle = await resizer.boundingBox();
      await page.mouse.move(
        minimumHandle!.x + minimumHandle!.width / 2,
        minimumHandle!.y + minimumHandle!.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        minimumHandle!.x + minimumHandle!.width / 2 + 60,
        minimumHandle!.y + minimumHandle!.height / 2,
      );
      await page.mouse.up();
      requireLayout(
        (await resizer.getAttribute("aria-valuenow")) === "300",
        `${name}: pointer resize cannot restore the 300px default`,
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
          box.x >= 0 && box.x + box.width <= width && box.y >= 0,
          `${name}: ${pane} is outside the document width`,
        );
      }
      requireLayout(
        navigatorBox.height >= 120 && canvasBox.height >= 240,
        `${name}: narrow navigator or canvas is unusably small`,
      );
      const narrowFlow = await page.evaluate(() => {
        const toolbarNote = document.querySelector<HTMLElement>(
          ".monitor-controls p",
        );
        const workspace =
          document.querySelector<HTMLElement>(".monitor-workspace");
        const inspector =
          document.querySelector<HTMLElement>(".monitor-inspector");
        const activity =
          document.querySelector<HTMLElement>(".monitor-history");
        const footer = document.querySelector<HTMLElement>(".monitor-footer");
        return {
          canvasHeight:
            document.querySelector(".monitor-graph")?.getBoundingClientRect()
              .height ?? 0,
          documentHeight: document.documentElement.scrollHeight,
          footerBottom:
            (footer?.getBoundingClientRect().bottom ?? 0) + window.scrollY,
          ordered:
            Boolean(toolbarNote && workspace && inspector && footer) &&
            toolbarNote!.getBoundingClientRect().bottom <=
              workspace!.getBoundingClientRect().top &&
            workspace!.getBoundingClientRect().bottom <=
              inspector!.getBoundingClientRect().bottom &&
            inspector!.getBoundingClientRect().bottom <=
              footer!.getBoundingClientRect().top,
          inspectorClips:
            Boolean(inspector) &&
            inspector!.scrollHeight > inspector!.clientHeight + 1,
          activityInsideInspector:
            Boolean(activity && inspector) &&
            activity!.getBoundingClientRect().bottom <=
              inspector!.getBoundingClientRect().bottom + 1,
          toolbarNoteVisible:
            Boolean(toolbarNote) &&
            getComputedStyle(toolbarNote!).display !== "none",
          workspaceClips:
            Boolean(workspace) &&
            ["hidden", "clip"].includes(getComputedStyle(workspace!).overflowY),
        };
      });
      requireLayout(
        narrowFlow.canvasHeight >= 480 && narrowFlow.canvasHeight <= 560,
        `${name}: narrow canvas is not a fixed readable block`,
      );
      requireLayout(
        narrowFlow.documentHeight > height &&
          Math.abs(narrowFlow.footerBottom - narrowFlow.documentHeight) <= 1 &&
          narrowFlow.ordered &&
          !narrowFlow.inspectorClips &&
          narrowFlow.activityInsideInspector &&
          narrowFlow.toolbarNoteVisible &&
          !narrowFlow.workspaceClips,
        `${name}: narrow content is clipped instead of using normal page flow`,
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
      overflow.laneCount === 4,
      `${name}: expected four visible lane headers`,
    );
    requireLayout(
      overflow.cardCount === 10,
      `${name}: expected orchestrator and nine visible agent cards`,
    );
    requireLayout(
      overflow.invalid === 0,
      `${name}: ${overflow.invalid} cards or rows overflow without local ellipsis`,
    );

    const visiblePopulation = await page.evaluate(() => ({
      navigatorRows: document.querySelectorAll(".navigator-identity-row")
        .length,
      navigatorGroups: document.querySelectorAll(".navigator-worktree").length,
      unassigned: document.querySelectorAll('[data-worktree="unassigned"]')
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
      visiblePopulation.navigatorRows === 9 &&
        visiblePopulation.navigatorGroups === 4 &&
        visiblePopulation.unassigned === 1,
      `${name}: navigator does not show the unassigned lane and nine current agents`,
    );
    requireLayout(
      visiblePopulation.bus === 1 && visiblePopulation.rails === 4,
      `${name}: graph lacks one connector bus and four lane rails`,
    );
    requireLayout(
      visiblePopulation.rootCards === 0,
      `${name}: structural worktree roots render as agent cards`,
    );
    const displayContract = await page.evaluate(() => {
      const rootIds = Array.from(
        document.querySelectorAll<SVGGElement>("[data-lane-header]"),
      ).map((header) => header.dataset.laneHeader ?? "");
      const visibleStatus = (selector: string) =>
        Array.from(document.querySelectorAll<HTMLElement>(selector)).map(
          (item) => {
            const bounds = item.getBoundingClientRect();
            const style = getComputedStyle(item);
            return {
              text: item.textContent?.trim() ?? "",
              visible:
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                bounds.width > 0 &&
                bounds.height > 0,
            };
          },
        );
      return {
        rootIds,
        laneSlugs: Array.from(
          document.querySelectorAll<HTMLElement>(
            "[data-lane-header] [data-worktree-slug]",
          ),
        ).map((item) => item.textContent?.trim() ?? ""),
        laneLabels: Array.from(
          document.querySelectorAll<HTMLElement>(
            "[data-lane-header] [data-lane-label]",
          ),
        ).map((item) => item.textContent?.trim().toLowerCase() ?? ""),
        navigatorSlugs: Array.from(
          document.querySelectorAll<HTMLElement>(
            ".navigator-worktree [data-worktree-slug]",
          ),
        ).map((item) => item.textContent?.trim() ?? ""),
        inspectorSlugs: Array.from(
          document.querySelectorAll<HTMLElement>(
            ".monitor-inspector [data-worktree-slug]",
          ),
        ).map((item) => item.textContent?.trim() ?? ""),
        slugHashes: document.querySelectorAll("[data-slug-hash]").length,
        cardStatuses: visibleStatus(".agent-status-word"),
        navigatorStatuses: visibleStatus(".navigator-agent-status"),
        olderLabel:
          document.querySelector(".older-runs-label")?.textContent ?? "",
        olderContext:
          document.querySelector(".older-runs-context")?.textContent ?? "",
        activityTimes: Array.from(
          document.querySelectorAll(".activity-time"),
        ).map((item) => item.textContent ?? ""),
        activityLabels: Array.from(
          document.querySelectorAll(".activity-label"),
        ).map((item) => item.textContent ?? ""),
      };
    });
    const expectedSlugs = [
      "chore-shared-ag-0736a7b0",
      "feature-007-tra-178e4f72",
      "main",
    ];
    requireLayout(
      JSON.stringify(displayContract.rootIds) ===
        JSON.stringify([
          "unassigned",
          ...expectedSlugs.map((slug) => `wt-${slug}`),
        ]) &&
        JSON.stringify(displayContract.laneSlugs) ===
          JSON.stringify(expectedSlugs) &&
        JSON.stringify(displayContract.navigatorSlugs) ===
          JSON.stringify(expectedSlugs) &&
        JSON.stringify(displayContract.inspectorSlugs) ===
          JSON.stringify([expectedSlugs[0]]) &&
        JSON.stringify(displayContract.laneLabels) ===
          JSON.stringify([
            "unassigned",
            "chore-shared-ag",
            "feature-007-tra",
            "main",
          ]) &&
        displayContract.slugHashes >= 5 &&
        [
          ...displayContract.laneSlugs,
          ...displayContract.navigatorSlugs,
          ...displayContract.inspectorSlugs,
        ].every((slug) => !slug.includes("/")),
      `${name}: preview does not use and render adapter-accurate hashed worktree slugs`,
    );
    const expectedStatuses = new Set([
      "Working",
      "Waiting",
      "Blocked",
      "Failed",
      "Completed",
      "Unknown status",
    ]);
    requireLayout(
      displayContract.cardStatuses.length === 10 &&
        displayContract.navigatorStatuses.length === 9 &&
        [
          ...displayContract.cardStatuses,
          ...displayContract.navigatorStatuses,
        ].every(
          (status) =>
            status.visible &&
            status.text.length > 0 &&
            expectedStatuses.has(status.text),
        ),
      `${name}: card or navigator status words are missing`,
    );
    requireLayout(
      /^Older runs · 19 agents$/.test(displayContract.olderLabel) &&
        displayContract.olderContext === "before today",
      `${name}: older-runs row copy or alignment hooks are missing`,
    );
    requireLayout(
      displayContract.activityTimes.every((value) => !value.endsWith(" · ")) &&
        displayContract.activityLabels.every(
          (value) => !/[·.]\s*$/.test(value),
        ),
      `${name}: activity rows retain trailing separators`,
    );

    const requireVisiblePopulation = async (
      selector: string,
      expected: number,
      label: string,
    ) => {
      const items = page.locator(selector);
      requireLayout(
        (await items.count()) === expected,
        `${name}: expected ${expected} ${label}`,
      );
      for (let index = 0; index < expected; index++) {
        const item = items.nth(index);
        const box = await item.boundingBox();
        requireLayout(
          (await item.isVisible()) &&
            Boolean(box) &&
            box!.width > 0 &&
            box!.height > 0,
          `${name}: ${label} ${index + 1} is hidden or has zero bounds`,
        );
      }
    };
    await requireVisiblePopulation("[data-lane-header]", 4, "lane headers");
    await requireVisiblePopulation("[data-node-card]", 10, "agent cards");
    await requireVisiblePopulation(
      ".navigator-identity-row",
      9,
      "navigator rows",
    );
    await requireVisiblePopulation(
      ".navigator-worktree",
      4,
      "navigator groups",
    );
    await requireVisiblePopulation("[data-connector-bus]", 1, "connector bus");
    await requireVisiblePopulation("[data-lane-rail]", 4, "lane rails");

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

    const laneGeometry = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<SVGGElement>("[data-lane-header]"),
      ).map((header) => {
        const rootId = header.dataset.laneHeader!;
        const headerRect = header
          .querySelector("rect")!
          .getBoundingClientRect();
        const cards = Array.from(
          document.querySelectorAll<SVGGElement>(
            '[data-node-card]:not([data-node-card="orchestrator"])',
          ),
        ).filter((card) => {
          const rect = card.querySelector("rect")!.getBoundingClientRect();
          return Math.abs(rect.x - headerRect.x) <= 1;
        });
        const contained = cards.every((card) => {
          const rect = card.querySelector("rect")!.getBoundingClientRect();
          return (
            Math.abs(rect.width - headerRect.width) <= 1 &&
            rect.x >= headerRect.x - 1 &&
            rect.right <= headerRect.right + 1
          );
        });
        return {
          cards: cards.length,
          contained,
          rails: document.querySelectorAll(`[data-lane-rail="${rootId}"]`)
            .length,
          railTags: Array.from(
            document.querySelectorAll(`[data-lane-rail="${rootId}"]`),
          ).map((rail) => rail.tagName.toLowerCase()),
          ticks: document.querySelectorAll(`[data-lane-tick="${rootId}"]`)
            .length,
        };
      }),
    );
    requireLayout(
      laneGeometry.every(
        (lane) =>
          lane.cards > 0 &&
          lane.contained &&
          lane.rails === 1 &&
          lane.railTags[0] === "path" &&
          lane.ticks === lane.cards,
      ),
      `${name}: each lane must have one rail, one tick per card, and fixed-width contained cards`,
    );
    requireLayout(
      (await page.locator("[data-orchestrator-drop]").count()) === 1 &&
        (await page.locator("[data-lane-drop]").count()) === 4,
      `${name}: orchestrator bus has duplicate or missing drops`,
    );

    const realDataGeometry = await page.evaluate(() => {
      const intersects = (left: DOMRect, right: DOMRect) =>
        Math.max(left.left, right.left) <
          Math.min(left.right, right.right) - 0.5 &&
        Math.max(left.top, right.top) <
          Math.min(left.bottom, right.bottom) - 0.5;
      const cards = Array.from(
        document.querySelectorAll<SVGGElement>("[data-node-card]"),
      );
      const cardRects = cards.map((card) =>
        card.querySelector("rect")!.getBoundingClientRect(),
      );
      const duplicateIdentities = Object.values(
        cards.reduce<Record<string, number>>((counts, card) => {
          const id = card.dataset.nodeCard ?? "";
          counts[id] = (counts[id] ?? 0) + 1;
          return counts;
        }, {}),
      ).some((count) => count !== 1);
      const textCollision = cards.some((card) => {
        const spans = Array.from(card.querySelectorAll("tspan")).filter(
          (span) => {
            const box = span.getBoundingClientRect();
            return box.width > 0 && box.height > 0;
          },
        );
        return spans.some((left, leftIndex) =>
          spans
            .slice(leftIndex + 1)
            .some((right) =>
              intersects(
                left.getBoundingClientRect(),
                right.getBoundingClientRect(),
              ),
            ),
        );
      });
      const cardCollision = cardRects.some((left, leftIndex) =>
        cardRects.slice(leftIndex + 1).some((right) => intersects(left, right)),
      );
      const pathIsOrthogonal = (path: SVGPathElement) => {
        const tokens =
          path.getAttribute("d")?.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)/g) ??
          [];
        let index = 0;
        let command = "";
        let x = 0;
        let y = 0;
        let subpathX = 0;
        let subpathY = 0;
        const coordinate = () => Number(tokens[index++]);
        while (index < tokens.length) {
          if (/^[a-zA-Z]$/.test(tokens[index])) command = tokens[index++];
          const relative = command === command.toLowerCase();
          switch (command.toUpperCase()) {
            case "M":
              x = coordinate() + (relative ? x : 0);
              y = coordinate() + (relative ? y : 0);
              subpathX = x;
              subpathY = y;
              command = relative ? "l" : "L";
              break;
            case "L": {
              const nextX = coordinate() + (relative ? x : 0);
              const nextY = coordinate() + (relative ? y : 0);
              if (nextX !== x && nextY !== y) return false;
              x = nextX;
              y = nextY;
              break;
            }
            case "H":
              x = coordinate() + (relative ? x : 0);
              break;
            case "V":
              y = coordinate() + (relative ? y : 0);
              break;
            case "Z":
              if (subpathX !== x && subpathY !== y) return false;
              x = subpathX;
              y = subpathY;
              command = "";
              break;
            default:
              return false;
          }
        }
        return true;
      };
      const diagonalConnector = Array.from(
        document.querySelectorAll<SVGGraphicsElement>(
          ".graph-edges line, .graph-edges path",
        ),
      ).some((segment) => {
        if (segment.tagName.toLowerCase() === "path")
          return !pathIsOrthogonal(segment as SVGPathElement);
        const line = segment as SVGLineElement;
        return (
          line.getAttribute("x1") !== line.getAttribute("x2") &&
          line.getAttribute("y1") !== line.getAttribute("y2")
        );
      });
      const laneHasHole = Array.from(
        document.querySelectorAll<SVGGElement>("[data-lane-header]"),
      ).some((header) => {
        const headerRect = header
          .querySelector("rect")!
          .getBoundingClientRect();
        const laneCards = cardRects
          .filter((card) => Math.abs(card.left - headerRect.left) <= 1)
          .sort((left, right) => left.top - right.top);
        if (!laneCards.length) return false;
        if (laneCards[0].top - headerRect.bottom > laneCards[0].height * 0.75)
          return true;
        return laneCards
          .slice(1)
          .some(
            (card, index) =>
              card.top - laneCards[index].bottom > card.height * 0.5,
          );
      });
      const navigator =
        document.querySelector<HTMLElement>(".monitor-navigator")!;
      return {
        duplicateIdentities,
        textCollision,
        cardCollision,
        diagonalConnector,
        laneHasHole,
        navigatorOverflows: navigator.scrollWidth > navigator.clientWidth + 1,
      };
    });
    requireLayout(
      Object.values(realDataGeometry).every((value) => value === false),
      `${name}: real-data geometry has duplicate cards, collisions, diagonal connectors, empty slots, or navigator overflow`,
    );
    const registrationIds = expectedSlugs.map((slug) => `wt-${slug}`);
    for (const rootId of registrationIds) {
      requireLayout(
        (await page.locator(`[data-node-card="${rootId}"]`).count()) === 0 &&
          (await page.locator(`[data-identity-id="${rootId}"]`).count()) === 0,
        `${name}: registration identity ${rootId} renders as an agent`,
      );
    }
    const repeatedRunDisplay = await page.evaluate(() => ({
      cards: document.querySelectorAll('[data-node-card$="-test-writer-r2"]')
        .length,
      cardBadge:
        document.querySelector(
          '[data-node-card$="-test-writer-r2"] .agent-run-badge',
        )?.textContent ?? "",
      navigatorBadge:
        document.querySelector(
          '[data-identity-id$="-test-writer-r2"] .navigator-run-badge',
        )?.textContent ?? "",
    }));
    requireLayout(
      repeatedRunDisplay.cards === 1 &&
        repeatedRunDisplay.cardBadge === "×5 runs" &&
        repeatedRunDisplay.navigatorBadge === "×5",
      `${name}: repeated identity does not collapse to one badged card and row`,
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
      '[data-node-card$="-test-writer-r2"].is-selected',
    );
    requireLayout(
      await selectedCard.isVisible(),
      `${name}: selected agent card is not visible`,
    );

    const copyButton = page.getByRole("button", { name: "Copy full ID" });
    if (width < 960) await copyButton.scrollIntoViewIfNeeded();
    const copy = await copyButton.boundingBox();
    if (
      !copy ||
      copy.x < 0 ||
      copy.y < 0 ||
      copy.x + copy.width > width ||
      copy.y + copy.height > height
    )
      throw new Error(`${name}: copy ID button is outside the viewport`);

    await page.evaluate(() => window.scrollTo(0, 0));
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
