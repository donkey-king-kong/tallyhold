import {
  age,
  displayName,
  statusWord,
  type ProjectedNode,
} from "./presentation";

export type Edge = { parentId: string; childId: string };
type Place = {
  x: number;
  y: number;
  width: number;
  height: number;
  lane: string | null;
};
const NS = "http://www.w3.org/2000/svg";

function svg<K extends keyof SVGElementTagNameMap>(
  name: K,
): SVGElementTagNameMap[K] {
  return document.createElementNS(NS, name);
}

function labelLines(value: string): string[] {
  return value.match(/.{1,20}/g) ?? [value];
}

function nodeSize(
  node: ProjectedNode,
  lane: string | null,
): Pick<Place, "width" | "height"> {
  const lines = labelLines(displayName(node.id, lane));
  return {
    width: Math.max(
      lane ? 200 : 180,
      Math.min(300, Math.max(...lines.map((line) => line.length * 12)) + 32),
    ),
    height: Math.max(60, 38 + lines.length * 18),
  };
}

export class GraphLayout {
  private readonly places = new Map<string, Place>();
  private readonly laneOrder: string[] = [];
  private readonly slotCounts = new Map<string, number>();
  private readonly displayLane = new Map<string, string | null>();

  reset(): void {
    this.places.clear();
    this.displayLane.clear();
    this.laneOrder.length = 0;
    this.slotCounts.clear();
  }

  assign(nodes: ProjectedNode[]): void {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    for (const node of nodes) {
      if (
        /^wt-[a-zA-Z0-9_-]+$/.test(node.id) &&
        (!node.parentId || node.parentId === "orchestrator") &&
        !this.laneOrder.includes(node.id)
      )
        this.laneOrder.push(node.id);
    }
    for (const node of nodes) {
      const intervals = Math.max(1, node.intervals?.length ?? 0);
      for (let index = 0; index < intervals; index++) {
        const key = `${node.id}\0${index}`;
        if (this.places.has(key)) continue;
        let lane: string | null = null;
        if (this.laneOrder.includes(node.id)) lane = node.id;
        else {
          let cursor = node;
          const seen = new Set([node.id]);
          while (cursor.parentId && !seen.has(cursor.parentId)) {
            seen.add(cursor.parentId);
            if (this.laneOrder.includes(cursor.parentId)) {
              lane = cursor.parentId;
              break;
            }
            const parent = byId.get(cursor.parentId);
            if (!parent) break;
            cursor = parent;
          }
        }
        if (node.id === "orchestrator") lane = null;
        const slug = lane?.slice(3) ?? null;
        const size = nodeSize(node, slug);
        let x: number;
        let y: number;
        if (node.id === "orchestrator") {
          x = 0;
          y = 0;
        } else if (lane) {
          x = 260 + this.laneOrder.indexOf(lane) * 340;
          y = this.slotCounts.get(lane) ?? 160;
          this.slotCounts.set(lane, y + size.height + 40);
        } else if (this.laneOrder.length) {
          x = 0;
          y = this.slotCounts.get("ungrouped") ?? 160;
          this.slotCounts.set("ungrouped", y + size.height + 40);
        } else {
          const proposed = node.position ?? { x: 0, y: 0 };
          const collision = [...this.places.values()].some(
            (place) =>
              proposed.x < place.x + place.width &&
              proposed.x + size.width > place.x &&
              proposed.y < place.y + place.height &&
              proposed.y + size.height > place.y,
          );
          x = proposed.x;
          y = collision
            ? Math.max(
                ...[...this.places.values()].map(
                  (place) => place.y + place.height + 40,
                ),
              )
            : proposed.y;
        }
        this.places.set(key, { x, y, ...size, lane: slug });
        if (index === 0) this.displayLane.set(node.id, slug);
      }
    }
  }

  place(id: string, index = 0): Place | undefined {
    return this.places.get(`${id}\0${index}`);
  }

  lane(id: string): string | null {
    return this.displayLane.get(id) ?? null;
  }

