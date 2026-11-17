"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "../lib/supabase/browser";

type Session = { access_token: string; expires_at?: number };
type CurrentUser = { id: string; base_currency: string };
type AuthClient = {
  auth: {
    getSession: () => Promise<{
      data: { session: Session | null };
      error: unknown;
    }>;
    signInWithOAuth: (options: {
      provider: "google";
      options: { redirectTo: string };
    }) => Promise<{ error: unknown }>;
    signOut: () => Promise<{ error: unknown }>;
    onAuthStateChange: (
      callback: (event: string, session: Session | null) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } };
  };
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function isValid(session: Session | null): session is Session {
  return Boolean(
    session?.access_token &&
    session.expires_at &&
    session.expires_at * 1000 > Date.now(),
  );
}

export function AuthStatus({ authClient }: { authClient?: AuthClient }) {
  const activeRequest = useRef<AbortController | null>(null);
  const [{ client, unavailable }] = useState(() => {
    if (authClient) return { client: authClient, unavailable: false };
    try {
      return { client: createClient(), unavailable: false };
    } catch {
      return { client: null, unavailable: true };
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [state, setState] = useState<"checking" | "signed-out" | "signed-in">(
    unavailable ? "signed-out" : "checking",
  );
  const [message, setMessage] = useState(
    unavailable ? "Sign-in is unavailable right now." : "",
  );

  useEffect(() => {
    if (!client) return;
    let active = true;
    let eventReceived = false;
    const subscription = client.auth.onAuthStateChange((_event, next) => {
      eventReceived = true;
      activeRequest.current?.abort();
      setUser(null);
      setState(isValid(next) ? "checking" : "signed-out");
      setSession(isValid(next) ? next : null);
    }).data.subscription;

    void client.auth.getSession().then(
      ({ data, error }) => {
        if (!active || eventReceived) return;
        if (error || !isValid(data.session)) {
          setSession(null);
          setState("signed-out");
        } else {
          setSession(data.session);
        }
      },
      () => {
        if (active && !eventReceived) setState("signed-out");
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    if (!isValid(session)) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = window.setTimeout(
      () => {
        controller.abort();
        setUser(null);
        setSession(null);
        setState("signed-out");
      },
      Math.min(session.expires_at! * 1000 - Date.now(), 2_147_483_647),
    );

    void (async () => {
      try {
        const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/v1/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          credentials: "omit",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Current user unavailable");
        const currentUser = (await response.json()) as CurrentUser;
        if (!controller.signal.aborted) {
          setUser(currentUser);
          setState("signed-in");
          setMessage("");
        }
      } catch {
        if (!controller.signal.aborted) {
          setUser(null);
          setSession(null);
          setState("signed-out");
          setMessage("Your session is unavailable. Please sign in again.");
        }
      }
    })();

    return () => {
      controller.abort();
      if (activeRequest.current === controller) activeRequest.current = null;
      window.clearTimeout(timeout);
    };
  }, [session]);

  async function signIn() {
    if (!client) return;
    setMessage("");
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch {
      setMessage("Sign-in did not complete. Please try again.");
    }
  }

  async function signOut() {
    if (!client) return;
    activeRequest.current?.abort();
    setUser(null);
    setSession(null);
    setState("signed-out");
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    } catch {
      setMessage("Sign-out could not complete. Please try again.");
    }
  }

  if (state === "checking")
    return <p aria-live="polite">Checking session...</p>;

  return (
    <div>
      {state === "signed-in" && user ? (
        <>
          <p>Base currency: {user.base_currency}</p>
          <button type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </>
      ) : (
        <button type="button" onClick={() => void signIn()} disabled={!client}>
          Continue with Google
        </button>
      )}
      {message && <p role="alert">{message}</p>}
    </div>
  );
}
