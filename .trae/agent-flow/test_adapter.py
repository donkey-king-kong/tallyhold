from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from adapter import Store, label

ADAPTER = Path(__file__).resolve().with_name("adapter.py")


class AdapterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.store = Store(Path(self.temp.name) / "runtime")

    def events(self) -> list[dict]:
        return [json.loads(line) for line in self.store.events.read_text().splitlines()]

    def test_lifecycle_and_heartbeats(self) -> None:
        self.store.init("local-run", "Coordinate checks")
        self.store.start("checker", "orchestrator", "Check event metadata")
        self.store.status("checker", "working", "Reviewing event types")
        self.store.tool("checker", "Read", False, "succeeded")
        self.store.tool("checker", "Read", True, "succeeded")
        self.store.complete("checker", "orchestrator", "Checks complete", False)
        self.store.complete("orchestrator", None, "Run complete", False)

        events = self.events()
        self.assertEqual([event["type"] for event in events], [
            "agent_spawn", "subagent_dispatch", "agent_spawn", "message",
            "tool_call_start", "tool_call_end", "subagent_return",
            "agent_complete", "agent_complete",
        ])
        self.assertTrue(all(event["sessionId"] == "local-run" for event in events))
        child = json.loads((self.store.heartbeats / "checker.json").read_text())
        self.assertEqual(child["parent_id"], "orchestrator")
        self.assertEqual(child["status"], "completed")

    def test_waiting_and_failure_are_visible(self) -> None:
        self.store.init("local-run", "Verify")
        self.store.start("verifier", "orchestrator", "Verify events")
        self.store.status("verifier", "waiting", "Waiting for input")
        self.store.status("verifier", "blocked", "Input unavailable")
        self.store.complete("verifier", "orchestrator", "Could not verify", True)
        types = [event["type"] for event in self.events()]
        self.assertIn("permission_requested", types)
        self.assertIn("error", types)
        self.assertEqual(json.loads((self.store.heartbeats / "verifier.json").read_text())["status"],
                         "failed")

    def test_existing_log_is_not_replaced(self) -> None:
        self.store.init("local-run", "Initial run")
        before = self.store.events.read_bytes()
        with self.assertRaisesRegex(ValueError, "already exists"):
            self.store.init("next-run", "Another run")
        self.assertEqual(self.store.events.read_bytes(), before)

    def test_new_work_reactivates_completed_orchestrator(self) -> None:
        self.store.init("local-run", "Initial run")
        self.store.complete("orchestrator", None, "Initial run finished", False)
        self.store.status("orchestrator", "working", "Starting another run")

        events = self.events()
        self.assertEqual([event["type"] for event in events[-2:]], ["agent_spawn", "message"])
        self.assertEqual(events[-2]["payload"]["name"], "orchestrator")
        self.assertTrue(events[-2]["payload"]["isMain"])
        self.assertEqual(json.loads((self.store.heartbeats / "orchestrator.json").read_text())["status"],
                         "working")

    def test_publish_requires_session(self) -> None:
        with self.assertRaisesRegex(ValueError, "run init"):
            self.store.status("orchestrator", "working", "Starting")
        self.assertFalse(self.store.events.exists())

    def test_labels_redact_common_sensitive_values(self) -> None:
        cleaned = label("Read /home/example/private.txt person@example.com "
                        "token=abc123 password=hunter2 Bearer xyz123")
        for secret in ("/home/example", "person@example.com", "abc123", "hunter2", "xyz123"):
            self.assertNotIn(secret, cleaned)


