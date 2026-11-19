// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  getAllByRole,
  getByRole,
  getByText,
  queryByText,
  within,
} from "@testing-library/dom";
import { readFileSync } from "node:fs";
import {
  mountSynthetic,
  SESSION_START,
  syntheticNode,
  syntheticView,
  twoLanes,
} from "./ui-fixtures";

let dispose: (() => void) | undefined;
let restoreBBox: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  restoreBBox?.();
  restoreBBox = undefined;
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function view(
  nodes: Array<Record<string, unknown>>,
  edges: Array<Record<string, unknown>> = [],
  diagnostics: Array<Record<string, unknown>> = [],
) {
  return {
    path: "/worktree/.agent-flow/agent-flow-events.jsonl",
    sessionId: "s1",
    sourceGeneration: 1,
    reader: "following",
    diagnostics,
    companions: [],
    projection: { nodes, edges, diagnostics },
  };
}

function node(id: string, status: string) {
  return {
    id,
    task: id === "done" ? "Finished review" : "Coordinate",
    status,
    relationship: "root",
    position: { x: 0, y: id === "done" ? 0 : 120 },
    terminal: status === "completed" || status === "failed",
    activities: [
      { type: "agent_spawn", time: 0, summary: "<img src=x onerror=alert(1)>" },
      { type: "agent_complete", time: 1, summary: "Review finished" },
    ],
    intervals: [{ start: 0, end: status === "completed" ? 1 : null }],
    lastUpdateAge: null,
  };
}

async function mount(
  nodes = [node("done", "completed"), node("active", "working")],
) {
  const root = document.createElement("main");
  document.body.append(root);
  const modulePath = ["../src/webview", "main"].join("/");
  const { mountMonitor } = await import(/* @vite-ignore */ modulePath);
  const app = mountMonitor(root, view(nodes));
  dispose = () => app.dispose();
  return { root, app };
}

