// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React, { act } from "react";
import { afterEach, expect, test, vi } from "vitest";

type Session = { access_token: string; expires_at: number };

const OWNER = "11111111-1111-4111-8111-111111111111";
const BROKER = "22222222-2222-4222-8222-222222222222";
const ACCOUNT = "33333333-3333-4333-8333-333333333333";
const valid: Session = { access_token: "offline-jwt", expires_at: 4102444800 };

function fakeAuth(initial: Session | null) {
  let listener: ((event: string, session: Session | null) => void) | undefined;
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: initial },
        error: null,
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(
        (callback: (event: string, session: Session | null) => void) => {
          listener = callback;
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        },
      ),
    },
  };
  return {
    client,
    emit(event: string, session: Session | null) {
      if (!listener) throw new Error("session listener is not registered");
      listener(event, session);
    },
  };
}

function reply(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

async function renderManager(client: ReturnType<typeof fakeAuth>["client"]) {
  const path = "./account-manager";
  const { AccountManager } = await import(path);
  return render(<AccountManager authClient={client} />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

test("signed-in account manager lists brokers and defaults entry currency from me", async () => {
  const auth = fakeAuth(valid);
  const fetch = vi.fn().mockImplementation(async (input: string) => {
    if (input.endsWith("/me"))
      return reply({ id: OWNER, base_currency: "SGD" });
    if (input.endsWith("/brokers"))
      return reply([{ id: BROKER, name: "IBKR", country: "SG" }]);
    return reply([]);
  });
  vi.stubGlobal("fetch", fetch);
  await renderManager(auth.client);

  expect(
    await screen.findByRole("heading", { name: /accounts/i }),
  ).toBeTruthy();
  expect(await screen.findByText(/no accounts yet/i)).toBeTruthy();
  expect(screen.getByRole("option", { name: /IBKR/i })).toBeTruthy();
  expect(screen.getByLabelText(/account currency/i)).toHaveProperty(
    "value",
    "SGD",
  );
  const nameInput = screen.getByLabelText(/account name/i);
  nameInput.focus();
  expect(document.activeElement).toBe(nameInput);
  expect(screen.getByText(/broker not listed/i)).toBeTruthy();
  for (const [url, options] of fetch.mock.calls) {
    expect(url).toMatch(/\/api\/v1\/(me|brokers|accounts)$/);
    expect(options).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer offline-jwt",
        }),
        credentials: "omit",
      }),
    );
  }
  expect(document.body.textContent).not.toContain("offline-jwt");
});

test("create, edit, and confirmed delete use bearer writes and update the visible list", async () => {
  const auth = fakeAuth(valid);
  let accounts: Array<Record<string, string>> = [];
  const fetch = vi
    .fn()
    .mockImplementation(async (input: string, options?: RequestInit) => {
      if (input.endsWith("/me"))
        return reply({ id: OWNER, base_currency: "SGD" });
      if (input.endsWith("/brokers"))
        return reply([{ id: BROKER, name: "IBKR", country: "SG" }]);
      if (options?.method === "POST") {
        const body = JSON.parse(String(options.body)) as Record<string, string>;
        accounts = [
          { id: ACCOUNT, broker_id: BROKER, broker_name: "IBKR", ...body },
        ];
        return reply(accounts[0], 201);
      }
      if (options?.method === "PATCH") {
        const body = JSON.parse(String(options.body)) as Record<string, string>;
        accounts = [{ ...accounts[0], ...body }];
        return reply(accounts[0]);
      }
      if (options?.method === "DELETE") {
        accounts = [];
        return reply(null, 204);
      }
      return reply(accounts);
    });
  vi.stubGlobal("fetch", fetch);
  await renderManager(auth.client);
  await screen.findByText(/no accounts yet/i);

  fireEvent.change(screen.getByLabelText(/broker/i), {
    target: { value: BROKER },
  });
  fireEvent.change(screen.getByLabelText(/account name/i), {
    target: { value: "Main" },
  });
  fireEvent.change(screen.getByLabelText(/account currency/i), {
    target: { value: "usd" },
  });
  expect(screen.getByLabelText(/account currency/i)).toHaveProperty(
    "value",
    "USD",
  );
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));
  expect(await screen.findByText("Main")).toBeTruthy();
  expect(screen.getAllByText("IBKR").length).toBeGreaterThanOrEqual(2);
  fireEvent.click(screen.getByRole("button", { name: /edit Main/i }));
  fireEvent.change(screen.getByLabelText(/account name/i), {
    target: { value: "Growth" },
  });
  fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
  expect(await screen.findByText("Growth")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /delete Growth/i }));
  expect(
    fetch.mock.calls.filter(([, options]) => options?.method === "DELETE"),
  ).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));
  expect(await screen.findByText(/no accounts yet/i)).toBeTruthy();
  const writes = fetch.mock.calls.filter(([, options]) =>
    ["POST", "PATCH", "DELETE"].includes(options?.method),
  );
  expect(writes.map(([, options]) => options.method)).toEqual([
    "POST",
    "PATCH",
    "DELETE",
  ]);
  expect(JSON.parse(String(writes[0][1].body))).toMatchObject({
    currency: "USD",
  });
  expect(
    writes.every(
      ([, options]) =>
        options.credentials === "omit" &&
        options.headers.Authorization === "Bearer offline-jwt",
    ),
  ).toBe(true);
});

