import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

describe("independent extension contract (AC1, AC15-16)", () => {
  it("contributes an explicitly named command on the approved stable API floor", async () => {
    const manifest = JSON.parse(await readFile(resolve("package.json"), "utf8"));
    expect(manifest.engines?.vscode).toBe("^1.80.0");
    expect(manifest.contributes?.commands).toContainEqual({
      command: "tallyholdAgentMonitor.open",
      title: "Tallyhold Agent Monitor: Open",
    });
    expect(manifest.main).toMatch(/dist\/extension/);
  });

  it("restricts webview content to bundled resources without remote requests", async () => {
    const { renderPanelHtml } = await import("../src/host/monitorPanel");
    const html = renderPanelHtml({
      scriptUri: "vscode-resource:/extension/main.js",
      styleUri: "vscode-resource:/extension/main.css",
      nonce: "synthetic-nonce",
    });
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("connect-src 'none'");
    expect(html).toContain("img-src 'none'");
    expect(html).toContain("script-src 'nonce-synthetic-nonce'");
    expect(html).toContain('nonce="synthetic-nonce"');
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toContain("unsafe-inline");
  });

  it("rejects forged, stale and oversized webview messages at the host boundary", async () => {
    const { validateWebviewMessage } = await import("../src/shared/protocol");
    expect(validateWebviewMessage({ type: "fitAll", generation: 7 }, 7)).toEqual({
      type: "fitAll", generation: 7,
    });
    expect(validateWebviewMessage({ type: "fitAll", generation: 6 }, 7)).toBeNull();
    expect(validateWebviewMessage({ type: "selectSource", uri: "https://example.invalid/log" }, 7)).toBeNull();
    expect(validateWebviewMessage({ type: "selectNode", generation: 7, id: "x".repeat(65_536) }, 7)).toBeNull();
    expect(validateWebviewMessage({ type: "runCommand", generation: 7 }, 7)).toBeNull();
  });

  it("limits webview local resources to the bundled media directory", async () => {
    const { createPanelOptions } = await import("../src/host/monitorPanel");
    expect(createPanelOptions("file:///extension/media")).toMatchObject({
      enableScripts: true,
      localResourceRoots: ["file:///extension/media"],
    });
  });

  it("rejects hostile resource URIs and attribute-breaking nonce values", async () => {
    const { renderPanelHtml } = await import("../src/host/monitorPanel");
    expect(() => renderPanelHtml({
      scriptUri: "https://example.invalid/remote.js",
      styleUri: "vscode-resource:/extension/main.css",
      nonce: "safe",
    })).toThrow();
    expect(() => renderPanelHtml({
      scriptUri: 'vscode-resource:/extension/main.js" onload="alert(1)',
      styleUri: "javascript:alert(1)",
      nonce: 'bad" onload="alert(1)',
    })).toThrow();
  });

  it("rejects malformed host-to-webview updates rather than rendering arbitrary payloads", async () => {
    const { validateHostMessage } = await import("../src/shared/protocol");
    expect(validateHostMessage({ type: "state", generation: 4, projection: { nodes: [] } }, 4)).toBeTruthy();
    expect(validateHostMessage({ type: "state", generation: 3, projection: { nodes: [] } }, 4)).toBeNull();
    expect(validateHostMessage({
      type: "state", generation: 4,
      projection: { nodes: [{ id: "<img src=x>", activities: "not a list" }] },
    }, 4)).toBeNull();
    expect(validateHostMessage({ type: "evaluate", generation: 4, code: "alert(1)" }, 4)).toBeNull();
  });

  it("excludes private runtime and test inputs from the packaged extension", async () => {
    const ignore = await readFile(resolve(".vscodeignore"), "utf8");
    for (const forbidden of [".agent-flow", ".env", "node_modules", "test", "coverage"]) {
      expect(ignore).toContain(forbidden);
    }
  });

  it("wires trusted discovery and persisted source restoration into activation", async () => {
    const activation = await readFile(resolve("src/extension.ts"), "utf8");
    expect(activation).toContain("resolveInitialSource");
    expect(activation).toContain("workspaceState.get");
    expect(activation).toContain("workspaceState.update");
    expect(activation).toContain("workspace.isTrusted");
  });
});
