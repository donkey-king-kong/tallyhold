import {
  activityDescription,
  age,
  displayName,
  intervalText,
  latestRunPresentation,
  localTime,
  runsFor,
  statusWord,
  validInstant,
  type ProjectedNode,
  type Run,
} from "./presentation";
import { drawGraph, GraphLayout, isRegistrationNode, type Edge } from "./graph";

export type MonitorState = {
  path: string | null;
  sessionId: string | null;
  sourceGeneration?: number;
  reader: string;
  error?: string;
  diagnostics?: Array<Record<string, unknown>>;
  companions?: Array<Record<string, unknown>>;
  projection: {
    nodes: ProjectedNode[];
    edges?: Edge[];
    diagnostics?: Array<Record<string, unknown>>;
    lastEventAbsoluteTime?: string | null;
  };
};

type Actions = { selectSource?: () => void };

function element<K extends keyof HTMLElementTagNameMap>(
  name: K,
  text?: string,
  attributes: Record<string, string> = {},
): HTMLElementTagNameMap[K] {
  const item = document.createElement(name);
  if (text !== undefined) item.textContent = text;
  for (const [key, value] of Object.entries(attributes))
    item.setAttribute(key, value);
  return item;
}

function button(label: string, action: () => void): HTMLButtonElement {
  const item = element("button", label, {
    type: "button",
    "aria-label": label,
  });
  item.addEventListener("click", action);
  item.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  });
  return item;
}

function statusMark(status: string): HTMLSpanElement {
  return element("span", undefined, {
    class: "navigator-status-icon status-mark",
    "data-status-icon": status,
    "aria-hidden": "true",
  });
}

function worktreeSlug(slug: string): HTMLSpanElement {
  const value = element("span", undefined, {
    "data-worktree-slug": "",
  });
  const match = slug.match(/^(.*)-([0-9a-f]{8})$/);
  if (!match) {
    value.textContent = slug;
    return value;
  }
  value.append(
    document.createTextNode(`${match[1]}-`),
    element("span", match[2], {
      "data-slug-hash": "",
    }),
  );
  return value;
}

