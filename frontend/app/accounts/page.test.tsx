// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, test, vi } from "vitest";

vi.mock("../../components/account-manager", () => ({
  AccountManager: () => <p>Broker account manager mounted</p>,
}));

afterEach(() => {
  cleanup();
  vi.resetModules();
});

test("/accounts page mounts the account manager", async () => {
  const path = "./page";
  const { default: AccountsPage } = await import(path);
  render(<AccountsPage />);

  expect(screen.getByText("Broker account manager mounted")).toBeTruthy();
});
