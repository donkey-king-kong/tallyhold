export interface HorizontalSegment {
  y: number;
  left: number;
  right: number;
}

const commandPattern = /^[MLHVZ]$/i;
const numberPattern = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;

export function horizontalSegmentsFromPathData(
  data: string,
): HorizontalSegment[] {
  const tokens =
    data.match(/[MLHVZ]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? [];
  const horizontal: HorizontalSegment[] = [];
  let index = 0;
  let command = "";
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;

  const hasNumber = () =>
    index < tokens.length && numberPattern.test(tokens[index]);
  const coordinate = () => Number(tokens[index++]);
  const add = (endX: number, endY: number) => {
    if (y === endY && x !== endX)
      horizontal.push({
        y,
        left: Math.min(x, endX),
        right: Math.max(x, endX),
      });
    x = endX;
    y = endY;
  };

  while (index < tokens.length) {
    if (commandPattern.test(tokens[index])) {
      command = tokens[index++];
      if (command.toUpperCase() === "Z") {
        add(startX, startY);
        command = "";
        continue;
      }
    }
    if (!command || !hasNumber()) break;

    const relative = command === command.toLowerCase();
    switch (command.toUpperCase()) {
      case "M": {
        const nextX = coordinate() + (relative ? x : 0);
        if (!hasNumber()) return horizontal;
        const nextY = coordinate() + (relative ? y : 0);
        x = nextX;
        y = nextY;
        startX = x;
        startY = y;
        command = relative ? "l" : "L";
        break;
      }
      case "L": {
        const nextX = coordinate() + (relative ? x : 0);
        if (!hasNumber()) return horizontal;
        const nextY = coordinate() + (relative ? y : 0);
        add(nextX, nextY);
        break;
      }
      case "H":
        add(coordinate() + (relative ? x : 0), y);
        break;
      case "V":
        add(x, coordinate() + (relative ? y : 0));
        break;
      default:
        return horizontal;
    }
  }
  return horizontal;
}

export function hasOverlappingHorizontalSegments(
  segments: HorizontalSegment[],
  tolerance = 4,
): boolean {
  return segments.some((segment, index) =>
    segments
      .slice(index + 1)
      .some(
        (other) =>
          Math.abs(segment.y - other.y) <= tolerance &&
          Math.min(segment.right, other.right) -
            Math.max(segment.left, other.left) >
            tolerance,
      ),
  );
}
