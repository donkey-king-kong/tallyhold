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

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
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
