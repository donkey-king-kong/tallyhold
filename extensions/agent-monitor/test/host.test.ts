import { afterEach, describe, expect, it, vi } from "vitest";
import {
  appendFile,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  truncate,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const roots: string[] = [];
const controllers: Array<{ dispose(): void }> = [];

afterEach(async () => {
  controllers.splice(0).forEach((controller) => controller.dispose());
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
  vi.restoreAllMocks();
});

async function fixture(session: string) {
  const root = await mkdtemp(join(tmpdir(), "tallyhold-monitor-"));
  roots.push(root);
  const path = join(root, "events.jsonl");
  const line =
    JSON.stringify({
      time: 0,
      type: "agent_spawn",
      sessionId: session,
      payload: { name: "same" },
    }) + "\n";
  await writeFile(path, line);
  return { path, line };
}

async function controller(options: Record<string, unknown> = {}) {
  const { createSourceController } = await import("../src/host/sourceReader");
  const instance = createSourceController(options);
  controllers.push(instance);
  return instance;
}

describe("selected local source (AC2, AC9-11, AC13, AC15)", () => {
  it("switches between worktrees without mixing same-named agents or sessions", async () => {
    const first = await fixture("first");
    const second = await fixture("second");
    await appendFile(
      first.path,
      JSON.stringify({
        time: 1,
        type: "message",
        sessionId: "first",
        payload: { agent: "same", content: "first only" },
      }) + "\n",
    );
    const reader = await controller();
    await reader.selectSource(pathToFileURL(first.path));
    expect(reader.getState()).toMatchObject({
      path: first.path,
      sessionId: "first",
      reader: "following",
    });
    await reader.selectSource(pathToFileURL(second.path));
    expect(reader.getState()).toMatchObject({
      path: second.path,
      sessionId: "second",
      reader: "following",
    });
    expect(
      reader.getState().projection.nodes.map((node: any) => node.id),
    ).toEqual(["same"]);
    expect(reader.getState().projection.nodes[0].activities).toHaveLength(1);
    expect(JSON.stringify(reader.getState().projection)).not.toContain(
      "first only",
    );
  });

  it("preserves the valid view on failure and recovers without duplicate history", async () => {
    const source = await fixture("s1");
    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));
    await rm(source.path);
    await reader.refresh();
    expect(reader.getState().reader).toBe("stale");
    expect(reader.getState().error).toMatch(/selected|file|read/i);
    expect(reader.getState().lastSuccessfulRead).toBeTruthy();
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
    expect(
      reader
        .getState()
        .diagnostics.some((item: any) => item.code === "limit_exceeded"),
    ).toBe(true);
  });

  it("never allows a stale read to overwrite a later selection", async () => {
    const first = await fixture("first");
    const second = await fixture("second");
    let releaseFirst: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const reader = await controller({
      readBytes: async (path: string) => {
        if (path === first.path) await gate;
        return readFile(path);
      },
    });
    const pending = reader.selectSource(pathToFileURL(first.path));
    await reader.selectSource(pathToFileURL(second.path));
    releaseFirst?.();
    await pending;
    expect(reader.getState().sessionId).toBe("second");
  });

  it("reopens from the selected bytes and ignores a conflicting companion snapshot", async () => {
    const source = await fixture("stream-session");
    const metadata = join(roots[0], "session.json");
    await writeFile(
      metadata,
      JSON.stringify({
        session_id: "different-session",
        started_at: 1_700_000_000,
      }),
    );
    const first = await controller();
    await first.selectSource(pathToFileURL(source.path));
    expect(
      first.getState().projection.nodes[0].activities[0].absoluteTime,
    ).toBeNull();
    first.dispose();
    const reopened = await controller();
    await reopened.selectSource(pathToFileURL(source.path));
    expect(reopened.getState().projection.nodes[0].activities).toHaveLength(1);
    expect(await readFile(metadata, "utf8")).toContain("different-session");
  });

  it("rejects non-local source URIs without making a network request", async () => {
    const reader = await controller();
    await expect(
      reader.selectSource(new URL("https://example.invalid/private.jsonl")),
    ).rejects.toThrow();
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
    expect(
      reader
        .getState()
        .diagnostics.some((item: any) => item.code === "limit_exceeded"),
    ).toBe(true);
  });

  it("labels identity and complete-record limits instead of dropping history", async () => {
    const source = await fixture("s1");
    const reader = await controller();
    const identities = Array.from({ length: 2_001 }, (_, index) =>
      JSON.stringify({
        time: index + 1,
        type: "agent_spawn",
        sessionId: "s1",
        payload: { name: `agent_${index}` },
      }),
    ).join("\n");
    await appendFile(source.path, identities + "\n");
    await reader.selectSource(pathToFileURL(source.path));
    expect(reader.getState().reader).not.toBe("following");
    expect(
      reader
        .getState()
        .diagnostics.some((item: any) => item.code === "limit_exceeded"),
    ).toBe(true);

    const repeated = Array.from({ length: 100_001 }, (_, index) =>
      JSON.stringify({
        time: index,
        type: "message",
        sessionId: "s1",
        payload: { agent: "same", content: "status" },
      }),
    ).join("\n");
    await writeFile(source.path, source.line + repeated + "\n");
    await reader.refresh();
    expect(reader.getState().reader).not.toBe("following");
    expect(
      reader
        .getState()
        .diagnostics.some((item: any) => item.code === "limit_exceeded"),
    ).toBe(true);
  });

  it("retains accepted history and an actionable incomplete state after an append exceeds a limit", async () => {
    const source = await fixture("s1");
    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));
    await appendFile(source.path, "x".repeat(1024 * 1024 + 1) + "\n");
    await reader.refresh();
    expect(reader.getState().projection.nodes[0].activities).toHaveLength(1);
    expect(reader.getState().reader).not.toBe("following");
    expect(reader.getState().error).toMatch(/limit|incomplete/i);
  });

  it("does not reread an unchanged notification or append across a changed prefix", async () => {
    const source = await fixture("s1");
    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));
    await reader.refresh();
    await reader.refresh();
    expect(reader.getState().projection.nodes[0].activities).toHaveLength(1);
    await writeFile(
      source.path,
      source.line.replace("s1", "s2") +
        JSON.stringify({
          time: 1,
          type: "message",
          sessionId: "s2",
          payload: { agent: "same", content: "new generation" },
        }) +
        "\n",
    );
    await reader.refresh();
    expect(reader.getState().sessionId).toBe("s2");
    expect(reader.getState().projection.nodes[0].activities).toHaveLength(2);
    expect(
      reader
        .getState()
        .projection.diagnostics.some(
          (item: any) => item.code === "session_mismatch",
        ),
    ).toBe(false);
  });

  it("replays when an early accepted byte changes before a later append", async () => {
    const source = await fixture("s1");
    const largeRecord =
      JSON.stringify({
        time: 1,
        type: "message",
        sessionId: "s1",
        payload: { agent: "same", content: "x".repeat(5_000) },
      }) + "\n";
    await appendFile(source.path, largeRecord);
    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));

    const replacement =
      source.line.replaceAll("s1", "s2") +
      largeRecord +
      JSON.stringify({
        time: 2,
        type: "message",
        sessionId: "s2",
        payload: { agent: "same", content: "new generation" },
      }) +
      "\n";
    await writeFile(source.path, replacement);
    await reader.refresh();

    expect(reader.getState().sessionId).toBe("s2");
    expect(reader.getState().projection.nodes[0].activities).toHaveLength(2);
    expect(
      reader
        .getState()
        .projection.diagnostics.some(
          (item: any) => item.code === "session_mismatch",
        ),
    ).toBe(true);
  });

  it("keeps malformed companions and heartbeat claims advisory", async () => {
    const source = await fixture("s1");
    const root = roots[0];
    await writeFile(join(root, "session.json"), "{invalid");
    await mkdir(join(root, "heartbeats"));
    await writeFile(
      join(root, "heartbeats", "same.json"),
      JSON.stringify({
        agent: "same",
        status: "completed",
        updated_at: 1,
      }),
    );
    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));
    expect(reader.getState().projection.nodes[0].status).toBe("starting");
    expect(
      reader.getState().projection.nodes[0].activities[0].absoluteTime,
    ).toBeNull();
    expect(
      reader
        .getState()
        .diagnostics.some((item: any) => item.code === "invalid_metadata"),
    ).toBe(true);
    await writeFile(
      join(root, "session.json"),
      JSON.stringify({
        session_id: "s1",
        started_at: -1,
      }),
    );
    await reader.refresh();
    expect(
      reader.getState().projection.nodes[0].activities[0].absoluteTime,
    ).toBeNull();
  });

  it("discovers worktree streams only when the workspace is trusted", async () => {
    const source = await fixture("s1");
    const root = roots[0];
    await mkdir(join(root, ".agent-flow"));
    await rename(
      source.path,
      join(root, ".agent-flow", "agent-flow-events.jsonl"),
    );
    const { discoverWorktreeSources } =
      await import("../src/host/monitorPanel");
    expect(await discoverWorktreeSources([root], { trusted: false })).toEqual(
      [],
    );
    expect(await discoverWorktreeSources([root], { trusted: true })).toEqual([
      pathToFileURL(join(root, ".agent-flow", "agent-flow-events.jsonl")).href,
    ]);
  });

  it("does not auto-read an untrusted workspace source until explicitly selected", async () => {
    const source = await fixture("s1");
    const root = roots[0];
    const directory = join(root, ".agent-flow");
    await mkdir(directory);
    const selected = join(directory, "agent-flow-events.jsonl");
    await rename(source.path, selected);
    const reads: string[] = [];
    const reader = await controller({
      workspaceRoots: [root],
      trusted: false,
      readBytes: async (path: string) => {
        reads.push(path);
        return readFile(path);
      },
    });
    expect(reads).toEqual([]);
    expect(reader.getState().projection.nodes).toHaveLength(0);
    expect(reader.getState().path ?? null).toBeNull();
    await reader.selectSource(pathToFileURL(selected));
    expect(reads).toContain(selected);
    expect(reader.getState().sessionId).toBe("s1");
  });

  it("closes its filesystem watcher on switch and disposal", async () => {
    const first = await fixture("first");
    const second = await fixture("second");
    let closed = 0;
    const reader = await controller({
      watchSource: () => ({
        close: () => {
          closed++;
        },
      }),
    });
    await reader.selectSource(pathToFileURL(first.path));
    await reader.selectSource(pathToFileURL(second.path));
    expect(closed).toBe(1);
    reader.dispose();
    expect(closed).toBe(2);
  });

  it("never trusts a matching but future session start or mutates companion files", async () => {
    const source = await fixture("s1");
    const root = roots[0];
    const metadata = join(root, "session.json");
    const future = JSON.stringify({
      session_id: "s1",
      started_at: Math.floor(Date.now() / 1000) + 3_600,
    });
    await writeFile(metadata, future);
    await mkdir(join(root, "heartbeats"));
    const heartbeat = join(root, "heartbeats", "same.json");
    const observation = JSON.stringify({
      agent_id: "same",
      parent_id: null,
      status: "completed",
      activity: "Finished",
      updated_at: new Date().toISOString(),
    });
    await writeFile(heartbeat, observation);
    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));
    expect(
      reader.getState().projection.nodes[0].activities[0].absoluteTime,
    ).toBeNull();
    expect(reader.getState().projection.nodes[0].status).toBe("starting");
    expect(
      reader
        .getState()
        .diagnostics.some((item: any) => item.code === "inconsistent_metadata"),
    ).toBe(true);
    expect(reader.getState().companions).toEqual([]);
    expect(await readFile(source.path, "utf8")).toBe(source.line);
    expect(await readFile(metadata, "utf8")).toBe(future);
    expect(await readFile(heartbeat, "utf8")).toBe(observation);
  });

  it("does not reread unchanged bytes and matches a fresh replay after append", async () => {
    const source = await fixture("s1");
    let reads = 0;
    const reader = await controller({
      readBytes: async (path: string) => {
        if (path === source.path) reads++;
        return readFile(path);
      },
    });
    await reader.selectSource(pathToFileURL(source.path));
    const initialReads = reads;
    await reader.refresh();
    await reader.refresh();
    expect(reads).toBe(initialReads);
    await appendFile(
      source.path,
      JSON.stringify({
        time: 1,
        type: "message",
        sessionId: "s1",
        payload: { agent: "same", content: "appended" },
      }) + "\n",
    );
    await reader.refresh();
    const fresh = await controller();
    await fresh.selectSource(pathToFileURL(source.path));
    expect(reader.getState().projection.nodes).toEqual(
      fresh.getState().projection.nodes,
    );
    expect(reader.getState().projection.nodes[0].activities).toHaveLength(2);
  });

  it("does not call fetch for local selection or a rejected network URI", async () => {
    const source = await fixture("s1");
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("network forbidden"));
    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));
    await expect(
      reader.selectSource(new URL("https://example.invalid/events")),
    ).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("cancels the fallback reconciliation timer when disposed", async () => {
    const source = await fixture("s1");
    let cancelled = 0;
    const reader = await controller({
      scheduleReconcile: () => ({
        dispose: () => {
          cancelled++;
        },
      }),
    });
    await reader.selectSource(pathToFileURL(source.path));
    reader.dispose();
    expect(cancelled).toBe(1);
  });

  it("accepts all identities within the approved 2,000-identity envelope", async () => {
    const source = await fixture("s1");
    const remaining = Array.from({ length: 1_999 }, (_, index) =>
      JSON.stringify({
        time: index + 1,
        type: "agent_spawn",
        sessionId: "s1",
        payload: { name: `agent_${index}` },
      }),
    ).join("\n");
    await appendFile(source.path, remaining + "\n");
    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));
    expect(reader.getState().reader).toBe("following");
    expect(reader.getState().projection.nodes).toHaveLength(2_000);
    expect(
      reader
        .getState()
        .diagnostics.some((item: any) => item.code === "limit_exceeded"),
    ).toBe(false);
  });

  it("counts dispatch and return parents toward the identity envelope", async () => {
    const source = await fixture("s1");
    const dispatches = Array.from({ length: 2_000 }, (_, index) =>
      JSON.stringify({
        time: index + 1,
        type: index % 2 === 0 ? "subagent_dispatch" : "subagent_return",
        sessionId: "s1",
        payload: { parent: `parent_${index}`, child: `child_${index}` },
      }),
    ).join("\n");
    await appendFile(source.path, dispatches + "\n");
    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));
    expect(reader.getState().reader).toBe("incomplete");
    expect(reader.getState().error).toMatch(/identity limit/i);
  });

  it("reads only continuity and appended ranges after the initial replay", async () => {
    const source = await fixture("s1");
    let fullReads = 0;
    const ranges: Array<[number, number]> = [];
    const reader = await controller({
      readBytes: async (path: string) => {
        fullReads++;
        return readFile(path);
      },
      readRange: async (path: string, start: number, end: number) => {
        ranges.push([start, end]);
        return (await readFile(path)).subarray(start, end);
      },
    });
    await reader.selectSource(pathToFileURL(source.path));
    expect(fullReads).toBe(1);
    await appendFile(
      source.path,
      JSON.stringify({
        time: 1,
        type: "message",
        sessionId: "s1",
        payload: { agent: "same", content: "incremental" },
      }) + "\n",
    );
    await reader.refresh();
    expect(fullReads).toBe(1);
    expect(ranges.some(([start]) => start >= source.line.length)).toBe(true);
    expect(reader.getState().projection.nodes[0].activities).toHaveLength(2);
  });

  it("restores a trusted prior source, discovers a trusted worktree fallback, and never auto-selects untrusted input", async () => {
    const source = await fixture("s1");
    const root = roots[0];
    const directory = join(root, ".agent-flow");
    await mkdir(directory);
    const discovered = join(directory, "agent-flow-events.jsonl");
    await rename(source.path, discovered);
    const { resolveInitialSource } = await import("../src/host/monitorPanel");
    const explicit = pathToFileURL(join(root, "explicit.jsonl")).href;
    expect(
      await resolveInitialSource(explicit, [root], { trusted: true }),
    ).toBe(explicit);
    expect(await resolveInitialSource(null, [root], { trusted: true })).toBe(
      pathToFileURL(discovered).href,
    );
    expect(
      await resolveInitialSource(explicit, [root], { trusted: false }),
    ).toBeNull();
  });

  it.each([
    ["missing", null],
    ["malformed", "{invalid"],
    [
      "mismatched",
      JSON.stringify({
        session_id: "different-session",
        started_at: 1_700_000_000,
      }),
    ],
  ])(
    "does not read heartbeat companions when session metadata is %s",
    async (_case, metadata) => {
      const source = await fixture("s1");
      const root = roots.at(-1)!;
      await mkdir(join(root, "heartbeats"));
      await writeFile(
        join(root, "heartbeats", "same.json"),
        JSON.stringify({ agent: "same", status: "working" }),
      );
      if (metadata !== null)
        await writeFile(join(root, "session.json"), metadata);
      const reader = await controller();
      await reader.selectSource(pathToFileURL(source.path));
      expect(reader.getState().companions).toEqual([]);
    },
  );

  it("validates heartbeat schema and chronology with host-owned attribution", async () => {
    const source = await fixture("s1");
    const root = roots.at(-1)!;
    const startedAt = Math.floor(Date.now() / 1000) - 60;
    await writeFile(
      join(root, "session.json"),
      JSON.stringify({ session_id: "s1", started_at: startedAt }),
    );
    await mkdir(join(root, "heartbeats"));
    await writeFile(
      join(root, "heartbeats", "valid.json"),
      JSON.stringify({
        agent_id: "same",
        parent_id: null,
        status: "working",
        activity: "Inspecting telemetry",
        updated_at: new Date().toISOString(),
        source: "untrusted",
        certainty: "certain",
      }),
    );
    await writeFile(
      join(root, "heartbeats", "stale.json"),
      JSON.stringify({
        agent_id: "stale",
        parent_id: null,
        status: "working",
        activity: "Old observation",
        updated_at: new Date((startedAt - 1) * 1000).toISOString(),
      }),
    );
    await writeFile(
      join(root, "heartbeats", "malformed.json"),
      JSON.stringify({ agent_id: "malformed", updated_at: "not-a-date" }),
    );

    const reader = await controller();
    await reader.selectSource(pathToFileURL(source.path));

    expect(reader.getState().companions).toEqual([
      expect.objectContaining({
        agentId: "same",
        source: "heartbeat",
        certainty: "provisional",
      }),
    ]);
    expect(reader.getState().companions[0]).not.toHaveProperty(
      "source",
      "untrusted",
    );
    expect(
      reader
        .getState()
        .diagnostics.filter((item: any) => item.code === "invalid_heartbeat"),
    ).toHaveLength(2);
  });
});