describe("editor webview controls (AC3-5, AC7-8, AC12, AC14-15)", () => {
  it("shows every node and a reachable Fit All, then explicitly filters last-reported nonterminal", async () => {
    const { root } = await mount();
    expect(getByRole(root, "button", { name: /fit all/i })).toBeTruthy();
    expect(
      getAllByRole(root, "button", { name: /done/i }).length,
    ).toBeGreaterThan(0);
    expect(getByRole(root, "button", { name: /active/i })).toBeTruthy();
    fireEvent.click(
      getByRole(root, "checkbox", { name: /last reported nonterminal/i }),
    );
    expect(queryByText(root, "Finished review")).toBeNull();
    fireEvent.click(
      getByRole(root, "checkbox", { name: /last reported nonterminal/i }),
    );
    expect(
      getAllByRole(root, "button", { name: /done/i }).length,
    ).toBeGreaterThan(0);
  });

  it("selects a completed node by keyboard and retains chronological inspector history", async () => {
    const { root } = await mount();
    const target = getAllByRole(root, "button", { name: /done/i })[0];
    target.focus();
    fireEvent.keyDown(target, { key: "Enter" });
    expect(getByText(root, "Finished review")).toBeTruthy();
    expect(getByText(root, /unavailable/i)).toBeTruthy();
    const history = getByRole(root, "region", { name: /activity history/i });
    expect(within(history).getByText(/review finished/i)).toBeTruthy();
    expect(history.textContent).toContain("agent_spawn");
    expect(history.textContent?.indexOf("agent_spawn")).toBeLessThan(
      history.textContent!.indexOf("Review finished"),
    );
    expect(root.textContent).toMatch(/completed/i);
    expect(getByRole(root, "button", { name: /fit all/i })).toBeTruthy();
  });

  it("renders hostile telemetry as text and marks stale source separately from agent status", async () => {
    const { root, app } = await mount();
    app.update({
      ...view([node("done", "completed")]),
      reader: "stale",
      error: "Selected file is temporarily unreadable",
    });
    expect(getByText(root, /temporarily unreadable/i)).toBeTruthy();
    fireEvent.click(getAllByRole(root, "button", { name: /done/i })[0]);
    expect(root.textContent).toContain("<img src=x onerror=alert(1)>");
    expect(root.querySelector("img")).toBeNull();
    expect(root.textContent).toMatch(/completed/i);
  });

  it("offers keyboard-operated zoom and pan without losing the selected inspector on update", async () => {
    const { root, app } = await mount();
    fireEvent.click(getAllByRole(root, "button", { name: /done/i })[0]);
    const graph = root.querySelector("svg");
    expect(graph).not.toBeNull();
    const initialCamera = graph!.outerHTML;
    fireEvent.click(getByRole(root, "button", { name: /zoom in/i }));
    expect(graph!.outerHTML).not.toBe(initialCamera);
    const zoomed = graph!.outerHTML;
    fireEvent.click(getByRole(root, "button", { name: /pan right/i }));
    expect(graph!.outerHTML).not.toBe(zoomed);
    const horizontal = graph!.outerHTML;
    fireEvent.click(getByRole(root, "button", { name: /pan down/i }));
    expect(graph!.outerHTML).not.toBe(horizontal);
    fireEvent.click(getByRole(root, "button", { name: /fit all/i }));
    expect(graph!.outerHTML).toBe(initialCamera);
    for (const name of [
      /zoom in/i,
      /zoom out/i,
      /pan left/i,
      /pan right/i,
      /pan up/i,
      /pan down/i,
      /fit all/i,
    ]) {
      const control = getByRole(root, "button", { name });
      control.focus();
      fireEvent.keyDown(control, { key: "Enter" });
      expect(document.activeElement).toBe(control);
    }
    app.update(
      view([
        node("done", "completed"),
        node("active", "working"),
        node("new", "starting"),
      ]),
    );
    expect(getByText(root, "Finished review")).toBeTruthy();
    expect(getByRole(root, "button", { name: /new/i })).toBeTruthy();
  });

  it("explains the filter and reveals a selected terminal node without discarding history", async () => {
    const { root } = await mount();
    const selected = getAllByRole(root, "button", { name: /done/i })[0];
    selected.focus();
    fireEvent.click(selected);
    fireEvent.click(
      getByRole(root, "checkbox", { name: /last reported nonterminal/i }),
    );
    expect(root.textContent).toMatch(
      /last reported.*not.*live|does not.*liveness/i,
    );
    const reveal = getByRole(root, "button", { name: /reveal.*done/i });
    expect(document.activeElement).toBe(reveal);
    fireEvent.click(reveal);
    expect(
      getAllByRole(root, "button", { name: /done/i }).length,
    ).toBeGreaterThan(0);
    expect(
      getByRole(root, "region", { name: /activity history/i }).textContent,
    ).toContain("Review finished");
  });

  it("offers a searchable keyboard navigator and updates age while the stream is quiet", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-11-14T22:13:30Z"));
    const { root } = await mount([
      { ...node("reviewer", "working"), lastUpdateAge: 2 },
      node("other", "completed"),
    ]);
    const search = getByRole(root, "textbox", { name: /find agent/i });
    fireEvent.input(search, { target: { value: "reviewer" } });
    const navigator = getByRole(root, "navigation", {
      name: /agent navigator/i,
    });
    expect(
      within(navigator).getByRole("button", { name: /reviewer/i }),
    ).toBeTruthy();
    expect(
      within(navigator).queryByRole("button", { name: /other/i }),
    ).toBeNull();
    expect(root.textContent).toMatch(/2(?:s| seconds)/i);
    vi.advanceTimersByTime(2_000);
    expect(root.textContent).toMatch(/4(?:s| seconds)/i);
    expect(root.textContent).not.toMatch(/verified live/i);
  });

  it("preserves the camera after append and filtering, with Fit All including terminal and unresolved overflow", async () => {
    const far = {
      ...node("unresolved", "failed"),
      relationship: "unresolved",
      position: { x: 4_000, y: -3_000 },
    };
    const { root, app } = await mount([node("done", "completed"), far]);
    const camera = () => root.querySelector("svg")?.getAttribute("viewBox");
    const initial = camera()!.split(/[ ,]+/).map(Number);
    expect(initial).toHaveLength(4);
    expect(initial[0]).toBeLessThanOrEqual(0);
    expect(initial[1]).toBeLessThanOrEqual(-3_000);
    expect(initial[0] + initial[2]).toBeGreaterThanOrEqual(4_000);
    expect(initial[1] + initial[3]).toBeGreaterThanOrEqual(0);
    fireEvent.click(getByRole(root, "button", { name: /zoom in/i }));
    fireEvent.click(getByRole(root, "button", { name: /pan right/i }));
    const moved = camera();
    app.update(
      view([
        node("done", "completed"),
        far,
        {
          ...node("new", "starting"),
          position: { x: 8_000, y: 0 },
        },
      ]),
    );
    expect(camera()).toBe(moved);
    expect(
      getByRole(root, "navigation", { name: /agent navigator/i }).textContent,
    ).toContain("unresolved");
    fireEvent.click(
      getByRole(root, "checkbox", { name: /last reported nonterminal/i }),
    );
    expect(camera()).toBe(moved);
    fireEvent.click(getByRole(root, "button", { name: /fit all/i }));
    const fitted = camera()!.split(/[ ,]+/).map(Number);
    expect(fitted[0] + fitted[2]).toBeGreaterThanOrEqual(8_000);
    expect(
      getByRole(root, "navigation", { name: /agent navigator/i }).textContent,
    ).not.toContain("unresolved");
  });

  it("fits the first projection and each new source generation", async () => {
    const root = document.createElement("main");
    document.body.append(root);
    const modulePath = ["../src/webview", "main"].join("/");
    const { mountMonitor } = await import(/* @vite-ignore */ modulePath);
    const app = mountMonitor(root, {
      ...view([]),
      sourceGeneration: 0,
      path: null,
      sessionId: null,
      reader: "idle",
    });
    dispose = () => app.dispose();
    const camera = () => root.querySelector("svg")?.getAttribute("viewBox");
    const first = {
      ...node("first", "working"),
      position: { x: 4_000, y: 3_000 },
    };
    app.update(view([first]));
    expect(camera()).toBe("0 0 4180 3060");

    fireEvent.click(getByRole(root, "button", { name: /zoom in/i }));
    fireEvent.click(getByRole(root, "button", { name: /pan down/i }));
    const moved = camera();
    app.update(view([first, node("append", "working")]));
    expect(camera()).toBe(moved);

    const second = {
      ...node("second", "working"),
      position: { x: 8_000, y: 6_000 },
    };
    app.update({ ...view([second]), sourceGeneration: 2 });
    expect(camera()).toBe("0 0 8180 6060");
  });

  it("labels a failed tool without mislabelling a completed agent as failed", async () => {
    const reviewed = {
      ...node("done", "completed"),
      identityKind: "unspecified",
      lastUpdateAge: 3,
      activities: [
        { type: "agent_spawn", time: 0, summary: "Review started" },
        {
          type: "tool_call_end",
          time: 1,
          summary: "Read first file",
          outcome: "succeeded",
          pairing: "unmatched",
        },
        {
          type: "tool_call_end",
          time: 2,
          summary: "Read second file",
          outcome: "failed",
          pairing: "unmatched",
        },
        { type: "agent_complete", time: 3, summary: "Review finished" },
      ],
    };
    const { root } = await mount([reviewed]);
    fireEvent.click(getAllByRole(root, "button", { name: /done/i })[0]);
    const history = getByRole(root, "region", { name: /activity history/i });
    expect(history.textContent).toMatch(
      /read first file[\s\S]*succeed(?:ed)?[\s\S]*read second file[\s\S]*fail(?:ed)?/i,
    );
    expect(history.textContent).toMatch(/unmatched/i);
    expect(history.textContent).toMatch(/review finished/i);
    const details = getByRole(root, "region", { name: /agent details/i });
    expect(details.textContent).toMatch(/completed/i);
    expect(details.textContent).toMatch(/unspecified/i);
    expect(details.textContent).toMatch(/3(?:s| seconds)/i);
    expect(details.textContent).not.toMatch(/agent failed/i);
  });

  it("shows reported relative time and only verified absolute activity time", async () => {
    const timed = {
      ...node("timed", "working"),
      activities: [
        {
          type: "message",
          time: 12.5,
          absoluteTime: null,
          summary: "Relative only",
        },
        {
          type: "message",
          time: 14,
          absoluteTime: "2023-11-14T22:13:34.000Z",
          summary: "Anchored",
        },
      ],
    };
    const { root } = await mount([timed]);
    fireEvent.click(getByRole(root, "button", { name: /timed/i }));
    const history = getByRole(root, "region", { name: /activity history/i });
    expect(history.textContent).toContain("Reported +12.5s");
    expect(history.textContent).toContain("Reported +14s");
    expect(history.textContent).toContain("2023-11-14T22:13:34.000Z");
    expect(history.textContent).not.toMatch(/relative only.*1970/i);
  });

  it("renders accepted heartbeat observations as provisional companions", async () => {
    const { root, app } = await mount();
    app.update({
      ...view([node("active", "working")]),
      companions: [
        {
          agentId: "reviewer",
          parentId: "orchestrator",
          status: "working",
          activity: "Reviewing",
          updatedAt: "2023-11-14T22:13:34.000Z",
          source: "heartbeat",
          certainty: "provisional",
        },
      ],
    });
    const companions = getByRole(root, "region", {
      name: /provisional companion observations/i,
    });
    expect(companions.textContent).toMatch(
      /reviewer.*working.*reviewing.*provisional/i,
    );
    expect(companions.textContent).toContain("2023-11-14T22:13:34.000Z");
  });

  it("keeps unknown age and uncertain relationships readable across editor themes", async () => {
    const uncertain = {
      ...node("orphan", "failed"),
      relationship: "unresolved",
      lastUpdateAge: null,
    };
    const { root } = await mount([uncertain]);
    for (const theme of [
      "vscode-light",
      "vscode-dark",
      "vscode-high-contrast",
    ]) {
      document.body.className = theme;
      const navigator = getByRole(root, "navigation", {
        name: /agent navigator/i,
      });
      const target = within(navigator).getByRole("button", { name: /orphan/i });
      fireEvent.click(target);
      expect(root.textContent).toMatch(/unresolved/i);
      expect(root.textContent).toMatch(/failed/i);
      expect(
        getByRole(root, "region", { name: /agent details/i }).textContent,
      ).toMatch(/unavailable/i);
    }
  });

  it("shows failed completed history immediately without playback, even at narrow reduced-motion size", async () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      addListener: () => {},
      removeListener: () => {},
    }));
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 320,
    });
    const failed = {
      ...node("failed-review", "failed"),
      task: "Check release",
    };
    const { root } = await mount([failed]);
    fireEvent(window, new Event("resize"));
    expect(getByRole(root, "button", { name: /fit all/i })).toBeTruthy();
    expect(
      getByRole(root, "navigation", { name: /agent navigator/i }).textContent,
    ).toContain("failed-review");
    fireEvent.click(
      getAllByRole(root, "button", { name: /failed-review/i })[0],
    );
    expect(
      getByRole(root, "region", { name: /activity history/i }).textContent,
    ).toContain("Review finished");
    expect(
      getByRole(root, "region", { name: /agent details/i }).textContent,
    ).toMatch(/failed/i);
    expect(root.querySelector("animate, animateMotion")).toBeNull();
  });

  it("shows an actionable initial read error without presenting an empty successful connection", async () => {
    const { root, app } = await mount();
    app.update({
      ...view([]),
      reader: "error",
      error: "Selected file cannot be read",
      sessionId: null,
    });
    expect(root.textContent).toMatch(/selected file cannot be read/i);
    expect(root.textContent).toMatch(/choose|select|retry|reopen/i);
    expect(root.textContent).not.toMatch(/connected|following/i);
    expect(root.textContent).toContain(
      "/worktree/.agent-flow/agent-flow-events.jsonl",
    );
  });

  it("preserves keyboard access to controls and history on a narrow panel after filtering", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 320,
    });
    const { root, app } = await mount();
    fireEvent(window, new Event("resize"));
    const navigator = getByRole(root, "navigation", {
      name: /agent navigator/i,
    });
    const target = within(navigator).getByRole("button", { name: /done/i });
    target.focus();
    fireEvent.keyDown(target, { key: "Enter" });
    expect(
      getByRole(root, "region", { name: /agent details/i }).textContent,
    ).toContain("Finished review");
    fireEvent.click(
      getByRole(root, "checkbox", { name: /last reported nonterminal/i }),
    );
    const reveal = getByRole(root, "button", { name: /reveal.*done/i });
    expect(document.activeElement).toBe(reveal);
    fireEvent.click(reveal);
    expect(
      getByRole(root, "region", { name: /activity history/i }).textContent,
    ).toContain("Review finished");
    const fit = getByRole(root, "button", { name: /fit all/i });
    fit.focus();
    fireEvent.keyDown(fit, { key: "Enter" });
    expect(document.activeElement).toBe(fit);
    app.update(view([node("done", "completed"), node("active", "working")]));
    expect(
      getByRole(root, "region", { name: /activity history/i }).textContent,
    ).toContain("Review finished");
  });

  it("labels an incomplete execution and locally observed age without inventing wall time", async () => {
    const uncertain = {
      ...node("reviewer", "working"),
      intervals: [{ start: null, end: null, certainty: "incomplete" }],
      lastUpdateAge: null,
      observedLocalAge: 3,
      activities: [
        {
          type: "tool_call_end",
          time: 4,
          summary: "Read file",
          pairing: "ambiguous",
        },
      ],
    };
    const { root } = await mount([uncertain]);
    fireEvent.click(getAllByRole(root, "button", { name: /reviewer/i })[0]);
    const details = getByRole(root, "region", { name: /agent details/i });
    const history = getByRole(root, "region", { name: /activity history/i });
    expect(details.textContent).toMatch(/incomplete|ambiguous/i);
    expect(details.textContent).toMatch(/observed locally.*3(?:s| seconds)/i);
    expect(details.textContent).not.toMatch(/last report.*3(?:s| seconds)/i);
    expect(history.textContent).toMatch(/ambiguous/i);
  });

  it("draws parent-child edges with valid SVG labels and exposes diagnostics", async () => {
    const parent = { ...node("parent", "working"), position: { x: 0, y: 0 } };
    const child = {
      ...node("child", "working"),
      parentId: "parent",
      relationship: "resolved",
      position: { x: 240, y: 120 },
    };
    const { root } = await mount();
    const modulePath = ["../src/webview", "main"].join("/");
    const { mountMonitor } = await import(/* @vite-ignore */ modulePath);
    dispose?.();
    root.replaceChildren();
    const app = mountMonitor(
      root,
      view(
        [parent, child],
        [{ parentId: "parent", childId: "child" }],
        [{ code: "session_mismatch", line: 3, byteOffset: 42 }],
      ),
    );
    dispose = () => app.dispose();
    expect(root.querySelectorAll("svg line[data-edge]")).toHaveLength(1);
    expect(root.querySelectorAll("svg g[data-node-id] text")).toHaveLength(2);
    expect(root.querySelector("foreignObject")).toBeNull();
    expect(
      getByRole(root, "region", { name: /diagnostics/i }).textContent,
    ).toMatch(/session_mismatch.*line 3.*byte 42/i);
  });

  it("filters on the reported terminal boundary instead of status spelling", async () => {
    const resolved = {
      ...node("resolved", "working"),
      status: "resolved",
      terminal: true,
    };
    const { root } = await mount([resolved, node("active", "working")]);
    fireEvent.click(
      getByRole(root, "checkbox", { name: /last reported nonterminal/i }),
    );
    const graph = getByRole(root, "img", { name: /agent graph/i });
    expect(graph.textContent).not.toContain("resolved");
    expect(graph.textContent).toContain("active");
  });

  it("bounds graph DOM nodes and pages long activity history without dropping it", async () => {
    const many = Array.from({ length: 600 }, (_, index) => ({
      ...node(`agent-${index}`, "working"),
      position: { x: (index % 20) * 240, y: Math.floor(index / 20) * 120 },
    }));
    many[0].activities = Array.from({ length: 205 }, (_, index) => ({
      type: "message",
      time: index,
      summary: `activity-${index}`,
    }));
    const { root } = await mount(many);
    expect(
      root.querySelectorAll("svg g[data-node-id]").length,
    ).toBeLessThanOrEqual(500);
    fireEvent.click(getByRole(root, "button", { name: /agent-0 working/i }));
    const history = getByRole(root, "region", { name: /activity history/i });
    expect(history.textContent).toContain("activity-0");
    expect(history.textContent).not.toContain("activity-204");
    fireEvent.click(getByRole(root, "button", { name: /last activity page/i }));
    expect(
      getByRole(root, "region", { name: /activity history/i }).textContent,
    ).toContain("activity-204");
  });

  it("fits complete node extents and filters the graph and navigator consistently", async () => {
    const far = {
      ...node("far", "working"),
      position: { x: 1_000, y: 700 },
    };
    const { root } = await mount([node("done", "completed"), far]);
    const [x, y, width, height] = root
      .querySelector("svg")!
      .getAttribute("viewBox")!
      .split(/\s+/)
      .map(Number);
    expect(x + width).toBeGreaterThanOrEqual(1_180);
    expect(y + height).toBeGreaterThanOrEqual(760);

    fireEvent.click(
      getByRole(root, "checkbox", { name: /last reported nonterminal/i }),
    );
    const navigator = getByRole(root, "navigation", {
      name: /agent navigator/i,
    });
    expect(navigator.textContent).not.toContain("done");
    expect(navigator.textContent).toContain("far");
  });

  it("prevents duplicate native keyboard activation and preserves focused controls", async () => {
    const { root, app } = await mount();
    const zoom = getByRole(root, "button", { name: /zoom in/i });
    const key = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    zoom.dispatchEvent(key);
    expect(key.defaultPrevented).toBe(true);

    const search = getByRole(root, "textbox", { name: /find agent/i });
    search.focus();
    fireEvent.input(search, { target: { value: "active" } });
    expect(document.activeElement).toBe(
      getByRole(root, "textbox", { name: /find agent/i }),
    );

    const fit = getByRole(root, "button", { name: /fit all/i });
    fit.focus();
    app.update(view([node("done", "completed"), node("active", "working")]));
    expect(document.activeElement).toBe(
      getByRole(root, "button", { name: /fit all/i }),
    );
  });
});

