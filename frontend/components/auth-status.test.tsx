// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React, { act } from "react";
import { afterEach, expect, test, vi } from "vitest";

type Session = { access_token: string; expires_at: number };

function fakeAuth(initial: Session | null) {
  let listener: ((event: string, session: Session | null) => void) | undefined;
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: initial },
        error: null,
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
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

async function renderAuthStatus(
  authClient: ReturnType<typeof fakeAuth>["client"],
) {
  const componentPath = "./auth-status";
  const { AuthStatus } = await import(componentPath);
  return render(<AuthStatus authClient={authClient} />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.doUnmock("@supabase/ssr");
  vi.resetModules();
});

test("browser Supabase client requests the PKCE OAuth flow", async () => {
  const createBrowserClient = vi.fn().mockReturnValue({ auth: {} });
  vi.doMock("@supabase/ssr", () => ({ createBrowserClient }));
  const clientPath = "../lib/supabase/browser";
  const { createClient } = await import(clientPath);
  createClient();

  expect(createBrowserClient).toHaveBeenCalledWith(
    expect.any(String),
    expect.any(String),
    expect.objectContaining({
      auth: expect.objectContaining({ flowType: "pkce" }),
    }),
  );
});

test("signed-out visitor starts Google OAuth without exposing tokens", async () => {
  const auth = fakeAuth(null);
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await renderAuthStatus(auth.client);

  fireEvent.click(await screen.findByRole("button", { name: /google/i }));

  expect(auth.client.auth.signInWithOAuth).toHaveBeenCalledWith({
    provider: "google",
    options: expect.objectContaining({
      redirectTo: expect.stringMatching(/\/auth\/callback$/),
    }),
  });
  expect(fetch).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toContain("access_token");
  expect(window.location.href).not.toContain("access_token");
});

test("session fetches only its own current user with bearer and omitted credentials", async () => {
  const auth = fakeAuth({
    access_token: "offline-jwt",
    expires_at: 4102444800,
  });
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      id: "11111111-1111-4111-8111-111111111111",
      base_currency: "SGD",
    }),
  });
  vi.stubGlobal("fetch", fetch);
  await renderAuthStatus(auth.client);

  expect(await screen.findByText(/SGD/)).toBeTruthy();
  expect(fetch).toHaveBeenCalledWith(
    expect.stringMatching(/\/api\/v1\/me$/),
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: "Bearer offline-jwt",
      }),
      credentials: "omit",
    }),
  );
  expect(document.body.textContent).not.toContain("offline-jwt");
});

test("callback-created session becomes authenticated without leaking its token", async () => {
  const auth = fakeAuth(null);
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      id: "11111111-1111-4111-8111-111111111111",
      base_currency: "SGD",
    }),
  });
  vi.stubGlobal("fetch", fetch);
  await renderAuthStatus(auth.client);
  expect(await screen.findByRole("button", { name: /google/i })).toBeTruthy();

  await act(async () =>
    auth.emit("SIGNED_IN", {
      access_token: "callback-jwt",
      expires_at: 4102444800,
    }),
  );
  expect(await screen.findByText(/SGD/)).toBeTruthy();
  expect(fetch).toHaveBeenCalledWith(
    expect.stringMatching(/\/api\/v1\/me$/),
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: "Bearer callback-jwt",
      }),
      credentials: "omit",
    }),
  );
  expect(document.body.textContent).not.toContain("callback-jwt");
  expect(window.location.href).not.toContain("callback-jwt");
});

test("sign-out and expiry remove protected user details", async () => {
  const auth = fakeAuth({
    access_token: "offline-jwt",
    expires_at: 4102444800,
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "11111111-1111-4111-8111-111111111111",
        base_currency: "SGD",
      }),
    }),
  );
  await renderAuthStatus(auth.client);
  expect(await screen.findByText(/SGD/)).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
  expect(auth.client.auth.signOut).toHaveBeenCalledOnce();
  await act(async () => auth.emit("SIGNED_OUT", null));
  expect(screen.queryByText(/SGD/)).toBeNull();
  expect(screen.getByRole("button", { name: /google/i })).toBeTruthy();
});

test("an expired session never fetches protected data", async () => {
  const auth = fakeAuth({ access_token: "expired-jwt", expires_at: 1 });
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await renderAuthStatus(auth.client);

  expect(await screen.findByRole("button", { name: /google/i })).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toContain("expired-jwt");
});

test("cancelled or failed sign-in shows a safe signed-out state", async () => {
  const auth = fakeAuth(null);
  auth.client.auth.signInWithOAuth.mockResolvedValue({
    data: {},
    error: new Error("sensitive provider detail"),
  });
  await renderAuthStatus(auth.client);
  fireEvent.click(await screen.findByRole("button", { name: /google/i }));

  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByRole("button", { name: /google/i })).toBeTruthy();
  expect(document.body.textContent).not.toContain("sensitive provider detail");
});