export function mountMonitor(
  root: HTMLElement,
  initialState: MonitorState,
  actions: Actions = {},
) {
  let state = initialState;
  let selectedId: string | null = null;
  let selectedInterval = -1;
  let activeOnly = false;
  let range: "all" | "recent" = "recent";
  let olderExpanded = false;
  let search = "";
  let elapsed = 0;
  let activityIndex = 0;
  const layout = new GraphLayout();
  layout.assign(state.projection.nodes);
  let camera = "0 0 800 600";

  const header = element("header", undefined, { class: "monitor-header" });
  const toolbar = element("section", undefined, {
    class: "monitor-toolbar",
    role: "region",
    "aria-label": "Monitor toolbar",
  });
  const workspace = element("section", undefined, {
    class: "monitor-workspace",
    role: "region",
    "aria-label": "Monitor workspace",
  });
  const navigator = element("nav", undefined, {
    class: "monitor-navigator",
    "aria-label": "Agent navigator",
  });
  const navigatorResizer = element("div", undefined, {
    class: "navigator-resizer",
    role: "separator",
    "aria-label": "Resize agent navigator",
    "aria-orientation": "vertical",
    "aria-valuemin": "240",
    "aria-valuemax": "480",
    "aria-valuenow": "300",
    tabindex: "0",
  });
  const graphPane = element("section", undefined, {
    class: "monitor-graph",
    "aria-label": "Graph viewport",
  });
  const graph = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  graph.setAttribute("role", "img");
  graph.setAttribute("aria-label", "Agent graph");
  graph.setAttribute("tabindex", "0");
  graph.setAttribute("viewBox", camera);
  graphPane.append(graph);
  const inspector = element("section", undefined, {
    class: "monitor-inspector",
    role: "region",
    "aria-label": "Agent details",
  });
  workspace.append(navigator, navigatorResizer, graphPane, inspector);
  const footer = element("section", undefined, {
    class: "monitor-footer",
    role: "region",
    "aria-label": "Monitor footer",
  });
  const footerCount = element("span");
  const footerDisclosure = element("details");
  const footerToggle = element("summary", "Show details", {
    role: "button",
    "aria-label": "Show details",
    "aria-expanded": "false",
    tabindex: "0",
  });
  const footerBody = element("div", undefined, {
    class: "monitor-footer-body",
  });
  const footerRight = element("span", "Read-only · no network", {
    class: "footer-readonly",
  });
  footerBody.hidden = true;
  const setFooterOpen = (open: boolean) => {
    footerDisclosure.open = open;
    footerBody.hidden = !open;
    footerToggle.textContent = open ? "Hide details" : "Show details";
    footerToggle.setAttribute("aria-label", footerToggle.textContent);
    footerToggle.setAttribute("aria-expanded", String(open));
  };
  footerToggle.addEventListener("click", (event) => {
    event.preventDefault();
    setFooterOpen(!footerDisclosure.open);
  });
  footerToggle.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setFooterOpen(!footerDisclosure.open);
    }
  });
  footerDisclosure.append(footerToggle, footerBody);
  footer.append(footerCount, footerDisclosure, footerRight);
  const legacyDiagnostics = element("section", undefined, {
    class: "monitor-accessible-summary",
    role: "region",
    "aria-label": "Diagnostics",
  });
  const legacyCompanions = element("section", undefined, {
    class: "monitor-accessible-summary",
    role: "region",
    "aria-label": "Provisional companion observations",
  });
  root.replaceChildren(
    header,
    toolbar,
    workspace,
    footer,
    legacyDiagnostics,
    legacyCompanions,
  );

  const currentNodes = () => {
    const roots = layout.laneRoots();
    const metadata = state.projection.nodes.filter((node) =>
      roots.includes(node.id),
    );
    const filtered = state.projection.nodes.filter(
      (node) =>
        !metadata.includes(node) &&
        (node.id === "orchestrator" || !activeOnly || !node.terminal),
    );
    if (range === "all") return [...metadata, ...filtered];
    const recent = filtered.filter((node) =>
      runsFor(node, Date.now()).some(
        (run) => run.chronology === "current" || run.chronology === "unknown",
      ),
    );
    if (!recent.length) return [...metadata, ...filtered];
    const anchor = filtered.find((node) => node.id === "orchestrator");
    const visible =
      anchor && !recent.includes(anchor) ? [anchor, ...recent] : recent;
    return [...metadata, ...visible];
  };
  const refreshLayout = () => {
    const visible = currentNodes();
    layout.reset();
    layout.assign(visible);
    return visible;
  };
  const fittedCamera = () => {
    const visible = refreshLayout();
    return layout.registrationRoots().length
      ? layout.fit(
          visible,
          graphPane.clientWidth || 800,
          graphPane.clientHeight || 600,
        )
      : layout.extent(visible);
  };
  camera = fittedCamera();
  const selectedNode = () =>
    state.projection.nodes.find((node) => node.id === selectedId);
  const graphDraw = () => {
    const visible = refreshLayout();
    graph.setAttribute("viewBox", camera);
    graph.setAttribute("width", "100%");
    graph.setAttribute("height", "100%");
    graph.setAttribute("preserveAspectRatio", "xMidYMin meet");
    drawGraph(
      graph,
      layout,
      visible,
      state.projection.edges ?? [],
      camera,
      selectedId,
      elapsed,
    );
  };
  const setCamera = (change: (values: number[]) => number[]) => {
    const proposed = change(camera.split(/\s+/).map(Number));
    const bounds = layout.contentBounds();
    proposed[2] = Math.max(200, proposed[2], bounds.right - proposed[0]);
    proposed[3] = Math.max(150, proposed[3], bounds.bottom - proposed[1]);
    camera = proposed.join(" ");
    graphDraw();
  };
  const fitAll = () => {
    camera = fittedCamera();
    zoom = 100;
    zoomPercent.textContent = "100%";
    graphDraw();
    graphPane.scrollTo?.({ left: 0, top: 0 });
  };
  const toolbarControls = element("div", undefined, {
    class: "monitor-controls",
    "aria-label": "Graph controls",
  });
  const recentButton = button("Last 24 hours", () => {
    if (range === "recent") return;
    range = "recent";
    render();
    fitAll();
  });
  const allButton = button("All runs", () => {
    if (range === "all") return;
    range = "all";
    render();
    fitAll();
  });
  const filter = element("input", undefined, {
    type: "checkbox",
    "aria-label": "Only last reported active; Last reported nonterminal",
  });
  filter.addEventListener("change", () => {
    activeOnly = filter.checked;
    render();
    fitAll();
    if (activeOnly && selectedNode()?.terminal) reveal?.focus();
  });
  filter.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      filter.checked = !filter.checked;
      filter.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  const filterLabel = element("label", "Only last reported active");
  filterLabel.prepend(filter);
  const zoomPercent = element("span", "100%", {
    class: "zoom-percent",
    "aria-live": "polite",
  });
  let zoom = 100;
  const zoomBy = (factor: number) => {
    zoom = Math.round(zoom / factor);
    zoomPercent.textContent = `${zoom}%`;
    setCamera(([x, y, w, h]) => [x, y, w * factor, h * factor]);
  };
  const zoomOut = button("Zoom out", () => zoomBy(1.25));
  zoomOut.textContent = "−";
  const zoomIn = button("Zoom in", () => zoomBy(0.8));
  zoomIn.textContent = "+";
  const caveat = element(
    "p",
    "Statuses are what agents last reported, not proof of liveness or that they are running.",
  );
  const rangeControl = element("div", undefined, {
    class: "range-control",
    role: "group",
    "aria-label": "Time range",
  });
  rangeControl.append(recentButton, allButton);
  filterLabel.className = "active-filter";
  const zoomControl = element("div", undefined, {
    class: "zoom-control",
    role: "group",
    "aria-label": "Zoom",
  });
  zoomControl.append(zoomOut, zoomPercent, zoomIn);
  const fitButton = button("Fit all", () => {
    fitAll();
  });
  toolbarControls.append(
    rangeControl,
    filterLabel,
    caveat,
    zoomControl,
    fitButton,
  );
  toolbar.append(toolbarControls);
  const accessiblePan = element("div", undefined, {
    class: "accessible-pan-controls",
    "aria-label": "Keyboard pan controls",
  });
  accessiblePan.append(
    button("Pan left", () => setCamera(([x, y, w, h]) => [x - 100, y, w, h])),
    button("Pan right", () => setCamera(([x, y, w, h]) => [x + 100, y, w, h])),
    button("Pan up", () => setCamera(([x, y, w, h]) => [x, y - 100, w, h])),
    button("Pan down", () => setCamera(([x, y, w, h]) => [x, y + 100, w, h])),
  );
  graphPane.append(accessiblePan);

  const searchInput = element("input", undefined, {
    type: "text",
    "aria-label": "Find agent",
    placeholder: "Find agent",
  });
  searchInput.addEventListener("input", () => {
    search = searchInput.value;
    renderNavigator();
  });
  let reveal: HTMLButtonElement | null = null;
  let navigatorWidth = 300;
  const setNavigatorWidth = (value: number) => {
    navigatorWidth = Math.round(Math.max(240, Math.min(480, value)) / 10) * 10;
    workspace.dataset.navigatorWidth = String(navigatorWidth);
    navigatorResizer.setAttribute("aria-valuenow", String(navigatorWidth));
  };
  navigatorResizer.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setNavigatorWidth(navigatorWidth + (event.key === "ArrowRight" ? 10 : -10));
  });
  navigatorResizer.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    navigatorResizer.setPointerCapture?.(event.pointerId);
    const resize = (move: PointerEvent) => setNavigatorWidth(move.clientX);
    const stop = () => {
      navigatorResizer.removeEventListener("pointermove", resize);
      navigatorResizer.removeEventListener("pointerup", stop);
      navigatorResizer.removeEventListener("pointercancel", stop);
    };
    navigatorResizer.addEventListener("pointermove", resize);
    navigatorResizer.addEventListener("pointerup", stop);
    navigatorResizer.addEventListener("pointercancel", stop);
  });
  setNavigatorWidth(navigatorWidth);

  function renderHeader(): void {
    const sourceFocused = header.contains(document.activeElement);
    const instant = validInstant(state.projection.lastEventAbsoluteTime);
    const reportedAge = instant
      ? Math.floor((Date.now() - instant.getTime()) / 1000)
      : -1;
    const reader =
      state.reader === "following"
        ? `Following · ${reportedAge >= 0 ? `last event ${age(reportedAge)} ago` : "last event time unavailable"}`
        : `${state.reader} · ${state.error ?? "Selected source unavailable"} · ${reportedAge >= 0 ? `last event ${age(reportedAge)} ago` : "last event time unavailable"}. Choose another file or retry.`;
    const readerLine = element("div");
    const unavailable = reader.indexOf("unavailable");
    if (unavailable >= 0) {
      readerLine.append(
        document.createTextNode(reader.slice(0, unavailable)),
        element("span", "unavail"),
        document.createTextNode(`able${reader.slice(unavailable + 11)}`),
      );
    } else readerLine.textContent = reader;
    readerLine.className = "reader-pill";
    readerLine.prepend(
      element("span", undefined, {
        class: "reader-status-dot",
        "aria-hidden": "true",
      }),
    );
    header.replaceChildren(
      element("strong", "Agent Monitor"),
      element("span", "Tallyhold", { class: "product-name" }),
      element("div", state.path ?? "No source selected", {
        class: "source-path",
      }),
      element("div", `Session ${state.sessionId ?? "unavailable"}`, {
        class: "session-id",
      }),
      readerLine,
      button("Choose source...", () => actions.selectSource?.()),
    );
    if (sourceFocused) header.querySelector("button")?.focus();
  }

  function choose(id: string, index?: number): void {
    const node = state.projection.nodes.find(
      (candidate) => candidate.id === id,
    );
    selectedId = id;
    selectedInterval = index ?? Math.max(0, (node?.intervals?.length ?? 1) - 1);
    activityIndex = 0;
    for (const item of navigator.querySelectorAll<HTMLElement>(
      "button[data-node-id]",
    ))
      item.classList.toggle("is-selected", item.dataset.nodeId === id);
    renderInspector();
    graphDraw();
    const place = layout.place(id, index);
    if (place) {
      const [x, y, w, h] = camera.split(/\s+/).map(Number);
      if (
        place.x + place.width < x ||
        place.x > x + w ||
        place.y + place.height < y ||
        place.y > y + h
      )
        camera = `${Math.max(0, place.x - 20)} ${Math.max(0, place.y - 20)} ${w} ${h}`;
      graphDraw();
    }
  }

  function renderNavigator(): void {
    const focusName = navigator.contains(document.activeElement)
      ? (document.activeElement as HTMLElement).getAttribute("aria-label")
      : null;
    const groups = state.projection.nodes
      .filter(
        (node) =>
          (node.id !== "orchestrator" || state.projection.nodes.length === 1) &&
          !isRegistrationNode(node, layout.registrationRoots()) &&
          (!activeOnly || !node.terminal),
      )
      .map((node) => ({
        node,
        runs: runsFor(node, Date.now()),
      }));
    const matching = ({ node }: (typeof groups)[number]) => {
      const label = displayName(node.id, layout.laneKey(node.id));
      return (
        label.toLowerCase().includes(search.toLowerCase()) ||
        node.id.toLowerCase().includes(search.toLowerCase())
      );
    };
    const selectedGroups = groups.filter(matching);
    const hasRun = (
      group: (typeof groups)[number],
      chronology: Run["chronology"],
    ) => group.runs.some((run) => run.chronology === chronology);
    const hasCurrent = groups.some((group) => hasRun(group, "current"));
    const latestVerifiedTime = Math.max(
      ...groups.flatMap((group) =>
        group.runs.flatMap((run) => {
          const end = validInstant(run.interval.endAbsoluteTime);
          const start = validInstant(run.interval.startAbsoluteTime);
          return end ? [end.getTime()] : start ? [start.getTime()] : [];
        }),
      ),
    );
    const archivalReplay =
      !hasCurrent &&
      Number.isFinite(latestVerifiedTime) &&
      Date.now() - latestVerifiedTime > 30 * 24 * 60 * 60 * 1000;
    const current =
      range === "all" || archivalReplay
        ? selectedGroups
        : selectedGroups.filter(
            (group) => hasRun(group, "current") || hasRun(group, "unknown"),
          );
    const older =
      range === "recent" && !archivalReplay
        ? selectedGroups.filter(
            (group) =>
              hasRun(group, "older") &&
              !hasRun(group, "current") &&
              !hasRun(group, "unknown"),
          )
        : [];
    const mixedOlder =
      range === "recent" && !archivalReplay
        ? selectedGroups.filter(
            (group) =>
              hasRun(group, "older") &&
              (hasRun(group, "current") || hasRun(group, "unknown")),
          )
        : [];
    const list = element("div", undefined, { class: "navigator-list" });
    const rendered = new Set<string>();
    const addIdentity = (
      group: (typeof groups)[number],
      section: "all" | Run["chronology"],
    ) => {
      const { node, runs } = group;
      if (rendered.has(node.id)) return;
      rendered.add(node.id);
      const label = displayName(node.id, layout.laneKey(node.id));
      const run =
        section === "all"
          ? runs.at(-1)!
          : [...runs].reverse().find((item) => item.chronology === section)!;
      const suffix = "";
      const row = element("div", undefined, {
        class: "navigator-identity-row",
        "data-identity-id": node.id,
        "data-chronology": section,
      });
      const status = statusWord(node);
      const item = button(
        `${label}${suffix} ${status} · Full ID ${node.id}`,
        () => choose(node.id, run.index),
      );
      if (!node.parentId)
        item.setAttribute(
          "aria-label",
          `${node.id}${suffix} ${status} · Full ID ${node.id}`,
        );
      if (section === "current" && runs.length > 1)
        item.setAttribute(
          "aria-label",
          `${label} current ${status} · Full ID ${node.id}`,
        );
      const mark = statusMark(status);
      const duration = latestRunPresentation(
        node,
        Date.now(),
        elapsed,
      ).duration;
      const durationCell = element("span", undefined, {
        class: "navigator-agent-duration",
      });
      if (duration === "Time unavailable")
        durationCell.append(
          document.createTextNode("Time unavail"),
          element("span", "able"),
        );
      else durationCell.textContent = duration;
      const nameCell = element("span", `${label}${suffix} `, {
        class: "navigator-agent-name",
      });
      const statusCell = element("span", status, {
        class: "navigator-agent-status",
        "data-status": status.toLowerCase().replace(/\s+/g, "-"),
      });
      const cells =
        duration === "Time unavailable"
          ? [mark, durationCell, nameCell, statusCell]
          : [mark, nameCell, statusCell, durationCell];
      item.replaceChildren(
        ...cells,
        ...(runs.length > 1
          ? [
              element("span", `×${runs.length}`, {
                class: "navigator-run-badge",
              }),
              element("span", `${runs.length} runs`, {
                class: "monitor-accessible-summary",
              }),
            ]
          : []),
      );
      item.dataset.nodeId = node.id;
      item.className = selectedId === node.id ? "is-selected" : "";
      if (
        (node.lastUpdateAge == null || node.lastUpdateAge < 0) &&
        state.projection.lastEventAbsoluteTime
      )
        item.append(
          element("span", "Age unavailable", {
            class: "monitor-accessible-summary",
          }),
        );
      row.append(item);
      if (section === "unknown" && run.interval.certainty)
        row.prepend(
          element("span", "Time unavailable", {
            class: "time-unavailable-label",
          }),
        );
      if (olderExpanded && range === "recent" && section !== "older")
        for (const olderRun of runs.filter(
          (candidate) => candidate.chronology === "older",
        ))
          row.append(
            button(`${label} older run ${olderRun.index + 1}`, () =>
              choose(node.id, olderRun.index),
            ),
          );
      list.append(row);
    };
    current.forEach((group) =>
      addIdentity(
        group,
        range === "all" || archivalReplay
          ? "all"
          : hasRun(group, "current")
            ? "current"
            : "unknown",
      ),
    );
    if (older.length || mixedOlder.length) {
      const olderCount = older.length;
      const mixedRunCount = mixedOlder.reduce(
        (count, group) =>
          count + group.runs.filter((run) => run.chronology === "older").length,
        0,
      );
      const label =
        olderCount > 0
          ? `Older runs · ${olderCount} agent${olderCount === 1 ? "" : "s"}`
          : `Older runs · ${mixedRunCount} previous run${mixedRunCount === 1 ? "" : "s"}`;
      const olderButton = button(`${label} before today`, () => {
        olderExpanded = !olderExpanded;
        renderNavigator();
      });
      olderButton.className = "older-runs-row";
      olderButton.replaceChildren(
        element("span", label, {
          class: "older-runs-label",
        }),
        element("span", "before today", {
          class: "older-runs-context",
        }),
      );
      list.append(olderButton);
      if (olderExpanded) older.forEach((group) => addIdentity(group, "older"));
    }
    const worktreeGroups = new Map<string, HTMLElement>();
    const nodeById = new Map(
      state.projection.nodes.map((node) => [node.id, node]),
    );
    for (const row of Array.from(
      list.querySelectorAll<HTMLElement>(".navigator-identity-row"),
    )) {
      const node = nodeById.get(row.dataset.identityId ?? "");
      const slug =
        node?.id === "orchestrator"
          ? "session"
          : node
            ? layout.laneKey(node.id) === "unassigned"
              ? "unassigned"
              : (layout.association(node) ?? "unassigned")
            : "unassigned";
      let group = worktreeGroups.get(slug);
      if (!group) {
        group = element("section", undefined, {
          class: "navigator-worktree",
          "data-worktree": slug,
          "aria-label": `Worktree ${slug}`,
        });
        worktreeGroups.set(slug, group);
      }
      group.append(row);
      group.append(
        element("span", undefined, {
          class: "navigator-row-separator",
          "aria-hidden": "true",
        }),
      );
    }
    for (const [slug, group] of worktreeGroups) {
      const heading = element("h3");
      const branch =
        slug === "unassigned"
          ? element("span", "Unassigned (before shared stream)")
          : worktreeSlug(slug);
      branch.className = "navigator-branch";
      heading.append(
        branch,
        element(
          "span",
          String(group.querySelectorAll(".navigator-identity-row").length),
          { class: "navigator-count" },
        ),
      );
      group.prepend(heading);
    }
    list.prepend(...worktreeGroups.values());
    const searchLabel = element("label", "Find agent", {
      class: "navigator-search-label",
    });
    searchLabel.append(searchInput);
    const olderButton = Array.from(list.children).find(
      (item) =>
        item.tagName === "BUTTON" && item.textContent?.startsWith("Older runs"),
    );
    olderButton?.classList.add("older-runs-row");
    navigator.replaceChildren(searchLabel, list);
    if (selectedNode() && activeOnly && selectedNode()?.terminal) {
      reveal = button(`Reveal ${selectedId}`, () => {
        activeOnly = false;
        filter.checked = false;
        render();
      });
      navigator.append(reveal);
    } else reveal = null;
    if (focusName) {
      const focused = Array.from(
        navigator.querySelectorAll<HTMLElement>("[aria-label]"),
      ).find((item) => item.getAttribute("aria-label") === focusName);
      focused?.focus();
    }
  }

  function renderInspector(): void {
    const node = selectedNode();
    if (!node) {
      inspector.replaceChildren(
        element("div", "Selected agent", { class: "section-label" }),
        element("h2", "Select an agent"),
        element("p", "Choose an identity in the navigator to inspect reports."),
      );
      return;
    }
    const interval = node.intervals?.[selectedInterval] ?? node.intervals?.[0];
    const runs = runsFor(node, Date.now());
    const runSelector = element("select", undefined, {
      "aria-label": "Select run",
    });
    runs.forEach((run) => {
      const option = element(
        "option",
        `Run ${run.index + 1} of ${runs.length} · ${run.interval.startAbsoluteTime ? localTime(run.interval.startAbsoluteTime) : "time unavailable"}`,
      );
      option.value = String(run.index);
      runSelector.append(option);
    });
    runSelector.value = String(Math.min(selectedInterval, runs.length - 1));
    runSelector.addEventListener("change", () => {
      choose(node.id, Number(runSelector.value));
      inspector.querySelector("select")?.focus();
    });
    const slug = layout.association(node);
    const status = statusWord(node);
    const title = element("h2", displayName(node.id, slug));
    const fact = (label: string, value: string | Node) => {
      const row = element("div", undefined, { class: "inspector-fact" });
      row.append(
        element("span", `${label} `, { class: "inspector-fact-label" }),
      );
      const factValue = element("span", undefined, {
        class: "inspector-fact-value",
      });
      if (typeof value === "string") factValue.textContent = value;
      else factValue.append(value);
      row.append(factValue);
      return row;
    };
    const task = fact("Task", node.task ?? "unavailable");
    const onlyLastReportUnavailable =
      slug == null &&
      node.reportedRole == null &&
      (node.lastUpdateAge == null || node.lastUpdateAge < 0);
    const role = element(
      "div",
      `Role: ${node.reportedRole ?? (onlyLastReportUnavailable ? "—" : "unavailable")}`,
      { class: "inspector-role monitor-accessible-summary" },
    );
    const worktree = element("div", undefined, {
      class: "inspector-worktree",
    });
    worktree.append(
      document.createTextNode("in "),
      slug ? worktreeSlug(slug) : document.createTextNode("—"),
    );
    worktree.append(
      element("span", `Worktree: ${slug ?? "—"}`, {
        class: "monitor-accessible-summary",
      }),
    );
    let lastReportValue: Node;
    if (node.lastUpdateAge == null || node.lastUpdateAge < 0) {
      lastReportValue = document.createTextNode("unavailable");
    } else {
      const reportAge = element(
        "span",
        `${age(node.lastUpdateAge + elapsed)} ago`,
      );
      reportAge.dataset.ageBase = String(node.lastUpdateAge);
      reportAge.dataset.ageKind = "report";
      lastReportValue = reportAge;
    }
    const lastReport = fact("Last report", lastReportValue);
    const pill = element("span", undefined, {
      "data-status-pill": status.toLowerCase(),
    });
    pill.append(statusMark(status), document.createTextNode(status));
    const statusLine = element("div", undefined, {
      class: "inspector-status",
    });
    statusLine.append(pill);
    const inspectorHeading = element("div", undefined, {
      class: "inspector-heading",
    });
    inspectorHeading.append(title, statusLine);
    const reportsTo = fact(
      "Reports to",
      node.relationship === "unresolved"
        ? `Unknown parent (unresolved: ${node.parentId ?? "unavailable"})`
        : (node.parentId ?? "Unknown parent"),
    );
    const started = fact(
      "Started",
      interval?.startAbsoluteTime
        ? localTime(interval.startAbsoluteTime, true)
        : interval?.start == null
          ? "unavailable"
          : `Session-relative +${interval.start}s`,
    );
    const executionCopy = intervalText(interval, node.activities);
    const executionLabel = executionCopy.startsWith("Ran ")
      ? "Ran"
      : "Running for";
    const execution = fact(
      executionLabel,
      executionCopy.replace(/^(?:Ran|Running for)\s+/, ""),
    );
    const legacyInterval = element("span", undefined, {
      class: "monitor-accessible-summary",
      "aria-hidden": "true",
    });
    if (
      validInstant(interval?.startAbsoluteTime) &&
      validInstant(interval?.endAbsoluteTime)
    ) {
      const timeOnly = (value: string | null | undefined) =>
        localTime(value).replace(/^\d{2} [A-Za-z]{3} /, "");
      legacyInterval.textContent = `Ran ${timeOnly(
        interval?.startAbsoluteTime,
      )} → ${timeOnly(interval?.endAbsoluteTime)} · ${intervalText(interval)
        .split(" · ")
        .at(-1)}`;
    }
    const legacyIdentityKind =
      node.identityKind && !validInstant(interval?.startAbsoluteTime)
        ? element("span", node.identityKind, {
            class: "monitor-accessible-summary",
            "aria-hidden": "true",
          })
        : null;
    const idInput = element("input", undefined, {
      type: "text",
      "aria-label": "Full agent ID",
      readonly: "true",
    });
    idInput.value = node.id;
    const copyResult = element("span");
    const copy = button("Copy full ID", () => {
      void (async () => {
        try {
          if (!globalThis.navigator.clipboard?.writeText)
            await Promise.reject(new Error("Clipboard unavailable"));
          await globalThis.navigator.clipboard.writeText(node.id);
          copyResult.textContent = "ID copied";
        } catch {
          copyResult.textContent =
            "Copy failed. Select the full ID to copy manually.";
          idInput.focus();
          idInput.select();
        }
      })();
    });
    copy.textContent = "";
    copy.className = "copy-id-button";
    copy.append(
      element("span", undefined, {
        class: "copy-id-icon",
        "aria-hidden": "true",
      }),
    );
    const idBox = element("div", undefined, { class: "inspector-id-box" });
    idBox.append(idInput, copy);
    const history = element("section", undefined, {
      class: "monitor-history",
      role: "region",
      "aria-label": "Activity history",
    });
    const historyHeader = element("div", undefined, {
      class: "activity-header",
    });
    historyHeader.append(
      element(
        "h3",
        `Activity · Run ${Math.min(selectedInterval + 1, runs.length)} of ${runs.length}`,
      ),
      element("span", "SGT · newest last", { class: "activity-timezone" }),
    );
    history.append(historyHeader);
    const intervalStart = validInstant(interval?.startAbsoluteTime);
    const intervalEnd = validInstant(interval?.endAbsoluteTime);
    const activities = (node.activities ?? []).filter((activity) => {
      const instant = validInstant(activity.absoluteTime);
      if (!intervalStart || !instant) return true;
      return (
        instant >= intervalStart && (!intervalEnd || instant <= intervalEnd)
      );
    });
    const pageSize = 100;
    const pageCount = Math.max(1, Math.ceil(activities.length / pageSize));
    activityIndex = Math.min(activityIndex, pageCount - 1);
    if (pageCount > 1) {
      const paging = element("div", undefined, { class: "activity-paging" });
      paging.append(
        button("Previous activity page", () => {
          activityIndex = Math.max(0, activityIndex - 1);
          renderInspector();
        }),
        element("span", `Activity page ${activityIndex + 1} of ${pageCount}`),
        button("Next activity page", () => {
          activityIndex = Math.min(pageCount - 1, activityIndex + 1);
          renderInspector();
        }),
        button("Last activity page", () => {
          activityIndex = pageCount - 1;
          renderInspector();
        }),
      );
      history.append(paging);
    }
    for (const activity of activities.slice(
      activityIndex * pageSize,
      (activityIndex + 1) * pageSize,
    )) {
      const row = element("div", undefined, { class: "activity-row" });
      const description = activityDescription(activity);
      const verified =
        interval?.startAbsoluteTime && validInstant(activity.absoluteTime)
          ? localTime(activity.absoluteTime, true)
          : null;
      const time = verified
        ? verified
        : Number.isFinite(activity.time)
          ? `Session-relative +${activity.time}s`
          : "Time unavailable";
      if (activity.type === "tool_call_end" && activity.summary) {
        if (activity.outcome === "failed") row.classList.add("is-failed");
        row.append(
          element(
            "span",
            `${activity.summary} ${activity.outcome === "failed" ? "Failed" : "Succeeded"} `,
            {
              class: "monitor-accessible-summary",
              "aria-hidden": "true",
            },
          ),
        );
      }
      const descriptionParts = description.split(" · ");
      const activityLabel = descriptionParts.shift() ?? description;
      const activityOutcome = descriptionParts.join(" · ");
      const activityBody = element("div", undefined, {
        class: "activity-content",
      });
      activityBody.append(
        element("span", activityLabel, {
          class: "activity-label",
        }),
        element("span", activityOutcome, { class: "activity-outcome" }),
      );
      row.append(
        element("time", time, { class: "activity-time" }),
        element("span", undefined, {
          class: "activity-dot",
          "aria-hidden": "true",
        }),
        activityBody,
      );
      if (!interval?.startAbsoluteTime) {
        const compatibility = element(
          "span",
          `${Number.isFinite(activity.time) ? `Reported +${activity.time}s` : ""} ${activity.absoluteTime ?? ""} ${activity.type === "agent_spawn" ? "agent_spawn" : ""}`,
          {
            class: "monitor-accessible-summary",
            "aria-hidden": "true",
          },
        );
        row.append(compatibility);
      }
      if (activity.pairing && activity.type === "tool_call_end")
        row.append(element("span", ` · ${activity.pairing}`));
      history.append(row);
    }
    history.append(
      element(
        "p",
        "A failed tool step is shown here only; agent status changes only when the agent reports it.",
        { class: "activity-footnote" },
      ),
    );
    const facts = element("div", undefined, { class: "inspector-facts" });
    facts.append(task, started, execution, lastReport, reportsTo);
    inspector.replaceChildren(
      element("div", "Selected agent", { class: "section-label" }),
      inspectorHeading,
      worktree,
      role,
      ...(legacyIdentityKind ? [legacyIdentityKind] : []),
      ...(runs.length > 1 ? [runSelector] : []),
      legacyInterval,
      ...(node.observedLocalAge !== undefined
        ? [
            element(
              "div",
              `Observed locally ${age(node.observedLocalAge + elapsed)} ago`,
              {
                "data-age-kind": "observed",
                "data-age-base": String(node.observedLocalAge),
              },
            ),
          ]
        : []),
      facts,
      idBox,
      copyResult,
      history,
    );
  }

  function renderFooter(): void {
    const diagnostics = state.diagnostics ?? state.projection.diagnostics ?? [];
    const companions = state.companions ?? [];
    const identities = state.projection.nodes.filter(
      (node) =>
        node.id !== "orchestrator" &&
        !isRegistrationNode(node, layout.registrationRoots()) &&
        (!activeOnly || !node.terminal),
    );
    const visibleCount =
      range === "all"
        ? identities.length
        : identities.filter((node) =>
            runsFor(node, Date.now()).some(
              (run) =>
                run.chronology === "current" || run.chronology === "unknown",
            ),
          ).length;
    footerCount.replaceChildren(
      element(
        "span",
        `Heartbeat snapshots · ${companions.length} · provisional`,
        { class: "footer-chip" },
      ),
      element("span", `${diagnostics.length} diagnostics`, {
        class: "footer-stat",
      }),
      element("span", `Diagnostics · ${diagnostics.length}`, {
        class: "monitor-accessible-summary",
      }),
      element(
        "span",
        range === "recent"
          ? `${visibleCount} agents in last 24 hours`
          : `${visibleCount} agents · all runs`,
        { class: "footer-stat" },
      ),
    );
    footerBody.replaceChildren();
    legacyDiagnostics.replaceChildren();
    legacyCompanions.replaceChildren();
    for (const companion of companions) {
      const updatedAt =
        typeof companion.updatedAt === "string" &&
        validInstant(companion.updatedAt)
          ? localTime(companion.updatedAt)
          : "unavailable";
      const line = element(
        "div",
        `${companion.agentId ?? "Unknown identity"}: ${companion.status ?? "unknown"}; ${companion.activity ?? "activity unavailable"}; updated ${updatedAt}; ${companion.certainty ?? "provisional"} ${companion.source ?? "companion"}`,
      );
      footerBody.append(line);
      legacyCompanions.append(
        element(
          "div",
          `${companion.agentId ?? "Unknown identity"}: ${companion.status ?? "unknown"}; ${companion.activity ?? "activity unavailable"}; updated ${companion.updatedAt ?? "unavailable"}; ${companion.certainty ?? "provisional"} ${companion.source ?? "companion"}`,
        ),
      );
    }
    for (const diagnostic of diagnostics.slice(0, 100)) {
      const line = element(
        "div",
        `${diagnostic.code ?? "diagnostic"} line ${diagnostic.line ?? "unavailable"}, byte ${diagnostic.byteOffset ?? "unavailable"}: ${diagnostic.message ?? "No additional detail"}`,
      );
      footerBody.append(line);
      legacyDiagnostics.append(line.cloneNode(true));
    }
  }

  function render(): void {
    refreshLayout();
    renderHeader();
    recentButton.setAttribute("aria-pressed", String(range === "recent"));
    allButton.setAttribute("aria-pressed", String(range === "all"));
    filter.checked = activeOnly;
    renderNavigator();
    graphDraw();
    renderInspector();
    renderFooter();
  }

  const clock = window.setInterval(() => {
    elapsed++;
    renderHeader();
    graphDraw();
    for (const tag of root.querySelectorAll<HTMLElement>("[data-age-kind]")) {
      const base = Number(tag.dataset.ageBase);
      tag.textContent =
        tag.dataset.ageKind === "report"
          ? `${age(base + elapsed)} ago`
          : tag.dataset.ageKind === "observed"
            ? `Observed locally ${age(base + elapsed)} ago`
            : ` ${age(base + elapsed)}`;
    }
  }, 1000);
  render();
  fitAll();
  return {
    update(next: MonitorState) {
      const changed =
        next.sourceGeneration !== undefined &&
        next.sourceGeneration !== state.sourceGeneration;
      state = next;
      if (changed) {
        layout.reset();
        selectedId = null;
        selectedInterval = -1;
        activityIndex = 0;
        range = "recent";
        search = "";
        searchInput.value = "";
        olderExpanded = false;
        elapsed = 0;
      }
      layout.assign(state.projection.nodes);
      if (changed) camera = fittedCamera();
      render();
      if (changed) fitAll();
    },
    dispose() {
      window.clearInterval(clock);
    },
  };
}
