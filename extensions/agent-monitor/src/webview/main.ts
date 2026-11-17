export type MonitorState = {
  path: string | null;
  sessionId: string | null;
  reader: string;
  error?: string;
  projection: { nodes: any[] };
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
    if (event.key === "Enter" || event.key === " ") action();
  });
  return value;
}

function terminal(status: string) {
  return status === "completed" || status === "failed";
}

function bounds(nodes: any[]): string {
  if (nodes.length === 0) return "0 0 800 600";
  const xs = nodes.map((node) => Number(node.position?.x ?? 0));
  const ys = nodes.map((node) => Number(node.position?.y ?? 0));
  const minX = Math.min(0, ...xs);
  const minY = Math.min(0, ...ys);
  const maxX = Math.max(0, ...xs);
  const maxY = Math.max(0, ...ys);
  return `${minX} ${minY} ${Math.max(800, maxX - minX)} ${Math.max(600, maxY - minY)}`;
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
  let reveal: HTMLButtonElement | null = null;
  let svgElement: SVGSVGElement | null = null;

  const select = (id: string) => {
    selectedId = id;
    render();
  };

  const setCamera = (transform: (values: number[]) => number[]) => {
    camera = transform(camera.split(/\s+/).map(Number)).join(" ");
    svgElement?.setAttribute("viewBox", camera);
  };

  const render = () => {
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
      button("Fit All", () => {
        camera = bounds(state.projection.nodes);
        svgElement?.setAttribute("viewBox", camera);
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
        terminal(
          state.projection.nodes.find((node) => node.id === selectedId)?.status,
        )
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

    const graphNodes = activeOnly
      ? state.projection.nodes.filter((node) => !terminal(node.status))
      : state.projection.nodes;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement = svg;
    svg.setAttribute("viewBox", camera);
    svg.setAttribute("aria-label", "Agent graph");
    for (const node of graphNodes) {
      const foreign = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "foreignObject",
      );
      foreign.setAttribute("x", String(node.position?.x ?? 0));
      foreign.setAttribute("y", String(node.position?.y ?? 0));
      foreign.setAttribute("width", "180");
      foreign.setAttribute("height", "80");
      const label = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      label.textContent = `${node.id} ${node.status}`;
      foreign.append(label);
      svg.append(foreign);
    }
    root.append(svg);

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
    for (const node of state.projection.nodes.filter((item) =>
      item.id.toLowerCase().includes(query.toLowerCase()),
    )) {
      const age =
        node.lastUpdateAge === null || node.lastUpdateAge === undefined
          ? ""
          : ` ${node.lastUpdateAge + elapsed}s`;
      navigator.append(
        button(
          `${node.id} ${node.status} ${node.relationship ?? ""}${age}`,
          () => select(node.id),
        ),
      );
    }
    root.append(navigator);

    const selected = state.projection.nodes.find(
      (node) => node.id === selectedId,
    );
    if (selected && activeOnly && terminal(selected.status)) {
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
          ),
        );
      }
      if (selected.observedLocalAge !== undefined) {
        details.append(
          element(
            "div",
            `Observed locally ${selected.observedLocalAge + elapsed}s ago`,
          ),
        );
      }
      root.append(details);

      const history = element("section", undefined, {
        role: "region",
        "aria-label": "Activity history",
      });
      for (const activity of selected.activities ?? []) {
        const line = element("div");
        line.append(
          element(
            "span",
            `${activity.type}: ${activity.summary ?? "unavailable"}`,
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
      root.append(history);
    }
  };

  const clock = window.setInterval(() => {
    elapsed++;
    render();
  }, 1000);
  render();

  return {
    update(nextState: MonitorState) {
      state = nextState;
      render();
    },
    dispose() {
      window.clearInterval(clock);
    },
  };
}
