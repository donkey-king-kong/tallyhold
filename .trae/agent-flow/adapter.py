#!/usr/bin/env python3
"""Publish cooperative, metadata-only events to Agent Flow."""

from __future__ import annotations

import argparse
from contextlib import contextmanager
import fcntl
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Iterator

ROOT = Path(__file__).resolve().parents[2] / ".agent-flow"
STATES = ("starting", "working", "waiting", "blocked")
CATEGORIES = ("Browser", "Edit", "Read", "Search", "Shell", "Test", "Other")


def label(value: str) -> str:
    """Keep display text short; callers must supply generic, nonsensitive text."""
    text = " ".join(value.split())
    text = re.sub(r"(?i)\bBearer\s+\S+", "<redacted>", text)
    text = re.sub(
        r"(?i)\b(?:api[_-]?key|token|password|secret)\s*[:=]\s*\S+",
        "<redacted>",
        text,
    )
    text = re.sub(r"\bsk-[A-Za-z0-9_-]{8,}\b", "<redacted>", text)
    text = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "<redacted>", text)
    text = re.sub(r"(?<!\w)(?:/Users|/home|/tmp)/\S+", "<redacted>", text)
    return text[:160] or "unspecified"


def identifier(value: str) -> str:
    if not re.fullmatch(r"[a-zA-Z][a-zA-Z0-9_-]{0,63}", value):
        raise ValueError("IDs must be 1-64 letters, digits, hyphens or underscores, starting with a letter")
    return value


def git_context() -> tuple[Path, str | None]:
    """Locate the main checkout and the invoking worktree, if inside Git."""
    def git(*args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(["git", *args], capture_output=True, text=True, check=False)

    top = git("rev-parse", "--show-toplevel")
    if top.returncode:
        return ROOT, None
    common = git("rev-parse", "--path-format=absolute", "--git-common-dir")
    bare = git("rev-parse", "--is-bare-repository")
    if common.returncode or bare.returncode or bare.stdout.strip() != "false":
        raise ValueError("unsupported Git common directory; use --root")
    checkout = Path(top.stdout.strip()).resolve()
    directory = Path(common.stdout.strip()).resolve()
    if (directory.name != ".git" or not directory.is_dir()
            or (directory.parent / ".git").resolve() != directory):
        raise ValueError("unsupported Git common directory; use --root")
    branch = git("symbolic-ref", "--quiet", "--short", "HEAD")
    raw = branch.stdout.strip() if branch.returncode == 0 else str(checkout)
    stem = raw if branch.returncode == 0 else checkout.name
    normalized = re.sub(r"[^a-z0-9_-]+", "-", stem.lower()).strip("-_") or "worktree"
    slug = ("main" if raw == "main" and branch.returncode == 0 else
            normalized[:15] + "-" + hashlib.sha256(raw.encode("utf-8")).hexdigest()[:8])
    return directory.parent / ".agent-flow", slug


class Store:
    def __init__(self, root: Path | None = None, *, source: str | None = None) -> None:
        if root is None:
            self.root, self.source = git_context()
        else:
            self.root, self.source = root, source
        self.root_id = "wt-" + self.source if self.source else None
        self.events = self.root / "agent-flow-events.jsonl"
        self.session = self.root / "session.json"
        self.heartbeats = self.root / "heartbeats"

    @contextmanager
    def locked(self) -> Iterator[None]:
        self.root.mkdir(parents=True, exist_ok=True)
        with (self.root / ".lock").open("a+b") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(lock.fileno(), fcntl.LOCK_UN)

    def resolve(self, value: str) -> str:
        identifier(value)
        if not self.root_id:
            return value
        if value == "orchestrator":
            return self.root_id
        if value == self.root_id or value.startswith(self.root_id + "-"):
            return value
        combined = self.root_id + "-" + value
        if len(combined) > 64:
            head = 64 - len(self.root_id) - 1 - 9
            combined = (self.root_id + "-" + value[:head] + "-" +
                        hashlib.sha256(value.encode("utf-8")).hexdigest()[:8])
        return identifier(combined)

    def initialized(self) -> dict:
        if not self.session.exists():
            raise ValueError("run init before publishing events")
        data = json.loads(self.session.read_text(encoding="utf-8"))
        if (not isinstance(data, dict) or
                not isinstance(data.get("session_id"), str) or
                not isinstance(data.get("started_at"), (int, float)) or
                isinstance(data["started_at"], bool)):
            raise ValueError("invalid session.json; preserve existing stream")
        identifier(data["session_id"])
        return data

    def atomic_json(self, path: Path, data: dict) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(dir=path.parent, prefix=".agent-flow-")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as stream:
                json.dump(data, stream, sort_keys=True)
                stream.write("\n")
            os.replace(temporary, path)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)

    def event(self, kind: str, payload: dict) -> None:
        session = self.initialized()
        if self.source:
            payload = {**payload, "sourceWorktree": self.source}
        record = {
            "time": round(max(0, time.time() - session["started_at"]), 3),
            "type": kind,
            "payload": payload,
            "sessionId": session["session_id"],
        }
        data = (json.dumps(record, separators=(",", ":")) + "\n").encode("utf-8")
        fd = os.open(self.events, os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o600)
        try:
            with memoryview(data) as remaining:
                while remaining:
                    written = os.write(fd, remaining)
                    if written <= 0:
                        raise OSError("event append made no progress")
                    remaining = remaining[written:]
        finally:
            os.close(fd)

    def heartbeat(self, agent: str, state: str, activity: str, parent: str | None = None) -> None:
        path = self.heartbeats / (identifier(agent) + ".json")
        previous = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
        self.atomic_json(path, {
            "agent_id": agent,
            "parent_id": identifier(parent) if parent else previous.get("parent_id"),
            "status": state,
            "activity": label(activity),
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        })

    def register(self) -> None:
        if not self.root_id:
            return
        with self.events.open("r", encoding="utf-8") as stream:
            for line in stream:
                record = json.loads(line)
                if (record.get("type") == "agent_spawn" and
                        record.get("payload", {}).get("name") == self.root_id):
                    return
        self.heartbeat(self.root_id, "starting", "Worktree activity", "orchestrator")
        self.event("subagent_dispatch", {
            "parent": "orchestrator", "child": self.root_id, "task": "Worktree activity",
        })
        self.event("agent_spawn", {
            "name": self.root_id, "parent": "orchestrator", "task": "Worktree activity",
        })

    def ready(self) -> None:
        self.initialized()
        self.register()

    def init(self, session_id: str, task: str) -> None:
        identifier(session_id)
        with self.locked():
            if self.session.exists():
                if not self.source:
                    raise ValueError("session already exists; preserve this log and use a new --root for another run")
                self.initialized()
                if not self.events.exists():
                    raise ValueError("session exists without event log")
            else:
                if self.events.exists():
                    raise ValueError("event log exists without valid session")
                self.atomic_json(self.session, {
                    "session_id": session_id, "started_at": time.time(),
                })
                self.heartbeat("orchestrator", "starting", task)
                self.event("agent_spawn", {
                    "name": "orchestrator", "isMain": True, "task": label(task),
                })
            self.register()

    def start(self, agent: str, parent: str, task: str) -> None:
        agent, parent = self.resolve(agent), self.resolve(parent)
        with self.locked():
            self.ready()
            self.heartbeat(agent, "starting", task, parent)
            self.event("subagent_dispatch", {"parent": parent, "child": agent, "task": label(task)})
            self.event("agent_spawn", {"name": agent, "parent": parent, "task": label(task)})

    def status(self, agent: str, state: str, activity: str) -> None:
        agent = self.resolve(agent)
        with self.locked():
            self.ready()
            path = self.heartbeats / (agent + ".json")
            previous = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
            if previous.get("status") in ("completed", "failed"):
                spawn = {"name": agent, "task": label(activity)}
                if previous.get("parent_id"):
                    spawn["parent"] = identifier(previous["parent_id"])
                elif agent == "orchestrator":
                    spawn["isMain"] = True
                self.event("agent_spawn", spawn)
            self.heartbeat(agent, state, activity)
            if state == "waiting":
                self.event("permission_requested", {
                    "agent": agent, "title": "Waiting", "message": label(activity),
                })
            elif state == "blocked":
                self.event("error", {"agent": agent, "message": label(activity), "status": state})
            else:
                self.event("message", {"agent": agent, "content": label(activity)})

    def tool(self, agent: str, category: str, end: bool, outcome: str) -> None:
        agent = self.resolve(agent)
        with self.locked():
            self.ready()
            if end:
                self.event("tool_call_end", {
                    "agent": agent, "tool": category,
                    "result": f"{category} activity {outcome}", "tokenCost": 0,
                })
            else:
                self.event("tool_call_start", {
                    "agent": agent, "tool": category,
                    "args": "metadata withheld", "preview": f"{category} activity",
                })

    def complete(self, agent: str, parent: str | None, summary: str, failed: bool) -> None:
        agent = self.resolve(agent)
        parent = self.resolve(parent) if parent else None
        with self.locked():
            self.ready()
            self.heartbeat(agent, "failed" if failed else "completed", summary)
            if parent:
                self.event("subagent_return", {
                    "child": agent, "parent": parent,
                    "summary": label(summary), "status": "failed" if failed else "completed",
                })
            if failed:
                self.event("error", {"agent": agent, "message": label(summary), "status": "failed"})
            self.event("agent_complete", {
                "name": agent, "status": "failed" if failed else "completed",
            })


