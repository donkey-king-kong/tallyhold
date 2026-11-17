export type MonitorState = {
  path: string | null;
  sessionId: string | null;
  sourceGeneration?: number;
  reader: string;
  error?: string;
  diagnostics?: any[];
  companions?: any[];
  projection: { nodes: any[]; edges?: any[]; diagnostics?: any[] };
};

type MonitorActions = {
  selectSource?: () => void;
};

function element<K extends keyof HTMLElementTagNameMap>(
  name: K,
  text?: string,
  attributes: Record<string, string> = {},
): HTMLElementTagNameMap[K] {
  const value = document.createElement(name);
  if (text !== undefined) value.textContent = text;
  for (const [key, content] of Object.entries(attributes))
    value.setAttribute(key, content);
  return value;
}

function button(name: string, action: () => void) {
  const value = element("button", name, { type: "button", "aria-label": name });
  value.addEventListener("click", action);
  value.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  });
  return value;
}

function terminal(node: any) {
  return node?.terminal === true;
}

function bounds(nodes: any[]): string {
  if (nodes.length === 0) return "0 0 800 600";
  const xs = nodes.map((node) => Number(node.position?.x ?? 0));
  const ys = nodes.map((node) => Number(node.position?.y ?? 0));
  const minX = Math.min(0, ...xs);
  const minY = Math.min(0, ...ys);
  const maxX = Math.max(0, ...xs.map((value) => value + 180));
  const maxY = Math.max(0, ...ys.map((value) => value + 60));
  return `${minX} ${minY} ${Math.max(800, maxX - minX)} ${Math.max(600, maxY - minY)}`;
}

export function visibleGraphNodes(
  nodes: any[],
  camera: string,
  maximum = 500,
): any[] {
  const [x, y, width, height] = camera.split(/\s+/).map(Number);
  const margin = 200;
  return nodes
    .filter((node) => {
      const nodeX = Number(node.position?.x ?? 0);
      const nodeY = Number(node.position?.y ?? 0);
      return (
        nodeX >= x - margin &&
        nodeX <= x + width + margin &&
        nodeY >= y - margin &&
        nodeY <= y + height + margin
      );
    })
    .slice(0, maximum);
}

export function activityPage(
  activities: any[],
  page: number,
  pageSize = 100,
): any[] {
  return activities.slice(page * pageSize, (page + 1) * pageSize);
}

