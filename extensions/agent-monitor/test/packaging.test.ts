import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

describe("independent extension contract (AC1, AC15-16)", () => {
  it("contributes an explicitly named command on the approved stable API floor", async () => {
    const manifest = JSON.parse(
      await readFile(resolve("package.json"), "utf8"),
    );
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

  it("allows the stylesheet through the webview CSP source while retaining its resource link", async () => {
    const { renderPanelHtml } = await import("../src/host/monitorPanel");
    const cspSource = "https://monitor.vscode-cdn.net";
    const stylesheet = `${cspSource}/media/styles.css`;
    const html = renderPanelHtml({
      scriptUri: `${cspSource}/media/webview.js`,
      styleUri: stylesheet,
      cspSource,
      nonce: "synthetic-nonce",
    });
    expect(html).toContain(`style-src ${cspSource};`);
    expect(html).not.toContain(`style-src ${stylesheet};`);
    expect(html).toContain(`<link rel="stylesheet" href="${stylesheet}">`);
    expect(html).toContain("script-src 'nonce-synthetic-nonce'");
    expect(html).not.toContain("unsafe-inline");
  });

  it("accepts space-separated webview CSP source lists and preserves their order", async () => {
    const { renderPanelHtml } = await import("../src/host/monitorPanel");
    const scriptUri =
      "https://file+.vscode-resource.vscode-cdn.net/Users/test/media/webview.js";
    const styleUri =
      "https://vscode-remote+ssh-remote+devbox.vscode-resource.vscode-cdn.net/home/test/media/styles.css";
    for (const cspSource of [
      "https://*.vscode-cdn.net",
      "'self' https://*.vscode-cdn.net",
      "https://*.vscode-cdn.net 'self'",
    ]) {
      const html = renderPanelHtml({
        scriptUri,
        styleUri,
        cspSource,
        nonce: "synthetic-nonce",
      });
      expect(html).toContain(`style-src ${cspSource};`);
      expect(html).toContain(`<link rel="stylesheet" href="${styleUri}">`);
      expect(html).toContain(
        `<script nonce="synthetic-nonce" src="${scriptUri}"></script>`,
      );
    }
  });

  it("rejects invalid cspSource lists and reports the rejected value", async () => {
    const { renderPanelHtml } = await import("../src/host/monitorPanel");
    const valid = {
      scriptUri:
        "https://file+.vscode-resource.vscode-cdn.net/Users/test/media/webview.js",
      styleUri:
        "https://vscode-remote+ssh-remote+devbox.vscode-resource.vscode-cdn.net/home/test/media/styles.css",
      nonce: "synthetic-nonce",
    };
    for (const cspSource of [
      "'unsafe-inline'",
      "https://evil.example",
      "https://*.vscode-cdn.net; script-src *",
      "",
    ]) {
      try {
        renderPanelHtml({ ...valid, cspSource });
        throw new Error(`expected ${cspSource} to be rejected`);
      } catch (error) {
        expect(String(error)).toContain("Unsafe webview resource: cspSource");
        expect(String(error)).toContain(JSON.stringify(cspSource));
      }
    }
  });

  it("accepts documented vscode asWebviewUri resource shapes", async () => {
    const { renderPanelHtml } = await import("../src/host/monitorPanel");
    const desktopScript =
      "https://file+.vscode-resource.vscode-cdn.net/Users/test/.vscode/extensions/tallyhold/media/webview.js";
    const remoteStyle =
      "https://vscode-remote+ssh-remote+devbox.vscode-resource.vscode-cdn.net/home/test/.vscode/extensions/tallyhold/media/styles.css";
    const html = renderPanelHtml({
      scriptUri: desktopScript,
      styleUri: remoteStyle,
      cspSource: "'self' https://*.vscode-cdn.net",
      nonce: "synthetic-nonce",
    });
    expect(html).toContain(`src="${desktopScript}"`);
    expect(html).toContain(`href="${remoteStyle}"`);
  });

  it("rejects forged, stale and oversized webview messages at the host boundary", async () => {
    const { validateWebviewMessage } = await import("../src/shared/protocol");
    expect(
      validateWebviewMessage({ type: "fitAll", generation: 7 }, 7),
    ).toEqual({
      type: "fitAll",
      generation: 7,
    });
    expect(
      validateWebviewMessage({ type: "fitAll", generation: 6 }, 7),
    ).toBeNull();
    expect(
      validateWebviewMessage(
        { type: "selectSource", uri: "https://example.invalid/log" },
        7,
      ),
    ).toBeNull();
    expect(
      validateWebviewMessage(
        { type: "selectNode", generation: 7, id: "x".repeat(65_536) },
        7,
      ),
    ).toBeNull();
    expect(
      validateWebviewMessage({ type: "runCommand", generation: 7 }, 7),
    ).toBeNull();
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
    expect(() =>
      renderPanelHtml({
        scriptUri: "https://example.invalid/remote.js",
        styleUri: "vscode-resource:/extension/main.css",
        nonce: "safe",
      }),
    ).toThrow(/scriptUri/);
    expect(() =>
      renderPanelHtml({
        scriptUri: 'vscode-resource:/extension/main.js" onload="alert(1)',
        styleUri: "javascript:alert(1)",
        nonce: 'bad" onload="alert(1)',
      }),
    ).toThrow(/scriptUri|styleUri|nonce/);
  });

  it("rejects malformed host-to-webview updates rather than rendering arbitrary payloads", async () => {
    const { validateHostMessage } = await import("../src/shared/protocol");
    expect(
      validateHostMessage(
        { type: "state", generation: 4, projection: { nodes: [] } },
        4,
      ),
    ).toBeTruthy();
    expect(
      validateHostMessage(
        { type: "state", generation: 3, projection: { nodes: [] } },
        4,
      ),
    ).toBeNull();
    expect(
      validateHostMessage(
        {
          type: "state",
          generation: 4,
          projection: {
            nodes: [{ id: "<img src=x>", activities: "not a list" }],
          },
        },
        4,
      ),
    ).toBeNull();
    expect(
      validateHostMessage(
        { type: "evaluate", generation: 4, code: "alert(1)" },
        4,
      ),
    ).toBeNull();
  });

  it("excludes private runtime and test inputs from the packaged extension", async () => {
    const ignore = await readFile(resolve(".vscodeignore"), "utf8");
    for (const forbidden of [
      ".agent-flow",
      ".env",
      "node_modules",
      "test",
      "coverage",
    ]) {
      expect(ignore).toContain(forbidden);
    }
  });

  it("provides an ignored real-log preview command through the parser pipeline", async () => {
    const manifest = JSON.parse(
      await readFile(resolve("package.json"), "utf8"),
    );
    const repositoryIgnore = await readFile(resolve(".gitignore"), "utf8");
    const script = await readFile(
      resolve("scripts/capture-real-preview.ts"),
      "utf8",
    ).catch(() => "");
    expect(manifest.scripts?.["preview:real"]).toMatch(
      /capture-real-preview.*--/,
    );
    expect(repositoryIgnore).toContain(".preview-real/");
    expect(script).toContain("createSourceController");
    expect(script).toContain("real-wide-last24h.png");
    expect(script).toContain("real-wide-all-runs.png");
    expect(script).toContain("real-narrow-last24h.png");
    expect(script).toContain("real-narrow-all-runs.png");
    expect(script).not.toMatch(/agent-flow-events\.jsonl["']/);
  });

  it("wires trusted discovery and persisted source restoration into activation", async () => {
    const activation = await readFile(resolve("src/extension.ts"), "utf8");
    expect(activation).toContain("resolveInitialSource");
    expect(activation).toContain("workspaceState.get");
    expect(activation).toContain("workspaceState.update");
    expect(activation).toContain("workspace.isTrusted");
  });
});

describe("Feature 008 optional projection protocol boundary", () => {
  it("accepts only bounded and explicitly typed reported facts", async () => {
    const { validateHostMessage } = await import("../src/shared/protocol");
    const node = {
      id: "a1-reviewer",
      reportedRole: "reviewer",
      intervals: [
        {
          start: 0,
          end: null,
          startAbsoluteTime: "2023-11-14T22:13:20.000Z",
          endAbsoluteTime: null,
        },
      ],
      activities: [
        {
          type: "tool_call_end",
          time: 3,
          relatedAgentId: "a1-child",
          toolCategory: "Read",
          toolDurationSeconds: 2.5,
        },
      ],
    };
    const state = (override: Record<string, unknown>) => ({
      type: "state",
      generation: 4,
      projection: {
        nodes: [node],
        lastEventAbsoluteTime: "2023-11-14T22:13:23.000Z",
        ...override,
      },
    });
    expect(validateHostMessage(state({}), 4)).toBeTruthy();
    expect(
      validateHostMessage(state({ lastEventAbsoluteTime: null }), 4),
    ).toBeTruthy();
    expect(
      validateHostMessage(state({ lastEventAbsoluteTime: 42 }), 4),
    ).toBeNull();
    expect(
      validateHostMessage(state({ lastEventAbsoluteTime: "unverified" }), 4),
    ).toBeNull();
    for (const invalid of [
      { intervals: [{ ...node.intervals[0], startAbsoluteTime: 123 }] },
      { activities: [{ ...node.activities[0], relatedAgentId: 42 }] },
      { activities: [{ ...node.activities[0], toolCategory: 42 }] },
      { activities: [{ ...node.activities[0], toolDurationSeconds: "2.5" }] },
    ]) {
      expect(
        validateHostMessage(state({ nodes: [{ ...node, ...invalid }] }), 4),
      ).toBeNull();
    }
    expect(
      validateHostMessage(
        state({
          nodes: [
            {
              ...node,
              reportedRole: { command: "runCommand" },
            },
          ],
        }),
        4,
      ),
    ).toBeNull();
    expect(
      validateHostMessage(
        state({
          nodes: [
            {
              ...node,
              intervals: [
                {
                  ...node.intervals[0],
                  endAbsoluteTime: "javascript:alert(1)",
                },
              ],
            },
          ],
        }),
        4,
      ),
    ).toBeNull();
    expect(
      validateHostMessage(
        state({
          nodes: [
            {
              ...node,
              activities: [
                {
                  ...node.activities[0],
                  relatedAgentId: "javascript:alert(1)",
                },
              ],
            },
          ],
        }),
        4,
      ),
    ).toBeNull();
    expect(
      validateHostMessage(
        state({
          nodes: [
            {
              ...node,
              activities: [
                {
                  ...node.activities[0],
                  toolCategory: "<script>alert(1)</script>",
                },
              ],
            },
          ],
        }),
        4,
      ),
    ).toBeNull();
    expect(
      validateHostMessage(
        state({
          nodes: [
            {
              ...node,
              activities: [{ ...node.activities[0], toolDurationSeconds: -2 }],
            },
          ],
        }),
        4,
      ),
    ).toBeNull();
    expect(
      validateHostMessage(
        state({
          nodes: [
            {
              ...node,
              reportedRole: "r".repeat(1_025),
            },
          ],
        }),
        4,
      ),
    ).toBeNull();
    expect(
      validateHostMessage(
        state({
          nodes: Array.from({ length: 2_001 }, (_, index) => ({
            ...node,
            id: `agent-${index}`,
          })),
        }),
        4,
      ),
    ).toBeNull();
  });
});
