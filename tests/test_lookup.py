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

    def test_all_demo_recipes_are_retrievable(self):
        queries = {
            "liquid-glass": "liquid glass refraction",
            "orbital-planet": "orbital planet rings",
            "liquid-metal": "liquid metal torus",
            "spectral-crystal": "spectral crystal absorption",
            "spatial-network": "spatial network nodes",
            "kinetic-tunnel": "kinetic tunnel rails",
            "editorial-spread": "editorial spread story",
            "energy-dashboard": "energy dashboard totals",
            "product-configurator": "product configurator finish",
            "timeline-workspace": "timeline workspace playhead",
            "contour-landscape": "contour landscape relief",
        }
        for recipe, query in queries.items():
            with self.subTest(recipe=recipe):
                result = LOOKUP.lookup(self.catalogue, query, limit=1)
                self.assertEqual("recipe-" + recipe, result["matches"][0]["id"])

    def test_recipe_coverage_matches_the_demo_navigation(self):
        examples = {card["example"] for card in self.catalogue["cards"] if "example" in card}
        self.assertEqual(11, len(examples))
        for document in ("samples/index.html", "samples/future/index.html"):
            source = (ROOT / document).read_text(encoding="utf-8")
            nav = re.search(r'<nav\b[^>]*class="(?:gallery|world)-nav"[^>]*>(.*?)</nav>', source, re.S)
            self.assertIsNotNone(nav, document)
            fragments = set(re.findall(r'href="#([\w-]+)"', nav.group(1)))
            self.assertEqual({document + "#" + fragment for fragment in fragments},
                             {example for example in examples if example.split("#")[0] == document})

    def test_domain_filter_is_explicit_and_every_domain_is_usable(self):
        domains = self.catalogue["domains"]
        self.assertEqual(16, len(set(domains)))
        for domain in domains:
            with self.subTest(domain=domain):
                cards = [card for card in self.catalogue["cards"] if domain in card["domains"]]
                self.assertTrue(cards)
                query = " ".join(cards[0]["tags"])
                result = LOOKUP.lookup(self.catalogue, query, domain=domain)
                self.assertTrue(result["matches"])
                self.assertTrue(all(domain in card["domains"] for card in result["matches"]))

    def test_design_system_obeys_query_and_surface_without_writing(self):
        result = LOOKUP.lookup(self.catalogue, "operations queue dashboard", surface="application",
                               stack="react", design_system=True, limit=1)
        self.assertEqual("direction-workshop-ledger", result["design_system"]["id"])
        self.assertEqual("react", result["stack"]["name"])
        self.assertTrue(result["design_system"]["system"]["palette"])
        for options in ({"query": "qzxvzz"}, {"query": "operations queue dashboard", "surface": "immersive"},
                        {"query": "operations queue dashboard", "domain": "icons"}):
            with self.subTest(options=options):
                self.assertIsNone(LOOKUP.lookup(self.catalogue, design_system=True, **options)["design_system"])

    def test_direction_palettes_have_readable_opaque_text_pairs(self):
        def luminance(color):
            self.assertRegex(color, r"^#[0-9A-Fa-f]{6}$")
            values = [int(color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
            linear = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in values]
            return sum(value * weight for value, weight in zip(linear, (0.2126, 0.7152, 0.0722)))

        directions = [card for card in self.catalogue["cards"] if "system" in card]
        self.assertEqual(8, len(directions))
        for direction in directions:
            system = direction["system"]
            for key in ("typography", "layout", "spacing_px", "radius_px", "motion", "avoid"):
                self.assertTrue(system[key])
            palette = system["palette"]
            for foreground, background in (("ink", "canvas"), ("ink", "surface"),
                                           ("muted", "canvas"), ("muted", "surface"), ("on_accent", "accent")):
                with self.subTest(direction=direction["id"], pair=(foreground, background)):
                    light, dark = sorted((luminance(palette[foreground]), luminance(palette[background])), reverse=True)
                    self.assertGreaterEqual((light + 0.05) / (dark + 0.05), 4.5)
            if "recipe" in system:
                self.assertTrue((ROOT / system["recipe"]).is_file())

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
                for key in ("title", "tags", "surfaces", "domains", "decision", "cost", "check"):
                    self.assertTrue(card[key])
                self.assertTrue(set(card["surfaces"]) <= set(self.catalogue["surfaces"]))
                self.assertTrue(set(card["domains"]) <= set(self.catalogue["domains"]))
        for record in [*cards, *self.catalogue["stacks"].values()]:
            reference = (ROOT / record["reference"]).resolve()
            self.assertTrue(reference.is_relative_to(ROOT))
            self.assertTrue(reference.is_file(), record["reference"])

    def test_all_local_reference_links_resolve_inside_package(self):
        documents = [ROOT / "SKILL.md", *(ROOT / "references").rglob("*.md")]
        for document in documents:
            source = document.read_text(encoding="utf-8")
            self.assertNotIn("D:\\", source)
            self.assertNotIn("C:\\", source)
            for target in re.findall(r"\]\(([^)]+)\)", source):
                if target.startswith(("https://", "http://", "#")):
                    continue
                with self.subTest(document=document.name, target=target):
                    path_part, _, fragment = target.partition("#")
                    resolved = (document.parent / path_part).resolve()
                    self.assertTrue(resolved.is_relative_to(ROOT), target)
                    self.assertTrue(resolved.is_file(), target)
                    if fragment and resolved.suffix == ".html":
                        html = resolved.read_text(encoding="utf-8")
                        self.assertTrue(f'id="{fragment}"' in html or f'href="#{fragment}"' in html, target)

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

    def test_recipe_and_system_cli_from_unrelated_directory(self):
        with tempfile.TemporaryDirectory(prefix="maharajahul-recipe-") as directory:
            command = [sys.executable, "-B", str(ROOT / "scripts" / "lookup.py")]
            recipe = subprocess.run([*command, "liquid glass refraction", "--surface", "application", "--limit", "1"],
                                    cwd=directory, text=True, encoding="utf-8", capture_output=True)
            proposal = subprocess.run([*command, "editorial journal paper", "--design-system", "--domain", "typography", "--json"],
                                      cwd=directory, text=True, encoding="utf-8", capture_output=True)
            self.assertEqual([], list(Path(directory).iterdir()))
        self.assertEqual(0, recipe.returncode, recipe.stderr)
        self.assertIn("references/recipes/liquid-glass.md", recipe.stdout)
        self.assertIn("samples/future/index.html#lucent", recipe.stdout)
        self.assertEqual(0, proposal.returncode, proposal.stderr)
        self.assertEqual("direction-archive-paper", json.loads(proposal.stdout)["design_system"]["id"])

    def test_cli_rejects_invalid_arguments(self):
        for arguments in ([], ["--stack", "nonexistent"], ["focus", "--limit", "0"],
                          ["focus", "--domain", "nonexistent"], ["--stack", "react", "--design-system"]):
            with self.subTest(arguments=arguments):
                result = subprocess.run(
                    [sys.executable, "-B", str(ROOT / "scripts" / "lookup.py"), *arguments],
                    text=True, encoding="utf-8", capture_output=True,
                )
                self.assertEqual(2, result.returncode)
                self.assertIn("error:", result.stderr)

    def test_api_rejects_invalid_filters(self):
        for options in ({"surface": "unknown"}, {"stack": "unknown"}, {"limit": 13}, {"domain": "unknown"}):
            with self.subTest(options=options), self.assertRaises(ValueError):
                LOOKUP.lookup(self.catalogue, "focus", **options)
        with self.assertRaises(ValueError):
            LOOKUP.lookup(self.catalogue, design_system=True)


if __name__ == "__main__":
    unittest.main()