def parser() -> argparse.ArgumentParser:
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--root", type=Path, help="local event directory")
    commands = cli.add_subparsers(dest="command", required=True)
    init = commands.add_parser("init")
    init.add_argument("--session-id", required=True)
    init.add_argument("--task", required=True)
    start = commands.add_parser("start")
    start.add_argument("--agent", required=True)
    start.add_argument("--parent", default="orchestrator")
    start.add_argument("--task", required=True)
    status = commands.add_parser("status")
    status.add_argument("--agent", required=True)
    status.add_argument("--state", required=True, choices=STATES)
    status.add_argument("--activity", required=True)
    for name in ("tool-start", "tool-end"):
        tool = commands.add_parser(name)
        tool.add_argument("--agent", required=True)
        tool.add_argument("--category", required=True, choices=CATEGORIES)
        if name == "tool-end":
            tool.add_argument("--outcome", choices=("succeeded", "failed"), default="succeeded")
    complete = commands.add_parser("complete")
    complete.add_argument("--agent", required=True)
    complete.add_argument("--parent")
    complete.add_argument("--summary", required=True)
    complete.add_argument("--failed", action="store_true")
    return cli


def main() -> int:
    args = parser().parse_args()
    try:
        store = Store() if args.root is None else Store(args.root, source=git_context()[1])
        if args.command == "init":
            store.init(args.session_id, args.task)
        elif args.command == "start":
            store.start(args.agent, args.parent, args.task)
        elif args.command == "status":
            store.status(args.agent, args.state, args.activity)
        elif args.command in ("tool-start", "tool-end"):
            store.tool(args.agent, args.category, args.command == "tool-end",
                       getattr(args, "outcome", "succeeded"))
        elif args.command == "complete":
            store.complete(args.agent, args.parent, args.summary, args.failed)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    print(store.events)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
