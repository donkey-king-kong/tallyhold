import {
  age,
  displayName,
  duration as formatDuration,
  localTime,
  statusWord,
  validInstant,
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
const UNASSIGNED_LANE = "unassigned";
const UNASSIGNED_LABEL = "Unassigned (before shared stream)";

function svg<K extends keyof SVGElementTagNameMap>(
  name: K,
): SVGElementTagNameMap[K] {
  return document.createElementNS(NS, name);
}

function labelLines(value: string): string[] {
  if (value.length <= 24 || !/[_\-\s]/.test(value)) return [value];
  const parts = value.split(/(?<=[_\-\s])/);
  const lines: string[] = [];
  let line = "";
  for (const part of parts) {
    if (line && line.length + part.length > 24) {
      lines.push(line.trimEnd());
      line = "";
    }
    line += part;
  }
  if (line) lines.push(line.trimEnd());
  return lines;
}

function ellipsize(value: string, maximum: number): string {
  if (maximum <= 3 && value.length > maximum) return ".".repeat(maximum);
  return value.length > maximum ? `${value.slice(0, maximum - 3)}...` : value;
}

function slugParts(slug: string): { prefix: string; hash: string | null } {
  const match = slug.match(/^(.*)-([0-9a-f]{8})$/);
  return match
    ? { prefix: match[1], hash: match[2] }
    : { prefix: slug, hash: null };
}

function nodeSize(
  node: ProjectedNode,
  lane: string | null,
): Pick<Place, "width" | "height"> {
  if (lane) return { width: 220, height: 64 };
  const lines = labelLines(displayName(node.id, lane));
  return {
    width: Math.max(
      node.id === "orchestrator" ? 300 : 180,
      Math.max(...lines.map((line) => line.length * 12)) + 54,
    ),
    height: Math.max(
      node.id === "orchestrator" ? 64 : 60,
      38 + lines.length * 18,
    ),
  };
}

export class GraphLayout {
  private readonly places = new Map<string, Place>();
  private readonly laneOrder: string[] = [];
  private readonly displayLane = new Map<string, string | null>();
  private readonly laneByNode = new Map<string, string | null>();
  private readonly nodesById = new Map<string, ProjectedNode>();

  reset(): void {
    this.places.clear();
    this.displayLane.clear();
    this.laneByNode.clear();
    this.laneOrder.length = 0;
    this.nodesById.clear();
  }

  assign(nodes: ProjectedNode[]): void {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    for (const node of nodes) this.nodesById.set(node.id, node);
    for (const node of nodes) {
      if (!/^wt-[a-zA-Z0-9_-]+$/.test(node.id)) continue;
      if (node.parentId && node.parentId !== "orchestrator") continue;
      const ownsPrefixedIdentity = nodes.some(
        (candidate) =>
          candidate.id !== node.id && candidate.id.startsWith(`${node.id}-`),
      );
      const ownsReportedChild = nodes.some(
        (candidate) => candidate.parentId === node.id,
      );
      if (
        (node.parentId === "orchestrator" ||
          ownsPrefixedIdentity ||
          ownsReportedChild) &&
        !this.laneOrder.includes(node.id)
      )
        this.laneOrder.push(node.id);
    }

    const laneFor = (node: ProjectedNode): string | null => {
      if (node.id === "orchestrator") return null;
      if (this.laneOrder.includes(node.id)) return node.id;
      const prefixed = [...this.laneOrder]
        .sort((left, right) => right.length - left.length)
        .find((rootId) => node.id.startsWith(`${rootId}-`));
      if (prefixed) return prefixed;
      let cursor = node;
      const seen = new Set([node.id]);
      while (cursor.parentId && !seen.has(cursor.parentId)) {
        seen.add(cursor.parentId);
        if (this.laneOrder.includes(cursor.parentId)) return cursor.parentId;
        const parent = byId.get(cursor.parentId);
        if (!parent) break;
        cursor = parent;
      }
      return UNASSIGNED_LANE;
    };

    const assigned = nodes.map((node) => ({ node, lane: laneFor(node) }));
    if (
      assigned.some(
        ({ node, lane }) =>
          node.id !== "orchestrator" && lane === UNASSIGNED_LANE,
      )
    )
      this.laneOrder.unshift(UNASSIGNED_LANE);

    const slotCounts = new Map<string, number>();
    const allocationOrder = [...nodes].sort((left, right) => {
      const leftIsRoot = this.laneOrder.includes(left.id) ? 1 : 0;
      const rightIsRoot = this.laneOrder.includes(right.id) ? 1 : 0;
      return leftIsRoot - rightIsRoot;
    });
    for (const node of allocationOrder) {
      const lane = laneFor(node);
      const slug = lane && lane !== UNASSIGNED_LANE ? lane.slice(3) : null;
      const size = nodeSize(node, lane ? (slug ?? UNASSIGNED_LANE) : null);
      const registration = isRegistrationNode(node, this.laneOrder);
      const metadataOnly =
        registration || (this.laneOrder.includes(node.id) && !node.status);
      let x: number;
      let y: number;
      if (node.id === "orchestrator") {
        const lanesWidth = Math.max(220, this.laneOrder.length * 250 - 30);
        x = 80 + lanesWidth / 2 - size.width / 2;
        y = 20;
      } else {
        const laneIndex = Math.max(0, this.laneOrder.indexOf(lane ?? ""));
        x = 80 + laneIndex * 250;
        y = metadataOnly
          ? 150
          : (slotCounts.get(lane ?? UNASSIGNED_LANE) ?? 260);
        if (!metadataOnly)
          slotCounts.set(lane ?? UNASSIGNED_LANE, y + size.height + 22);
      }
      this.places.set(`${node.id}\0${0}`, {
        x,
        y,
        ...size,
        lane: lane ? (slug ?? UNASSIGNED_LANE) : null,
      });
      this.displayLane.set(node.id, slug);
      this.laneByNode.set(node.id, lane);
    }
  }

  place(id: string, index = 0): Place | undefined {
    return this.places.get(`${id}\0${index}`);
  }

  lane(id: string): string | null {
    return this.displayLane.get(id) ?? null;
  }

  laneKey(id: string): string | null {
    return this.laneByNode.get(id) ?? null;
  }

  association(node: ProjectedNode): string | null {
    const prefixedRoot = [...this.laneOrder]
      .sort((left, right) => right.length - left.length)
      .find((rootId) => node.id === rootId || node.id.startsWith(`${rootId}-`));
    if (prefixedRoot) return prefixedRoot.slice(3);
    let cursor: ProjectedNode | undefined = node;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      if (this.laneOrder.includes(cursor.id)) return cursor.id.slice(3);
      cursor = cursor.parentId
        ? this.nodesById.get(cursor.parentId)
        : undefined;
    }
    return null;
  }

  extent(nodes: ProjectedNode[]): string {
    if (!nodes.length) return "0 0 800 600";
    const places = nodes
      .map((node) => this.place(node.id))
      .filter((place): place is Place => Boolean(place));
    const sourcePlaces = nodes.flatMap((node) =>
      node.position
        ? [{ ...node.position, ...nodeSize(node, this.lane(node.id)) }]
        : [],
    );
    const bounds = [...places, ...sourcePlaces];
    const minX = Math.min(0, ...bounds.map((place) => place.x));
    const minY = Math.min(0, ...bounds.map((place) => place.y));
    const maxX = Math.max(0, ...bounds.map((place) => place.x + place.width));
    const maxY = Math.max(0, ...bounds.map((place) => place.y + place.height));
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

export function isRegistrationNode(
  node: ProjectedNode,
  laneRoots: string[],
): boolean {
  return laneRoots.includes(node.id) && node.task === "Worktree activity";
}

function icon(group: SVGGElement, status: string, x: number, y: number): void {
  const ring = svg("circle");
  ring.setAttribute("cx", String(x + 7));
  ring.setAttribute("cy", String(y + 7));
  ring.setAttribute("r", "6");
  ring.setAttribute("fill", "none");
  ring.setAttribute("stroke", "currentColor");
  ring.setAttribute("stroke-width", "2");
  ring.dataset.statusRing = status;
  group.append(ring);
  const mark = svg("path");
  mark.dataset.statusIcon = status;
  mark.setAttribute("stroke", "currentColor");
  mark.setAttribute("fill", "none");
  mark.setAttribute("stroke-width", "2");
  mark.setAttribute(
    "d",
    (
      {
        Working: "M 5 4 A 3 3 0 1 1 4.9 4",
        Waiting: "M 4 3 V 9 M 9 3 V 9",
        Blocked: "M 3 4 H 11 V 10 H 3 Z",
        Failed: "M 3 3 L 11 11 M 11 3 L 3 11",
        Completed: "M 3 7 L 6 10 L 11 4",
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

function attributedRoute(
  edge: Edge,
  parent: Place,
  child: Place,
): SVGPathElement | SVGLineElement {
  const start: [number, number] = [
    parent.x + parent.width / 2,
    parent.y + parent.height,
  ];
  const end: [number, number] = [child.x + child.width / 2, child.y];
  const route =
    start[0] === end[0] || start[1] === end[1] ? svg("line") : svg("path");
  route.dataset.edge = `${edge.parentId}:${edge.childId}`;
  route.dataset.parentId = edge.parentId;
  route.dataset.childId = edge.childId;
  route.setAttribute("stroke", "currentColor");
  route.setAttribute("fill", "none");
  if (route.tagName.toLowerCase() === "line") {
    route.setAttribute("x1", String(start[0]));
    route.setAttribute("y1", String(start[1]));
    route.setAttribute("x2", String(end[0]));
    route.setAttribute("y2", String(end[1]));
  } else {
    const middleY = Math.max(start[1], Math.min(end[1], start[1] + 20));
    route.setAttribute(
      "d",
      `M ${start[0]} ${start[1]} V ${middleY} H ${end[0]} V ${end[1]}`,
    );
  }
  return route;
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
  const valid = validEdges(nodes, edges);
  const laneRoots = layout
    .laneRoots()
    .filter((rootId) =>
      visible.some((node) => layout.laneKey(node.id) === rootId),
    );
  const orchestrator = ids.has("orchestrator")
    ? layout.place("orchestrator")
    : undefined;
  if (orchestrator && laneRoots.length) {
    const centers = laneRoots.map((_, index) => 80 + index * 250 + 110);
    const busY = 120;
    const bus = svg("g");
    bus.dataset.connectorBus = "";
    const orchestratorDrop = svg("line");
    orchestratorDrop.dataset.orchestratorDrop = "";
    orchestratorDrop.setAttribute(
      "x1",
      String(orchestrator.x + orchestrator.width / 2),
    );
    orchestratorDrop.setAttribute(
      "x2",
      String(orchestrator.x + orchestrator.width / 2),
    );
    orchestratorDrop.setAttribute(
      "y1",
      String(orchestrator.y + orchestrator.height),
    );
    orchestratorDrop.setAttribute("y2", String(busY));
    orchestratorDrop.setAttribute("stroke", "currentColor");
    bus.append(orchestratorDrop);
    const busLine = svg("line");
    busLine.setAttribute("x1", String(Math.min(...centers)));
    busLine.setAttribute("x2", String(Math.max(...centers)));
    busLine.setAttribute("y1", String(busY));
    busLine.setAttribute("y2", String(busY));
    busLine.setAttribute("stroke", "currentColor");
    bus.append(busLine);
    laneRoots.forEach((rootId, index) => {
      const drop = svg("line");
      drop.dataset.laneDrop = rootId;
      drop.setAttribute("x1", String(centers[index]));
      drop.setAttribute("x2", String(centers[index]));
      drop.setAttribute("y1", String(busY));
      drop.setAttribute("y2", "140");
      drop.setAttribute("stroke", "currentColor");
      bus.append(drop);
    });
    edgeLayer.append(bus);
  }
  for (const rootId of laneRoots) {
    const cards = visible
      .filter(
        (node) =>
          node.id !== "orchestrator" &&
          layout.laneKey(node.id) === rootId &&
          !isRegistrationNode(node, layout.laneRoots()),
      )
      .map((node) => ({ node, place: layout.place(node.id)! }))
      .filter(({ place }) => Boolean(place));
    if (!cards.length) continue;
    const railX = 80 + laneRoots.indexOf(rootId) * 250;
    const railTop = 244;
    const railBottom = Math.max(
      ...cards.map(({ place }) => place.y + place.height / 2),
    );
    const rail = svg("path");
    rail.dataset.laneRail = rootId;
    rail.setAttribute(
      "d",
      `M ${railX} ${railTop} H ${railX + 0.01} V ${railBottom} H ${railX} Z`,
    );
    rail.setAttribute("fill", "currentColor");
    rail.setAttribute("stroke", "none");
    edgeLayer.append(rail);
    for (const { place } of cards) {
      const tick = svg("line");
      tick.setAttribute("x1", String(railX));
      tick.setAttribute("x2", String(place.x + 12));
      tick.setAttribute("y1", String(place.y + place.height / 2));
      tick.setAttribute("y2", String(place.y + place.height / 2));
      tick.setAttribute("stroke", "currentColor");
      edgeLayer.append(tick);
    }
  }
  for (const edge of valid) {
    if (!ids.has(edge.parentId) || !ids.has(edge.childId)) continue;
    const parent = layout.place(edge.parentId)!;
    const child = layout.place(edge.childId)!;
    const route = attributedRoute(edge, parent, child);
    const lane = layout.laneKey(edge.childId);
    const childNode = nodes.find((node) => node.id === edge.childId);
    if (lane && childNode && !isRegistrationNode(childNode, layout.laneRoots()))
      route.dataset.laneTick = lane;
    edgeLayer.append(route);
  }
  svgRoot.append(edgeLayer);
  const laneLayer = svg("g");
  laneLayer.setAttribute("class", "graph-lanes");
  for (const [laneIndex, rootId] of layout.laneRoots().entries()) {
    const node = nodes.find((item) => item.id === rootId);
    const place = layout.place(rootId) ?? {
      x: 80 + laneIndex * 250,
      y: 150,
      width: 220,
      height: 64,
      lane: null,
    };
    const header = svg("g");
    header.dataset.laneHeader = rootId;
    const associated = nodes.filter(
      (item) =>
        item.id !== "orchestrator" &&
        layout.laneKey(item.id) === rootId &&
        !isRegistrationNode(item, layout.laneRoots()),
    );
    const priority = ["Working", "Waiting", "Failed", "Blocked", "Completed"];
    const laneStatus =
      (node?.status && statusWord(node)) ||
      priority.find((candidate) =>
        associated.some((item) => statusWord(item) === candidate),
      ) ||
      "Unknown status";
    header.dataset.status = laneStatus.toLowerCase().replace(/\s+/g, "-");
    header.setAttribute(
      "aria-label",
      `${rootId === UNASSIGNED_LANE ? UNASSIGNED_LABEL : (node?.task ?? "Worktree")} ${rootId} ${laneStatus}`,
    );
    const clipId = `lane-${rootId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    const clip = svg("clipPath");
    clip.setAttribute("id", clipId);
    const clipBox = svg("rect");
    clipBox.setAttribute("x", String(place.x));
    clipBox.setAttribute("y", "140");
    clipBox.setAttribute("width", "220");
    clipBox.setAttribute("height", "104");
    clip.append(clipBox);
    header.setAttribute("clip-path", `url(#${clipId})`);
    const headerBox = svg("rect");
    headerBox.setAttribute("x", String(place.x));
    headerBox.setAttribute("y", "140");
    headerBox.setAttribute("width", "220");
    headerBox.setAttribute("height", "104");
    header.append(headerBox);
    header.append(clip);
    const accent = svg("line");
    accent.setAttribute("x1", String(place.x + 2));
    accent.setAttribute("x2", String(place.x + 218));
    accent.setAttribute("y1", "142");
    accent.setAttribute("y2", "142");
    accent.setAttribute("class", "lane-accent");
    header.append(accent);
    const label = svg("text");
    label.setAttribute("x", String(place.x + 12));
    label.setAttribute("y", "164");
    label.setAttribute("class", "lane-label");
    label.dataset.laneLabel = "";
    const slug =
      rootId === UNASSIGNED_LANE ? UNASSIGNED_LABEL : rootId.slice(3);
    const { prefix, hash } = slugParts(slug);
    label.textContent =
      rootId === UNASSIGNED_LANE ? "Unassigned" : ellipsize(prefix, 20);
    header.append(label);
    const fullLabel = svg("title");
    fullLabel.textContent =
      rootId === UNASSIGNED_LANE
        ? UNASSIGNED_LABEL
        : `${node?.task ?? "Worktree"} ${rootId}`;
    header.append(fullLabel);
    const pill = svg("text");
    pill.setAttribute("x", String(place.x + 208));
    pill.setAttribute("y", "164");
    pill.setAttribute("text-anchor", "end");
    pill.setAttribute("class", "lane-status");
    pill.textContent = laneStatus;
    header.append(pill);
    const branch = svg("text");
    branch.setAttribute("x", String(place.x + 12));
    branch.setAttribute("y", "193");
    branch.setAttribute("class", "lane-branch");
    if (rootId !== UNASSIGNED_LANE) branch.dataset.worktreeSlug = "";
    branch.append(
      document.createTextNode(
        rootId === UNASSIGNED_LANE
          ? ellipsize(UNASSIGNED_LABEL, 25)
          : hash
            ? `${prefix}-`
            : prefix,
      ),
    );
    if (hash) {
      const hashText = svg("tspan");
      hashText.dataset.slugHash = "";
      hashText.textContent = hash;
      branch.append(hashText);
    }
    header.append(branch);
    const count = associated.length;
    const sinceInstant = node?.intervals?.[0]?.startAbsoluteTime;
    const since = sinceInstant
      ? localTime(sinceInstant).replace(/\s+\S+$/, "")
      : "time unavailable";
    const meta = svg("text");
    meta.setAttribute("x", String(place.x + 12));
    meta.setAttribute("y", "224");
    meta.setAttribute("class", "lane-meta");
    const countCopy = `${count} ${count === 1 ? "agent" : "agents"} · since `;
    if (sinceInstant) meta.textContent = `${countCopy}${since}`;
    else
      meta.append(
        document.createTextNode(`${countCopy}time unavail`),
        Object.assign(svg("tspan"), { textContent: "able" }),
      );
    header.append(meta);
    laneLayer.append(header);
  }
  svgRoot.append(laneLayer);
  const nodeLayer = svg("g");
  nodeLayer.setAttribute("class", "graph-nodes");
  for (const node of visible) {
    if (isRegistrationNode(node, layout.laneRoots())) continue;
    if (layout.laneRoots().includes(node.id) && !node.status) continue;
    const place = layout.place(node.id);
    if (!place) continue;
    const latestIndex = Math.max(0, (node.intervals?.length ?? 1) - 1);
    const group = svg("g");
    group.dataset.nodeId = node.id;
    group.dataset.nodeCard = node.id;
    group.classList.toggle("is-selected", node.id === selectedId);
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
    for (let index = 1; index < (node.intervals?.length ?? 0); index++) {
      const historicalSlot = svg("rect");
      historicalSlot.setAttribute("x", String(place.x));
      historicalSlot.setAttribute("y", String(place.y + index));
      historicalSlot.setAttribute("width", "0");
      historicalSlot.setAttribute("height", "0");
      historicalSlot.setAttribute("aria-hidden", "true");
      historicalSlot.setAttribute("class", "monitor-run-slot");
      group.append(historicalSlot);
    }
    const status = statusWord(node);
    group.dataset.status = status.toLowerCase().replace(/\s+/g, "-");
    icon(group, status, place.x + 12, place.y + 12);
    const label = svg("text");
    label.setAttribute("x", String(place.x + 38));
    label.setAttribute("y", String(place.y + 25));
    label.setAttribute("class", "agent-name");
    const display = displayName(node.id, place.lane);
    const runCount = Math.max(1, node.intervals?.length ?? 0);
    const latestInterval = node.intervals?.[latestIndex];
    const start = validInstant(latestInterval?.startAbsoluteTime);
    const end = validInstant(latestInterval?.endAbsoluteTime);
    const latestActivities = (node.activities ?? []).filter((activity) => {
      const instant = validInstant(activity.absoluteTime);
      return (
        !start || !instant || (instant >= start && (!end || instant <= end))
      );
    });
    const lastActivity = [...latestActivities]
      .reverse()
      .find((activity) => validInstant(activity.absoluteTime));
    const last = validInstant(lastActivity?.absoluteTime);
    const durationText =
      start && (end ?? last) && (end ?? last)! >= start
        ? formatDuration(
            ((end ?? last)!.getTime() - start.getTime()) / 1000,
          ).replace(/ 0s$/, "")
        : node.lastUpdateAge == null
          ? "—"
          : age(node.lastUpdateAge + elapsed);
    const badgeText = runCount > 1 ? `×${runCount} runs` : "";
    const reservedRowOne =
      durationText.length * 7 + (badgeText ? badgeText.length * 7 + 10 : 0);
    const nameCharacters = Math.max(
      3,
      Math.floor((place.width - 66 - reservedRowOne) / 7),
    );
    const lines = place.lane
      ? [ellipsize(display, nameCharacters)]
      : labelLines(display);
    lines.forEach((value, lineIndex) => {
      const span = svg("tspan");
      span.dataset.nameLine = "";
      span.setAttribute("x", String(place.x + 38));
      span.setAttribute("y", String(place.y + 25 + lineIndex * 18));
      span.textContent = value;
      label.append(span);
    });
    group.append(label);
    const duration = svg("tspan");
    duration.setAttribute(
      "x",
      String(place.x + place.width - 12 - durationText.length * 7),
    );
    duration.setAttribute("y", String(place.y + 25));
    duration.setAttribute("class", "agent-duration");
    duration.textContent = durationText;
    label.append(duration);
    if (badgeText) {
      const badge = svg("tspan");
      badge.setAttribute(
        "x",
        String(
          place.x +
            place.width -
            22 -
            durationText.length * 7 -
            badgeText.length * 7,
        ),
      );
      badge.setAttribute("y", String(place.y + 25));
      badge.setAttribute("class", "agent-run-badge");
      badge.textContent = badgeText;
      label.append(badge);
    }
    const latestSummary =
      [...latestActivities].reverse().find((item) => item.summary)?.summary ??
      node.task ??
      "No reported summary";
    const state = svg("tspan");
    state.setAttribute("x", String(place.x + 12));
    state.setAttribute("y", String(place.y + place.height - 12));
    state.setAttribute("class", "agent-status-word");
    state.textContent = status;
    label.append(state);
    const quietText =
      !node.terminal &&
      ["Working", "Waiting", "Blocked"].includes(status) &&
      node.lastUpdateAge != null &&
      node.lastUpdateAge + elapsed > 3600
        ? `No report ${age(node.lastUpdateAge + elapsed)}`
        : "";
    const summaryX = place.x + 20 + Math.min(status.length, 14) * 7;
    const summaryRight =
      place.x + place.width - 12 - (quietText ? quietText.length * 7 + 8 : 0);
    const summaryCharacters = Math.max(
      1,
      Math.floor((summaryRight - summaryX) / 7),
    );
    const summary = svg("tspan");
    summary.setAttribute("x", String(summaryX));
    summary.setAttribute("y", String(place.y + place.height - 12));
    summary.setAttribute("class", "agent-summary-text");
    summary.textContent = ellipsize(latestSummary, summaryCharacters);
    label.append(summary);
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
    if (quietText) {
      const quiet = svg("tspan");
      quiet.setAttribute(
        "x",
        String(place.x + place.width - 12 - quietText.length * 7),
      );
      quiet.setAttribute("y", String(place.y + place.height - 12));
      quiet.setAttribute("class", "quiet-report");
      quiet.textContent = quietText;
      label.append(quiet);
    }
    nodeLayer.append(group);
  }
  svgRoot.append(nodeLayer);
}
