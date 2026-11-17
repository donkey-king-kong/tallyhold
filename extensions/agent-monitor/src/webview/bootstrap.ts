import { validateHostMessage } from "../shared/protocol";
import { mountMonitor, type MonitorState } from "./main";

declare function acquireVsCodeApi(): { postMessage(message: unknown): void };

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Agent Monitor root is missing");

const vscode = acquireVsCodeApi();
let generation = 0;
const empty = {
  path: "No source selected",
  sessionId: null,
  sourceGeneration: 0,
  reader: "idle",
  diagnostics: [],
  companions: [],
  projection: { nodes: [] },
};
const monitor = mountMonitor(root, empty, {
  selectSource: () => vscode.postMessage({ type: "selectSource", generation }),
});
window.addEventListener("message", (event) => {
  const candidate = event.data?.generation;
  if (!Number.isInteger(candidate) || candidate < generation) return;
  const message = validateHostMessage(event.data, candidate);
  if (message) {
    generation = candidate;
    monitor.update(message as unknown as MonitorState);
  }
});
window.addEventListener("unload", () => monitor.dispose());
