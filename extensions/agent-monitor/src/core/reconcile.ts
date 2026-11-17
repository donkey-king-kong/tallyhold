type JsonObject = Record<string, unknown>;

type Diagnostic = {
  code: string;
  line: number;
  byteOffset: number;
  message?: string;
};

type Activity = {
  type: string;
  time: number;
  summary: string;
  absoluteTime: string | null;
  outcome?: "succeeded" | "failed";
  pairing?: "paired" | "unmatched" | "ambiguous";
  certainty?: "reported" | "ambiguous";
};

type Interval = {
  start: number | null;
  end: number | null;
  certainty: "reported" | "incomplete";
};

type NodeState = {
  id: string;
  parentId?: string;
  task?: string;
  status: string;
  relationship: "root" | "resolved" | "unresolved";
  position: { x: number; y: number };
  activities: Activity[];
  intervals: Interval[];
  identityKind: "unspecified";
  lastTime: number;
  terminal: boolean;
  openTools: Map<string, { count: number; ambiguous: boolean }>;
};

const supported = new Set([
  "agent_spawn",
  "agent_complete",
  "message",
  "error",
  "permission_requested",
  "tool_call_start",
  "tool_call_end",
  "subagent_dispatch",
  "subagent_return",
]);

function concatenate(left: Uint8Array, right: Uint8Array): Uint8Array {
  const value = new Uint8Array(left.length + right.length);
  value.set(left);
  value.set(right, left.length);
  return value;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function eventIdentity(type: string, payload: JsonObject): string | undefined {
  if (type === "agent_spawn" || type === "agent_complete")
    return text(payload.name);
  if (type === "subagent_dispatch") return text(payload.parent);
  if (type === "subagent_return")
    return text(payload.parent) ?? text(payload.agent);
  return text(payload.agent);
}

function summary(type: string, payload: JsonObject): string {
  const candidate =
    payload.content ?? payload.message ?? payload.result ?? payload.task;
  return typeof candidate === "string" ? candidate : type;
}

export function createStream(options: {
  source: string;
  sessionStartedAt?: number;
}) {
  let pending: Uint8Array<ArrayBufferLike> = new Uint8Array();
  let processedOffset = 0;
  let lineNumber = 0;
  let sessionId: string | null = null;
  let lastReportedTime = -1;
  const nodes: NodeState[] = [];
  const byId = new Map<string, NodeState>();
  const diagnostics: Diagnostic[] = [];
  const edges: Array<{ parentId: string; childId: string }> = [];

  const diagnose = (code: string, byteOffset: number, message?: string) => {
    diagnostics.push({ code, line: lineNumber, byteOffset, message });
  };

  const positionFor = (parentId?: string) => {
    const parent = parentId ? byId.get(parentId) : undefined;
    return { x: parent ? parent.position.x + 240 : 0, y: nodes.length * 120 };
  };

  const ensureNode = (
    id: string,
    parentId?: string,
    task?: string,
  ): NodeState => {
    let node = byId.get(id);
    if (!node) {
      node = {
        id,
        parentId,
        task,
        status: "unknown",
        relationship: parentId ? "unresolved" : "root",
        position: positionFor(parentId),
        activities: [],
        intervals: [],
        identityKind: "unspecified",
        lastTime: 0,
        terminal: false,
        openTools: new Map(),
      };
      nodes.push(node);
      byId.set(id, node);
    } else {
      if (parentId && !node.parentId) node.parentId = parentId;
      if (task && !node.task) node.task = task;
    }
    return node;
  };

  const wouldCycle = (parentId: string, childId: string): boolean => {
    if (parentId === childId) return true;
    let cursor = byId.get(parentId);
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor.id)) {
      if (cursor.id === childId) return true;
      seen.add(cursor.id);
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
    return false;
  };

  const reconcileEdges = () => {
    edges.length = 0;
    for (const node of nodes) {
      if (!node.parentId || !byId.has(node.parentId)) {
        node.relationship = node.parentId ? "unresolved" : "root";
        continue;
      }
      if (wouldCycle(node.parentId, node.id)) {
        if (
          !diagnostics.some(
            (item) => item.code === "cycle" && item.message === node.id,
          )
        ) {
          diagnostics.push({
            code: "cycle",
            line: lineNumber,
            byteOffset: processedOffset,
            message: node.id,
          });
        }
        node.relationship = "unresolved";
        continue;
      }
      node.relationship = "resolved";
      if (
        !edges.some(
          (edge) => edge.parentId === node.parentId && edge.childId === node.id,
        )
      ) {
        edges.push({ parentId: node.parentId, childId: node.id });
      }
    }
  };

  const absoluteTime = (time: number) =>
    options.sessionStartedAt === undefined
      ? null
      : new Date((options.sessionStartedAt + time) * 1000).toISOString();

  const processRecord = (raw: string, byteOffset: number) => {
    let record: JsonObject;
    try {
      record = JSON.parse(raw) as JsonObject;
    } catch {
      diagnose("malformed_record", byteOffset);
      return;
    }
    if (
      !isObject(record) ||
      typeof record.type !== "string" ||
      typeof record.sessionId !== "string" ||
      !isObject(record.payload) ||
      typeof record.time !== "number" ||
      !Number.isFinite(record.time) ||
      record.time < 0
    ) {
      diagnose("invalid_record", byteOffset);
      return;
    }
    if (!supported.has(record.type)) {
      diagnose("unsupported_type", byteOffset);
      return;
    }
    if (sessionId === null) sessionId = record.sessionId;
    if (record.sessionId !== sessionId) {
      diagnose("session_mismatch", byteOffset);
      return;
    }
    if (record.time < lastReportedTime)
      diagnose("out_of_order_time", byteOffset);
    lastReportedTime = record.time;

    const payload = record.payload;
    const id = eventIdentity(record.type, payload);
    if (!id) {
      diagnose("invalid_record", byteOffset);
      return;
    }
    const reportsRelationship =
      record.type !== "subagent_dispatch" && record.type !== "subagent_return";
    const node = ensureNode(
      id,
      reportsRelationship ? text(payload.parent) : undefined,
      reportsRelationship ? text(payload.task) : undefined,
    );
    const activity: Activity = {
      type: record.type,
      time: record.time,
      summary: summary(record.type, payload),
      absoluteTime: absoluteTime(record.time),
    };

    if (node.terminal && record.type !== "agent_spawn")
      activity.certainty = "ambiguous";
    if (record.type === "agent_spawn") {
      node.intervals.push({
        start: record.time,
        end: null,
        certainty: "reported",
      });
      node.status = "starting";
      node.terminal = false;
    } else if (record.type === "agent_complete") {
      const open = [...node.intervals]
        .reverse()
        .find((interval) => interval.end === null);
      if (open) {
        open.end = record.time;
      } else if (node.intervals.length === 0) {
        node.intervals.push({
          start: null,
          end: record.time,
          certainty: "incomplete",
        });
      } else {
        activity.certainty = "ambiguous";
      }
      node.status = text(payload.status) ?? "completed";
      node.terminal = true;
    } else if (record.type === "message") {
      if (!node.terminal) node.status = "working";
    } else if (
      record.type === "error" ||
      record.type === "permission_requested"
    ) {
      if (!node.terminal)
        node.status =
          text(payload.status) ??
          (record.type === "error" ? "blocked" : "waiting");
    } else if (record.type === "tool_call_start") {
      const tool = text(payload.tool) ?? "unknown";
      const open = node.openTools.get(tool) ?? { count: 0, ambiguous: false };
      open.count++;
      if (open.count > 1) open.ambiguous = true;
      node.openTools.set(tool, open);
    } else if (record.type === "tool_call_end") {
      const tool = text(payload.tool) ?? "unknown";
      const open = node.openTools.get(tool);
      activity.pairing = !open
        ? "unmatched"
        : open.ambiguous
          ? "ambiguous"
          : "paired";
      if (open) {
        open.count--;
        if (open.count === 0) node.openTools.delete(tool);
      }
      activity.outcome = /fail|error/i.test(
        String(payload.result ?? payload.outcome ?? ""),
      )
        ? "failed"
        : "succeeded";
    }
    node.lastTime = record.time;
    node.activities.push(activity);
    reconcileEdges();
  };

  return {
    ingest(input: Uint8Array) {
      pending = concatenate(pending, input);
      let start = 0;
      for (let index = 0; index < pending.length; index++) {
        if (pending[index] !== 10) continue;
        lineNumber++;
        const lineBytes = pending.slice(start, index);
        const offset = processedOffset + start;
        const raw = new TextDecoder("utf-8", { fatal: false }).decode(
          lineBytes,
        );
        if (raw.length > 0) processRecord(raw, offset);
        start = index + 1;
      }
      processedOffset += start;
      pending = pending.slice(start);
    },
    snapshot(snapshotOptions: { activeOnly?: boolean; now?: number } = {}) {
      const now = snapshotOptions.now ?? Date.now();
      const selected = snapshotOptions.activeOnly
        ? nodes.filter((node) => !node.terminal)
        : nodes;
      return {
        source: options.source,
        sessionId,
        nodes: selected.map((node) => ({
          id: node.id,
          parentId: node.parentId,
          task: node.task,
          status: node.status,
          relationship: node.relationship,
          position: { ...node.position },
          activities: node.activities.map((activity) => ({ ...activity })),
          intervals: node.intervals.map((interval) => ({ ...interval })),
          identityKind: node.identityKind,
          terminal: node.terminal,
          lastUpdateAge:
            options.sessionStartedAt === undefined
              ? null
              : Math.max(
                  0,
                  Math.floor(
                    now / 1000 - options.sessionStartedAt - node.lastTime,
                  ),
                ),
        })),
        edges: edges.map((edge) => ({ ...edge })),
        diagnostics: diagnostics.map((item) => ({ ...item })),
      };
    },
  };
}
