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
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toContain("unsafe-inline");
  });
});