  association(node: ProjectedNode, nodes: ProjectedNode[]): string | null {
    const byId = new Map(nodes.map((item) => [item.id, item]));
    let cursor: ProjectedNode | undefined = node;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      if (this.laneOrder.includes(cursor.id)) return cursor.id.slice(3);
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
    return null;
  }

  extent(nodes: ProjectedNode[]): string {
    if (!nodes.length) return "0 0 800 600";
    const places = [...this.places.values()];
    const minX = Math.min(0, ...places.map((place) => place.x));
    const minY = Math.min(0, ...places.map((place) => place.y));
    const maxX = Math.max(0, ...places.map((place) => place.x + place.width));
    const maxY = Math.max(0, ...places.map((place) => place.y + place.height));
    return `${minX} ${minY} ${Math.max(800, maxX - minX)} ${Math.max(600, maxY - minY)}`;
  }

  contentBounds(): { right: number; bottom: number } {
    const places = [...this.places.values()];
    return {
      right: Math.max(0, ...places.map((place) => place.x + place.width)),
      bottom: Math.max(0, ...places.map((place) => place.y + place.height)),
    };
  }

  laneRoots(): string[] {
    return [...this.laneOrder];
  }
}

function icon(group: SVGGElement, status: string, x: number, y: number): void {
  const mark = svg("path");
  mark.dataset.statusIcon = status;
  mark.setAttribute("stroke", "currentColor");
  mark.setAttribute("fill", "none");
  mark.setAttribute("stroke-width", "2");
  mark.setAttribute(
    "d",
    (
      {
        Working: "M 2 1 L 12 7 L 2 13 Z",
        Waiting: "M 2 1 V 13 M 10 1 V 13",
        Blocked: "M 1 2 H 13 V 12 H 1 Z",
        Failed: "M 1 1 L 13 13 M 13 1 L 1 13",
        Completed: "M 1 7 L 5 11 L 13 2",
      } as Record<string, string>
    )[status] ?? "M 7 1 A 6 6 0 1 1 6 13",
  );
  mark.setAttribute("transform", `translate(${x} ${y})`);
  group.append(mark);
}

function validEdges(nodes: ProjectedNode[], edges: Edge[]): Edge[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const seen = new Set<string>();
  return edges.filter((edge) => {
    const child = byId.get(edge.childId);
    if (
      !byId.has(edge.parentId) ||
      !child ||
      edge.parentId === edge.childId ||
      child.relationship === "unresolved"
    )
      return false;
    const key = `${edge.parentId}\0${edge.childId}`;
    if (seen.has(key)) return false;
    let cursor = byId.get(edge.parentId);
    const visited = new Set<string>();
    while (cursor?.parentId && !visited.has(cursor.id)) {
      if (cursor.parentId === child.id) return false;
      visited.add(cursor.id);
      cursor = byId.get(cursor.parentId);
    }
    seen.add(key);
    return true;
  });
}

