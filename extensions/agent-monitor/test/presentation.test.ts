// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, getByRole, within } from "@testing-library/dom";
import {
  mountSynthetic,
  SESSION_START,
  syntheticNode,
  syntheticView,
} from "./ui-fixtures";

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

function mount(
  nodes: Array<Record<string, unknown>>,
  edges = [] as Array<{
    parentId: string;
    childId: string;
  }>,
) {
  const result = mountSynthetic(nodes, edges);
  dispose = () => result.app.dispose();
  return result;
}

describe("Feature 008 presentation through the mounted webview", () => {
  it("lane assignment preserves slots across late root and append", () => {
    const orphan = syntheticNode("a1-orphan", {
      parentId: "wt-a1",
      relationship: "unresolved",
      position: { x: 0, y: 0 },
    });
    const { root, app } = mount([orphan]);
    const rect = () =>
      root.querySelector('g[data-node-id="a1-orphan"] rect')?.getAttribute("x");
    const before = rect();
    const lane = syntheticNode("wt-a1", { task: "Review accounts" });
    app.update(
      syntheticView(
        [
          { ...orphan, relationship: "resolved" },
          lane,
          syntheticNode("a1-new", {
            parentId: "wt-a1",
            relationship: "resolved",
          }),
        ],
        [
          { parentId: "wt-a1", childId: "a1-orphan" },
          { parentId: "wt-a1", childId: "a1-new" },
        ],
      ),
    );
    expect(rect()).toBe(before);
    const nav = getByRole(root, "navigation", { name: /agent navigator/i });
    expect(
      within(nav).getByRole("button", { name: /^a1-orphan\b/i }),
    ).toBeTruthy();
    expect(root.textContent).toContain("Review accounts");
    expect(root.querySelectorAll("svg [data-edge]")).toHaveLength(2);
  });

  it("display name strips only assigned lane prefix and preserves unmatched and ungrouped ids", () => {
    const rootNode = syntheticNode("wt-alpha", { task: "Review accounts" });
    const matching = syntheticNode("alpha-reviewer", {
      parentId: "wt-alpha",
      relationship: "resolved",
    });
    const unmatched = syntheticNode("beta-reviewer", {
      parentId: "wt-alpha",
      relationship: "resolved",
    });
    const ungrouped = syntheticNode("alpha-orphan");
    const { root } = mount(
      [rootNode, matching, unmatched, ungrouped],
      [
        { parentId: "wt-alpha", childId: "alpha-reviewer" },
        { parentId: "wt-alpha", childId: "beta-reviewer" },
      ],
    );
    const nav = getByRole(root, "navigation", { name: /agent navigator/i });
    const shortened = within(nav).getByRole("button", { name: /^reviewer\b/i });
    expect(shortened.textContent).toMatch(/^reviewer\b/i);
    expect(
      within(nav).getByRole("button", { name: /^beta-reviewer\b/i }),
    ).toBeTruthy();
    expect(
      within(nav).getByRole("button", { name: /^alpha-orphan\b/i }),
    ).toBeTruthy();
    fireEvent.click(shortened);
    const inspector = getByRole(root, "region", { name: /agent details/i });
    expect(inspector.textContent).toContain("alpha-reviewer");
    expect(inspector.textContent).toMatch(/role:\s*unavailable/i);
    expect(getByRole(inspector, "button", { name: /copy.*id/i })).toBeTruthy();
  });

  it("no report threshold requires verified age", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-11-14T23:13:20.000Z"));
    const { root, app } = mount([
      syntheticNode("one-hour", { lastUpdateAge: 3_600 }),
      syntheticNode("unknown", { lastUpdateAge: null }),
    ]);
    expect(root.textContent).not.toMatch(/No report 1h/i);
    vi.advanceTimersByTime(2_000);
    expect(root.textContent).toMatch(/No report 1h/);
    app.update(
      syntheticView([syntheticNode("unknown", { lastUpdateAge: null })]),
    );
    expect(root.textContent).not.toMatch(/No report \d/);
    expect(root.textContent).toMatch(/unavailable/i);
  });

  it("local time ages durations and relative fallback respect verified bounds", () => {
    vi.stubEnv("TZ", "Asia/Singapore");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-11-14T22:17:00.000Z"));
    const completed = syntheticNode("a1-done", {
      status: "completed",
      terminal: true,
      intervals: [
        {
          start: 0,
          end: 195,
          certainty: "reported",
          startAbsoluteTime: SESSION_START,
          endAbsoluteTime: "2023-11-14T22:16:35.000Z",
        },
      ],
      lastUpdateAge: 12,
    });
    const relative = syntheticNode("unanchored", {
      intervals: [{ start: 499_993.939, end: null, certainty: "reported" }],
      lastUpdateAge: null,
      activities: [
        {
          type: "message",
          time: 499_993.939,
          absoluteTime: null,
          summary: "relative",
        },
      ],
    });
    const { root } = mount([completed, relative]);
    const nav = getByRole(root, "navigation", { name: /agent navigator/i });
    fireEvent.click(within(nav).getByRole("button", { name: /a1-done/i }));
    const inspector = getByRole(root, "region", { name: /agent details/i });
    expect(inspector.textContent).toMatch(/Ran 06:13.*06:16.*3m 15s/);
    expect(inspector.textContent).toMatch(/12s/);
    expect(inspector.textContent).toMatch(/SGT|GMT\+8/);
    expect(inspector.textContent).not.toMatch(/\.000Z/);
    fireEvent.click(within(nav).getByRole("button", { name: /unanchored/i }));
    expect(
      getByRole(root, "region", { name: /agent details/i }).textContent,
    ).toMatch(/session-relative|unavailable/i);
    expect(root.textContent).not.toMatch(/1970/);
  });

  it("event labels avoid raw repetition and preserve ambiguous tools", () => {
    const reported = syntheticNode("wt-a1", {
      activities: [
        {
          type: "agent_spawn",
          time: 0,
          summary: "agent_spawn",
          absoluteTime: SESSION_START,
        },
        {
          type: "subagent_dispatch",
          time: 1,
          relatedAgentId: "a1-reviewer",
          summary: "subagent_dispatch",
        },
        {
          type: "subagent_return",
          time: 2,
          relatedAgentId: "a1-reviewer",
          summary: "subagent_return",
        },
        { type: "permission_requested", time: 3, summary: "Approve file read" },
        {
          type: "tool_call_end",
          time: 6,
          summary: "ok",
          toolCategory: "Read",
          toolDurationSeconds: 3,
          pairing: "paired",
          outcome: "succeeded",
        },
        {
          type: "tool_call_end",
          time: 7,
          summary: "failed",
          toolCategory: "Write",
          toolDurationSeconds: null,
          pairing: "ambiguous",
          outcome: "failed",
        },
        { type: "new_report_kind", time: 8, summary: "Unexpected detail" },
      ],
    });
    const { root } = mount([reported]);
    fireEvent.click(
      getByRole(root, "navigation", { name: /agent navigator/i }).querySelector(
        "button",
      )!,
    );
    const history = getByRole(root, "region", { name: /activity history/i });
    expect(history.textContent).toMatch(/Started/);
    expect(history.textContent).toMatch(/Handed work to.*a1-reviewer/);
    expect(history.textContent).toMatch(/Got result from.*a1-reviewer/);
    expect(history.textContent).toMatch(/Waiting:.*Approve file read/);
    expect(history.textContent).toMatch(/Read.*Succeeded.*3s/);
    expect(history.textContent).toMatch(/Write.*Failed.*ambiguous/i);
    expect(history.textContent).toMatch(
      /Other reported event.*new_report_kind/,
    );
    expect(history.textContent).not.toMatch(
      /subagent_return:\s*subagent_return/,
    );
  });

  it("last 24 hours groups older and unknown intervals without dropping history", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-11-20T22:14:00.000Z"));
    const old = syntheticNode("old-run", {
      status: "completed",
      terminal: true,
      intervals: [
        {
          start: 0,
          end: 10,
          certainty: "reported",
          startAbsoluteTime: SESSION_START,
          endAbsoluteTime: "2023-11-14T22:13:30.000Z",
        },
      ],
    });
    const recent = syntheticNode("recent-run", {
      intervals: [
        {
          start: 0,
          end: null,
          certainty: "reported",
          startAbsoluteTime: "2023-11-20T21:13:20.000Z",
          endAbsoluteTime: null,
        },
      ],
      activities: [
        {
          type: "message",
          time: 0,
          summary: "Current",
          absoluteTime: "2023-11-20T21:13:20.000Z",
        },
      ],
    });
    const unknown = syntheticNode("unknown-run", {
      intervals: [{ start: 0, end: null, certainty: "reported" }],
      lastUpdateAge: null,
    });
    const { root } = mount([old, recent, unknown]);
    fireEvent.click(getByRole(root, "button", { name: /last 24 hours/i }));
    const nav = getByRole(root, "navigation", { name: /agent navigator/i });
    expect(
      within(nav).getByRole("button", { name: /recent-run/i }),
    ).toBeTruthy();
    expect(
      within(nav).getByRole("button", { name: /older runs.*1/i }),
    ).toBeTruthy();
    expect(within(nav).queryByRole("button", { name: /^old-run/i })).toBeNull();
    expect(nav.textContent).toMatch(/time unavailable.*unknown-run/i);
    fireEvent.click(getByRole(root, "button", { name: /all runs/i }));
    expect(
      within(
        getByRole(root, "navigation", {
          name: /agent navigator/i,
        }),
      ).getByRole("button", { name: /^old-run/i }),
    ).toBeTruthy();
  });
});
