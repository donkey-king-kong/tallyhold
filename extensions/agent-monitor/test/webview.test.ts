// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, getByRole, getByText, queryByText } from "@testing-library/dom";

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
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
    activities: [{ type: "agent_spawn", time: 0, summary: "<img src=x onerror=alert(1)>" }],
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
    expect(getByRole(root, "button", { name: /done/i })).toBeTruthy();
    expect(getByRole(root, "button", { name: /active/i })).toBeTruthy();
    fireEvent.click(getByRole(root, "checkbox", { name: /last reported nonterminal/i }));
    expect(queryByText(root, "Finished review")).toBeNull();
    fireEvent.click(getByRole(root, "checkbox", { name: /last reported nonterminal/i }));
    expect(getByRole(root, "button", { name: /done/i })).toBeTruthy();
  });

  it("selects a completed node by keyboard and retains chronological inspector history", async () => {
    const { root } = await mount();
    const target = getByRole(root, "button", { name: /done/i });
    target.focus();
    fireEvent.keyDown(target, { key: "Enter" });
    expect(getByText(root, "Finished review")).toBeTruthy();
    expect(getByText(root, /unavailable/i)).toBeTruthy();
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
    fireEvent.click(getByRole(root, "button", { name: /done/i }));
    expect(root.textContent).toContain("<img src=x onerror=alert(1)>");
    expect(root.querySelector("img")).toBeNull();
    expect(root.textContent).toMatch(/completed/i);
  });

  it("offers keyboard-operated zoom and pan without losing the selected inspector on update", async () => {
    const { root, app } = await mount();
    fireEvent.click(getByRole(root, "button", { name: /done/i }));
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
});
