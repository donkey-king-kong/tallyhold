import { mountMonitor } from "../src/webview/main";

export const SESSION_START = "2023-11-14T22:13:20.000Z";

export function syntheticNode(
  id: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    task: id,
    status: "working",
    relationship: "root",
    position: { x: 0, y: 0 },
    terminal: false,
    intervals: [
      {
        start: 0,
        end: null,
        certainty: "reported",
        startAbsoluteTime: SESSION_START,
        endAbsoluteTime: null,
      },
    ],
    activities: [
      {
        type: "agent_spawn",
        time: 0,
        absoluteTime: SESSION_START,
        summary: id,
      },
    ],
    lastUpdateAge: 0,
    reportedRole: null,
    ...overrides,
  };
}

export function syntheticView(
  nodes: Array<Record<string, unknown>>,
  edges: Array<{ parentId: string; childId: string }> = [],
  extras: Record<string, unknown> = {},
) {
  return {
    path: "/synthetic/.agent-flow/agent-flow-events.jsonl",
    sessionId: "synthetic-session",
    sourceGeneration: 1,
    reader: "following",
    diagnostics: [],
    companions: [],
    projection: {
      nodes,
      edges,
      diagnostics: [],
      lastEventAbsoluteTime: SESSION_START,
    },
    ...extras,
  };
}

export function mountSynthetic(
  nodes: Array<Record<string, unknown>>,
  edges: Array<{ parentId: string; childId: string }> = [],
  extras: Record<string, unknown> = {},
) {
  const root = document.createElement("main");
  document.body.append(root);
  const app = mountMonitor(root, syntheticView(nodes, edges, extras));
  return { root, app };
}

export function twoLanes() {
  const anchor = syntheticNode("orchestrator", { task: "Coordinate" });
  const alpha = syntheticNode("wt-a1", {
    task: "Review accounts",
    parentId: "orchestrator",
    relationship: "resolved",
  });
  const beta = syntheticNode("wt-b2", {
    task: "Import portfolio",
    parentId: "orchestrator",
    relationship: "resolved",
  });
  const reviewer = syntheticNode("a1-reviewer", {
    task: "Review tests",
    parentId: "wt-a1",
    relationship: "resolved",
  });
  const importer = syntheticNode("b2-importer", {
    task: "Import rows",
    parentId: "wt-b2",
    relationship: "resolved",
  });
  return {
    nodes: [anchor, alpha, beta, reviewer, importer],
    edges: [
      { parentId: "orchestrator", childId: "wt-a1" },
      { parentId: "orchestrator", childId: "wt-b2" },
      { parentId: "wt-a1", childId: "a1-reviewer" },
      { parentId: "wt-b2", childId: "b2-importer" },
    ],
  };
}