function mount008(
  nodes: Array<Record<string, unknown>>,
  edges: Array<{ parentId: string; childId: string }> = [],
  extras: Record<string, unknown> = {},
) {
  const result = mountSynthetic(nodes, edges, extras);
  dispose = () => result.app.dispose();
  return result;
}

function graphNode(root: HTMLElement, id: string) {
  return root.querySelector<SVGGElement>(`svg g[data-node-id="${id}"]`)!;
}

describe("Feature 008 Agent Monitor DOM acceptance", () => {
  it("applies the bundled stylesheet to the workspace without inline layout", () => {
    const { root } = mount008(twoLanes().nodes, twoLanes().edges);
    const stylesheet = document.createElement("style");
    stylesheet.textContent = readFileSync("media/styles.css", "utf8");
    document.head.append(stylesheet);
    try {
      expect(stylesheet.sheet?.cssRules.length).toBeGreaterThan(0);
      const workspace = getByRole(root, "region", {
        name: /monitor workspace/i,
      });
      expect(getComputedStyle(workspace).display).toBe("grid");
      expect(getComputedStyle(workspace).gridTemplateColumns).toContain(
        "minmax(0, 1fr)",
      );
      expect(
        getComputedStyle(getByRole(root, "button", { name: /fit all/i }))
          .minHeight,
      ).toBe("30px");
      expect(root.querySelector("[style]")).toBeNull();
    } finally {
      stylesheet.remove();
    }
  });

  it("header shows source session following age and stale recovery", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-11-14T22:13:32.000Z"));
    const { root, app } = mount008([syntheticNode("orchestrator")]);
    const header = root.querySelector("header")!;
    expect(header.textContent).toContain(
      "/synthetic/.agent-flow/agent-flow-events.jsonl",
    );
    expect(header.textContent).toContain("synthetic-session");
    expect(header.textContent).toMatch(/Following.*last event 12s ago/i);
    expect(
      within(header).getByRole("button", { name: /choose source/i }),
    ).toBeTruthy();
    app.update({
      ...syntheticView([syntheticNode("orchestrator")]),
      reader: "stale",
      error: "Selected file unavailable",
    });
    expect(root.querySelector("header")?.textContent).toMatch(
      /stale.*unavailable/i,
    );
    expect(root.querySelector('g[data-node-id="orchestrator"]')).not.toBeNull();
    app.update({
      ...syntheticView([syntheticNode("orchestrator")], [], {
        projection: {
          nodes: [syntheticNode("orchestrator")],
          edges: [],
          diagnostics: [],
          lastEventAbsoluteTime: null,
        },
      }),
      reader: "incomplete",
    });
    expect(root.querySelector("header")?.textContent).toMatch(
      /incomplete.*last event time unavailable/i,
    );
    expect(root.querySelector('g[data-node-id="orchestrator"]')).not.toBeNull();
    app.update(syntheticView([syntheticNode("orchestrator")]));
    expect(root.querySelector("header")?.textContent).toMatch(
      /Following.*last event 12s ago/i,
    );
  });

  it("toolbar toggles range and last reported active without liveness claim", () => {
    const { root } = mount008([
      syntheticNode("finished", { status: "completed", terminal: true }),
      syntheticNode("errored", { status: "failed", terminal: true }),
      syntheticNode("working"),
    ]);
    const toolbar = getByRole(root, "region", { name: /monitor toolbar/i });
    expect(
      within(toolbar).getByRole("button", { name: /last 24 hours/i }),
    ).toBeTruthy();
    fireEvent.click(within(toolbar).getByRole("button", { name: /all runs/i }));
    fireEvent.click(
      within(toolbar).getByRole("checkbox", {
        name: /only last reported active/i,
      }),
    );
    expect(
      getByRole(root, "img", { name: /agent graph/i }).textContent,
    ).not.toContain("finished");
    expect(
      getByRole(root, "img", { name: /agent graph/i }).textContent,
    ).not.toContain("errored");
    expect(
      getByRole(root, "img", { name: /agent graph/i }).textContent,
    ).toContain("working");
    expect(toolbar.textContent).toMatch(/last reported.*not.*liveness/i);
    expect(
      within(toolbar).getByRole("button", { name: /zoom in/i }),
    ).toBeTruthy();
    expect(
      within(toolbar).getByRole("button", { name: /fit all/i }),
    ).toBeTruthy();
  });

  it("wide view places three panes beside visible graph and narrow view stacks in order", () => {
    const { nodes, edges } = twoLanes();
    const { root } = mount008(nodes, edges);
    const workspace = getByRole(root, "region", { name: /monitor workspace/i });
    const nav = within(workspace).getByRole("navigation", {
      name: /agent navigator/i,
    });
    const graph = within(workspace).getByRole("img", { name: /agent graph/i });
    const inspector = within(workspace).getByRole("region", {
      name: /agent details/i,
    });
    expect(
      [nav, graph, inspector].map((element) =>
        Array.from(
          workspace.querySelectorAll("nav, svg, [aria-label='Agent details']"),
        ).indexOf(element),
      ),
    ).toEqual([0, 1, 2]);
    const style = readFileSync("media/styles.css", "utf8");
    const workspaceClass = workspace.classList[0];
    const boundedGraph = graph.parentElement!;
    const graphClass = boundedGraph.classList[0];
    expect(workspaceClass).toBeTruthy();
    expect(graphClass).toBeTruthy();
    const wide = style.match(
      new RegExp(`\\.${workspaceClass}\\s*\\{([^}]+)\\}`, "i"),
    )?.[1];
    expect(wide).toMatch(/display:\s*grid/i);
    expect(wide).toMatch(/grid-template-columns:\s*[^;]*minmax\(0,\s*1fr\)/i);
    const narrow = style.match(
      /@media\s*\(max-width:\s*959px\)\s*\{([\s\S]*?)\n\}/i,
    )?.[1];
    expect(narrow).toContain(`.${workspaceClass}`);
    expect(narrow).toMatch(/grid-template-columns:\s*1fr/i);
    const graphRule = style.match(
      new RegExp(`\\.${graphClass}\\s*\\{([^}]+)\\}`, "i"),
    )?.[1];
    expect(graphRule).toMatch(/(?:max-height|height):\s*[^;]+/i);
    expect(graphRule).toMatch(/overflow:\s*(?:auto|hidden)/i);
    expect(
      nav.compareDocumentPosition(graph) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      graph.compareDocumentPosition(inspector) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("root task titles slug subtitles and agent counts span lanes", () => {
    const { nodes, edges } = twoLanes();
    const twentyFive = Array.from({ length: 25 }, (_, index) =>
      syntheticNode(`${index % 2 === 0 ? "a1" : "b2"}-agent-${index}`, {
        parentId: index % 2 === 0 ? "wt-a1" : "wt-b2",
        relationship: "resolved",
        activities: [
          {
            type: "agent_spawn",
            time: 27 - index,
            summary: `Agent ${index}`,
            absoluteTime: SESSION_START,
          },
        ],
      }),
    );
    const { root } = mount008(
      [...nodes, ...twentyFive],
      [
        ...edges,
        ...twentyFive.map((node, index) => ({
          parentId: index % 2 === 0 ? "wt-a1" : "wt-b2",
          childId: node.id,
        })),
      ],
    );
    const graph = getByRole(root, "img", { name: /agent graph/i });
    expect(graph.textContent).toContain("Review accounts");
    expect(graph.textContent).toContain("Import portfolio");
    expect(graph.textContent).toContain("wt-a1");
    expect(graph.textContent).toContain("wt-b2");
    expect(graph.textContent).toMatch(/15 agents?/i);
    expect(graph.textContent).toMatch(/14 agents?/i);
    const a = graphNode(root, "wt-a1").querySelector("rect")!;
    const b = graphNode(root, "wt-b2").querySelector("rect")!;
    expect(a.getAttribute("x")).not.toBe(b.getAttribute("x"));
    const alphaXs = twentyFive
      .filter((_, index) => index % 2 === 0)
      .map((node) =>
        graphNode(root, node.id).querySelector("rect")!.getAttribute("x"),
      );
    const betaXs = twentyFive
      .filter((_, index) => index % 2 === 1)
      .map((node) =>
        graphNode(root, node.id).querySelector("rect")!.getAttribute("x"),
      );
    expect(new Set(alphaXs).size).toBe(1);
    expect(new Set(betaXs).size).toBe(1);
    expect(alphaXs[0]).not.toBe(betaXs[0]);
    const ys = twentyFive.map((node) =>
      Number(graphNode(root, node.id).querySelector("rect")?.getAttribute("y")),
    );
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(16 * 120);
    const first = Number(
      graphNode(root, twentyFive[0].id)
        .querySelector("rect")!
        .getAttribute("y"),
    );
    const last = Number(
      graphNode(root, twentyFive[24].id)
        .querySelector("rect")!
        .getAttribute("y"),
    );
    expect(last).toBeGreaterThan(first);
    const anchor = graphNode(root, "orchestrator").querySelector("rect")!;
    expect(Number(anchor.getAttribute("y"))).toBeLessThan(
      Number(a.getAttribute("y")),
    );
    expect(Number(anchor.getAttribute("y"))).toBeLessThan(
      Number(b.getAttribute("y")),
    );
  });

  it("foreground labels fit inside fixed boxes without overlap at fit and zoom", () => {
    const prior = Object.getOwnPropertyDescriptor(
      SVGElement.prototype,
      "getBBox",
    );
    Object.defineProperty(SVGElement.prototype, "getBBox", {
      configurable: true,
      value: function (this: SVGElement) {
        const width = Array.from(this.textContent ?? "").reduce(
          (sum, char) => sum + (char === "W" ? 10 : char === "i" ? 4 : 7),
          0,
        );
        return { x: 0, y: 0, width, height: 14 } as DOMRect;
      },
    });
    restoreBBox = () => {
      if (prior) Object.defineProperty(SVGElement.prototype, "getBBox", prior);
      else Reflect.deleteProperty(SVGElement.prototype, "getBBox");
    };
    const long =
      "a1-a-very-long-reviewer-name-that-must-ellipsize-without-overlap";
    const { nodes, edges } = twoLanes();
    nodes.push(
      syntheticNode(long, {
        parentId: "wt-a1",
        relationship: "resolved",
      }),
    );
    edges.push({ parentId: "wt-a1", childId: long });
    const { root } = mount008(nodes, edges);
    const check = () => {
      const rects: Array<{
        id: string;
        x: number;
        y: number;
        w: number;
        h: number;
      }> = [];
      for (const group of root.querySelectorAll<SVGGElement>(
        "svg g[data-node-id]",
      )) {
        const rect = group.querySelector("rect")!;
        const text = group.querySelector("text")!;
        const children = Array.from(group.children);
        expect(children.indexOf(text)).toBeGreaterThan(children.indexOf(rect));
        const x = Number(rect.getAttribute("x"));
        const y = Number(rect.getAttribute("y"));
        const w = Number(rect.getAttribute("width"));
        const h = Number(rect.getAttribute("height"));
        const lines = Array.from(text.querySelectorAll("tspan"));
        expect(lines.length).toBeGreaterThan(0);
        for (const line of lines) {
          const tx = Number(line.getAttribute("x") ?? text.getAttribute("x"));
          const ty = Number(line.getAttribute("y") ?? text.getAttribute("y"));
          expect(tx).toBeGreaterThanOrEqual(x + 8);
          expect(ty).toBeGreaterThanOrEqual(y + 8);
          expect(tx + line.getBBox().width).toBeLessThanOrEqual(x + w - 8);
          expect(ty).toBeLessThanOrEqual(y + h - 8);
        }
        rects.push({ id: group.dataset.nodeId!, x, y, w, h });
      }
      const longCard = graphNode(root, long);
      const visibleName = longCard.querySelectorAll(
        "text > tspan[data-name-line]",
      );
      expect(visibleName).toHaveLength(1);
      expect(visibleName[0].textContent).toMatch(/\.\.\.$/);
      expect(longCard.getAttribute("aria-label")).toContain(long);
      const laneWidth = Number(
        root
          .querySelector('[data-lane-header="wt-a1"] rect')!
          .getAttribute("width"),
      );
      expect(
        Number(longCard.querySelector("rect")!.getAttribute("width")),
      ).toBe(laneWidth);
      for (let i = 0; i < rects.length; i++)
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i],
            b = rects[j];
          expect(
            a.x + a.w <= b.x ||
              b.x + b.w <= a.x ||
              a.y + a.h <= b.y ||
              b.y + b.h <= a.y,
          ).toBe(true);
        }
      const [vx, vy, vw, vh] = root
        .querySelector("svg")!
        .getAttribute("viewBox")!
        .split(/\s+/)
        .map(Number);
      for (const box of rects) {
        expect(vx).toBeLessThanOrEqual(box.x);
        expect(vy).toBeLessThanOrEqual(box.y);
        expect(vx + vw).toBeGreaterThanOrEqual(box.x + box.w);
        expect(vy + vh).toBeGreaterThanOrEqual(box.y + box.h);
      }
    };
    fireEvent.click(getByRole(root, "button", { name: /fit all/i }));
    check();
    const fitted = root.querySelector("svg")?.getAttribute("viewBox");
    fireEvent.click(getByRole(root, "button", { name: /zoom in/i }));
    expect(root.querySelector("svg")?.getAttribute("viewBox")).not.toBe(fitted);
    check();
    fireEvent.click(getByRole(root, "button", { name: /fit all/i }));
    expect(root.querySelector("svg")?.getAttribute("viewBox")).toBe(fitted);
    check();
  });

  it("all resolved links draw one connector including cross lane and late parent", () => {
    const { nodes, edges } = twoLanes();
    const late = syntheticNode("a1-late", {
      parentId: "wt-a1",
      relationship: "unresolved",
    });
    const { root, app } = mount008([late, ...nodes], edges);
    const updatedEdges = [...edges, { parentId: "wt-a1", childId: "a1-late" }];
    app.update(
      syntheticView(
        [
          { ...late, relationship: "resolved" },
          ...nodes,
          syntheticNode("cycle", { relationship: "unresolved" }),
        ],
        [
          ...updatedEdges,
          updatedEdges[4],
          { parentId: "cycle", childId: "cycle" },
          { parentId: "a1-late", childId: "wt-a1" },
        ],
      ),
    );
    const graph = getByRole(root, "img", { name: /agent graph/i });
    const connectors = Array.from(
      graph.querySelectorAll<SVGElement>("[data-edge]"),
    );
    expect(connectors).toHaveLength(updatedEdges.length);
    for (const edge of updatedEdges) {
      const matches = connectors.filter(
        (line) =>
          line.getAttribute("data-parent-id") === edge.parentId &&
          line.getAttribute("data-child-id") === edge.childId,
      );
      expect(matches).toHaveLength(1);
      const stroke =
        matches[0].getAttribute("stroke") ||
        getComputedStyle(matches[0]).stroke;
      expect(stroke).toBeTruthy();
      expect(stroke).not.toMatch(/^(?:none|transparent)$/i);
      if (matches[0].tagName.toLowerCase() === "line") {
        const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map((key) =>
          Number(matches[0].getAttribute(key)),
        );
        expect(x1 === x2 || y1 === y2).toBe(true);
        expect(matches[0].hasAttribute("transform")).toBe(false);
      } else {
        expect(matches[0].getAttribute("d")).toMatch(/^M /);
        expect(matches[0].getAttribute("d")).not.toMatch(/[CLQAST]/i);
      }
    }
    const children = Array.from(
      graph.querySelector("svg")?.children ?? graph.children,
    );
    expect(
      children.findIndex((element) => element.contains(connectors[0])),
    ).toBeLessThan(
      children.findIndex((element) =>
        element.contains(graphNode(root, "wt-a1")),
      ),
    );
    expect(
      connectors.some((line) => line.getAttribute("data-child-id") === "cycle"),
    ).toBe(false);
    expect(
      connectors.some(
        (line) =>
          line.getAttribute("data-parent-id") === "a1-late" &&
          line.getAttribute("data-child-id") === "wt-a1",
      ),
    ).toBe(false);
    fireEvent.click(getByRole(root, "button", { name: /fit all/i }));
    expect(graph.querySelectorAll("[data-edge]")).toHaveLength(
      updatedEdges.length,
    );
  });

  it("active-only hides incident connectors and offscreen culling keeps distant nodes reachable", () => {
    const { nodes, edges } = twoLanes();
    nodes[3] = { ...nodes[3], status: "completed", terminal: true };
    const distant = Array.from({ length: 520 }, (_, index) =>
      syntheticNode(`b2-agent-${index}`, {
        parentId: "wt-b2",
        relationship: "resolved",
      }),
    );
    const { root } = mount008(
      [...nodes, ...distant],
      [
        ...edges,
        ...distant.map((node) => ({ parentId: "wt-b2", childId: node.id })),
      ],
    );
    const graph = getByRole(root, "img", { name: /agent graph/i });
    expect(
      graph.querySelectorAll("g[data-node-id]").length,
    ).toBeLessThanOrEqual(500);
    fireEvent.click(
      getByRole(root, "checkbox", { name: /only last reported active/i }),
    );
    expect(graph.querySelector('[data-child-id="a1-reviewer"]')).toBeNull();
    expect(graph.querySelector('[data-child-id="b2-importer"]')).not.toBeNull();
    const nav = getByRole(root, "navigation", { name: /agent navigator/i });
    fireEvent.input(within(nav).getByRole("textbox", { name: /find agent/i }), {
      target: { value: "b2-agent-519" },
    });
    fireEvent.click(within(nav).getByRole("button", { name: /b2-agent-519/i }));
    expect(
      graph.querySelector('g[data-node-id="b2-agent-519"]'),
    ).not.toBeNull();
    expect(
      graph.querySelectorAll("g[data-node-id]").length,
    ).toBeLessThanOrEqual(500);
  });

  it("statuses and unknown parent show distinct symbols without fading completed", () => {
    const states = ["working", "waiting", "blocked", "failed", "completed"];
    const nodes = states.map((status) =>
      syntheticNode(status, {
        status,
        terminal: status === "completed" || status === "failed",
      }),
    );
    nodes.push(
      syntheticNode("orphan", {
        relationship: "unresolved",
        parentId: "missing",
      }),
    );
    const { root } = mount008(nodes);
    const marks = states.map((status) => {
      const group = graphNode(root, status);
      expect(group.textContent?.toLowerCase()).toContain(status);
      return group.querySelector("[data-status-icon]")?.outerHTML;
    });
    expect(new Set(marks).size).toBe(states.length);
    const orphan = graphNode(root, "orphan");
    expect(orphan.textContent).toMatch(/unknown parent/i);
    expect(orphan.querySelector("[stroke-dasharray]")).not.toBeNull();
    let completed: Element | null = graphNode(root, "completed");
    while (completed && completed !== root) {
      const value =
        completed.getAttribute("opacity") ||
        (completed instanceof Element
          ? getComputedStyle(completed).opacity
          : "");
      if (value) expect(Number(value)).toBe(1);
      completed = completed.parentElement;
    }
    expect(root.textContent).toMatch(/completed/);
  });

  it("failed tool never changes completed agent status", () => {
    const finished = syntheticNode("done", {
      status: "completed",
      terminal: true,
      activities: [
        {
          type: "tool_call_end",
          time: 1,
          toolCategory: "Read",
          toolDurationSeconds: null,
          pairing: "unmatched",
          outcome: "failed",
          summary: "Read failed",
        },
      ],
    });
    const { root } = mount008([finished]);
    fireEvent.click(
      getByRole(root, "navigation", { name: /agent navigator/i }).querySelector(
        "button",
      )!,
    );
    const details = getByRole(root, "region", { name: /agent details/i });
    const activity = getByRole(root, "region", { name: /activity history/i });
    expect(details.textContent).toMatch(/Completed/);
    expect(activity.textContent).toMatch(/Read.*Failed/i);
    expect(details.textContent).not.toMatch(/agent failed/i);
  });

  it("quiet report tag advances without dimming", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-11-14T23:15:00.000Z"));
    const { root } = mount008([
      syntheticNode("quiet", { lastUpdateAge: 3_700 }),
    ]);
    const group = graphNode(root, "quiet");
    expect(group.textContent).toMatch(/No report 1h 1m/);
    expect(group.getAttribute("opacity")).not.toBe("0.5");
    vi.advanceTimersByTime(60_000);
    expect(graphNode(root, "quiet").textContent).toMatch(/No report 1h 2m/);
    expect(root.textContent).not.toMatch(/verified live/i);
  });

  it("inspector shows worktree task unavailable role status times parent and copyable full id", async () => {
    vi.stubEnv("TZ", "Asia/Singapore");
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });
    const { nodes, edges } = twoLanes();
    const { root } = mount008(nodes, edges);
    const nav = getByRole(root, "navigation", { name: /agent navigator/i });
    fireEvent.click(within(nav).getByRole("button", { name: /reviewer/i }));
    const details = getByRole(root, "region", { name: /agent details/i });
    expect(details.textContent).toContain("a1-reviewer");
    expect(details.textContent).toMatch(/Worktree:\s*a1/i);
    expect(details.textContent).toMatch(/Role:\s*unavailable/i);
    expect(details.textContent).toMatch(/Review tests/);
    expect(details.textContent).toMatch(/Working/);
    expect(details.textContent).toMatch(/Reports to.*wt-a1/i);
    expect(details.textContent).toMatch(/Started.*SGT|Started.*GMT\+8/i);
    expect(details.textContent).not.toMatch(
      /Identity kind|Relationship:|Execution interval reported/,
    );
    fireEvent.click(within(details).getByRole("button", { name: /copy.*id/i }));
    expect(writeText).toHaveBeenCalledWith("a1-reviewer");
  });

  it("clipboard denial reports failure and leaves the full id selectable", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    const { root } = mount008([syntheticNode("a1-reviewer")]);
    fireEvent.click(
      within(
        getByRole(root, "navigation", {
          name: /agent navigator/i,
        }),
      ).getByRole("button", { name: /a1-reviewer/i }),
    );
    const details = getByRole(root, "region", { name: /agent details/i });
    fireEvent.click(within(details).getByRole("button", { name: /copy.*id/i }));
    await vi.waitFor(() =>
      expect(details.textContent).toMatch(/copy.*failed|could not copy/i),
    );
    expect(writeText).toHaveBeenCalledWith("a1-reviewer");
    const fallback = within(details).getByRole("textbox", {
      name: /full.*id/i,
    });
    expect(fallback).toHaveProperty("value", "a1-reviewer");
    expect(fallback.hasAttribute("disabled")).toBe(false);
  });

  it("older run expansion search and reveal retain selection", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-11-20T22:13:20.000Z"));
    const old = syntheticNode("old-run", {
      status: "completed",
      terminal: true,
      intervals: [
        {
          start: 0,
          end: 3,
          certainty: "reported",
          startAbsoluteTime: SESSION_START,
          endAbsoluteTime: "2023-11-14T22:13:23.000Z",
        },
      ],
    });
    const { root, app } = mount008([
      old,
      syntheticNode("new-run", {
        intervals: [
          {
            start: 0,
            end: null,
            certainty: "reported",
            startAbsoluteTime: "2023-11-20T22:13:20.000Z",
            endAbsoluteTime: null,
          },
        ],
      }),
    ]);
    fireEvent.click(getByRole(root, "button", { name: /last 24 hours/i }));
    fireEvent.click(getByRole(root, "button", { name: /older runs/i }));
    const nav = getByRole(root, "navigation", { name: /agent navigator/i });
    const search = within(nav).getByRole("textbox", { name: /find agent/i });
    fireEvent.input(search, { target: { value: "old" } });
    fireEvent.click(within(nav).getByRole("button", { name: /old-run/i }));
    fireEvent.click(
      getByRole(root, "checkbox", { name: /only last reported active/i }),
    );
    const reveal = getByRole(root, "button", { name: /reveal.*old-run/i });
    fireEvent.click(reveal);
    app.update(syntheticView([old, syntheticNode("new-run")]));
    expect(
      getByRole(root, "region", { name: /agent details/i }).textContent,
    ).toContain("old-run");
  });

  it("shows one navigator row per identity and selects its runs in the inspector", () => {
    const intervals = Array.from({ length: 13 }, (_, index) => ({
      start: index * 60,
      end: index * 60 + 30,
      certainty: "reported",
      startAbsoluteTime: `2023-11-14T22:${String(index).padStart(2, "0")}:20.000Z`,
      endAbsoluteTime: `2023-11-14T22:${String(index).padStart(2, "0")}:50.000Z`,
    }));
    const orchestrator = syntheticNode("orchestrator", {
      status: "completed",
      terminal: true,
      intervals,
    });
    const { root, app } = mount008([orchestrator]);
    const nav = getByRole(root, "navigation", { name: /agent navigator/i });
    expect(
      within(nav).getAllByRole("button", { name: /^orchestrator\b/i }),
    ).toHaveLength(1);
    expect(nav.textContent).toMatch(/orchestrator.*13 runs/i);
    fireEvent.click(
      within(nav).getByRole("button", { name: /^orchestrator\b/i }),
    );
    const inspector = getByRole(root, "region", { name: /agent details/i });
    const runSelect = within(inspector).getByRole("combobox", {
      name: /select run/i,
    }) as HTMLSelectElement;
    expect(runSelect.options).toHaveLength(13);
    fireEvent.change(runSelect, { target: { value: "12" } });
    expect(runSelect.value).toBe("12");
    expect(inspector.textContent).toMatch(/Ran 06:12.*06:12.*30s/i);
    app.update(syntheticView([orchestrator]));
    expect(
      (
        within(inspector).getByRole("combobox", {
          name: /select run/i,
        }) as HTMLSelectElement
      ).value,
    ).toBe("12");
  });

  it("navigator and graph use plain status copy while retaining accessible full IDs", () => {
    const rootId = "wt-chore-shared-ag-0736a7b0";
    const fullId = `${rootId}-test-writer`;
    const { root } = mount008(
      [
        syntheticNode(rootId),
        syntheticNode(fullId, {
          parentId: rootId,
          relationship: "resolved",
          lastUpdateAge: 3_840,
        }),
      ],
      [{ parentId: rootId, childId: fullId }],
    );
    const nav = getByRole(root, "navigation", { name: /agent navigator/i });
    const row = within(nav).getByRole("button", { name: /^test-writer\b/i });
    expect(row.textContent).toMatch(/^test-writer.*Working.*1h 4m/i);
    const mark = row.querySelector<HTMLElement>("[data-status-icon]");
    expect(mark?.dataset.statusIcon).toBe("Working");
    expect(mark?.getAttribute("aria-hidden")).toBe("true");
    const styles = readFileSync("media/styles.css", "utf8");
    expect(styles).toMatch(
      /\.navigator-status-icon\[data-status-icon="Working"\]/,
    );
    expect(row.textContent).not.toMatch(
      /resolved|\(wt-|test-writer.*test-writer/i,
    );
    expect(row.getAttribute("aria-label")).toContain(fullId);
    const rootRow = within(nav).getByRole("button", {
      name: new RegExp(`^${rootId}\\b`, "i"),
    });
    expect(rootRow.textContent).not.toMatch(/\sroot\b/i);
    const graph = graphNode(root, fullId);
    expect(graph.textContent).toMatch(/test-writer.*Working/i);
    expect(graph.textContent).not.toMatch(/resolved/i);
    expect(graph.getAttribute("aria-label")).toContain(fullId);
    fireEvent.click(row);
    expect(
      getByRole(root, "textbox", { name: /full agent id/i }),
    ).toHaveProperty("value", fullId);
  });

  it("footer keeps graph visible and expands provisional snapshots and diagnostics", () => {
    const reported = syntheticNode("agent-x", {
      status: "completed",
      terminal: true,
    });
    const { root, app } = mount008([reported], [], {
      diagnostics: [{ code: "session_mismatch", line: 4, byteOffset: 72 }],
      companions: [
        {
          agentId: "agent-x",
          status: "working",
          source: "heartbeat",
          certainty: "provisional",
        },
      ],
    });
    const footer = getByRole(root, "region", { name: /monitor footer/i });
    expect(footer.textContent).toMatch(/heartbeat.*provisional/i);
    expect(footer.textContent).toMatch(/diagnostics.*1/i);
    expect(footer.querySelector("details")?.open).toBe(false);
    expect(
      root.querySelector("svg")!.compareDocumentPosition(footer) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    fireEvent.click(within(footer).getByText(/show.*details/i));
    expect(footer.querySelector("details")?.open).toBe(true);
    expect(footer.textContent).toMatch(/agent-x/);
    expect(footer.textContent).toMatch(/session_mismatch.*line 4.*byte 72/i);
    app.update(
      syntheticView([reported], [], {
        companions: [
          {
            agentId: "agent-x",
            status: "failed",
            source: "heartbeat",
            certainty: "provisional",
          },
        ],
        diagnostics: [{ code: "session_mismatch", line: 5, byteOffset: 80 }],
      }),
    );
    expect(footer.querySelector("details")?.open).toBe(true);
    expect(footer.textContent).toMatch(/session_mismatch.*line 5.*byte 80/i);
    expect(graphNode(root, "agent-x").textContent).toMatch(/Completed/i);
    expect(
      getByRole(root, "region", { name: /agent details/i }).textContent,
    ).not.toMatch(/agent failed/i);
  });

  it("footer has one disclosure with hidden content and local heartbeat times", () => {
    vi.stubEnv("TZ", "Asia/Singapore");
    const { root, app } = mount008([syntheticNode("agent-x")], [], {
      companions: [
        {
          agentId: "agent-x",
          status: "working",
          updatedAt: "2023-11-14T02:41:00.000Z",
          certainty: "provisional",
        },
      ],
      diagnostics: [{ code: "incomplete", line: 4 }],
    });
    const footer = getByRole(root, "region", { name: /monitor footer/i });
    const details = footer.querySelector("details")!;
    const summary = within(footer).getByRole("button", {
      name: /show details/i,
    });
    expect(footer.querySelectorAll("summary")).toHaveLength(1);
    expect(
      within(footer).getAllByRole("button", { name: /details/i }),
    ).toHaveLength(1);
    expect(details.open).toBe(false);
    expect(details.querySelector("[hidden]")).not.toBeNull();
    fireEvent.click(summary);
    expect(details.open).toBe(true);
    expect(details.querySelector("[hidden]")).toBeNull();
    expect(footer.textContent).toMatch(/agent-x.*10:41 SGT/i);
    expect(footer.textContent).not.toContain("2023-11-14T02:41:00.000Z");
    app.update(
      syntheticView([syntheticNode("agent-x")], [], {
        companions: [
          {
            agentId: "agent-x",
            status: "working",
            updatedAt: "2023-11-14T02:42:00.000Z",
            certainty: "provisional",
          },
        ],
      }),
    );
    expect(details.open).toBe(true);
    expect(footer.textContent).toMatch(/10:42 SGT/);
  });

  it("light dark high contrast meet text and connector contrast", () => {
    const { nodes, edges } = twoLanes();
    const { root } = mount008(nodes, edges);
    fireEvent.click(
      within(
        getByRole(root, "navigation", {
          name: /agent navigator/i,
        }),
      ).getByRole("button", { name: /reviewer/i }),
    );
    const css = readFileSync("media/styles.css", "utf8");
    const palettes = [
      {
        name: "vscode-light",
        foreground: "#202124",
        background: "#ffffff",
        widget: "#f1f3f4",
        secondary: "#5f6368",
        accent: "#005a9c",
      },
      {
        name: "vscode-dark",
        foreground: "#f0f0f0",
        background: "#202124",
        widget: "#303134",
        secondary: "#d1d1d1",
        accent: "#80caff",
      },
      {
        name: "vscode-high-contrast",
        foreground: "#ffffff",
        background: "#000000",
        widget: "#000000",
        secondary: "#ffffff",
        accent: "#ffff00",
      },
    ];
    const luminance = (hex: string) => {
      const channels = hex
        .match(/[a-f\d]{2}/gi)!
        .map((part) => parseInt(part, 16) / 255)
        .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const contrast = (a: string, b: string) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    for (const palette of palettes) {
      document.body.className = palette.name;
      const resolved = css.replace(
        /var\((--vscode-[\w-]+)(?:,\s*([^)]+))?\)/g,
        (_, token: string) => {
          if (
            /focusBorder|contrastBorder|contrastActiveBorder|charts-/.test(
              token,
            )
          )
            return palette.accent;
          if (/descriptionForeground/.test(token)) return palette.secondary;
          if (
            /editorWidget-background|input-background|sideBar-background/.test(
              token,
            )
          )
            return palette.widget;
          if (/background/.test(token)) return palette.background;
          return palette.foreground;
        },
      );
      const stylesheet = document.createElement("style");
      stylesheet.textContent = resolved;
      document.head.append(stylesheet);
      const node = graphNode(root, "wt-a1");
      const label = node.querySelector("text")!;
      const box = node.querySelector("rect")!;
      const icon = node.querySelector<SVGElement>("[data-status-icon]")!;
      const line = root.querySelector<SVGElement>("svg [data-edge]")!;
      const inspector = getByRole(root, "region", { name: /agent details/i });
      const pill = inspector.querySelector<HTMLElement>("[data-status-pill]")!;
      const footer = getByRole(root, "region", { name: /monitor footer/i });
      const rgbHex = (value: string) =>
        value?.startsWith("#")
          ? value
          : "#" +
            (value?.match(/\d+/g) ?? [])
              .slice(0, 3)
              .map((item) => Number(item).toString(16).padStart(2, "0"))
              .join("");
      const actual = (
        element: Element,
        property: "color" | "backgroundColor" | "fill" | "stroke",
      ) => {
        const raw =
          element.getAttribute(
            property === "backgroundColor" ? "fill" : property,
          ) || getComputedStyle(element)[property];
        return raw === "currentColor" ? getComputedStyle(element).color : raw;
      };
      const boxSurface = actual(box, "fill");
      const pairs: Array<[string, string, number]> = [
        [actual(label, "fill"), boxSurface, 4.5],
        [actual(icon, "stroke") || actual(icon, "fill"), boxSurface, 3],
        [actual(line, "stroke"), palette.background, 3],
        [actual(pill, "color"), actual(pill, "backgroundColor"), 4.5],
        [actual(footer, "color"), actual(footer, "backgroundColor"), 4.5],
      ];
      for (const [foreground, background, minimum] of pairs) {
        expect(foreground).toMatch(/^(?:rgb\(|#)/);
        expect(background).toMatch(/^(?:rgb\(|#)/);
        expect(
          contrast(rgbHex(foreground), rgbHex(background)),
        ).toBeGreaterThanOrEqual(minimum);
      }
      const focusRule = resolved.match(
        /button:focus-visible[^{]*\{([^}]+)\}/,
      )?.[1];
      expect(focusRule).toMatch(/outline:\s*2px solid/i);
      expect(focusRule).toContain(palette.accent);
      expect(contrast(palette.accent, palette.widget)).toBeGreaterThanOrEqual(
        3,
      );
      stylesheet.remove();
    }
  });

  it("keyboard and reduced motion reach controls and inspector", () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      addListener: () => {},
      removeListener: () => {},
    }));
    const { nodes, edges } = twoLanes();
    const { root } = mount008(nodes, edges);
    const activate = (control: HTMLElement) => {
      const name = control.getAttribute("aria-label");
      control.focus();
      fireEvent.keyDown(control, { key: "Enter" });
      expect(document.activeElement?.getAttribute("aria-label")).toBe(name);
    };
    const graph = () => getByRole(root, "img", { name: /agent graph/i });
    const initial = graph().getAttribute("viewBox");
    activate(getByRole(root, "button", { name: /zoom in/i }));
    expect(graph().getAttribute("viewBox")).not.toBe(initial);
    activate(getByRole(root, "button", { name: /fit all/i }));
    expect(graph().getAttribute("viewBox")).toBe(initial);
    activate(getByRole(root, "button", { name: /last 24 hours/i }));
    expect(
      getByRole(root, "button", { name: /last 24 hours/i }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    activate(getByRole(root, "button", { name: /all runs/i }));
    expect(
      getByRole(root, "button", { name: /all runs/i }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    const nav = getByRole(root, "navigation", { name: /agent navigator/i });
    const search = within(nav).getByRole("textbox", { name: /find agent/i });
    search.focus();
    fireEvent.input(search, { target: { value: "reviewer" } });
    expect(within(nav).queryByRole("button", { name: /importer/i })).toBeNull();
    expect(document.activeElement).toBe(search);
    const selection = within(nav).getByRole("button", { name: /reviewer/i });
    activate(selection);
    expect(
      getByRole(root, "region", { name: /agent details/i }).textContent,
    ).toContain("a1-reviewer");
    const filter = getByRole(root, "checkbox", {
      name: /only last reported active/i,
    });
    activate(filter);
    expect(
      (
        getByRole(root, "checkbox", {
          name: /only last reported active/i,
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    const pan = getByRole(root, "button", { name: /pan right/i });
    const beforePan = graph().getAttribute("viewBox");
    activate(pan);
    expect(graph().getAttribute("viewBox")).not.toBe(beforePan);
    const details = getByRole(root, "region", { name: /agent details/i });
    activate(within(details).getByRole("button", { name: /copy.*id/i }));
    expect(details.textContent).toContain("a1-reviewer");
    expect(root.querySelector("animate, animateMotion")).toBeNull();
    const css = readFileSync("media/styles.css", "utf8");
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(css).toMatch(/:focus-visible[^{]*\{[^}]*outline/i);
  });

  it("keyboard expands older runs and footer and pages activity across updates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-11-20T22:13:20.000Z"));
    const old = syntheticNode("old-run", {
      status: "completed",
      terminal: true,
      intervals: [
        {
          start: 0,
          end: 3,
          certainty: "reported",
          startAbsoluteTime: SESSION_START,
          endAbsoluteTime: "2023-11-14T22:13:23.000Z",
        },
      ],
      activities: Array.from({ length: 105 }, (_, index) => ({
        type: "message",
        time: index,
        summary: `Report ${index}`,
      })),
    });
    const { root, app } = mount008([old], [], {
      diagnostics: [{ code: "incomplete", line: 2 }],
    });
    const press = (control: HTMLElement) => {
      control.focus();
      fireEvent.keyDown(control, { key: "Enter" });
    };
    press(getByRole(root, "button", { name: /last 24 hours/i }));
    const older = getByRole(root, "button", { name: /older runs/i });
    press(older);
    expect(
      getByRole(root, "navigation", { name: /agent navigator/i }).textContent,
    ).toContain("old-run");
    press(getByRole(root, "button", { name: /old-run/i }));
    const history = getByRole(root, "region", { name: /activity history/i });
    press(within(history).getByRole("button", { name: /last activity page/i }));
    const lastPage = getByRole(root, "region", {
      name: /activity history/i,
    }).textContent!;
    expect(lastPage).toContain("Report 104");
    const pageLabel = lastPage.match(/Activity page \d+ of \d+/)?.[0];
    expect(pageLabel).toBeTruthy();
    const footer = getByRole(root, "region", { name: /monitor footer/i });
    press(within(footer).getByRole("button", { name: /show.*details/i }));
    expect(footer.querySelector("details")?.open).toBe(true);
    app.update(
      syntheticView([old], [], {
        diagnostics: [{ code: "incomplete", line: 3 }],
      }),
    );
    expect(
      getByRole(root, "region", { name: /activity history/i }).textContent,
    ).toContain("Report 104");
    expect(
      getByRole(root, "region", { name: /activity history/i }).textContent,
    ).toContain(pageLabel);
    expect(
      getByRole(root, "region", { name: /monitor footer/i }).querySelector(
        "details",
      )?.open,
    ).toBe(true);
  });

  it("historical and incremental fixtures preserve camera and no executable telemetry", () => {
    const { nodes, edges } = twoLanes();
    nodes[3] = {
      ...nodes[3],
      task: "<img src=x onerror=alert(1)>",
    };
    const { root, app } = mount008(nodes, edges);
    fireEvent.click(getByRole(root, "button", { name: /zoom in/i }));
    const camera = root.querySelector("svg")?.getAttribute("viewBox");
    app.update(
      syntheticView(
        [
          ...nodes,
          syntheticNode("b2-new", {
            parentId: "wt-b2",
            relationship: "resolved",
          }),
        ],
        [...edges, { parentId: "wt-b2", childId: "b2-new" }],
      ),
    );
    expect(root.querySelector("svg")?.getAttribute("viewBox")).toBe(camera);
    fireEvent.click(
      within(
        getByRole(root, "navigation", {
          name: /agent navigator/i,
        }),
      ).getByRole("button", { name: /reviewer/i }),
    );
    expect(root.textContent).toContain("<img src=x onerror=alert(1)>");
    expect(root.querySelector("img")).toBeNull();
    expect(root.querySelectorAll("svg [data-edge]")).toHaveLength(5);
    expect(
      getByRole(root, "img", { name: /agent graph/i }).textContent,
    ).toContain("Import portfolio");
    app.update({
      ...syntheticView([syntheticNode("new-source")]),
      sourceGeneration: 2,
    });
    expect(root.textContent).not.toContain("<img src=x onerror=alert(1)>");
    expect(root.querySelector('g[data-node-id="new-source"]')).not.toBeNull();
  });

  it("matches the approved compact header toolbar and independent lane header cards", () => {
    const { nodes, edges } = twoLanes();
    const { root } = mount008(nodes, edges);
    const header = root.querySelector(".monitor-header")!;
    const toolbar = getByRole(root, "region", { name: /monitor toolbar/i });
    expect(header.textContent).toMatch(
      /Agent Monitor.*Tallyhold.*agent-flow-events\.jsonl.*Session.*Following.*Choose source/is,
    );
    expect(
      within(toolbar)
        .getByRole("button", { name: /last 24 hours/i })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(toolbar.textContent).toMatch(/100%/);
    expect(
      within(toolbar).queryByRole("button", {
        name: /pan (left|right|up|down)/i,
      }),
    ).toBeNull();
    const laneHeaders = Array.from(
      root.querySelectorAll<SVGGElement>("[data-lane-header]"),
    );
    expect(laneHeaders).toHaveLength(2);
    const boxes = laneHeaders.map((item) => {
      expect(item.textContent).toMatch(
        /Review accounts|Import portfolio|wt-a1|wt-b2|Working|agents?|since/i,
      );
      const box = item.querySelector("rect")!;
      return {
        x: Number(box.getAttribute("x")),
        y: Number(box.getAttribute("y")),
        width: Number(box.getAttribute("width")),
        height: Number(box.getAttribute("height")),
      };
    });
    expect(
      boxes[0].x + boxes[0].width <= boxes[1].x ||
        boxes[1].x + boxes[1].width <= boxes[0].x ||
        boxes[0].y + boxes[0].height <= boxes[1].y ||
        boxes[1].y + boxes[1].height <= boxes[0].y,
    ).toBe(true);
  });

  it("assigns root-prefixed orphans to their lane and keeps card copy inside fixed boxes", () => {
    const rootId = "wt-alpha";
    const longName = "UnbreakableDisplayNameWithoutSeparators";
    const prefixed = `${rootId}-${longName}`;
    const completed = syntheticNode(`${rootId}-done`, {
      status: "completed",
      terminal: true,
      lastUpdateAge: 7_200,
    });
    const { root } = mount008([
      syntheticNode(rootId, { task: "Review tests" }),
      syntheticNode(prefixed, { parentId: undefined, relationship: "root" }),
      completed,
    ]);
    const laneX = graphNode(root, rootId)
      .querySelector("rect")!
      .getAttribute("x");
    expect(
      graphNode(root, prefixed).querySelector("rect")!.getAttribute("x"),
    ).toBe(laneX);
    expect(root.querySelectorAll("[data-lane-header]")).toHaveLength(1);
    const card = graphNode(root, prefixed);
    const labelLines = card.querySelectorAll("text > tspan[data-name-line]");
    expect(labelLines).toHaveLength(1);
    expect(labelLines[0].textContent).toMatch(/\.\.\.$/);
    expect(card.getAttribute("aria-label")).toContain(longName);
    const laneWidth = Number(
      root.querySelector("[data-lane-header] rect")!.getAttribute("width"),
    );
    expect(Number(card.querySelector("rect")!.getAttribute("width"))).toBe(
      laneWidth,
    );
    expect(card.textContent).toMatch(/Working.*0s|0s.*Working/i);
    expect(graphNode(root, completed.id).textContent).not.toMatch(/No report/i);
  });

  it("defaults to the recent graph with one lane rail and one attributed tick per card", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-11-20T12:00:00.000Z"));
    const rootId = "wt-alpha";
    const old = syntheticNode("old-agent", {
      status: "completed",
      terminal: true,
      intervals: [
        {
          start: 0,
          end: 1,
          startAbsoluteTime: "2023-11-13T12:00:00.000Z",
          endAbsoluteTime: "2023-11-13T12:00:01.000Z",
        },
      ],
    });
    const children = ["one", "two", "three"].map((name) =>
      syntheticNode(`${rootId}-${name}`, {
        parentId: rootId,
        relationship: "resolved",
        intervals: [
          {
            start: 0,
            end: null,
            startAbsoluteTime: "2023-11-20T11:00:00.000Z",
            endAbsoluteTime: null,
          },
        ],
      }),
    );
    const { root } = mount008(
      [
        syntheticNode(rootId, {
          intervals: [
            {
              start: 0,
              end: null,
              startAbsoluteTime: "2023-11-20T11:00:00.000Z",
              endAbsoluteTime: null,
            },
          ],
        }),
        old,
        ...children,
      ],
      children.map((child) => ({ parentId: rootId, childId: child.id })),
    );
    const graph = getByRole(root, "img", { name: /agent graph/i });
    expect(graph.querySelector('[data-node-id="old-agent"]')).toBeNull();
    expect(getByRole(root, "button", { name: /older runs/i })).toBeTruthy();
    const rails = Array.from(
      graph.querySelectorAll(`[data-lane-rail="${rootId}"]`),
    );
    expect(rails).toHaveLength(1);
    expect(rails[0].tagName.toLowerCase()).toBe("path");
    const ticks = Array.from(
      graph.querySelectorAll(`[data-lane-tick="${rootId}"]`),
    );
    expect(ticks).toHaveLength(children.length);
    expect(ticks.every((tick) => tick.tagName.toLowerCase() === "line")).toBe(
      true,
    );
    const routes = Array.from(graph.querySelectorAll("[data-edge]"));
    expect(routes).toHaveLength(3);
    expect(routes.every((route) => route.hasAttribute("data-lane-tick"))).toBe(
      true,
    );
  });

  it("renders dated plain activity and the approved inspector hierarchy for one selected run", () => {
    vi.stubEnv("TZ", "Asia/Singapore");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-11-20T12:00:00.000Z"));
    const rootId = "wt-alpha";
    const agent = syntheticNode(`${rootId}-test-writer`, {
      task: "Write failing health contract",
      parentId: rootId,
      relationship: "resolved",
      identityKind: "unspecified",
      intervals: [
        {
          start: 0,
          end: 60,
          startAbsoluteTime: "2023-11-13T08:33:36.000Z",
          endAbsoluteTime: "2023-11-13T08:34:36.000Z",
        },
        {
          start: 100,
          end: null,
          startAbsoluteTime: "2023-11-20T08:33:36.000Z",
          endAbsoluteTime: null,
        },
      ],
      activities: [
        {
          type: "agent_spawn",
          time: 0,
          absoluteTime: "2023-11-13T08:33:36.000Z",
          summary: "Old run",
        },
        {
          type: "agent_spawn",
          time: 100,
          absoluteTime: "2023-11-20T08:33:36.000Z",
          summary: "Write failing health contract",
        },
      ],
    });
    const { root } = mount008(
      [syntheticNode(rootId), agent],
      [{ parentId: rootId, childId: agent.id }],
    );
    fireEvent.click(
      within(
        getByRole(root, "navigation", { name: /agent navigator/i }),
      ).getByRole("button", { name: /^test-writer\b/i }),
    );
    const details = getByRole(root, "region", { name: /agent details/i });
    expect(details.textContent).toMatch(
      /test-writer.*Working.*Worktree:\s*alpha/is,
    );
    expect(details.textContent).toMatch(
      /Task.*Started.*Running for.*Last report.*Reports to/is,
    );
    expect(details.textContent).not.toMatch(/unspecified|Identity kind/i);
    expect(details.textContent).toMatch(/Activity.*Run 2 of 2/is);
    const history = getByRole(root, "region", { name: /activity history/i });
    expect(history.querySelector(".activity-time")?.textContent).toBe(
      "16:33:36 SGT",
    );
    expect(history.querySelector(".activity-label")?.textContent).toBe(
      "Started",
    );
    expect(history.querySelector(".activity-outcome")?.textContent).toBe(
      "Write failing health contract",
    );
    expect(history.textContent).not.toMatch(
      /Old run|Reported|Verified absolute|\(agent_spawn\)|\+\d+s/,
    );
    const select = within(details).getByRole("combobox", {
      name: /select run/i,
    });
    expect(select.textContent).toMatch(/13 Nov 16:33 SGT/);
  });

  it("groups navigator identities by worktree with run counts inside their rows", () => {
    const rootId = "wt-alpha";
    const agent = syntheticNode(`${rootId}-reviewer`, {
      parentId: rootId,
      relationship: "resolved",
      intervals: [
        { start: 0, end: 1 },
        { start: 2, end: null },
      ],
    });
    const { root } = mount008(
      [syntheticNode(rootId), agent, syntheticNode("orchestrator")],
      [{ parentId: rootId, childId: agent.id }],
    );
    const nav = getByRole(root, "navigation", { name: /agent navigator/i });
    const group = nav.querySelector('[data-worktree="alpha"]');
    expect(group).not.toBeNull();
    expect(group?.textContent).toMatch(/alpha.*reviewer.*2 runs/is);
    const row = group?.querySelector(`[data-identity-id="${agent.id}"]`);
    expect(row?.textContent).toMatch(/reviewer.*2 runs/is);
    expect(row?.querySelector(".navigator-agent-status")?.textContent).toBe(
      "Working",
    );
    expect(row?.nextElementSibling?.textContent).not.toMatch(/^2 runs$/i);
  });

  it("renders the reported hashed worktree slug without inventing a branch name", () => {
    const slug = "chore-shared-ag-0736a7b0";
    const rootId = `wt-${slug}`;
    const agent = syntheticNode(`${rootId}-reviewer`, {
      parentId: rootId,
      relationship: "resolved",
    });
    const { root } = mount008(
      [syntheticNode(rootId), agent],
      [{ parentId: rootId, childId: agent.id }],
    );
    const lane = root.querySelector(`[data-lane-header="${rootId}"]`)!;
    expect(lane.querySelector("[data-worktree-slug]")?.textContent).toBe(slug);
    expect(lane.querySelector("[data-slug-hash]")?.textContent).toBe(
      "0736a7b0",
    );
    const navigator = getByRole(root, "navigation", {
      name: /agent navigator/i,
    });
    expect(navigator.querySelector("[data-worktree-slug]")?.textContent).toBe(
      slug,
    );
    expect(navigator.querySelector("[data-slug-hash]")?.textContent).toBe(
      "0736a7b0",
    );
    fireEvent.click(
      within(navigator).getByRole("button", { name: /reviewer/i }),
    );
    const details = getByRole(root, "region", { name: /agent details/i });
    expect(details.querySelector("[data-worktree-slug]")?.textContent).toBe(
      slug,
    );
    expect(details.querySelector("[data-slug-hash]")?.textContent).toBe(
      "0736a7b0",
    );
    for (const surface of [lane, navigator, details]) {
      expect(surface.querySelectorAll("[data-worktree-slug]")).toHaveLength(1);
      expect(surface.textContent).not.toContain("/");
    }
  });

  it("renders legacy identities in an orthogonal unassigned lane and hides registration roots", () => {
    const rootId = "wt-alpha";
    const registration = syntheticNode(rootId, {
      task: "Worktree activity",
      parentId: "orchestrator",
      relationship: "resolved",
    });
    const child = syntheticNode(`${rootId}-implementer`, {
      parentId: rootId,
      relationship: "resolved",
    });
    const legacy = syntheticNode("legacy-test-writer", {
      parentId: "orchestrator",
      relationship: "resolved",
    });
    const { root } = mount008(
      [syntheticNode("orchestrator"), registration, child, legacy],
      [
        { parentId: "orchestrator", childId: rootId },
        { parentId: rootId, childId: child.id },
        { parentId: "orchestrator", childId: legacy.id },
      ],
    );
    const graph = getByRole(root, "img", { name: /agent graph/i });
    const unassigned = graph.querySelector<SVGGElement>(
      '[data-lane-header="unassigned"]',
    );
    const worktree = graph.querySelector<SVGGElement>(
      `[data-lane-header="${rootId}"]`,
    );
    expect(unassigned?.textContent).toContain(
      "Unassigned (before shared stream)",
    );
    expect(
      Number(unassigned?.querySelector("rect")?.getAttribute("x")),
    ).toBeLessThan(Number(worktree?.querySelector("rect")?.getAttribute("x")));
    expect(graph.querySelector(`[data-node-card="${rootId}"]`)).toBeNull();
    expect(
      graph.querySelector(`[data-node-card="${legacy.id}"]`),
    ).not.toBeNull();
    const navigator = getByRole(root, "navigation", {
      name: /agent navigator/i,
    });
    expect(
      navigator.querySelector(`[data-identity-id="${rootId}"]`),
    ).toBeNull();
    expect(
      navigator.querySelector('[data-worktree="unassigned"]')?.textContent,
    ).toContain("Unassigned (before shared stream)");
    for (const segment of graph.querySelectorAll<SVGLineElement>(
      ".graph-edges line",
    )) {
      const x1 = Number(segment.getAttribute("x1"));
      const x2 = Number(segment.getAttribute("x2"));
      const y1 = Number(segment.getAttribute("y1"));
      const y2 = Number(segment.getAttribute("y2"));
      expect(x1 === x2 || y1 === y2).toBe(true);
      expect(segment.hasAttribute("transform")).toBe(false);
    }
    for (const path of graph.querySelectorAll<SVGPathElement>(
      ".graph-edges path",
    ))
      expect(path.getAttribute("d")).not.toMatch(/[CLQAST]/i);
  });

  it("collapses five runs to one card and row with latest run selected", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-11-20T12:00:00.000Z"));
    const rootId = "wt-alpha";
    const intervals = Array.from({ length: 5 }, (_, index) => ({
      start: index * 100,
      end: index === 4 ? null : index * 100 + 50,
      startAbsoluteTime: `2023-11-20T0${7 + index}:00:00.000Z`,
      endAbsoluteTime:
        index === 4 ? null : `2023-11-20T0${7 + index}:00:50.000Z`,
    }));
    const activities = intervals.map((interval, index) => ({
      type: "message",
      time: interval.start,
      absoluteTime: interval.startAbsoluteTime,
      summary: `Run ${index + 1} summary`,
    }));
    const repeated = syntheticNode(`${rootId}-test-writer`, {
      parentId: rootId,
      relationship: "resolved",
      intervals,
      activities,
    });
    const unknown = syntheticNode(`${rootId}-time-unknown`, {
      parentId: rootId,
      relationship: "resolved",
      intervals: [{ start: null, end: null }],
      lastUpdateAge: null,
    });
    const { root } = mount008(
      [
        syntheticNode(rootId, {
          task: "Worktree activity",
          status: undefined,
        }),
        repeated,
        unknown,
      ],
      [
        { parentId: rootId, childId: repeated.id },
        { parentId: rootId, childId: unknown.id },
      ],
    );
    const graph = getByRole(root, "img", { name: /agent graph/i });
    expect(
      graph.querySelectorAll(`[data-node-card="${repeated.id}"]`),
    ).toHaveLength(1);
    expect(
      graph.querySelector(`[data-node-card="${repeated.id}"] .agent-run-badge`)
        ?.textContent,
    ).toBe("×5 runs");
    const navigator = getByRole(root, "navigation", {
      name: /agent navigator/i,
    });
    const row = navigator.querySelector(`[data-identity-id="${repeated.id}"]`)!;
    expect(
      navigator.querySelectorAll(`[data-identity-id="${repeated.id}"]`),
    ).toHaveLength(1);
    expect(row.querySelector(".navigator-run-badge")?.textContent).toBe("×5");
    expect(row.children).toHaveLength(1);
    expect(navigator.querySelector(".navigator-time-unavailable")).toBeNull();
    expect(
      navigator.querySelector(
        `[data-identity-id="${unknown.id}"] .navigator-agent-duration`,
      )?.textContent,
    ).toBe("Time unavailable");
    fireEvent.click(within(row).getByRole("button"));
    const inspector = getByRole(root, "region", { name: /agent details/i });
    expect(
      (
        within(inspector).getByRole("combobox", {
          name: /select run/i,
        }) as HTMLSelectElement
      ).value,
    ).toBe("4");
    expect(
      getByRole(root, "region", { name: /activity history/i }).textContent,
    ).toContain("Run 5 summary");
    expect(
      getByRole(root, "region", { name: /activity history/i }).textContent,
    ).not.toContain("Run 1 summary");
  });

  it("reserves separate card grid cells for long copy duration and quiet age", () => {
    const rootId = "wt-alpha";
    const agent = syntheticNode(
      `${rootId}-an-extremely-long-agent-name-with-many-parts`,
      {
        parentId: rootId,
        relationship: "resolved",
        status: "waiting",
        lastUpdateAge: 84_120,
        activities: [
          {
            type: "permission_requested",
            time: 1,
            summary:
              "A very long waiting summary that must yield to the quiet report",
          },
        ],
      },
    );
    const { root } = mount008(
      [
        syntheticNode(rootId, {
          task: "Worktree activity",
          status: undefined,
        }),
        agent,
      ],
      [{ parentId: rootId, childId: agent.id }],
    );
    const card = graphNode(root, agent.id);
    expect(card.querySelector(".quiet-report")?.textContent).toMatch(
      /^No report /,
    );
    for (const row of [25, 52]) {
      const boxes = Array.from(card.querySelectorAll<SVGTSpanElement>("tspan"))
        .filter((span) => Number(span.getAttribute("y")) === row + 260)
        .map((span) => ({
          left: Number(span.getAttribute("x")),
          right:
            Number(span.getAttribute("x")) +
            (span.textContent?.length ?? 0) * 7,
        }))
        .sort((left, right) => left.left - right.left);
      for (let index = 1; index < boxes.length; index++)
        expect(boxes[index - 1].right).toBeLessThanOrEqual(boxes[index].left);
    }
    const styles = readFileSync("media/styles.css", "utf8");
    expect(styles).toMatch(
      /\.graph-nodes \.agent-name\s*\{[^}]*font-size:\s*13px/s,
    );
    expect(styles).toMatch(/\.agent-status-word[^}]*font-size:\s*12px/s);
  });

  it("compacts recent lane slots exposes a bounded resizer and labels footer range", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-11-20T12:00:00.000Z"));
    const rootId = "wt-alpha";
    const old = syntheticNode(`${rootId}-old`, {
      parentId: rootId,
      relationship: "resolved",
      status: "completed",
      terminal: true,
      intervals: [
        {
          start: 0,
          end: 1,
          startAbsoluteTime: "2023-11-13T12:00:00.000Z",
          endAbsoluteTime: "2023-11-13T12:00:01.000Z",
        },
      ],
    });
    const current = ["one", "two"].map((name, index) =>
      syntheticNode(`${rootId}-${name}`, {
        parentId: rootId,
        relationship: "resolved",
        intervals: [
          {
            start: index,
            end: null,
            startAbsoluteTime: `2023-11-20T1${index}:00:00.000Z`,
            endAbsoluteTime: null,
          },
        ],
      }),
    );
    const { root } = mount008(
      [
        syntheticNode(rootId, {
          task: "Worktree activity",
          status: undefined,
        }),
        old,
        ...current,
      ],
      [old, ...current].map((node) => ({
        parentId: rootId,
        childId: node.id,
      })),
    );
    const ys = current.map((node) =>
      Number(graphNode(root, node.id).querySelector("rect")?.getAttribute("y")),
    );
    expect(ys).toEqual([260, 346]);
    const resizer = getByRole(root, "separator", {
      name: /resize agent navigator/i,
    });
    expect(resizer.getAttribute("aria-valuemin")).toBe("240");
    expect(resizer.getAttribute("aria-valuemax")).toBe("480");
    expect(resizer.getAttribute("aria-valuenow")).toBe("300");
    const footer = getByRole(root, "region", { name: /monitor footer/i });
    expect(footer.textContent).toMatch(/2 agents in last 24 hours/i);
    fireEvent.click(getByRole(root, "button", { name: /all runs/i }));
    expect(footer.textContent).toMatch(/3 agents · all runs/i);
  });
});
