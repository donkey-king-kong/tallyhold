"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import {
  Account,
  AccountApiError,
  Broker,
  accountRequest,
} from "../lib/accounts-api";
import {
  AuthClient,
  isValid,
  useAuthenticatedSession,
} from "../lib/authenticated-session";

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";
const action =
  "rounded-lg bg-teal-800 px-4 py-2 font-medium text-white hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50";

export function AccountManager({ authClient }: { authClient?: AuthClient }) {
  const { session, user, state, message, client, invalidate, signIn, signOut } =
    useAuthenticatedSession(authClient);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [listError, setListError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [brokerId, setBrokerId] = useState("");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef<AbortController | null>(null);
  const activeToken = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !isValid(session) || state !== "signed-in") {
      pending.current?.abort();
      activeToken.current = null;
      void Promise.resolve().then(() => {
        setAccounts(null);
        setLoadedFor(null);
        setBrokers([]);
        setListError("");
        setFeedback("");
        setBusy(false);
      });
      return;
    }
    const controller = new AbortController();
    pending.current?.abort();
    pending.current = controller;
    const token = session.access_token;
    const scope = `${user.id}:${token}`;
    activeToken.current = token;
    void (async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setAccounts(null);
      setLoadedFor(null);
      setBrokers([]);
      setListError("");
      setFeedback("");
      setEditing(null);
      setDeleting(null);
      setCurrency(user.base_currency);
      try {
        const catalog = await accountRequest<Broker[]>(
          "brokers",
          token,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setBrokers(catalog);
        setBrokerId(catalog[0]?.id ?? "");
        const owned = await accountRequest<Account[]>(
          "accounts",
          token,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setAccounts(owned);
        setLoadedFor(scope);
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof AccountApiError && error.status === 401) {
          invalidate();
          return;
        }
        setListError("Accounts are unavailable. Please try again later.");
      }
    })();
    return () => {
      controller.abort();
      activeToken.current = null;
      if (pending.current === controller) pending.current = null;
    };
  }, [user, session, state, invalidate]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = activeToken.current;
    if (!token || !user || busy || (accounts === null && !listError)) return;
    if (
      !name.trim() ||
      name.trim().length > 255 ||
      !/^[A-Z]{3}$/.test(currency)
    ) {
      setFeedback("Enter an account name and a three-letter account currency.");
      return;
    }
    if (!editing && !brokerId) {
      setFeedback("Choose a broker before creating an account.");
      return;
    }
    const controller = pending.current;
    if (!controller || controller.signal.aborted) return;
    setBusy(true);
    setFeedback("");
    try {
      const saved = await accountRequest<Account>(
        editing ? `accounts/${editing}` : "accounts",
        token,
        controller.signal,
        editing ? "PATCH" : "POST",
        editing
          ? { name: name.trim(), currency }
          : { broker_id: brokerId, name: name.trim(), currency },
      );
      if (controller.signal.aborted || activeToken.current !== token) return;
      let listAvailable = true;
      if (
        accounts === null ||
        loadedFor !== `${user.id}:${token}` ||
        listError
      ) {
        try {
          const owned = await accountRequest<Account[]>(
            "accounts",
            token,
            controller.signal,
          );
          if (controller.signal.aborted || activeToken.current !== token)
            return;
          setAccounts(owned);
          setLoadedFor(`${user.id}:${token}`);
          setListError("");
        } catch (error) {
          if (controller.signal.aborted) return;
          if (error instanceof AccountApiError && error.status === 401) {
            invalidate();
            return;
          }
          setAccounts(null);
          setLoadedFor(null);
          setListError("Accounts are unavailable. Please try again later.");
          listAvailable = false;
        }
      } else {
        setAccounts((previous) =>
          [
            ...(previous ?? []).filter((account) => account.id !== saved.id),
            saved,
          ].sort(
            (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
          ),
        );
      }
      setEditing(null);
      setName("");
      setFeedback(
        !listAvailable
          ? "Account created, but the list could not be reloaded."
          : editing
            ? "Account updated."
            : "Account created.",
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof AccountApiError && error.status === 401) {
        invalidate();
      } else if (error instanceof AccountApiError && error.status === 409) {
        setFeedback("An account with this name already exists.");
      } else {
        setFeedback("Could not save the account. Please try again.");
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  async function confirmDelete() {
    const token = activeToken.current;
    const controller = pending.current;
    if (!token || !deleting || !controller || controller.signal.aborted || busy)
      return;
    setBusy(true);
    setFeedback("");
    try {
      await accountRequest<void>(
        `accounts/${deleting}`,
        token,
        controller.signal,
        "DELETE",
      );
      if (controller.signal.aborted || activeToken.current !== token) return;
      setAccounts(
        (previous) =>
          previous?.filter((account) => account.id !== deleting) ?? [],
      );
      setDeleting(null);
      setFeedback("Account deleted.");
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof AccountApiError && error.status === 401) {
        invalidate();
      } else if (error instanceof AccountApiError && error.status === 409) {
        setFeedback("This account has transactions and cannot be deleted.");
      } else {
        setFeedback("Could not delete the account. Please try again.");
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  if (state === "checking") return <p role="status">Checking session...</p>;
  if (state !== "signed-in" || !user || !isValid(session))
    return (
      <div>
        <p>Sign in to manage your accounts.</p>
        <button
          className={action}
          type="button"
          disabled={!client}
          onClick={() => void signIn()}
        >
          Continue with Google
        </button>
        {message && <p role="alert">{message}</p>}
      </div>
    );

  const visibleAccounts =
    loadedFor === `${user.id}:${session.access_token}` ? accounts : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-sm font-medium text-teal-800 underline"
          >
            Back to home
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">Accounts</h1>
          <p className="mt-1 text-slate-600">Manage your broker accounts.</p>
        </div>
        <button
          type="button"
          className="text-teal-800 underline"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </header>

      <section aria-label="Account list">
        <h2 className="text-xl font-semibold">Your list</h2>
        {listError && <p role="alert">{listError}</p>}
        {!listError && visibleAccounts === null && (
          <p role="status">Loading accounts...</p>
        )}
        {visibleAccounts?.length === 0 && (
          <p>No accounts yet. Add one below.</p>
        )}
        {visibleAccounts && visibleAccounts.length > 0 && (
          <ul className="mt-4 grid gap-3">
            {visibleAccounts.map((account) => (
              <li
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <strong>{account.name}</strong>
                  <p className="text-sm text-slate-600">
                    <span>{account.broker_name}</span> · {account.currency}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="text-teal-800 underline"
                    onClick={() => {
                      setEditing(account.id);
                      setDeleting(null);
                      setName(account.name);
                      setCurrency(account.currency);
                      setFeedback("");
                    }}
                  >
                    Edit {account.name}
                  </button>
                  <button
                    type="button"
                    className="text-rose-800 underline"
                    onClick={() => setDeleting(account.id)}
                  >
                    Delete {account.name}
                  </button>
                </div>
                {deleting === account.id && (
                  <div className="w-full rounded-lg bg-rose-50 p-3">
                    <p>Delete {account.name}? This cannot be undone.</p>
                    <button
                      type="button"
                      className={action}
                      disabled={busy}
                      onClick={() => void confirmDelete()}
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      className="ml-3 underline"
                      onClick={() => setDeleting(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-semibold">
          {editing ? "Edit account" : "Add account"}
        </h2>
        <form
          onSubmit={(event) => void save(event)}
          noValidate
          className="mt-4 grid gap-4"
        >
          {!editing && (
            <label className="grid gap-1">
              Broker
              <select
                className={field}
                value={brokerId}
                onChange={(event) => setBrokerId(event.target.value)}
              >
                <option value="">Choose a broker</option>
                {brokers.map((broker) => (
                  <option key={broker.id} value={broker.id}>
                    {broker.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="text-sm text-slate-600">
            Broker not listed? New brokers cannot be added here yet.
          </p>
          <label className="grid gap-1">
            Account name
            <input
              className={field}
              value={name}
              maxLength={256}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="grid gap-1">
            Account currency
            <input
              className={field}
              value={currency}
              maxLength={3}
              onChange={(event) =>
                setCurrency(event.target.value.toUpperCase())
              }
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className={action}
              disabled={busy || (visibleAccounts === null && !listError)}
            >
              {editing ? "Save changes" : "Create account"}
            </button>
            {editing && (
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setEditing(null);
                  setName("");
                  setCurrency(user.base_currency);
                }}
              >
                Cancel edit
              </button>
            )}
          </div>
          {feedback && (
            <p role="alert" aria-live="polite">
              {feedback}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