export function mountMonitor(
  root: HTMLElement,
  initialState: MonitorState,
  actions: MonitorActions = {},
) {
  let state = initialState;
  let selectedId: string | null = null;
  let activeOnly = false;
  let query = "";
  let camera = bounds(state.projection.nodes);
  let elapsed = 0;
  let activityPageIndex = 0;
  let reveal: HTMLButtonElement | null = null;
  let svgElement: SVGSVGElement | null = null;

  const select = (id: string) => {
    selectedId = id;
    activityPageIndex = 0;
    render();
  };

  const displayedNodes = () =>
    activeOnly
      ? state.projection.nodes.filter((node) => !terminal(node))
      : state.projection.nodes;

  const drawGraph = () => {
    if (!svgElement) return;
    svgElement.replaceChildren();
    const visible = visibleGraphNodes(displayedNodes(), camera);
    const visibleById = new Map(visible.map((node) => [node.id, node]));
    for (const edge of state.projection.edges ?? []) {
      const parent = visibleById.get(edge.parentId);
      const child = visibleById.get(edge.childId);
      if (!parent || !child) continue;
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      line.dataset.edge = `${edge.parentId}:${edge.childId}`;
      line.setAttribute("x1", String(Number(parent.position?.x ?? 0) + 90));
      line.setAttribute("y1", String(Number(parent.position?.y ?? 0) + 30));
      line.setAttribute("x2", String(Number(child.position?.x ?? 0) + 90));
      line.setAttribute("y2", String(Number(child.position?.y ?? 0) + 30));
      svgElement.append(line);
    }
    for (const node of visible) {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.dataset.nodeId = node.id;
      const rectangle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      rectangle.setAttribute("x", String(node.position?.x ?? 0));
      rectangle.setAttribute("y", String(node.position?.y ?? 0));
      rectangle.setAttribute("width", "180");
      rectangle.setAttribute("height", "60");
      const label = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      label.setAttribute("x", String(Number(node.position?.x ?? 0) + 8));
      label.setAttribute("y", String(Number(node.position?.y ?? 0) + 34));
      label.textContent = `${node.id} ${node.status}`;
      group.append(rectangle, label);
      svgElement.append(group);
    }
  };

  const setCamera = (transform: (values: number[]) => number[]) => {
    camera = transform(camera.split(/\s+/).map(Number)).join(" ");
    svgElement?.setAttribute("viewBox", camera);
    drawGraph();
  };

  const render = () => {
    const focusedLabel = root.contains(document.activeElement)
      ? (document.activeElement as HTMLElement).getAttribute("aria-label")
      : null;
    root.replaceChildren();
    const header = element("header");
    header.append(element("strong", "Tallyhold Agent Monitor"));
    header.append(element("div", state.path ?? "No source selected"));
    header.append(
      element("div", `Session: ${state.sessionId ?? "unavailable"}`),
    );
    if (
      state.reader === "error" ||
      state.reader === "stale" ||
      state.reader === "incomplete"
    ) {
      header.append(
        element(
          "div",
          `${state.error ?? "Selected source is unavailable"}. Choose another file or retry.`,
        ),
      );
    } else {
      header.append(element("div", `Reader: ${state.reader}`));
    }
    root.append(header);
    const diagnostics = state.diagnostics ?? state.projection.diagnostics ?? [];
    if (diagnostics.length > 0) {
      const region = element("section", undefined, {
        role: "region",
        "aria-label": "Diagnostics",
      });
      region.append(element("h2", `Diagnostics (${diagnostics.length})`));
      for (const diagnostic of diagnostics.slice(0, 100)) {
        const location =
          diagnostic.line === undefined
            ? ""
            : ` line ${diagnostic.line}, byte ${diagnostic.byteOffset ?? "unavailable"}`;
        region.append(
          element(
            "div",
            `${diagnostic.code ?? "diagnostic"}${location}: ${diagnostic.message ?? "No additional detail"}`,
          ),
        );
      }
      if (diagnostics.length > 100)
        region.append(element("div", "Additional diagnostics are not shown."));
      root.append(region);
    }
    if ((state.companions?.length ?? 0) > 0) {
      const region = element("section", undefined, {
        role: "region",
        "aria-label": "Provisional companion observations",
      });
      region.append(element("h2", "Provisional companion observations"));
      for (const companion of state.companions ?? []) {
        region.append(
          element(
            "div",
            `${companion.agentId ?? "Unknown identity"}: ${companion.status ?? "unknown"}; ${companion.activity ?? "activity unavailable"}; updated ${companion.updatedAt ?? "unavailable"}; ${companion.certainty ?? "provisional"} ${companion.source ?? "companion"}`,
          ),
        );
      }
      root.append(region);
    }

    const controls = element("section", undefined, {
      "aria-label": "Graph controls",
    });
    controls.append(
      button("Choose Source", () => actions.selectSource?.()),
      button("Zoom in", () =>
        setCamera(([x, y, width, height]) => [x, y, width * 0.8, height * 0.8]),
      ),
      button("Zoom out", () =>
        setCamera(([x, y, width, height]) => [
          x,
          y,
          width * 1.25,
          height * 1.25,
        ]),
      ),
      button("Pan left", () =>
        setCamera(([x, y, width, height]) => [x - 100, y, width, height]),
      ),
      button("Pan right", () =>
        setCamera(([x, y, width, height]) => [x + 100, y, width, height]),
      ),
      button("Pan up", () =>
        setCamera(([x, y, width, height]) => [x, y - 100, width, height]),
      ),
      button("Pan down", () =>
        setCamera(([x, y, width, height]) => [x, y + 100, width, height]),
      ),
      button("Fit All", () => {
        camera = bounds(state.projection.nodes);
        svgElement?.setAttribute("viewBox", camera);
        drawGraph();
      }),
    );
    const label = element("label", "Last reported nonterminal");
    const checkbox = element("input", undefined, {
      type: "checkbox",
      "aria-label": "Last reported nonterminal",
    });
    checkbox.checked = activeOnly;
    checkbox.addEventListener("change", () => {
      activeOnly = checkbox.checked;
      render();
      if (
        activeOnly &&
        selectedId &&
        terminal(state.projection.nodes.find((node) => node.id === selectedId))
      ) {
        reveal?.focus();
      }
    });
    label.prepend(checkbox);
    controls.append(
      label,
      element(
        "p",
        "Last reported status only; this does not establish process liveness.",
      ),
    );
    root.append(controls);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement = svg;
    svg.setAttribute("viewBox", camera);
    svg.setAttribute("aria-label", "Agent graph");
    svg.setAttribute("role", "img");
    root.append(svg);
    drawGraph();

    const navigator = element("nav", undefined, {
      "aria-label": "Agent navigator",
    });
    const search = element("input", undefined, {
      type: "text",
      "aria-label": "Find agent",
    });
    search.value = query;
    search.addEventListener("input", () => {
      query = search.value;
      render();
    });
    navigator.append(search);
    for (const node of displayedNodes().filter((item) =>
      item.id.toLowerCase().includes(query.toLowerCase()),
    )) {
      const navigatorButton = button(
        `${node.id} ${node.status} ${node.relationship ?? ""}`,
        () => select(node.id),
      );
      if (node.lastUpdateAge !== null && node.lastUpdateAge !== undefined) {
        navigatorButton.append(
          element("span", ` ${node.lastUpdateAge + elapsed}s`, {
            "data-age-kind": "short",
            "data-age-base": String(node.lastUpdateAge),
          }),
        );
      }
      navigator.append(navigatorButton);
    }
    root.append(navigator);

    const selected = state.projection.nodes.find(
      (node) => node.id === selectedId,
    );
    if (selected && activeOnly && terminal(selected)) {
      reveal = button(`Reveal ${selected.id}`, () => {
        activeOnly = false;
        render();
      });
      root.append(reveal);
    } else {
      reveal = null;
    }

    if (selected) {
      const details = element("section", undefined, {
        role: "region",
        "aria-label": "Agent details",
      });
      details.append(element("h2", `Reported identity: ${selected.id}`));
      details.append(element("div", selected.task ?? "Task unavailable"));
      details.append(
        element("div", `Reported status: ${selected.status ?? "unavailable"}`),
      );
      details.append(
        element(
          "div",
          `Identity kind: ${selected.identityKind ?? "unspecified"}`,
        ),
      );
      details.append(
        element(
          "div",
          `Relationship: ${selected.relationship ?? "unavailable"}`,
        ),
      );
      const intervalCertainty = selected.intervals?.some(
        (item: any) => item.certainty !== "reported",
      )
        ? "Execution interval incomplete"
        : "Execution interval reported";
      details.append(element("div", intervalCertainty));
      if (
        selected.lastUpdateAge === null ||
        selected.lastUpdateAge === undefined
      ) {
        details.append(element("div", "Wall-clock age unavailable"));
      } else {
        details.append(
          element(
            "div",
            `Last report ${selected.lastUpdateAge + elapsed}s ago`,
            {
              "data-age-kind": "report",
              "data-age-base": String(selected.lastUpdateAge),
            },
          ),
        );
      }
      if (selected.observedLocalAge !== undefined) {
        details.append(
          element(
            "div",
            `Observed locally ${selected.observedLocalAge + elapsed}s ago`,
            {
              "data-age-kind": "observed",
              "data-age-base": String(selected.observedLocalAge),
            },
          ),
        );
      }
      root.append(details);

      const history = element("section", undefined, {
        role: "region",
        "aria-label": "Activity history",
      });
      const activities = selected.activities ?? [];
      const pageCount = Math.max(1, Math.ceil(activities.length / 100));
      activityPageIndex = Math.min(activityPageIndex, pageCount - 1);
      for (const activity of activityPage(activities, activityPageIndex)) {
        const line = element("div");
        line.append(
          element(
            "span",
            `Reported +${Number.isFinite(activity.time) ? activity.time : "unavailable"}s`,
          ),
        );
        if (activity.absoluteTime)
          line.append(
            element("span", ` Verified absolute ${activity.absoluteTime}`),
          );
        line.append(
          element(
            "span",
            ` ${activity.type}: ${activity.summary ?? "unavailable"}`,
          ),
        );
        if (activity.outcome)
          line.append(element("strong", ` ${activity.outcome}`));
        if (activity.pairing)
          line.append(element("span", ` ${activity.pairing}`));
        if (activity.certainty)
          line.append(element("span", ` ${activity.certainty}`));
        history.append(line);
      }
      if (pageCount > 1) {
        const paging = element("div");
        paging.append(
          button("Previous activity page", () => {
            activityPageIndex = Math.max(0, activityPageIndex - 1);
            render();
          }),
          element(
            "span",
            `Activity page ${activityPageIndex + 1} of ${pageCount}`,
          ),
          button("Next activity page", () => {
            activityPageIndex = Math.min(pageCount - 1, activityPageIndex + 1);
            render();
          }),
          button("Last activity page", () => {
            activityPageIndex = pageCount - 1;
            render();
          }),
        );
        history.prepend(paging);
      }
      root.append(history);
    }
    if (focusedLabel) {
      const nextFocus = Array.from(
        root.querySelectorAll<HTMLElement>("[aria-label]"),
      ).find((item) => item.getAttribute("aria-label") === focusedLabel);
      nextFocus?.focus();
    }
  };

  const clock = window.setInterval(() => {
    elapsed++;
    for (const age of Array.from(
      root.querySelectorAll<HTMLElement>("[data-age-kind]"),
    )) {
      const base = Number(age.dataset.ageBase ?? 0);
      age.textContent =
        age.dataset.ageKind === "report"
          ? `Last report ${base + elapsed}s ago`
          : age.dataset.ageKind === "observed"
            ? `Observed locally ${base + elapsed}s ago`
            : ` ${base + elapsed}s`;
    }
  }, 1000);
  render();

  return {
    update(nextState: MonitorState) {
      const sourceChanged =
        nextState.sourceGeneration !== undefined &&
        nextState.sourceGeneration !== state.sourceGeneration;
      state = nextState;
      if (sourceChanged) camera = bounds(state.projection.nodes);
      render();
    },
    dispose() {
      window.clearInterval(clock);
    },
  };
}
