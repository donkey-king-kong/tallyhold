// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function renderHealthStatus() {
  const componentPath = "./health-status";
  const { HealthStatus } = await import(componentPath);
  render(<HealthStatus />);
}

test("shows the API health status when the API responds", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" }),
    }),
  );

  await renderHealthStatus();

  expect((await screen.findByRole("status")).textContent).toBe("API healthy");
});

test("shows an unavailable state when the API responds with an error", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

  await renderHealthStatus();

  expect((await screen.findByRole("alert")).textContent).toBe("API unavailable");
});

test("shows an unavailable state when the API cannot be reached", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

  await renderHealthStatus();

  expect((await screen.findByRole("alert")).textContent).toBe("API unavailable");
});
