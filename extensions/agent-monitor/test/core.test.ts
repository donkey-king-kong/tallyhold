import { describe, expect, it } from "vitest";

const encoder = new TextEncoder();
type Payload = Record<string, unknown>;

function record(type: string, payload: Payload, time: number, sessionId = "s1") {
  return JSON.stringify({ time, type, payload, sessionId }) + "\n";
}

function bytes(text: string) {
  return encoder.encode(text);
}

async function stream(options: Record<string, unknown> = {}) {
  const { createStream } = await import("../src/core/reconcile");
  return createStream({ source: "/worktree/.agent-flow/agent-flow-events.jsonl", ...options });
}

const history = [
  record("agent_spawn", { name: "root", isMain: true, task: "Coordinate" }, 0),
  record("subagent_dispatch", { parent: "root", child: "reviewer", task: "Review" }, 1),
  record("agent_spawn", { name: "reviewer", parent: "root", task: "Review" }, 2),
  record("message", { agent: "reviewer", content: "Inspecting" }, 3),
  record("tool_call_start", { agent: "reviewer", tool: "Read" }, 4),
  record("tool_call_end", { agent: "reviewer", tool: "Read", result: "Read activity failed" }, 5),
  record("agent_complete", { name: "reviewer", status: "completed" }, 6),
].join("");

