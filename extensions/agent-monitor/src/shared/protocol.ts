function object(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function generation(value: unknown, expected: number) {
  return Number.isInteger(value) && value === expected;
}

function safeText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 1024 &&
    !/[<>]/.test(value) &&
    !/^\s*(?:javascript|data|https?|file):/i.test(value)
  );
}

function optionalText(value: unknown): boolean {
  return value === undefined || value === null || safeText(value);
}

function optionalInstant(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" &&
      /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString() === value)
  );
}

export function validateWebviewMessage(
  value: unknown,
  expectedGeneration: number,
) {
  if (
    !object(value) ||
    !generation(value.generation, expectedGeneration) ||
    typeof value.type !== "string"
  ) {
    return null;
  }
  if (value.type === "fitAll")
    return { type: "fitAll", generation: value.generation };
  if (value.type === "setFilter" && typeof value.activeOnly === "boolean") {
    return {
      type: value.type,
      generation: value.generation,
      activeOnly: value.activeOnly,
    };
  }
  if (
    value.type === "selectNode" &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    value.id.length <= 1024
  ) {
    return { type: value.type, generation: value.generation, id: value.id };
  }
  if (value.type === "selectSource" && value.uri === undefined) {
    return { type: value.type, generation: value.generation };
  }
  if (
    value.type === "selectSource" &&
    typeof value.uri === "string" &&
    value.uri.length <= 4096 &&
    value.uri.startsWith("file:")
  ) {
    return { type: value.type, generation: value.generation, uri: value.uri };
  }
  return null;
}

export function validateHostMessage(
  value: unknown,
  expectedGeneration: number,
) {
  if (
    !object(value) ||
    value.type !== "state" ||
    !generation(value.generation, expectedGeneration) ||
    !object(value.projection) ||
    !Array.isArray(value.projection.nodes) ||
    value.projection.nodes.length > 2000 ||
    !optionalInstant(value.projection.lastEventAbsoluteTime)
  ) {
    return null;
  }
  for (const node of value.projection.nodes) {
    if (
      !object(node) ||
      typeof node.id !== "string" ||
      node.id.length > 1024 ||
      !optionalText(node.reportedRole) ||
      (node.activities !== undefined && !Array.isArray(node.activities)) ||
      (node.intervals !== undefined && !Array.isArray(node.intervals))
    ) {
      return null;
    }
    for (const interval of node.intervals ?? []) {
      if (
        !object(interval) ||
        !optionalInstant(interval.startAbsoluteTime) ||
        !optionalInstant(interval.endAbsoluteTime)
      )
        return null;
    }
    for (const activity of node.activities ?? []) {
      if (
        !object(activity) ||
        !optionalText(activity.relatedAgentId) ||
        !optionalText(activity.toolCategory) ||
        (activity.toolDurationSeconds !== undefined &&
          activity.toolDurationSeconds !== null &&
          (typeof activity.toolDurationSeconds !== "number" ||
            !Number.isFinite(activity.toolDurationSeconds) ||
            activity.toolDurationSeconds < 0))
      )
        return null;
    }
  }
  return value;
}
