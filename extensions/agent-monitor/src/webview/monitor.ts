import {
  activityDescription,
  age,
  displayName,
  intervalText,
  localTime,
  runsFor,
  statusWord,
  validInstant,
  type ProjectedNode,
  type Run,
} from "./presentation";
import { drawGraph, GraphLayout, type Edge } from "./graph";

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

export function mountMonitor(
  root: HTMLElement,
  initialState: MonitorState,
  actions: Actions = {},
) {
  let state = initialState;
  let selectedId: string | null = null;
  let selectedInterval = 0;
  let activeOnly = false;
  let range: "all" | "recent" = "all";
  let olderExpanded = false;
  let search = "";
  let elapsed = 0;
  let activityIndex = 0;
  const layout = new GraphLayout();
  layout.assign(state.projection.nodes);
  let camera = layout.extent(state.projection.nodes);

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
  workspace.append(navigator, graphPane, inspector);
  const footer = element("section", undefined, {
    class: "monitor-footer",
    role: "region",
    "aria-label": "Monitor footer",
  });
  const footerCount = element("span");
  const footerDisclosure = element("details");
  const footerToggle = button("Show details", () => {
    footerDisclosure.open = !footerDisclosure.open;
  });
  const footerBody = element("div");
  footerDisclosure.append(footerBody);
  footer.append(footerCount, footerToggle, footerDisclosure);
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

  const currentNodes = () =>
    state.projection.nodes.filter((node) => !activeOnly || !node.terminal);
  const selectedNode = () =>
    state.projection.nodes.find((node) => node.id === selectedId);
  const graphDraw = () => {
    graph.setAttribute("viewBox", camera);
    drawGraph(
      graph,
      layout,
      currentNodes(),
      state.projection.edges ?? [],
      camera,
      selectedId,
      elapsed,
    );
  };
  const setCamera = (change: (values: number[]) => number[]) => {
    const proposed = change(camera.split(/\s+/).map(Number));
    const bounds = layout.contentBounds();
    proposed[2] = Math.max(proposed[2], bounds.right - proposed[0]);
    proposed[3] = Math.max(proposed[3], bounds.bottom - proposed[1]);
    camera = proposed.join(" ");
    graphDraw();
  };
  const fitAll = () => {
    camera = layout.extent(state.projection.nodes);
    graphDraw();
  };
  const toolbarControls = element("div", undefined, {
    class: "monitor-controls",
    "aria-label": "Graph controls",
  });
  const recentButton = button("Last 24 hours", () => {
    range = "recent";
    render();
  });
  const allButton = button("All runs", () => {
    range = "all";
    render();
  });
  const filter = element("input", undefined, {
    type: "checkbox",
    "aria-label": "Only last reported active; Last reported nonterminal",
  });
  filter.addEventListener("change", () => {
    activeOnly = filter.checked;
    render();
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
  toolbarControls.append(
    recentButton,
    allButton,
    filterLabel,
    button("Zoom out", () =>
      setCamera(([x, y, w, h]) => [x, y, w * 1.25, h * 1.25]),
    ),
    button("Zoom in", () =>
      setCamera(([x, y, w, h]) => [x, y, w * 0.8, h * 0.8]),
    ),
    button("Fit All", fitAll),
    button("Pan left", () => setCamera(([x, y, w, h]) => [x - 100, y, w, h])),
    button("Pan right", () => setCamera(([x, y, w, h]) => [x + 100, y, w, h])),
    button("Pan up", () => setCamera(([x, y, w, h]) => [x, y - 100, w, h])),
    button("Pan down", () => setCamera(([x, y, w, h]) => [x, y + 100, w, h])),
  );
  const caveat = element(
    "p",
    "Status is last reported, not proof of liveness.",
  );
  toolbar.append(toolbarControls, caveat);

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
    header.replaceChildren(
      element("strong", "Tallyhold Agent Monitor"),
      element("div", state.path ?? "No source selected"),
      element("div", `Session: ${state.sessionId ?? "unavailable"}`),
      readerLine,
      button("Choose Source", () => actions.selectSource?.()),
    );
    if (sourceFocused) header.querySelector("button")?.focus();
  }

  function choose(id: string, index = 0): void {
    selectedId = id;
    selectedInterval = index;
    activityIndex = 0;
    renderNavigator();
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
    const groups = currentNodes().map((node) => ({
      node,
      runs: runsFor(node, Date.now()),
    }));
    const matching = ({ node }: (typeof groups)[number]) => {
      const label = displayName(node.id, layout.lane(node.id));
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
    const current =
      range === "all"
        ? selectedGroups
        : selectedGroups.filter((group) => hasRun(group, "current"));
    const older =
      range === "recent"
        ? selectedGroups.filter((group) => hasRun(group, "older"))
        : [];
    const unknown =
      range === "recent"
        ? selectedGroups.filter(
            (group) => !hasRun(group, "current") && hasRun(group, "unknown"),
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
      const label = displayName(node.id, layout.lane(node.id));
      const run =
        section === "all"
          ? runs.at(-1)!
          : runs.find((item) => item.chronology === section)!;
      const suffix =
        runs.length > 1 && range === "recent"
          ? ` ${section === "older" ? "older" : "current"}`
          : "";
      const row = element("div", undefined, {
        class: "navigator-identity-row",
        "data-identity-id": node.id,
      });
      const item = button(
        `${label}${suffix} ${node.status ?? "unknown"} ${node.relationship ?? ""} (${node.id})`,
        () => choose(node.id, run.index),
      );
      item.dataset.nodeId = node.id;
      item.className = selectedId === node.id ? "is-selected" : "";
      if (node.lastUpdateAge != null && node.lastUpdateAge >= 0) {
        const tag = element("span", ` ${age(node.lastUpdateAge + elapsed)}`);
        tag.dataset.ageBase = String(node.lastUpdateAge);
        tag.dataset.ageKind = "short";
        item.append(tag);
      } else if (state.projection.lastEventAbsoluteTime)
        item.append(element("span", " · Age unavailable"));
      row.append(item);
      if (runs.length > 1) row.append(element("span", `${runs.length} runs`));
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
      addIdentity(group, range === "all" ? "all" : "current"),
    );
    if (older.length) {
      list.append(
        button(
          `Older runs · ${older.reduce((sum, group) => sum + group.runs.filter((run) => run.chronology === "older").length, 0)}`,
          () => {
            olderExpanded = !olderExpanded;
            renderNavigator();
          },
        ),
      );
      if (olderExpanded) older.forEach((group) => addIdentity(group, "older"));
    }
    if (unknown.length) {
      list.append(element("div", "Time unavailable"));
      unknown.forEach((group) => addIdentity(group, "unknown"));
    }
    navigator.replaceChildren(searchInput, list);
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
    const slug = layout.association(node, state.projection.nodes);
    const status = statusWord(node);
    const title = element("h2", `Reported identity: ${node.id}`);
    const task = element("div", node.task ?? "Task unavailable");
    const meta = element(
      "div",
      `Role: ${node.reportedRole ?? "unavailable"} · ${node.identityKind ?? "unspecified"} · Worktree: ${slug ?? "unavailable"} · `,
    );
    if (node.lastUpdateAge == null || node.lastUpdateAge < 0) {
      meta.append("Wall-clock age unavailable");
    } else {
      const reportAge = element(
        "span",
        `Last report ${age(node.lastUpdateAge + elapsed)} ago`,
      );
      reportAge.dataset.ageBase = String(node.lastUpdateAge);
      reportAge.dataset.ageKind = "report";
      meta.append(reportAge);
    }
    const pill = element("span", `◉ ${status}`, {
      "data-status-pill": status.toLowerCase(),
    });
    const statusLine = element("div", "Reported status: ");
    statusLine.append(pill);
    const reportsTo = element(
      "div",
      node.relationship === "unresolved"
        ? `Reports to Unknown parent (unresolved: ${node.parentId ?? "unavailable"})`
        : `Reports to ${node.parentId ?? "Unknown parent"}`,
    );
    const started = element(
      "div",
      `Started ${
        interval?.startAbsoluteTime
          ? localTime(interval.startAbsoluteTime, true)
          : interval?.start == null
            ? "unavailable"
            : `Session-relative +${interval.start}s`
      }`,
    );
    const execution = element("div", intervalText(interval, node.activities));
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
    const history = element("section", undefined, {
      class: "monitor-history",
      role: "region",
      "aria-label": "Activity history",
    });
    const activities = node.activities ?? [];
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
      const relative = Number.isFinite(activity.time)
        ? activity.time
        : "unavailable";
      const relativeLabel =
        activity.type === "subagent_dispatch" ? "Session-relative" : "Reported";
      row.append(element("span", `${relativeLabel} +${relative}s `));
      if (activity.absoluteTime && validInstant(activity.absoluteTime))
        row.append(
          element(
            "span",
            `Verified absolute ${
              interval?.startAbsoluteTime
                ? localTime(activity.absoluteTime, true)
                : activity.absoluteTime
            } · `,
          ),
        );
      const description = activityDescription(activity);
      const legacySummary =
        activity.type === "tool_call_end" &&
        !activity.toolCategory &&
        activity.summary
          ? `${activity.summary} · `
          : "";
      row.append(
        element(
          "span",
          `${legacySummary}${description}${activity.type === "agent_spawn" ? " (agent_spawn)" : ""}`,
        ),
      );
      if (activity.pairing && activity.type === "tool_call_end")
        row.append(element("span", ` · ${activity.pairing}`));
      history.append(row);
    }
    inspector.replaceChildren(
      title,
      task,
      statusLine,
      meta,
      reportsTo,
      ...(runs.length > 1 ? [runSelector] : []),
      started,
      execution,
      idInput,
      copy,
      copyResult,
      history,
    );
    if (node.observedLocalAge !== undefined) {
      const observed = element(
        "div",
        `Observed locally ${age(node.observedLocalAge + elapsed)} ago`,
      );
      observed.dataset.ageKind = "observed";
      observed.dataset.ageBase = String(node.observedLocalAge);
      inspector.insertBefore(observed, history);
    }
  }

  function renderFooter(): void {
    const diagnostics = state.diagnostics ?? state.projection.diagnostics ?? [];
    const companions = state.companions ?? [];
    footerCount.textContent = `Heartbeat snapshots provisional: ${companions.length} · Diagnostics: ${diagnostics.length}`;
    footerBody.replaceChildren();
    legacyDiagnostics.replaceChildren();
    legacyCompanions.replaceChildren();
    for (const companion of companions) {
      const line = element(
        "div",
        `${companion.agentId ?? "Unknown identity"}: ${companion.status ?? "unknown"}; ${companion.activity ?? "activity unavailable"}; updated ${companion.updatedAt ?? "unavailable"}; ${companion.certainty ?? "provisional"} ${companion.source ?? "companion"}`,
      );
      footerBody.append(line);
      legacyCompanions.append(line.cloneNode(true));
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
          ? `Last report ${age(base + elapsed)} ago`
          : tag.dataset.ageKind === "observed"
            ? `Observed locally ${age(base + elapsed)} ago`
            : ` ${age(base + elapsed)}`;
    }
  }, 1000);
  render();
  return {
    update(next: MonitorState) {
      const changed =
        next.sourceGeneration !== undefined &&
        next.sourceGeneration !== state.sourceGeneration;
      state = next;
      if (changed) {
        layout.reset();
        selectedId = null;
        selectedInterval = 0;
        activityIndex = 0;
        range = "all";
        search = "";
        searchInput.value = "";
        olderExpanded = false;
        elapsed = 0;
      }
      layout.assign(state.projection.nodes);
      if (changed) camera = layout.extent(state.projection.nodes);
      render();
    },
    dispose() {
      window.clearInterval(clock);
    },
  };
}
