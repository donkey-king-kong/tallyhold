// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, getAllByRole, getByRole, getByText, queryByText, within } from "@testing-library/dom";

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
  vi.useRealTimers();
});

function view(nodes: Array<Record<string, unknown>>) {
  return {
    path: "/worktree/.agent-flow/agent-flow-events.jsonl",
    sessionId: "s1",
    reader: "following",
    diagnostics: [],
    projection: { nodes },
  };
}

function node(id: string, status: string) {
  return {
    id, task: id === "done" ? "Finished review" : "Coordinate",
    status, relationship: "root", position: { x: 0, y: id === "done" ? 0 : 120 },
    activities: [
      { type: "agent_spawn", time: 0, summary: "<img src=x onerror=alert(1)>" },
      { type: "agent_complete", time: 1, summary: "Review finished" },
    ],
    intervals: [{ start: 0, end: status === "completed" ? 1 : null }],
    lastUpdateAge: null,
  };
}

async function mount(nodes = [node("done", "completed"), node("active", "working")]) {
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
    expect(getAllByRole(root, "button", { name: /done/i }).length).toBeGreaterThan(0);
    expect(getByRole(root, "button", { name: /active/i })).toBeTruthy();
    fireEvent.click(getByRole(root, "checkbox", { name: /last reported nonterminal/i }));
    expect(queryByText(root, "Finished review")).toBeNull();
    fireEvent.click(getByRole(root, "checkbox", { name: /last reported nonterminal/i }));
    expect(getAllByRole(root, "button", { name: /done/i }).length).toBeGreaterThan(0);
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
    expect(history.textContent?.indexOf("agent_spawn")).toBeLessThan(history.textContent!.indexOf("Review finished"));
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
    fireEvent.click(getByRole(root, "button", { name: /fit all/i }));
    expect(graph!.outerHTML).toBe(initialCamera);
    for (const name of [/zoom in/i, /zoom out/i, /pan left/i, /pan right/i, /fit all/i]) {
      const control = getByRole(root, "button", { name });
      control.focus();
      fireEvent.keyDown(control, { key: "Enter" });
      expect(document.activeElement).toBe(control);
    }
    app.update(view([node("done", "completed"), node("active", "working"), node("new", "starting")]));
    expect(getByText(root, "Finished review")).toBeTruthy();
    expect(getByRole(root, "button", { name: /new/i })).toBeTruthy();
  });

  it("explains the filter and reveals a selected terminal node without discarding history", async () => {
    const { root } = await mount();
    fireEvent.click(getAllByRole(root, "button", { name: /done/i })[0]);
    fireEvent.click(getByRole(root, "checkbox", { name: /last reported nonterminal/i }));
    expect(root.textContent).toMatch(/last reported.*not.*live|does not.*liveness/i);
    fireEvent.click(getByRole(root, "button", { name: /reveal.*done/i }));
    expect(getAllByRole(root, "button", { name: /done/i }).length).toBeGreaterThan(0);
    expect(getByRole(root, "region", { name: /activity history/i }).textContent).toContain("Review finished");
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
    const navigator = getByRole(root, "navigation", { name: /agent navigator/i });
    expect(within(navigator).getByRole("button", { name: /reviewer/i })).toBeTruthy();
    expect(within(navigator).queryByRole("button", { name: /other/i })).toBeNull();
    expect(root.textContent).toMatch(/2(?:s| seconds)/i);
    vi.advanceTimersByTime(2_000);
    expect(root.textContent).toMatch(/4(?:s| seconds)/i);
    expect(root.textContent).not.toMatch(/verified live/i);
  });
});
