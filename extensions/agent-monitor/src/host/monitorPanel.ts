import { access } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

function safeResource(uri: string): boolean {
  if (/^vscode-resource:\/[A-Za-z0-9_./-]+$/.test(uri)) return true;
  try {
    const parsed = new URL(uri);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".vscode-cdn.net") &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.hash === ""
    );
  } catch {
    return false;
  }
}

export function renderPanelHtml(input: {
  scriptUri: string;
  styleUri: string;
  nonce: string;
}): string {
  if (
    !safeResource(input.scriptUri) ||
    !safeResource(input.styleUri) ||
    !/^[A-Za-z0-9_-]+$/.test(input.nonce)
  ) {
    throw new Error("Unsafe webview resource");
  }
  return [
    "<!doctype html><html><head>",
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src 'none'; img-src 'none'; style-src ${input.styleUri}; script-src 'nonce-${input.nonce}'">`,
    `<link rel="stylesheet" href="${input.styleUri}">`,
    '</head><body><main id="app"></main>',
    `<script nonce="${input.nonce}" src="${input.scriptUri}"></script>`,
    "</body></html>",
  ].join("");
}

export function createPanelOptions(mediaRoot: string) {
  return { enableScripts: true, localResourceRoots: [mediaRoot] };
}

export async function discoverWorktreeSources(
  roots: string[],
  options: { trusted: boolean },
) {
  if (!options.trusted) return [];
  const found: string[] = [];
  for (const root of roots) {
    const path = join(root, ".agent-flow", "agent-flow-events.jsonl");
    try {
      await access(path);
      found.push(pathToFileURL(path).href);
    } catch {
      // Missing worktree streams are not discoveries.
    }
  }
  return found;
}

export async function resolveInitialSource(
  stored: string | null,
  roots: string[],
  options: { trusted: boolean },
): Promise<string | null> {
  if (!options.trusted) return null;
  if (stored) {
    try {
      if (new URL(stored).protocol === "file:") return stored;
    } catch {
      // Ignore invalid persisted values and continue with discovery.
    }
  }
  return (await discoverWorktreeSources(roots, options))[0] ?? null;
}