export function drawGraph(
  svgRoot: SVGSVGElement,
  layout: GraphLayout,
  nodes: ProjectedNode[],
  edges: Edge[],
  camera: string,
  selectedId: string | null,
  elapsed: number,
  maximum = 500,
): void {
  svgRoot.replaceChildren();
  const [cx, cy, cw, ch] = camera.split(/\s+/).map(Number);
  const visible = nodes
    .filter((node) => {
      const place = layout.place(node.id);
      return (
        place &&
        (node.id === selectedId ||
          (place.x + place.width >= cx - 200 &&
            place.x <= cx + cw + 200 &&
            place.y + place.height >= cy - 200 &&
            place.y <= cy + ch + 200))
      );
    })
    .slice(0, maximum);
  if (selectedId && !visible.some((node) => node.id === selectedId)) {
    const selected = nodes.find((node) => node.id === selectedId);
    if (selected) visible.splice(Math.max(0, maximum - 1), 1, selected);
  }
  const ids = new Set(visible.map((node) => node.id));
  const edgeLayer = svg("g");
  edgeLayer.setAttribute("class", "graph-edges");
  for (const edge of validEdges(nodes, edges)) {
    if (!ids.has(edge.parentId) || !ids.has(edge.childId)) continue;
    const parent = layout.place(edge.parentId)!;
    const child = layout.place(edge.childId)!;
    const line = svg("line");
    line.dataset.edge = `${edge.parentId}:${edge.childId}`;
    line.dataset.parentId = edge.parentId;
    line.dataset.childId = edge.childId;
    line.setAttribute("x1", String(parent.x + parent.width / 2));
    line.setAttribute("y1", String(parent.y + parent.height));
    line.setAttribute("x2", String(child.x + child.width / 2));
    line.setAttribute("y2", String(child.y));
    line.setAttribute("stroke", "currentColor");
    edgeLayer.append(line);
  }
  svgRoot.append(edgeLayer);
  const laneLayer = svg("g");
  laneLayer.setAttribute("class", "graph-lanes");
  for (const rootId of layout.laneRoots()) {
    const node = nodes.find((item) => item.id === rootId);
    const place = layout.place(rootId);
    if (!node || !place) continue;
    const heading = svg("text");
    heading.setAttribute("x", String(place.x));
    heading.setAttribute("y", String(place.y - 70));
    heading.textContent = `${node.task ?? "unavailable"} · ${rootId} · ${statusWord(node)} · ${nodes.filter((item) => layout.association(item, nodes) === rootId.slice(3)).length} agents · since ${node.intervals?.[0]?.startAbsoluteTime ? "reported" : "Session-relative time unavailable"}`;
    laneLayer.append(heading);
  }
  svgRoot.append(laneLayer);
  const nodeLayer = svg("g");
  nodeLayer.setAttribute("class", "graph-nodes");
  for (const node of visible) {
    const intervals = Math.max(1, node.intervals?.length ?? 0);
    for (let index = 0; index < intervals; index++) {
      const place = layout.place(node.id, index);
      if (!place) continue;
      const group = svg("g");
      group.dataset.nodeId = node.id;
      group.setAttribute("aria-label", `${node.id} ${statusWord(node)}`);
      const box = svg("rect");
      for (const [key, value] of Object.entries({
        x: place.x,
        y: place.y,
        width: place.width,
        height: place.height,
      }))
        box.setAttribute(key, String(value));
      group.append(box);
      const status = statusWord(node);
      icon(group, status, place.x + place.width - 24, place.y + 11);
      const label = svg("text");
      label.setAttribute("x", String(place.x + 10));
      label.setAttribute("y", String(place.y + 22));
      const lines = labelLines(displayName(node.id, place.lane));
      lines.forEach((value, lineIndex) => {
        const span = svg("tspan");
        span.setAttribute("x", String(place.x + 10));
        span.setAttribute("y", String(place.y + 22 + lineIndex * 18));
        span.textContent = value;
        label.append(span);
      });
      group.append(label);
      const state = svg("tspan");
      state.setAttribute("x", String(place.x + 10));
      state.setAttribute("y", String(place.y + place.height - 10));
      state.textContent = status;
      label.append(state);
      if (node.relationship === "unresolved") {
        const mark = svg("path");
        mark.setAttribute("stroke-dasharray", "3 2");
        mark.setAttribute("stroke", "currentColor");
        mark.setAttribute(
          "d",
          `M ${place.x + place.width - 30} ${place.y + 32} h 16`,
        );
        group.append(mark);
        const uncertain = svg("text");
        uncertain.setAttribute("x", String(place.x + 10));
        uncertain.setAttribute("y", String(place.y + place.height + 16));
        uncertain.textContent = "Unknown parent";
        group.append(uncertain);
      }
      if (node.lastUpdateAge != null && node.lastUpdateAge + elapsed > 3600) {
        const quiet = svg("text");
        quiet.setAttribute("x", String(place.x + 10));
        quiet.setAttribute("y", String(place.y + place.height + 32));
        quiet.textContent = `No report ${age(node.lastUpdateAge + elapsed)}`;
        group.append(quiet);
      }
      nodeLayer.append(group);
    }
  }
  svgRoot.append(nodeLayer);
}