test("a conflict preserves form input and distinguishes outage from an empty list", async () => {
  const auth = fakeAuth(valid);
  const fetch = vi
    .fn()
    .mockImplementation(async (input: string, options?: RequestInit) => {
      if (input.endsWith("/me"))
        return reply({ id: OWNER, base_currency: "SGD" });
      if (input.endsWith("/brokers"))
        return reply([{ id: BROKER, name: "IBKR", country: "SG" }]);
      if (options?.method === "POST") return reply({ detail: "Conflict" }, 409);
      return reply([], 503);
    });
  vi.stubGlobal("fetch", fetch);
  await renderManager(auth.client);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByText(/no accounts yet/i)).toBeNull();
  fireEvent.change(screen.getByLabelText(/account name/i), {
    target: { value: "Retirement" },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));
  expect(await screen.findByText(/already exists/i)).toBeTruthy();
  expect(screen.getByLabelText(/account name/i)).toHaveProperty(
    "value",
    "Retirement",
  );
});

test("sign-out drops private rows and ignores an older in-flight response", async () => {
  const auth = fakeAuth(valid);
  let finishList!: (value: ReturnType<typeof reply>) => void;
  const pending = new Promise<ReturnType<typeof reply>>((resolve) => {
    finishList = resolve;
  });
  const fetch = vi.fn().mockImplementation(async (input: string) => {
    if (input.endsWith("/me"))
      return reply({ id: OWNER, base_currency: "SGD" });
    if (input.endsWith("/brokers"))
      return reply([{ id: BROKER, name: "IBKR", country: "SG" }]);
    return pending;
  });
  vi.stubGlobal("fetch", fetch);
  await renderManager(auth.client);
  await waitFor(() =>
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/accounts$/),
      expect.any(Object),
    ),
  );
  const staleCreate = screen.getByRole("button", { name: /create account/i });
  await act(async () => auth.emit("SIGNED_OUT", null));
  fireEvent.click(staleCreate);
  finishList(reply([{ id: ACCOUNT, name: "Private account" }]));
  await act(async () => pending);
  expect(screen.queryByText("Private account")).toBeNull();
  expect(
    fetch.mock.calls.filter(([, options]) => options?.method === "POST"),
  ).toHaveLength(0);
});

