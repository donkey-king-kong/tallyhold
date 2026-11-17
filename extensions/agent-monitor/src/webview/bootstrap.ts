import { validateHostMessage } from "../shared/protocol";
import { mountMonitor, type MonitorState } from "./main";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Agent Monitor root is missing");

const empty = {
  path: "No source selected",
  sessionId: null,
  reader: "idle",
  diagnostics: [],
  projection: { nodes: [] },
};
const monitor = mountMonitor(root, empty);
window.addEventListener("message", (event) => {
  const message = validateHostMessage(event.data, 1);
  if (message) monitor.update(message as unknown as MonitorState);
});
window.addEventListener("unload", () => monitor.dispose());