class SharedStreamContractTests(unittest.TestCase):
    """Exercise the published CLI against disposable, linked Git worktrees."""

    def setUp(self) -> None:
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.base = Path(temp.name).resolve()
        self.script = self.base / "runner" / ".trae" / "agent-flow" / "adapter.py"
        self.script.parent.mkdir(parents=True)
        shutil.copyfile(ADAPTER, self.script)
        self.main = self.base / "main"
        self.alpha = self.base / "alpha"
        self.beta = self.base / "beta"
        self.git("init", "-b", "main", str(self.main), cwd=self.base)
        self.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.test",
                 "commit", "--allow-empty", "-m", "fixture", cwd=self.main)
        self.git("worktree", "add", "-b", "feature/red-alpha", str(self.alpha), cwd=self.main)
        self.git("worktree", "add", "-b", "feature/red-beta", str(self.beta), cwd=self.main)
        self.root = self.main / ".agent-flow"

    def git(self, *args: str, cwd: Path) -> str:
        result = subprocess.run(
            ["git", *args], cwd=cwd, text=True, capture_output=True, timeout=20,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return result.stdout.strip()

    def cli(self, cwd: Path, *args: str, script: Path | None = None,
            success: bool = True) -> subprocess.CompletedProcess[str]:
        result = subprocess.run(
            [sys.executable, str(script or self.script), *args],
            cwd=cwd, text=True, capture_output=True, timeout=20,
        )
        if success:
            self.assertEqual(result.returncode, 0, result.stderr)
        return result

    def init(self, cwd: Path = None, session: str = "shared-run") -> None:
        self.cli(cwd or self.main, "init", "--session-id", session, "--task", "Fixture run")

    def records(self) -> list[dict]:
        path = self.root / "agent-flow-events.jsonl"
        self.assertTrue(path.is_file(), f"missing shared stream: {path}")
        return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]

    def roots(self) -> dict[str, str]:
        return {
            record["payload"]["sourceWorktree"]: record["payload"]["name"]
            for record in self.records()
            if record["type"] == "agent_spawn"
            and record["payload"].get("name", "").startswith("wt-")
            and record["payload"].get("parent") == "orchestrator"
        }

    def heartbeat(self, name: str) -> dict:
        path = self.root / "heartbeats" / f"{name}.json"
        self.assertTrue(path.is_file(), f"missing namespaced heartbeat: {path}")
        return json.loads(path.read_text(encoding="utf-8"))

    def test_shared_default_root_from_main_and_linked_worktrees(self) -> None:
        self.init()
        nested = self.alpha / "nested"
        nested.mkdir()
        self.init(nested, session="other-run")
        for checkout in (self.main, nested, self.beta):
            result = self.cli(checkout, "status", "--agent", "orchestrator",
                              "--state", "working", "--activity", "Fixture status")
            self.assertEqual(Path(result.stdout.strip()), self.root / "agent-flow-events.jsonl")
        self.assertEqual({record["sessionId"] for record in self.records()}, {"shared-run"})

    def test_explicit_root_wins(self) -> None:
        override = self.base / "custom-stream"
        result = self.cli(self.alpha, "--root", str(override), "init",
                          "--session-id", "override-run", "--task", "Fixture run")
        self.assertEqual(Path(result.stdout.strip()), override / "agent-flow-events.jsonl")
        self.assertTrue((override / "session.json").is_file())
        self.assertFalse((self.alpha / ".agent-flow" / "session.json").exists())
        self.assertFalse((self.root / "session.json").exists())
        first = json.loads((override / "agent-flow-events.jsonl").read_text().splitlines()[0])
        self.assertIn("sourceWorktree", first["payload"])
        self.assertRegex(first["payload"]["sourceWorktree"], r"^feature-red-alp-[0-9a-f]{8}$")

    def test_outside_git_keeps_legacy_root_and_ids(self) -> None:
        legacy = self.base / "legacy"
        script = legacy / ".trae" / "agent-flow" / "adapter.py"
        script.parent.mkdir(parents=True)
        shutil.copyfile(ADAPTER, script)
        outside = self.base / "outside"
        outside.mkdir()
        result = self.cli(outside, "init", "--session-id", "legacy-run",
                          "--task", "Fixture run", script=script)
        self.assertEqual(Path(result.stdout.strip()), legacy / ".agent-flow" /
                         "agent-flow-events.jsonl")
        self.cli(outside, "status", "--agent", "orchestrator", "--state", "working",
                 "--activity", "Fixture status", script=script)
        records = [json.loads(line) for line in
                   (legacy / ".agent-flow" / "agent-flow-events.jsonl").read_text().splitlines()]
        self.assertEqual(records[0]["payload"]["name"], "orchestrator")
        self.assertEqual(records[-1]["payload"]["agent"], "orchestrator")

    def test_bare_roles_and_ship_review_rounds_are_isolated(self) -> None:
        self.init()
        for checkout in (self.alpha, self.beta):
            self.init(checkout, session="ignored-run")
            self.cli(checkout, "start", "--agent", "implementer", "--parent",
                     "orchestrator", "--task", "Fixture implementation")
            self.cli(checkout, "status", "--agent", "implementer", "--state",
                     "working", "--activity", "Fixture status")
            self.cli(checkout, "tool-start", "--agent", "implementer", "--category", "Read")
            self.cli(checkout, "tool-end", "--agent", "implementer", "--category", "Read")
            self.cli(checkout, "complete", "--agent", "implementer", "--parent",
                     "orchestrator", "--summary", "Fixture complete")
            self.cli(checkout, "start", "--agent", "reviewer_round_1",
                     "--task", "Fixture review")
        roots = self.roots()
        self.assertEqual(len(roots), 3)
        events = self.records()
        for slug, root in roots.items():
            if slug == "main":
                continue
            role = f"{root}-implementer"
            review = f"{root}-reviewer_round_1"
            self.assertEqual(sum(e["type"] == "agent_spawn" and
                                 e["payload"].get("name") == root for e in events), 1)
            self.assertTrue(any(e["type"] == "subagent_dispatch" and
                                e["payload"].get("child") == role and
                                e["payload"].get("parent") == root for e in events))
            self.assertTrue(any(e["type"] == "agent_spawn" and
                                e["payload"].get("name") == review and
                                e["payload"].get("parent") == root for e in events))
            for kind in ("message", "tool_call_start", "tool_call_end"):
                self.assertTrue(any(e["type"] == kind and
                                    e["payload"].get("agent") == role for e in events))
            self.assertTrue(any(e["type"] == "subagent_return" and
                                e["payload"].get("child") == role and
                                e["payload"].get("parent") == root for e in events))
            self.assertTrue(any(e["type"] == "agent_complete" and
                                e["payload"].get("name") == role for e in events))
            self.assertEqual(self.heartbeat(role)["parent_id"], root)

    def test_default_and_explicit_parents_resolve_consistently(self) -> None:
        self.init()
        self.cli(self.alpha, "start", "--agent", "first", "--task", "Fixture first")
        self.cli(self.alpha, "start", "--agent", "second", "--parent", "orchestrator",
                 "--task", "Fixture second")
        self.cli(self.alpha, "complete", "--agent", "first", "--parent",
                 "orchestrator", "--summary", "Fixture complete")
        root = next(value for key, value in self.roots().items() if key != "main")
        for child in ("first", "second"):
            self.assertEqual(self.heartbeat(f"{root}-{child}")["parent_id"], root)
        returns = [e["payload"] for e in self.records() if e["type"] == "subagent_return"]
        self.assertIn({"child": f"{root}-first", "parent": root,
                       "summary": "Fixture complete", "status": "completed"}, returns)

    def test_slug_branch_and_detached_head(self) -> None:
        self.init(self.alpha)
        alpha_slug = next(iter(self.roots()))
        self.assertRegex(alpha_slug, r"^feature-red-alp-[0-9a-f]{8}$")
        self.git("checkout", "--detach", cwd=self.beta)
        self.init(self.beta, session="other-run")
        roots = self.roots()
        self.assertTrue(any(re.fullmatch(r"beta-[0-9a-f]{8}", slug)
                            for slug in roots), roots)
        self.assertNotEqual(alpha_slug, next(slug for slug in roots if slug != alpha_slug))

    def test_normalization_collisions_and_long_names_remain_distinct(self) -> None:
        branches = ("feature/a.b", "feature/a-b",
                    "feature/" + "a" * 52 + "x",
                    "feature/" + "a" * 52 + "y")
        for number, branch in enumerate(branches):
            checkout = self.base / f"variant-{number}"
            self.git("worktree", "add", "-b", branch, str(checkout), cwd=self.main)
            self.init(checkout, session=f"run-{number}")
            self.cli(checkout, "start", "--agent", "role_" + "z" * 58 + str(number),
                     "--task", "Fixture role")
        roots = self.roots()
        self.assertEqual(len(roots), len(branches))
        self.assertEqual(len(set(roots.values())), len(branches))
        self.assertEqual(sum(slug.startswith("feature-a-b-") for slug in roots), 2)
        ids = [e["payload"]["name"] for e in self.records()
               if e["type"] == "agent_spawn" and "-role_" in e["payload"].get("name", "")]
        self.assertEqual(len(ids), len(branches))
        self.assertEqual(len(set(ids)), len(branches))
        self.assertTrue(all(re.fullmatch(r"[a-zA-Z][a-zA-Z0-9_-]{0,63}", name)
                            for name in [*roots.values(), *ids]))
        self.assertTrue(all(len(name) <= 64 for name in ids))
        invalid = self.cli(self.alpha, "start", "--agent", "bad/id",
                           "--task", "Fixture invalid", success=False)
        self.assertNotEqual(invalid.returncode, 0)

    def test_every_payload_has_source_worktree(self) -> None:
        self.init()
        self.init(self.alpha, session="ignored-run")
        self.init(self.beta, session="ignored-too")
        for checkout in (self.alpha, self.beta):
            self.cli(checkout, "start", "--agent", "checker", "--task", "Fixture check")
            self.cli(checkout, "status", "--agent", "checker", "--state", "working",
                     "--activity", "Fixture status")
            self.cli(checkout, "tool-start", "--agent", "checker", "--category", "Read")
            self.cli(checkout, "complete", "--agent", "checker", "--summary", "Fixture done")
        events = self.records()
        self.assertTrue(all(e["payload"].get("sourceWorktree") in self.roots()
                            for e in events))
        self.assertEqual(events[0]["payload"]["sourceWorktree"], "main")
        checkers = {e["payload"]["name"]: e["payload"]["sourceWorktree"]
                    for e in events if e["type"] == "agent_spawn" and
                    e["payload"].get("name", "").endswith("-checker")}
        self.assertEqual(len(checkers), 2)
        self.assertEqual(len(set(checkers.values())), 2)

    def test_init_reuses_existing_session_without_rewriting(self) -> None:
        self.init()
        session_path = self.root / "session.json"
        log_path = self.root / "agent-flow-events.jsonl"
        self.assertTrue(session_path.is_file(), "init did not create the shared session")
        self.assertTrue(log_path.is_file(), "init did not create the shared stream")
        session_before = session_path.read_bytes()
        log_before = log_path.read_bytes()
        self.init(self.alpha, session="different-run")
        self.assertEqual(session_path.read_bytes(), session_before)
        self.assertTrue(log_path.read_bytes().startswith(log_before))
        self.init(self.alpha, session="third-run")
        self.assertEqual(session_path.read_bytes(), session_before)
        self.assertEqual({e["sessionId"] for e in self.records()}, {"shared-run"})
        self.assertEqual(sum(e["type"] == "agent_spawn" and
                             e["payload"].get("name") == "orchestrator"
                             for e in self.records()), 1)

    def test_concurrent_init_creates_exactly_one_session(self) -> None:
        processes = [
            subprocess.Popen([sys.executable, str(self.script), "init", "--session-id",
                              f"run-{number}", "--task", "Fixture race"],
                             cwd=checkout, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                             text=True)
            for number, checkout in enumerate((self.alpha, self.beta))
        ]
        results = [process.communicate(timeout=20) for process in processes]
        self.assertEqual([process.returncode for process in processes], [0, 0], results)
        session_path = self.root / "session.json"
        self.assertTrue(session_path.is_file(), "concurrent init did not share a session")
        session = json.loads(session_path.read_text())["session_id"]
        self.assertIn(session, ("run-0", "run-1"))
        self.cli(self.alpha, "status", "--agent", "orchestrator", "--state", "working",
                 "--activity", "Fixture alpha")
        self.cli(self.beta, "status", "--agent", "orchestrator", "--state", "working",
                 "--activity", "Fixture beta")
        events = self.records()
        self.assertEqual({e["sessionId"] for e in events}, {session})
        self.assertEqual(sum(e["type"] == "agent_spawn" and
                             e["payload"].get("name") == "orchestrator" for e in events), 1)
        self.assertEqual(len(self.roots()), 2)

    def test_orphan_log_is_not_overwritten(self) -> None:
        self.root.mkdir()
        log = self.root / "agent-flow-events.jsonl"
        sentinel = b'{"type":"historical","payload":{}}\n'
        log.write_bytes(sentinel)
        result = self.cli(self.alpha, "init", "--session-id", "new-run",
                          "--task", "Fixture run", success=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(log.read_bytes(), sentinel)
        self.assertFalse((self.root / "session.json").exists())

    def test_concurrent_process_appends_are_complete_and_unique(self) -> None:
        self.init()
        self.init(self.alpha, session="ignored-run")
        self.init(self.beta, session="ignored-too")
        labels = [f"Fixture-{number:02d}" for number in range(40)]
        processes = [
            subprocess.Popen([sys.executable, str(self.script), "status", "--agent",
                              "worker", "--state", "working", "--activity", label],
                             cwd=self.alpha if number % 2 else self.beta,
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            for number, label in enumerate(labels)
        ]
        results = [process.communicate(timeout=20) for process in processes]
        self.assertEqual([process.returncode for process in processes],
                         [0] * len(processes), results)
        lines = (self.root / "agent-flow-events.jsonl").read_bytes().splitlines(keepends=True)
        self.assertTrue(all(line.endswith(b"\n") for line in lines))
        events = [json.loads(line) for line in lines]
        observed = [e["payload"].get("content") for e in events if e["type"] == "message"
                    and e["payload"].get("content") in labels]
        self.assertCountEqual(observed, labels)
        self.assertEqual({e["sessionId"] for e in events}, {"shared-run"})

    def test_documented_commands_share_one_stream(self) -> None:
        self.init()
        for checkout in (self.alpha, self.beta):
            self.init(checkout, session="ship-run")
            self.cli(checkout, "status", "--agent", "orchestrator", "--state",
                     "working", "--activity", "Starting ship run")
            self.cli(checkout, "start", "--agent", "reviewer_round_1",
                     "--parent", "orchestrator", "--task", "Fixture review")
            self.cli(checkout, "status", "--agent", "reviewer_round_1", "--state",
                     "working", "--activity", "Reviewer active")
            self.cli(checkout, "tool-start", "--agent", "orchestrator", "--category", "Shell")
            self.cli(checkout, "tool-end", "--agent", "orchestrator",
                     "--category", "Shell", "--outcome", "succeeded")
            self.cli(checkout, "complete", "--agent", "reviewer_round_1",
                     "--parent", "orchestrator", "--summary", "Fixture verdict")
        self.assertEqual(len(self.roots()), 3)
        self.assertEqual({e["sessionId"] for e in self.records()}, {"shared-run"})
        self.assertEqual(len([e for e in self.records() if e["type"] == "subagent_return"
                              and "reviewer_round_1" in e["payload"]["child"]]), 2)

    def test_main_orchestrator_maps_to_wt_main(self) -> None:
        self.init()
        shared = self.heartbeat("orchestrator")
        self.cli(self.main, "start", "--agent", "architect", "--task", "Fixture design")
        self.cli(self.main, "status", "--agent", "orchestrator", "--state",
                 "working", "--activity", "Fixture work")
        self.cli(self.main, "tool-start", "--agent", "orchestrator", "--category", "Read")
        self.cli(self.main, "complete", "--agent", "orchestrator", "--summary", "Fixture done")
        self.assertEqual(self.heartbeat("orchestrator"), shared)
        self.assertEqual(self.heartbeat("wt-main")["status"], "completed")
        events = self.records()
        self.assertTrue(any(e["type"] == "agent_spawn" and
                            e["payload"].get("name") == "wt-main" and
                            e["payload"].get("parent") == "orchestrator" for e in events))
        self.assertTrue(any(e["type"] == "agent_spawn" and
                            e["payload"].get("name") == "wt-main-architect" and
                            e["payload"].get("parent") == "wt-main" for e in events))
        self.assertEqual([e["type"] for e in events if
                          e["payload"].get("name") == "orchestrator"], ["agent_spawn"])
        self.assertTrue(all(e["payload"].get("agent") != "orchestrator" for e in events))

    def test_prefixed_ids_and_parents_are_idempotent(self) -> None:
        self.init(self.alpha)
        root = next(iter(self.roots().values()))
        self.init(self.beta, session="ignored-run")
        other = next(value for value in self.roots().values() if value != root)
        self.cli(self.alpha, "start", "--agent", f"{root}-manual", "--parent", root,
                 "--task", "Fixture manual")
        self.cli(self.alpha, "status", "--agent", f"{root}-manual", "--state",
                 "working", "--activity", "Fixture status")
        self.cli(self.alpha, "tool-start", "--agent", f"{root}-manual", "--category", "Read")
        self.cli(self.alpha, "complete", "--agent", f"{root}-manual", "--parent", root,
                 "--summary", "Fixture complete")
        self.cli(self.alpha, "status", "--agent", root, "--state", "working",
                 "--activity", "Fixture root")
        self.cli(self.beta, "start", "--agent", f"{other}-manual", "--parent", other,
                 "--task", "Fixture other")
        events = self.records()
        for worktree_root in (root, other):
            self.assertTrue(any(e["type"] == "agent_spawn" and
                                e["payload"].get("name") == f"{worktree_root}-manual" and
                                e["payload"].get("parent") == worktree_root for e in events))
            self.assertFalse(any(f"{worktree_root}-{worktree_root}" in json.dumps(e["payload"])
                                 for e in events))
        self.assertEqual(sum(e["type"] == "agent_spawn" and
                             e["payload"].get("name") == root for e in events), 1)
        self.assertEqual(self.heartbeat(f"{root}-manual")["parent_id"], root)

    def test_reused_init_does_not_reactivate_shared_orchestrator(self) -> None:
        self.init()
        self.cli(self.main, "complete", "--agent", "orchestrator",
                 "--summary", "Fixture finished")
        self.heartbeat("orchestrator")
        shared_before = (self.root / "heartbeats" / "orchestrator.json").read_bytes()
        log_before = self.records()
        self.init(self.alpha, session="later-run")
        self.init(self.alpha, session="again-run")
        self.assertEqual((self.root / "heartbeats" / "orchestrator.json").read_bytes(),
                         shared_before)
        added = self.records()[len(log_before):]
        self.assertFalse(any(e["payload"].get("name") == "orchestrator" or
                             e["payload"].get("agent") == "orchestrator" for e in added))
        self.assertEqual(sum(e["type"] == "agent_spawn" and
                             e["payload"].get("name") == "orchestrator"
                             for e in self.records()), 1)

    def test_status_reactivates_only_namespaced_heartbeat(self) -> None:
        self.init()
        self.init(self.alpha, session="ignored-run")
        self.cli(self.alpha, "start", "--agent", "checker", "--task", "Fixture check")
        self.cli(self.alpha, "complete", "--agent", "checker",
                 "--summary", "Fixture finished")
        root = next(value for key, value in self.roots().items() if key != "main")
        shared_before = (self.root / "heartbeats" / "orchestrator.json").read_bytes()
        self.cli(self.alpha, "status", "--agent", "checker", "--state", "working",
                 "--activity", "Fixture resumed")
        events = self.records()
        self.assertEqual([e["payload"].get("name") for e in events if
                          e["type"] == "agent_spawn" and
                          e["payload"].get("name") == f"{root}-checker"],
                         [f"{root}-checker", f"{root}-checker"])
        self.assertEqual(self.heartbeat(f"{root}-checker")["status"], "working")
        self.assertEqual(self.heartbeat(f"{root}-checker")["parent_id"], root)
        self.assertEqual((self.root / "heartbeats" / "orchestrator.json").read_bytes(),
                         shared_before)


if __name__ == "__main__":
    unittest.main()