test("switching login identities hides the previous account until the new list resolves", async () => {
  const auth = fakeAuth(valid);
  let finishSecond!: (value: ReturnType<typeof reply>) => void;
  const secondList = new Promise<ReturnType<typeof reply>>((resolve) => {
    finishSecond = resolve;
  });
  const fetch = vi
    .fn()
    .mockImplementation(async (input: string, options?: RequestInit) => {
      const token = (options?.headers as Record<string, string> | undefined)
        ?.Authorization;
      if (input.endsWith("/me"))
        return reply({
          id: token === "Bearer offline-jwt" ? OWNER : BROKER,
          base_currency: "SGD",
        });
      if (input.endsWith("/brokers"))
        return reply([{ id: BROKER, name: "IBKR", country: "SG" }]);
      if (token === "Bearer second-jwt") return secondList;
      return reply([
        {
          id: ACCOUNT,
          broker_id: BROKER,
          broker_name: "IBKR",
          name: "Private first account",
          currency: "SGD",
        },
      ]);
    });
  vi.stubGlobal("fetch", fetch);
  await renderManager(auth.client);
  expect(await screen.findByText("Private first account")).toBeTruthy();

  await act(async () =>
    auth.emit("SIGNED_IN", {
      access_token: "second-jwt",
      expires_at: 4102444800,
    }),
  );
  expect(screen.queryByText("Private first account")).toBeNull();
  finishSecond(
    reply([
      {
        id: ACCOUNT,
        broker_id: BROKER,
        broker_name: "IBKR",
        name: "Second account",
        currency: "USD",
      },
    ]),
  );
  expect(await screen.findByText("Second account")).toBeTruthy();
  expect(screen.queryByText("Private first account")).toBeNull();
});

test("expired session makes no protected requests", async () => {
  const auth = fakeAuth({ access_token: "expired-jwt", expires_at: 1 });
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await renderManager(auth.client);

  expect(await screen.findByText(/sign in/i)).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toContain("expired-jwt");
});

test("loading is distinct from empty and invalid currency blocks creation", async () => {
  const auth = fakeAuth(valid);
  let finishList!: (value: ReturnType<typeof reply>) => void;
  const pending = new Promise<ReturnType<typeof reply>>((resolve) => {
    finishList = resolve;
  });
  const fetch = vi.fn().mockImplementation(async (input: string) => {
    if (input.endsWith("/me"))
      return reply({ id: OWNER, base_currency: "SGD" });
    if (input.endsWith("/brokers"))
      return reply([{ id: BROKER, name: "IBKR", country: "SG" }]);
    return pending;
  });
  vi.stubGlobal("fetch", fetch);
  await renderManager(auth.client);
  expect(await screen.findByText(/loading accounts/i)).toBeTruthy();
  expect(screen.queryByText(/no accounts yet/i)).toBeNull();
  finishList(reply([]));
  expect(await screen.findByText(/no accounts yet/i)).toBeTruthy();

  fireEvent.change(screen.getByLabelText(/account name/i), {
    target: { value: "Main" },
  });
  fireEvent.change(screen.getByLabelText(/account currency/i), {
    target: { value: "US1" },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByLabelText(/account currency/i)).toHaveProperty(
    "value",
    "US1",
  );
  expect(
    fetch.mock.calls.filter(([, options]) => options?.method === "POST"),
  ).toHaveLength(0);
});

test("an API 401 clears private accounts and prevents later writes", async () => {
  const auth = fakeAuth(valid);
  let rejectNextList = false;
  const fetch = vi.fn().mockImplementation(async (input: string) => {
    if (input.endsWith("/me"))
      return reply({ id: OWNER, base_currency: "SGD" });
    if (input.endsWith("/brokers"))
      return reply([{ id: BROKER, name: "IBKR", country: "SG" }]);
    if (rejectNextList) return reply({ detail: "Invalid token" }, 401);
    return reply([
      {
        id: ACCOUNT,
        broker_id: BROKER,
        broker_name: "IBKR",
        name: "Private account",
        currency: "SGD",
      },
    ]);
  });
  vi.stubGlobal("fetch", fetch);
  await renderManager(auth.client);
  expect(await screen.findByText("Private account")).toBeTruthy();

  rejectNextList = true;
  await act(async () =>
    auth.emit("TOKEN_REFRESHED", {
      access_token: "refreshed-jwt",
      expires_at: 4102444800,
    }),
  );
  expect(await screen.findByText(/sign in/i)).toBeTruthy();
  expect(screen.queryByText("Private account")).toBeNull();
  expect(screen.queryByRole("button", { name: /create account/i })).toBeNull();
  expect(
    fetch.mock.calls.filter(([, options]) => options?.method === "POST"),
  ).toHaveLength(0);
});
