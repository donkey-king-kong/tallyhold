import { NextRequest } from "next/server";
import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.doUnmock("../lib/supabase/server");
  vi.resetModules();
});

test("callback exchanges only the one-time code and redirects without tokens", async () => {
  const exchangeCodeForSession = vi.fn().mockResolvedValue({
    data: { session: { access_token: "offline-jwt" } },
    error: null,
  });
  vi.doMock("../lib/supabase/server", () => ({
    createClient: async () => ({ auth: { exchangeCodeForSession } }),
  }));
  const routePath = "../app/auth/callback/route";
  const { GET } = await import(routePath);
  const response = await GET(
    new NextRequest("http://localhost:3000/auth/callback?code=one-time-code"),
  );

  expect(exchangeCodeForSession).toHaveBeenCalledWith("one-time-code");
  expect(response.status).toBeGreaterThanOrEqual(300);
  expect(response.status).toBeLessThan(400);
  expect(response.headers.get("location")).not.toMatch(
    /one-time-code|offline-jwt|access_token|refresh_token/,
  );
});

test("cancelled callback returns a safe signed-out redirect", async () => {
  const exchangeCodeForSession = vi.fn();
  vi.doMock("../lib/supabase/server", () => ({
    createClient: async () => ({ auth: { exchangeCodeForSession } }),
  }));
  const routePath = "../app/auth/callback/route";
  const { GET } = await import(routePath);
  const response = await GET(
    new NextRequest(
      "http://localhost:3000/auth/callback?error=access_denied&error_description=sensitive-provider-detail",
    ),
  );

  expect(exchangeCodeForSession).not.toHaveBeenCalled();
  expect(response.status).toBeGreaterThanOrEqual(300);
  expect(response.status).toBeLessThan(400);
  expect(response.headers.get("location")).not.toMatch(
    /sensitive-provider-detail|access_denied|access_token|refresh_token/,
  );
});
