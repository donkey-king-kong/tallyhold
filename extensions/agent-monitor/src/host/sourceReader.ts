import { open, readFile, readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createStream, eventIdentity } from "../core/reconcile";

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
const AGENT_ID = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;

type Companion = {
  agentId: string;
  parentId: string | null;
  status: string;
  activity: string;
  updatedAt: string;
  source: "heartbeat";
  certainty: "provisional";
};

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
      const id =
        typeof record?.type === "string" &&
        typeof record?.payload === "object" &&
        record.payload !== null &&
        !Array.isArray(record.payload)
          ? eventIdentity(record.type, record.payload)
          : undefined;
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
  const companions: Companion[] = [];
  let sessionStartedAt: number | undefined;
  let metadataStartedAt: number | undefined;
  let metadataMatches = false;
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
      metadataMatches = true;
      metadataStartedAt = metadata.started_at;
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
  } catch {
    diagnostics.push({
      code: "invalid_metadata",
      message: "Session metadata is missing or invalid",
    });
  }

  if (metadataMatches) {
    try {
      const heartbeatRoot = join(root, "heartbeats");
      for (const name of await readdir(heartbeatRoot)) {
        if (!name.endsWith(".json")) continue;
        try {
          const value = JSON.parse(
            await readFile(join(heartbeatRoot, name), "utf8"),
          );
          const updatedAtSeconds =
            typeof value?.updated_at === "string"
              ? Date.parse(value.updated_at) / 1000
              : Number.NaN;
          const valid =
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value) &&
            typeof value.agent_id === "string" &&
            AGENT_ID.test(value.agent_id) &&
            (value.parent_id === null ||
              (typeof value.parent_id === "string" &&
                AGENT_ID.test(value.parent_id))) &&
            typeof value.status === "string" &&
            value.status.length > 0 &&
            value.status.length <= 160 &&
            typeof value.activity === "string" &&
            value.activity.length > 0 &&
            value.activity.length <= 160 &&
            Number.isFinite(updatedAtSeconds) &&
            updatedAtSeconds >= (metadataStartedAt ?? 0) &&
            updatedAtSeconds <= Date.now() / 1000 + 1;
          if (!valid) {
            diagnostics.push({
              code: "invalid_heartbeat",
              message: `Heartbeat ${name} is malformed or chronologically inconsistent`,
            });
            continue;
          }
          companions.push({
            agentId: value.agent_id,
            parentId: value.parent_id,
            status: value.status,
            activity: value.activity,
            updatedAt: new Date(updatedAtSeconds * 1000).toISOString(),
            source: "heartbeat",
            certainty: "provisional",
          });
        } catch {
          diagnostics.push({
            code: "invalid_heartbeat",
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
  let sourceGeneration = 0;
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
    sourceGeneration,
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
          sourceGeneration,
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
        const continuity = await readRange(selectedPath, 0, fileSize);
        if (token !== generation || disposed) return;
        if (equalBytes(continuity, acceptedBytes)) {
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
      if (model !== null) sourceGeneration++;
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
      sourceGeneration++;
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
        sourceGeneration,
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
