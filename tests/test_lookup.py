import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("lookup", ROOT / "scripts" / "lookup.py")
LOOKUP = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(LOOKUP)


class LookupTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalogue = LOOKUP.load_catalogue()

    def test_actionable_matches(self):
        cases = [
            ("keyboard focus modal", "application", "focus-through-a-dialog"),
            ("water shoreline foam", "immersive", "shore-contact"),
            ("form validation recovery", "application", "recover-the-form"),
        ]
        for query, surface, expected in cases:
            with self.subTest(query=query):
                result = LOOKUP.lookup(self.catalogue, query, surface=surface)
                self.assertIn(expected, [card["id"] for card in result["matches"][:3]])

    def test_unknown_query_does_not_invent_recommendations(self):
        result = LOOKUP.lookup(self.catalogue, "qzxvzz")
        self.assertEqual([], result["matches"])

    def test_surface_limits_results_and_ranking_is_repeatable(self):
        result = LOOKUP.lookup(self.catalogue, "layout color content", surface="editorial", limit=2)
        self.assertTrue(result["matches"])
        self.assertLessEqual(len(result["matches"]), 2)
        self.assertTrue(all("editorial" in card["surfaces"] for card in result["matches"]))
        self.assertEqual(result, LOOKUP.lookup(self.catalogue, "layout color content", "editorial", limit=2))

    def test_every_stack_works_without_a_query(self):
        self.assertEqual(22, len(self.catalogue["stacks"]))
        for stack in self.catalogue["stacks"]:
            with self.subTest(stack=stack):
                result = LOOKUP.lookup(self.catalogue, stack=stack)
                self.assertEqual(stack, result["stack"]["name"])
                self.assertEqual([], result["matches"])
                for key in ("inspect", "decide", "check", "reference"):
                    self.assertTrue(result["stack"][key])

    def test_catalogue_records_are_complete_and_references_exist(self):
        self.assertEqual(1, self.catalogue["version"])
        cards = self.catalogue["cards"]
        self.assertEqual(len(cards), len({card["id"] for card in cards}))
        for card in cards:
            with self.subTest(card=card["id"]):
                for key in ("title", "tags", "surfaces", "decision", "cost", "check"):
                    self.assertTrue(card[key])
                self.assertTrue(set(card["surfaces"]) <= set(self.catalogue["surfaces"]))
        for record in [*cards, *self.catalogue["stacks"].values()]:
            reference = (ROOT / record["reference"]).resolve()
            self.assertTrue(reference.is_relative_to(ROOT))
            self.assertTrue(reference.is_file(), record["reference"])

    def test_entrypoint_references_are_portable(self):
        source = (ROOT / "SKILL.md").read_text(encoding="utf-8")
        references = re.findall(r"references/[\w-]+\.md", source)
        self.assertTrue(references)
        for reference in references:
            self.assertTrue((ROOT / reference).is_file(), reference)
        self.assertNotIn("D:\\", source)
        self.assertNotIn("C:\\", source)

    def test_cli_from_unrelated_directory(self):
        with tempfile.TemporaryDirectory(prefix="maharajahul-lookup-") as directory:
            result = subprocess.run(
                [sys.executable, "-B", str(ROOT / "scripts" / "lookup.py"), "--stack", "javafx", "--json"],
                cwd=directory, text=True, encoding="utf-8", capture_output=True,
            )
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual("javafx", json.loads(result.stdout)["stack"]["name"])

    def test_cli_rejects_invalid_arguments(self):
        for arguments in ([], ["--stack", "nonexistent"], ["focus", "--limit", "0"]):
            with self.subTest(arguments=arguments):
                result = subprocess.run(
                    [sys.executable, "-B", str(ROOT / "scripts" / "lookup.py"), *arguments],
                    text=True, encoding="utf-8", capture_output=True,
                )
                self.assertEqual(2, result.returncode)
                self.assertIn("error:", result.stderr)

    def test_api_rejects_invalid_filters(self):
        for options in ({"surface": "unknown"}, {"stack": "unknown"}, {"limit": 13}):
            with self.subTest(options=options), self.assertRaises(ValueError):
                LOOKUP.lookup(self.catalogue, "focus", **options)


if __name__ == "__main__":
    unittest.main()
