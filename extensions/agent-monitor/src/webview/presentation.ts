export type Activity = {
  type: string;
  time?: number;
  summary?: string;
  absoluteTime?: string | null;
  relatedAgentId?: string | null;
  toolCategory?: string | null;
  toolDurationSeconds?: number | null;
  outcome?: string;
  pairing?: string;
  certainty?: string;
};

export type Interval = {
  start?: number | null;
  end?: number | null;
  certainty?: string;
  startAbsoluteTime?: string | null;
  endAbsoluteTime?: string | null;
};

export type ProjectedNode = {
  id: string;
  parentId?: string;
  task?: string;
  status?: string;
  relationship?: string;
  position?: { x: number; y: number };
  activities?: Activity[];
  intervals?: Interval[];
  reportedRole?: string | null;
  identityKind?: string;
  terminal?: boolean;
  lastUpdateAge?: number | null;
  observedLocalAge?: number;
};

export type Run = {
  node: ProjectedNode;
  interval: Interval;
  index: number;
  chronology: "current" | "older" | "unknown";
};

export function validInstant(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT/.test(value))
    return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function age(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0)
    return "unavailable";
  const value = Math.floor(seconds);
  if (value < 60) return `${value}s`;
  if (value < 3600) return `${Math.floor(value / 60)}m ${value % 60}s`;
  if (value < 86400)
    return `${Math.floor(value / 3600)}h ${Math.floor((value % 3600) / 60)}m`;
  return `${Math.floor(value / 86400)}d`;
}

export function duration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "unavailable";
  const rounded = Math.floor(seconds);
  if (rounded < 60) return `${rounded}s`;
  if (rounded < 3600) return `${Math.floor(rounded / 60)}m ${rounded % 60}s`;
  return `${Math.floor(rounded / 3600)}h ${Math.floor((rounded % 3600) / 60)}m`;
}

export function localTime(
  value: string | null | undefined,
  seconds = false,
): string {
  const date = validInstant(value);
  if (!date) return "unavailable";
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const eventDay = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return new Intl.DateTimeFormat(
    zone === "Asia/Singapore" ? "en-SG" : "en-GB",
    {
      ...(eventDay === today
        ? {}
        : { day: "2-digit" as const, month: "short" as const }),
      hour: "2-digit",
      minute: "2-digit",
      ...(seconds ? { second: "2-digit" } : {}),
      hourCycle: "h23",
      timeZoneName: "short",
    },
  )
    .format(date)
    .replace(",", "")
    .replace(/UTC(?=[+-])/g, "GMT");
}

export function intervalText(
  interval: Interval | undefined,
  activities: Activity[] = [],
): string {
  if (!interval) return "Started unavailable; interval unavailable";
  const start = validInstant(interval.startAbsoluteTime);
  const end = validInstant(interval.endAbsoluteTime);
  if (start && end && end >= start) {
    return `Ran ${localTime(interval.startAbsoluteTime)} → ${localTime(interval.endAbsoluteTime)} · ${duration((end.getTime() - start.getTime()) / 1000)}`;
  }
  if (start && interval.end == null) {
    const last = [...activities].reverse().find((activity) => {
      const instant = validInstant(activity.absoluteTime);
      return (
        instant &&
        instant >= start &&
        activity.time !== undefined &&
        (interval.start == null || activity.time >= interval.start)
      );
    });
    const through = validInstant(last?.absoluteTime);
    if (through)
      return `Running for ${duration((through.getTime() - start.getTime()) / 1000)} (reported through ${localTime(last?.absoluteTime)})`;
  }
  const startRelative =
    interval.start == null
      ? "unavailable"
      : `Session-relative +${interval.start}s`;
  const endRelative =
    interval.end == null ? "unavailable" : `Session-relative +${interval.end}s`;
  return `Execution interval incomplete: Started ${startRelative}; ended ${endRelative}`;
}

export function statusWord(node: ProjectedNode): string {
  switch (node.status?.toLowerCase()) {
    case "starting":
    case "working":
      return "Working";
    case "waiting":
      return "Waiting";
    case "blocked":
      return "Blocked";
    case "failed":
      return "Failed";
    case "completed":
    case "resolved":
      return "Completed";
    default:
      return "Unknown status";
  }
}

export function activityLabel(activity: Activity): string {
  const summary = activity.summary ?? "";
  switch (activity.type) {
    case "agent_spawn":
      return "Started";
    case "subagent_dispatch":
      return `Handed work to ${activity.relatedAgentId ?? "identity unavailable"}`;
    case "subagent_return":
      return `Got result from ${activity.relatedAgentId ?? "identity unavailable"}`;
    case "permission_requested":
      return `Waiting: "${summary}"`;
    case "tool_call_end": {
      const category = activity.toolCategory ?? "Category unavailable";
      const result = activity.outcome === "failed" ? "Failed" : "Succeeded";
      const elapsed =
        activity.pairing === "ambiguous"
          ? "ambiguous duration"
          : activity.toolDurationSeconds == null
            ? "duration unavailable"
            : duration(activity.toolDurationSeconds);
      return `${category} · ${result} · ${elapsed}`;
    }
    case "tool_call_start":
      return `Started ${activity.toolCategory ?? "unknown"} tool`;
    case "agent_complete":
      return "Completed";
    case "error":
      return "Blocked";
    case "message":
      return "Reported";
    default:
      return `Other reported event: ${activity.type}`;
  }
}

export function activityDescription(activity: Activity): string {
  const label = activityLabel(activity);
  const summary = activity.summary ?? "";
  if (
    !summary ||
    summary === activity.type ||
    label.includes(summary) ||
    (activity.type === "subagent_return" && summary === "subagent_return")
  )
    return label;
  return `${label} · ${summary}`;
}

export function displayName(id: string, laneSlug: string | null): string {
  const prefix = `wt-${laneSlug}-`;
  const shortened =
    laneSlug && id.startsWith(prefix) && id.length > prefix.length
      ? id.slice(prefix.length)
      : id;
  return shortened.replace(/-(r\d+[a-z]?)$/i, " · $1");
}

export function runsFor(node: ProjectedNode, now: number): Run[] {
  const intervals = node.intervals?.length ? node.intervals : [{}];
  const cutoff = now - 24 * 60 * 60 * 1000;
  return intervals.map((interval, index) => {
    const start = validInstant(interval.startAbsoluteTime);
    const end = validInstant(interval.endAbsoluteTime);
    const last = [...(node.activities ?? [])].reverse().find((item) => {
      const instant = validInstant(item.absoluteTime);
      return (
        instant && (!start || instant >= start) && (!end || instant <= end)
      );
    });
    const lastDate = validInstant(last?.absoluteTime);
    const boundedEnd = end ?? lastDate ?? start;
    const chronology =
      !start || !boundedEnd
        ? "unknown"
        : boundedEnd.getTime() < cutoff
          ? "older"
          : start.getTime() <= now
            ? "current"
            : "unknown";
    return { node, interval, index, chronology };
  });
}
