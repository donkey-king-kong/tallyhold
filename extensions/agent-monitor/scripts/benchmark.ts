import { performance } from "node:perf_hooks";
import { appendFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { JSDOM } from "jsdom";
import { createStream } from "../src/core/reconcile";
import { createSourceController } from "../src/host/sourceReader";
import { mountMonitor } from "../src/webview/main";

const encoder = new TextEncoder();
const MIB = 1024 * 1024;

type Envelope = {
  name: string;
  targetBytes: number;
  records: number;
  identities: number;
};

function record(index: number, identities: number, padding: number) {
  const id = `agent-${index % identities}`;
  const value =
    index < identities
      ? {
          time: index / 10,
          type: "agent_spawn",
          payload: { name: id, task: `Synthetic task ${index}` },
          sessionId: "synthetic-benchmark",
          padding: "x".repeat(padding),
        }
      : {
          time: index / 10,
          type: "message",
          payload: { agent: id, summary: `Synthetic activity ${index}` },
          sessionId: "synthetic-benchmark",
          padding: "x".repeat(padding),
        };
  return `${JSON.stringify(value)}\n`;
}

function fixture(envelope: Envelope): Uint8Array {
  const emptyLines = Array.from({ length: envelope.records }, (_, index) =>
    record(index, envelope.identities, 0),
  );
  const baseBytes = emptyLines.reduce(
    (total, line) => total + encoder.encode(line).byteLength,
    0,
  );
  const paddingBytes = envelope.targetBytes - baseBytes;
  if (paddingBytes < 0) throw new Error(`${envelope.name} target is too small`);
  const padding = Math.floor(paddingBytes / envelope.records);
  let remainder = paddingBytes % envelope.records;
  const lines = Array.from({ length: envelope.records }, (_, index) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return record(index, envelope.identities, padding + extra);
  });
  return encoder.encode(lines.join(""));
}

function appendFixture(start: number, count: number, identities: number) {
  return encoder.encode(
    Array.from({ length: count }, (_, offset) =>
      record(start + offset, identities, 0),
    ).join(""),
  );
}

