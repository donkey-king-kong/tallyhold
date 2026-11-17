import { open, readFile, readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createStream } from "../core/reconcile";

type Disposable = { dispose?: () => void; close?: () => void };
type Options = {
  readBytes?: (path: string) => Promise<Uint8Array>;
  readRange?: (path: string, start: number, end: number) => Promise<Uint8Array>;
  watchSource?: (path: string, refresh: () => void) => Disposable;
  scheduleReconcile?: (refresh: () => void) => Disposable;
  workspaceRoots?: string[];
  trusted?: boolean;
};

const EMPTY_PROJECTION = {
  sessionId: null,
  nodes: [],
  edges: [],
  diagnostics: [],
};
const FILE_LIMIT = 64 * 1024 * 1024;
const LINE_LIMIT = 1024 * 1024;
const RECORD_LIMIT = 100_000;
const IDENTITY_LIMIT = 2_000;

function close(resource: Disposable | undefined) {
  resource?.close?.();
  resource?.dispose?.();
}

function concatenate(
  left: Uint8Array<ArrayBufferLike>,
  right: Uint8Array<ArrayBufferLike>,
): Uint8Array<ArrayBufferLike> {
  const value = new Uint8Array(left.length + right.length);
  value.set(left);
  value.set(right, left.length);
  return value;
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function limitDiagnostic(message: string) {
  return { code: "limit_exceeded", line: 0, byteOffset: 0, message };
}

function inspectLimits(bytes: Uint8Array): string | null {
  let records = 0;
  let lineStart = 0;
  const identities = new Set<string>();
  const decoder = new TextDecoder();
  for (let index = 0; index < bytes.length; index++) {
    if (bytes[index] !== 10) continue;
    if (index - lineStart > LINE_LIMIT)
      return "Line limit exceeded; view is incomplete";
    records++;
    if (records > RECORD_LIMIT)
      return "Record limit exceeded; view is incomplete";
    try {
      const record = JSON.parse(decoder.decode(bytes.slice(lineStart, index)));
      const id = record?.payload?.name ?? record?.payload?.agent;
      if (typeof id === "string") identities.add(id);
      if (identities.size > IDENTITY_LIMIT)
        return "Identity limit exceeded; view is incomplete";
    } catch {
      // The core parser owns malformed-record diagnostics.
    }
    lineStart = index + 1;
  }
  if (bytes.length - lineStart > LINE_LIMIT)
    return "Line limit exceeded; view is incomplete";
  return null;
}

async function readCompanions(path: string, sessionId: string | null) {
  const diagnostics: Array<Record<string, unknown>> = [];
  const companions: Array<Record<string, unknown>> = [];
  let sessionStartedAt: number | undefined;
  const root = dirname(path);
  try {
    const metadata = JSON.parse(
      await readFile(join(root, "session.json"), "utf8"),
    );
    if (
      metadata?.session_id === sessionId &&
      typeof metadata.started_at === "number" &&
      Number.isFinite(metadata.started_at) &&
      metadata.started_at >= 0
    ) {
      if (metadata.started_at > Date.now() / 1000) {
        diagnostics.push({
          code: "inconsistent_metadata",
          message: "Session start is in the future",
        });
      } else {
        sessionStartedAt = metadata.started_at;
      }
    } else {
      diagnostics.push({
        code: "invalid_metadata",
        message: "Session metadata does not match the stream",
      });
    }
  } catch (error: any) {
    if (error?.code !== "ENOENT")
      diagnostics.push({
        code: "invalid_metadata",
        message: "Session metadata is invalid",
      });
  }

  try {
    const heartbeatRoot = join(root, "heartbeats");
    for (const name of await readdir(heartbeatRoot)) {
      if (!name.endsWith(".json")) continue;
      try {
        const value = JSON.parse(
          await readFile(join(heartbeatRoot, name), "utf8"),
        );
        companions.push({
          source: "heartbeat",
          certainty: "provisional",
          ...value,
        });
      } catch {
        diagnostics.push({
          code: "invalid_metadata",
          message: `Heartbeat ${name} is invalid`,
        });
      }
    }
  } catch (error: any) {
    if (error?.code !== "ENOENT")
      diagnostics.push({
        code: "invalid_metadata",
        message: "Heartbeat directory is invalid",
      });
  }
  return { diagnostics, companions, sessionStartedAt };
}

export function createSourceController(options: Options = {}) {
  const readBytes = options.readBytes ?? ((path: string) => readFile(path));
  const readRange =
    options.readRange ??
    (options.readBytes
      ? async (path: string, start: number, end: number) =>
          (await options.readBytes!(path)).slice(start, end)
      : async (path: string, start: number, end: number) => {
          const handle = await open(path, "r");
          try {
            const buffer = Buffer.alloc(Math.max(0, end - start));
            const { bytesRead } = await handle.read(
              buffer,
              0,
              buffer.length,
              start,
            );
            return buffer.subarray(0, bytesRead);
          } finally {
            await handle.close();
          }
        });
  let generation = 0;
  let selectedPath: string | null = null;
  let signature: string | null = null;
  let fileIdentity: string | null = null;
  let fileSize = 0;
  let acceptedBytes: Uint8Array<ArrayBufferLike> = new Uint8Array();
  let model: ReturnType<typeof createStream> | null = null;
  let metadataDiagnostics: Array<Record<string, unknown>> = [];
  let watcher: Disposable | undefined;
  let timer: Disposable | undefined;
  let disposed = false;
  let state: any = {
    path: null,
    sessionId: null,
    reader: "idle",
    diagnostics: [],
    companions: [],
    projection: EMPTY_PROJECTION,
  };

  const release = () => {
    close(watcher);
    close(timer);
    watcher = undefined;
    timer = undefined;
  };

  const load = async (token: number, force = false) => {
    if (!selectedPath || disposed) return;
    try {
      const details = await stat(selectedPath);
      const nextIdentity = `${details.dev}:${details.ino}`;
      const nextSignature = `${details.dev}:${details.ino}:${details.size}:${details.mtimeMs}`;
      if (!force && signature === nextSignature) return;
      if (details.size > FILE_LIMIT) {
        const diagnostic = limitDiagnostic(
          "File limit exceeded; view is incomplete",
        );
        state = {
          ...state,
          reader: "incomplete",
          error: diagnostic.message,
          diagnostics: [diagnostic],
        };
        signature = nextSignature;
        return;
      }
      const acceptProjection = (
        projection: any,
        companions: Array<Record<string, unknown>>,
      ) => {
        const diagnostics = [...projection.diagnostics, ...metadataDiagnostics];
        projection.diagnostics = diagnostics;
        state = {
          path: selectedPath,
          sessionId: projection.sessionId,
          reader: "following",
          diagnostics,
          companions,
          projection,
          lastSuccessfulRead: new Date().toISOString(),
        };
      };
      const rejectLimit = (limit: string) => {
        const diagnostic = limitDiagnostic(limit);
        state = {
          ...state,
          reader: "incomplete",
          error: limit,
          diagnostics: [diagnostic],
        };
        signature = nextSignature;
      };

      const currentModel = model;
      const canAppend =
        !force &&
        currentModel !== null &&
        fileIdentity === nextIdentity &&
        details.size > fileSize;
      if (canAppend && currentModel) {
        const continuityStart = Math.max(0, fileSize - 4096);
        const continuity = await readRange(
          selectedPath,
          continuityStart,
          fileSize,
        );
        if (token !== generation || disposed) return;
        const expected = acceptedBytes.slice(continuityStart, fileSize);
        if (equalBytes(continuity, expected)) {
          const appended = await readRange(
            selectedPath,
            fileSize,
            details.size,
          );
          if (token !== generation || disposed) return;
          const combined = concatenate(acceptedBytes, appended);
          const limit = inspectLimits(combined);
          if (limit) {
            rejectLimit(limit);
            return;
          }
          currentModel.ingest(appended);
          acceptedBytes = combined;
          fileSize = details.size;
          signature = nextSignature;
          acceptProjection(currentModel.snapshot(), state.companions ?? []);
          return;
        }
      }

      const bytes = await readBytes(selectedPath);
      if (token !== generation || disposed) return;
      const limit = inspectLimits(bytes);
      if (limit) {
        rejectLimit(limit);
        return;
      }
      const probe = createStream({ source: selectedPath });
      probe.ingest(bytes);
      const probeProjection: any = probe.snapshot();
      const metadata = await readCompanions(
        selectedPath,
        probeProjection.sessionId,
      );
      if (token !== generation || disposed) return;
      const nextModel = createStream({
        source: selectedPath,
        sessionStartedAt: metadata.sessionStartedAt,
      });
      nextModel.ingest(bytes);
      model = nextModel;
      metadataDiagnostics = metadata.diagnostics;
      acceptedBytes = bytes;
      fileIdentity = nextIdentity;
      fileSize = details.size;
      signature = nextSignature;
      acceptProjection(nextModel.snapshot(), metadata.companions);
    } catch (error: any) {
      if (token !== generation || disposed) return;
      const hadView = state.projection?.nodes?.length > 0;
      state = {
        ...state,
        path: selectedPath,
        reader: hadView ? "stale" : "error",
        error: `Selected file cannot be read: ${error?.message ?? String(error)}`,
      };
    }
  };

  const refresh = async () => load(generation);

  return {
    async selectSource(uri: URL) {
      if (uri.protocol !== "file:")
        throw new Error("Only local file sources are supported");
      generation++;
      const token = generation;
      release();
      selectedPath = fileURLToPath(uri);
      signature = null;
      fileIdentity = null;
      fileSize = 0;
      acceptedBytes = new Uint8Array();
      model = null;
      metadataDiagnostics = [];
      state = {
        path: selectedPath,
        sessionId: null,
        reader: "reading",
        diagnostics: [],
        companions: [],
        projection: EMPTY_PROJECTION,
      };
      watcher = options.watchSource?.(selectedPath, () => void refresh());
      timer = options.scheduleReconcile?.(() => void refresh());
      await load(token, true);
    },
    refresh,
    getState() {
      return state;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      release();
    },
  };
}
