function object(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function generation(value: unknown, expected: number) {
  return Number.isInteger(value) && value === expected;
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
    value.projection.nodes.length > 2000
  ) {
    return null;
  }
  for (const node of value.projection.nodes) {
    if (
      !object(node) ||
      typeof node.id !== "string" ||
      node.id.length > 1024 ||
      (node.activities !== undefined && !Array.isArray(node.activities))
    ) {
      return null;
    }
  }
  return value;
}