function fitAll(nodes: Array<{ position: { x: number; y: number } }>) {
  return nodes.reduce(
    (result, node) => ({
      minX: Math.min(result.minX, node.position.x),
      minY: Math.min(result.minY, node.position.y),
      maxX: Math.max(result.maxX, node.position.x),
      maxY: Math.max(result.maxY, node.position.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
}

function measure(envelope: Envelope, appendCount = 0) {
  globalThis.gc?.();
  const bytes = fixture(envelope);
  const rssBefore = process.memoryUsage().rss;
  const model = createStream({ source: `synthetic://${envelope.name}` });
  const coldStart = performance.now();
  model.ingest(bytes);
  const snapshot = model.snapshot();
  const coldMs = performance.now() - coldStart;
  const rssDeltaMiB = (process.memoryUsage().rss - rssBefore) / MIB;

  const fitStart = performance.now();
  fitAll(snapshot.nodes);
  const fitAllMs = performance.now() - fitStart;

  let appendMs: number | null = null;
  if (appendCount > 0) {
    const appended = appendFixture(
      envelope.records,
      appendCount,
      envelope.identities,
    );
    const appendStart = performance.now();
    model.ingest(appended);
    model.snapshot();
    appendMs = performance.now() - appendStart;
  }

  return {
    name: envelope.name,
    bytes: bytes.byteLength,
    mebibytes: Number((bytes.byteLength / MIB).toFixed(3)),
    records: envelope.records,
    identities: snapshot.nodes.length,
    coldMs: Number(coldMs.toFixed(2)),
    appendRecords: appendCount,
    appendMs: appendMs === null ? null : Number(appendMs.toFixed(2)),
    fitAllMs: Number(fitAllMs.toFixed(2)),
    rssDeltaMiB: Number(rssDeltaMiB.toFixed(2)),
    diagnostics: snapshot.diagnostics.length,
  };
}

async function measureHost(envelope: Envelope, appendCount: number) {
  const root = await mkdtemp(join(tmpdir(), "agent-monitor-benchmark-"));
  const path = join(root, "events.jsonl");
  const bytes = fixture(envelope);
  const appended = appendFixture(
    envelope.records,
    appendCount,
    envelope.identities,
  );
  const controller = createSourceController();
  try {
    await writeFile(path, bytes);
    const coldStart = performance.now();
    await controller.selectSource(pathToFileURL(path));
    const coldMs = performance.now() - coldStart;

    await appendFile(path, appended);
    const appendStart = performance.now();
    await controller.refresh();
    const appendMs = performance.now() - appendStart;
    const state = controller.getState();
    return {
      coldMs: Number(coldMs.toFixed(2)),
      appendBytes: appended.byteLength,
      appendRecords: appendCount,
      appendMs: Number(appendMs.toFixed(2)),
      reader: state.reader,
      identities: state.projection.nodes.length,
      diagnostics: state.diagnostics.length,
    };
  } finally {
    controller.dispose();
    await rm(root, { recursive: true, force: true });
  }
}

function measureWebview() {
  const dom = new JSDOM("<main></main>", { url: "https://webview.local/" });
  const previousDocument = Reflect.get(globalThis, "document");
  const previousWindow = Reflect.get(globalThis, "window");
  Reflect.set(globalThis, "document", dom.window.document);
  Reflect.set(globalThis, "window", dom.window);
  const activities = Array.from({ length: 100_000 }, (_, index) => ({
    type: "message",
    time: index,
    summary: `Synthetic activity ${index}`,
  }));
  const nodes = Array.from({ length: 2_000 }, (_, index) => ({
    id: `agent-${index}`,
    status: index === 0 ? "working" : "completed",
    terminal: index !== 0,
    relationship: "root",
    position: { x: (index % 20) * 240, y: Math.floor(index / 20) * 100 },
    activities: index === 0 ? activities : [],
    intervals: [],
    lastUpdateAge: 0,
  }));
  const root = dom.window.document.querySelector("main") as HTMLElement;
  const renderStart = performance.now();
  const monitor = mountMonitor(root, {
    path: "/synthetic/events.jsonl",
    sessionId: "synthetic-benchmark",
    reader: "following",
    projection: { nodes, edges: [], diagnostics: [] },
  });
  const initialRenderMs = performance.now() - renderStart;
  const inspectStart = performance.now();
  (root.querySelector("nav button") as HTMLButtonElement).click();
  const inspectorRenderMs = performance.now() - inspectStart;
  const result = {
    identities: nodes.length,
    activities: activities.length,
    initialRenderMs: Number(initialRenderMs.toFixed(2)),
    inspectorRenderMs: Number(inspectorRenderMs.toFixed(2)),
    renderedGraphNodes: root.querySelectorAll("svg [data-node-id]").length,
    renderedActivities: root.querySelectorAll(
      '[aria-label="Activity history"] > div:not(:first-child)',
    ).length,
  };
  monitor.dispose();
  dom.window.close();
  if (previousDocument === undefined)
    Reflect.deleteProperty(globalThis, "document");
  else Reflect.set(globalThis, "document", previousDocument);
  if (previousWindow === undefined)
    Reflect.deleteProperty(globalThis, "window");
  else Reflect.set(globalThis, "window", previousWindow);
  return result;
}

const representative = measure(
  {
    name: "representative",
    targetBytes: 10 * MIB,
    records: 20_000,
    identities: 500,
  },
  200,
);
const maximum = measure({
  name: "maximum",
  targetBytes: 64 * MIB - 1,
  records: 100_000,
  identities: 2_000,
});
const host = await measureHost(
  {
    name: "representative-host",
    targetBytes: 10 * MIB,
    records: 20_000,
    identities: 500,
  },
  200,
);
const webview = measureWebview();

console.log(
  JSON.stringify({ representative, maximum, host, webview }, null, 2),
);
