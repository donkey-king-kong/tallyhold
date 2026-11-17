import { afterEach, describe, expect, it } from "vitest";
import { appendFile, mkdtemp, readFile, rename, rm, truncate, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const roots: string[] = [];
const controllers: Array<{ dispose(): void }> = [];

afterEach(async () => {
  controllers.splice(0).forEach((controller) => controller.dispose());
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function fixture(session: string) {
  const root = await mkdtemp(join(tmpdir(), "tallyhold-monitor-"));
  roots.push(root);
  const path = join(root, "events.jsonl");
  const line = JSON.stringify({
    time: 0, type: "agent_spawn", sessionId: session, payload: { name: "same" },
  }) + "\n";
  await writeFile(path, line);
  return { path, line };
}

async function controller() {
  const { createSourceController } = await import("../src/host/sourceReader");
  const instance = createSourceController();
  controllers.push(instance);
  return instance;
}

describe("selected local source (AC2, AC9-11, AC13, AC15)", () => {
  it("switches between worktrees without mixing same-named agents or sessions", async () => {
    const first = await fixture("first");
    const second = await fixture("second");
    const reader = await controller();
    await reader.selectSource(pathToFileURL(first.path));
    expect(reader.getState()).toMatchObject({
      path: first.path, sessionId: "first", reader: "following",
    });
    await reader.selectSource(pathToFileURL(second.path));
    expect(reader.getState()).toMatchObject({
      path: second.path, sessionId: "second", reader: "following",
    });
    expect(reader.getState().projection.nodes.map((node: any) => node.id)).toEqual(["same"]);
  });

  it("preserves the valid view on failure and recovers without duplicate history", async () => {
    const source = await fixture("s1");
    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));
    await rm(source.path);
    await reader.refresh();
    expect(reader.getState().reader).toBe("stale");
    expect(reader.getState().projection.nodes).toHaveLength(1);
    await writeFile(source.path, source.line);
    await reader.refresh();
    await reader.refresh();
    expect(reader.getState().reader).toBe("following");
    expect(reader.getState().projection.nodes[0].activities).toHaveLength(1);
    expect(await readFile(source.path, "utf8")).toBe(source.line);
  });

  it("reconstructs after truncation, same-size replacement and partial append", async () => {
    const source = await fixture("old");
    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));
    await writeFile(source.path, "");
    await reader.refresh();
    expect(reader.getState().projection.nodes).toHaveLength(0);
    const replacement = source.line.replace("old", "new");
    const staging = join(roots[0], "staging");
    await writeFile(staging, replacement.slice(0, -1));
    await rename(staging, source.path);
    await reader.refresh();
    expect(reader.getState().projection.nodes).toHaveLength(0);
    await appendFile(source.path, "\n");
    await reader.refresh();
    expect(reader.getState().sessionId).toBe("new");
    expect(reader.getState().projection.nodes[0].activities).toHaveLength(1);
  });

  it("reports missing files and oversize lines without a false successful connection", async () => {
    const root = await mkdtemp(join(tmpdir(), "tallyhold-monitor-"));
    roots.push(root);
    const path = join(root, "missing.jsonl");
    const reader = await controller();
    await reader.selectSource(pathToFileURL(path));
    expect(reader.getState().reader).toBe("error");
    await writeFile(path, "x".repeat(1024 * 1024 + 1) + "\n");
    await reader.refresh();
    expect(reader.getState().reader).not.toBe("following");
    expect(reader.getState().diagnostics.some((item: any) => item.code === "limit_exceeded")).toBe(true);
  });

  it("never allows a stale read to overwrite a later selection", async () => {
    const first = await fixture("first");
    const second = await fixture("second");
    const reader = await controller();
    const pending = reader.selectSource(pathToFileURL(first.path));
    await reader.selectSource(pathToFileURL(second.path));
    await pending;
    expect(reader.getState().sessionId).toBe("second");
  });

  it("reopens from the selected bytes and ignores a conflicting companion snapshot", async () => {
    const source = await fixture("stream-session");
    const metadata = join(roots[0], "session.json");
    await writeFile(metadata, JSON.stringify({
      session_id: "different-session", started_at: 1_700_000_000,
    }));
    const first = await controller();
    await first.selectSource(pathToFileURL(source.path));
    expect(first.getState().projection.nodes[0].activities[0].absoluteTime).toBeNull();
    first.dispose();
    const reopened = await controller();
    await reopened.selectSource(pathToFileURL(source.path));
    expect(reopened.getState().projection.nodes[0].activities).toHaveLength(1);
    expect(await readFile(metadata, "utf8")).toContain("different-session");
  });

  it("rejects non-local source URIs without making a network request", async () => {
    const reader = await controller();
    await expect(reader.selectSource(new URL("https://example.invalid/private.jsonl"))).rejects.toThrow();
    expect(reader.getState().projection.nodes).toHaveLength(0);
  });

  it("replays a same-size replacement instead of retaining the old session", async () => {
    const source = await fixture("old");
    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));
    const staging = join(roots[0], "same-size");
    await writeFile(staging, source.line.replace("old", "new"));
    await rename(staging, source.path);
    await reader.refresh();
    expect(reader.getState().sessionId).toBe("new");
    expect(reader.getState().projection.nodes[0].activities).toHaveLength(1);
  });

  it("reports the 64 MiB file boundary without parsing or silently truncating it", async () => {
    const source = await fixture("s1");
    await truncate(source.path, 64 * 1024 * 1024 + 1);
    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));
    expect(reader.getState().reader).not.toBe("following");
    expect(reader.getState().diagnostics.some((item: any) => item.code === "limit_exceeded")).toBe(true);
  });

  it("labels identity and complete-record limits instead of dropping history", async () => {
    const source = await fixture("s1");
    const reader = await controller();
    const identities = Array.from({ length: 2_001 }, (_, index) => JSON.stringify({
      time: index + 1, type: "agent_spawn", sessionId: "s1",
      payload: { name: `agent_${index}` },
    })).join("\n");
    await appendFile(source.path, identities + "\n");
    await reader.selectSource(pathToFileURL(source.path));
    expect(reader.getState().reader).not.toBe("following");
    expect(reader.getState().diagnostics.some((item: any) => item.code === "limit_exceeded")).toBe(true);

    const repeated = Array.from({ length: 100_001 }, (_, index) => JSON.stringify({
      time: index, type: "message", sessionId: "s1",
      payload: { agent: "same", content: "status" },
    })).join("\n");
    await writeFile(source.path, source.line + repeated + "\n");
    await reader.refresh();
    expect(reader.getState().reader).not.toBe("following");
    expect(reader.getState().diagnostics.some((item: any) => item.code === "limit_exceeded")).toBe(true);
  });
});