describe("selected-stream projection (AC3-10, AC12-13)", () => {
  it("reconstructs a finished graph without playback and preserves a failed tool outcome", async () => {
    const model = await stream();
    model.ingest(bytes(history));
    const view = model.snapshot();
    expect(view.sessionId).toBe("s1");
    expect(view.nodes.map((node: any) => node.id)).toEqual(["root", "reviewer"]);
    expect(view.nodes[1]).toMatchObject({ parentId: "root", status: "completed", task: "Review" });
    expect(view.nodes[1].activities.map((item: any) => item.type)).toEqual([
      "agent_spawn", "message", "tool_call_start", "tool_call_end", "agent_complete",
    ]);
    expect(view.nodes[1].activities.find((item: any) => item.type === "tool_call_end").outcome).toBe("failed");
    expect(view.nodes[1].intervals).toHaveLength(1);
  });

  it("agrees byte-for-byte for batch and every split point, even mid-UTF-8", async () => {
    const text = history + record("message", { agent: "root", content: "café" }, 7);
    const input = bytes(text);
    const batch = await stream();
    batch.ingest(input);
    for (let cut = 1; cut < input.length; cut++) {
      const incremental = await stream();
      incremental.ingest(input.slice(0, cut));
      incremental.ingest(input.slice(cut));
      expect(incremental.snapshot()).toEqual(batch.snapshot());
    }
  });

  it("does not count a partial final line or duplicate notifications, but counts equal-valued lines at different offsets", async () => {
    const model = await stream();
    const line = record("message", { agent: "root", content: "same" }, 1);
    const spawn = record("agent_spawn", { name: "root" }, 0);
    model.ingest(bytes(spawn + line.slice(0, -1)));
    expect(model.snapshot().nodes[0].activities).toHaveLength(1);
    model.ingest(bytes("\n" + line));
    expect(model.snapshot().nodes[0].activities).toHaveLength(3);
    model.ingest(bytes(""));
    expect(model.snapshot().nodes[0].activities).toHaveLength(3);
  });

  it("retains completed intervals on reactivation and isolates sessions", async () => {
    const model = await stream();
    model.ingest(bytes(
      record("agent_spawn", { name: "worker" }, 0) +
      record("agent_complete", { name: "worker", status: "completed" }, 1) +
      record("agent_spawn", { name: "worker" }, 2) +
      record("message", { agent: "worker", content: "again" }, 3),
    ));
    expect(model.snapshot().nodes[0].intervals).toHaveLength(2);
    expect(model.snapshot().nodes[0].activities).toHaveLength(4);
    expect(model.snapshot().nodes[0].intervals).toMatchObject([
      { start: 0, end: 1, certainty: "reported" },
      { start: 2, end: null, certainty: "reported" },
    ]);
    expect(model.snapshot().nodes[0].status).toBe("working");
    model.ingest(bytes(record("agent_spawn", { name: "worker" }, 4, "other")));
    expect(model.snapshot().nodes).toHaveLength(1);
    expect(model.snapshot().diagnostics.some((item: any) => item.code === "session_mismatch")).toBe(true);
  });

  it("does not invent parents, spawn boundaries, tool pairs or agent failure", async () => {
    const model = await stream();
    model.ingest(bytes(
      record("agent_spawn", { name: "child", parent: "missing" }, 0) +
      record("tool_call_end", { agent: "child", tool: "Read", result: "failed" }, 1) +
      record("tool_call_start", { agent: "child", tool: "Read" }, 2) +
      record("tool_call_start", { agent: "child", tool: "Read" }, 3) +
      record("tool_call_end", { agent: "child", tool: "Read", result: "succeeded" }, 4) +
      record("agent_complete", { name: "unspawned", status: "failed" }, 5),
    ));
    const view = model.snapshot();
    expect(view.nodes.find((node: any) => node.id === "missing")).toBeUndefined();
    expect(view.nodes.find((node: any) => node.id === "child")).toMatchObject({
      parentId: "missing", status: "starting", relationship: "unresolved",
    });
    expect(view.nodes.find((node: any) => node.id === "unspawned").intervals[0].certainty).toBe("incomplete");
    expect(view.nodes.find((node: any) => node.id === "child").activities.some((item: any) => item.pairing === "ambiguous")).toBe(true);
    expect(view.nodes.find((node: any) => node.id === "child").activities[1].pairing).toBe("unmatched");
  });

  it("keeps coordinates on append, status and filter changes, and rejects cycles", async () => {
    const model = await stream();
    model.ingest(bytes(record("agent_spawn", { name: "a", parent: "b" }, 0)));
    const before = model.snapshot().nodes[0].position;
    model.ingest(bytes(
      record("agent_spawn", { name: "b", parent: "a" }, 1) +
      record("agent_complete", { name: "a", status: "completed" }, 2),
    ));
    expect(model.snapshot().nodes.find((node: any) => node.id === "a").position).toEqual(before);
    expect(model.snapshot().nodes).toHaveLength(2);
    expect(model.snapshot().diagnostics.some((item: any) => item.code === "cycle")).toBe(true);
    expect(model.snapshot().edges).not.toContainEqual({ parentId: "a", childId: "b" });
    expect(model.snapshot({ activeOnly: true }).nodes.map((node: any) => node.id)).toEqual(["b"]);
    expect(model.snapshot().nodes.map((node: any) => node.id)).toEqual(["a", "b"]);
  });

  it("survives invalid complete lines and keeps relative time honest without metadata", async () => {
    const model = await stream();
    model.ingest(bytes(
      "{not-json}\n" +
      record("future_event", { agent: "a" }, 1) +
      record("agent_spawn", { name: "a" }, 2),
    ));
    expect(model.snapshot().nodes).toHaveLength(1);
    expect(model.snapshot().diagnostics.map((item: any) => item.code)).toEqual([
      "malformed_record", "unsupported_type",
    ]);
    expect(model.snapshot().nodes[0].lastUpdateAge).toBeNull();
    expect(model.snapshot().nodes[0].activities[0].absoluteTime).toBeNull();
  });

  it("never promotes a quiet nonterminal identity to verified liveness or success", async () => {
    const model = await stream({ sessionStartedAt: 1_700_000_000 });
    model.ingest(bytes(
      record("agent_spawn", { name: "reviewer", task: "Independent review" }, 0) +
      record("message", { agent: "reviewer", content: "Review started" }, 1),
    ));
    const view = model.snapshot();
    expect(view.nodes[0].status).toBe("working");
    expect(view.nodes[0].identityKind).toBe("unspecified");
    expect(view.nodes[0].activities[1].absoluteTime).toBe("2023-11-14T22:13:21.000Z");
    expect(view.nodes[0].intervals[0].end).toBeNull();
  });

  it("preserves valid records after a malformed schema and does not invent activity", async () => {
    const model = await stream();
    model.ingest(bytes(
      record("agent_spawn", { name: "root" }, 0) +
      record("message", { content: "missing agent" }, 1) +
      record("error", { agent: "root", message: "Read failed", status: "blocked" }, 2) +
      record("message", { agent: "root", content: "Recovered" }, 3),
    ));
    expect(model.snapshot().nodes).toHaveLength(1);
    expect(model.snapshot().nodes[0].activities.map((item: any) => item.type)).toEqual([
      "agent_spawn", "error", "message",
    ]);
    expect(model.snapshot().nodes[0].status).toBe("working");
    expect(model.snapshot().diagnostics.some((item: any) => item.code === "invalid_record")).toBe(true);
  });

  it("resolves a late parent without moving either identity or accepting a self-link", async () => {
    const model = await stream();
    model.ingest(bytes(record("agent_spawn", { name: "child", parent: "parent" }, 1)));
    const childPosition = model.snapshot().nodes[0].position;
    model.ingest(bytes(
      record("agent_spawn", { name: "parent" }, 2) +
      record("agent_spawn", { name: "self", parent: "self" }, 3),
    ));
    const view = model.snapshot();
    expect(view.nodes.find((item: any) => item.id === "child").position).toEqual(childPosition);
    expect(view.edges).toContainEqual({ parentId: "parent", childId: "child" });
    expect(view.edges).not.toContainEqual({ parentId: "self", childId: "self" });
    expect(view.nodes.map((item: any) => item.id)).toEqual(["child", "parent", "self"]);
    expect(view.nodes.every((item: any) => Number.isFinite(item.position.x) && Number.isFinite(item.position.y))).toBe(true);
  });

  it("reports duplicate terminal boundaries and post-terminal activity as incomplete", async () => {
    const model = await stream();
    model.ingest(bytes(
      record("agent_spawn", { name: "a" }, 0) +
      record("agent_complete", { name: "a", status: "completed" }, 2) +
      record("agent_complete", { name: "a", status: "completed" }, 3) +
      record("message", { agent: "a", content: "late" }, 4),
    ));
    expect(model.snapshot().nodes[0].intervals).toHaveLength(1);
    expect(model.snapshot().nodes[0].intervals[0]).toMatchObject({ start: 0, end: 2 });
    expect(model.snapshot().nodes[0].activities.slice(-2).every((item: any) => item.certainty === "ambiguous")).toBe(true);
    expect(model.snapshot().nodes[0].status).not.toBe("working");
  });

  it("rejects invalid times and payloads while reporting offsets and source-order anomalies", async () => {
    const model = await stream();
    const first = record("agent_spawn", { name: "root" }, 3);
    const invalid = [
      '{"time":-1,"type":"message","sessionId":"s1","payload":{"agent":"root"}}\n',
      '{"time":null,"type":"message","sessionId":"s1","payload":{"agent":"root"}}\n',
      '{"time":2,"type":"message","sessionId":"s1","payload":[]}\n',
      '{"time":2,"type":"message","sessionId":7,"payload":{"agent":"root"}}\n',
    ].join("");
    model.ingest(bytes(first + invalid + record("message", { agent: "root", content: "late timestamp" }, 1)));
    const view = model.snapshot();
    expect(view.nodes[0].activities.map((item: any) => item.time)).toEqual([3, 1]);
    expect(view.diagnostics.filter((item: any) => item.code === "invalid_record")).toHaveLength(4);
    expect(view.diagnostics.some((item: any) => item.code === "out_of_order_time")).toBe(true);
    expect(view.diagnostics.every((item: any) => Number.isInteger(item.line) && Number.isInteger(item.byteOffset))).toBe(true);
  });

  it("advances verified report age without changing reported agent state", async () => {
    const model = await stream({ sessionStartedAt: 1_700_000_000 });
    model.ingest(bytes(record("agent_spawn", { name: "reviewer" }, 2)));
    expect(model.snapshot({ now: 1_700_000_010_000 }).nodes[0].lastUpdateAge).toBe(8);
    expect(model.snapshot({ now: 1_700_000_070_000 }).nodes[0].lastUpdateAge).toBe(68);
    expect(model.snapshot({ now: 1_700_000_070_000 }).nodes[0].status).toBe("starting");
  });
});
