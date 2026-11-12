import json
import tempfile
import unittest
from pathlib import Path

from adapter import Store, label


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

    def test_publish_requires_session(self) -> None:
        with self.assertRaisesRegex(ValueError, "run init"):
            self.store.status("orchestrator", "working", "Starting")
        self.assertFalse(self.store.events.exists())

    def test_labels_redact_common_sensitive_values(self) -> None:
        cleaned = label("Read /home/example/private.txt person@example.com "
                        "token=abc123 password=hunter2 Bearer xyz123")
        for secret in ("/home/example", "person@example.com", "abc123", "hunter2", "xyz123"):
            self.assertNotIn(secret, cleaned)


if __name__ == "__main__":
    unittest.main()
