#!/usr/bin/env python3
"""Find actionable design notes in this package's local catalogue."""

import argparse
import json
from pathlib import Path
import re

PACKAGE = Path(__file__).resolve().parents[1]
COMMON = frozenset("a an and are as at be by for from in is it of on or that the this to with".split())


def terms(text):
    return set(re.findall(r"[^\W_]+", text.casefold())) - COMMON


def load_catalogue():
    catalogue = json.loads((PACKAGE / "data" / "decisions.json").read_text(encoding="utf-8"))
    catalogue["cards"].extend(json.loads((PACKAGE / "data" / "directions.json").read_text(encoding="utf-8")))
    return catalogue


def lookup(catalogue, query="", surface=None, stack=None, limit=5, domain=None, design_system=False):
    if surface is not None and surface not in catalogue["surfaces"]:
        raise ValueError("Unknown surface: " + surface)
    if stack is not None and stack not in catalogue["stacks"]:
        raise ValueError("Unknown stack: " + stack)
    if domain is not None and domain not in catalogue["domains"]:
        raise ValueError("Unknown domain: " + domain)
    if design_system and not query.strip():
        raise ValueError("A design-system proposal needs a query")
    if not 1 <= limit <= 12:
        raise ValueError("Limit must be between 1 and 12")
    wanted = terms(query)
    matches = []
    for card in catalogue["cards"]:
        if surface and surface not in card["surfaces"]:
            continue
        if domain and domain not in card["domains"]:
            continue
        tag_hits = wanted & terms(" ".join(card["tags"]))
        title_hits = wanted & terms(card["title"])
        detail_hits = wanted & terms(card["decision"])
        matched = tag_hits | title_hits | detail_hits
        if not matched:
            continue
        matches.append({
            **card,
            "match_score": 4 * len(tag_hits) + 2 * len(title_hits) + len(detail_hits),
            "matched_terms": sorted(matched),
        })
    matches.sort(key=lambda card: (-card["match_score"], card["id"]))
    return {
        "query": query,
        "surface": surface,
        "domain": domain,
        "stack": {"name": stack, **catalogue["stacks"][stack]} if stack else None,
        "matches": matches[:limit],
        "design_system": next((card for card in matches if "system" in card), None) if design_system else None,
        "ranking": "Literal term matches; scores are not confidence or design quality.",
    }


def main():
    catalogue = load_catalogue()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("query", nargs="?", default="")
    parser.add_argument("--surface", choices=catalogue["surfaces"])
    parser.add_argument("--stack", choices=sorted(catalogue["stacks"]))
    parser.add_argument("--domain", choices=catalogue["domains"])
    parser.add_argument("--design-system", action="store_true", help="Include the best matching authored direction; does not write files")
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--json", action="store_true", dest="as_json")
    parser.add_argument("--list-stacks", action="store_true")
    parser.add_argument("--list-domains", action="store_true")
    args = parser.parse_args()
    if args.list_stacks:
        print("\n".join(sorted(catalogue["stacks"])))
        return
    if args.list_domains:
        print("\n".join(catalogue["domains"]))
        return
    if not args.query.strip() and not args.stack:
        parser.error("Provide a query or select --stack")
    if not 1 <= args.limit <= 12:
        parser.error("--limit must be between 1 and 12")
    if args.design_system and not args.query.strip():
        parser.error("--design-system needs a query")
    result = lookup(catalogue, args.query, args.surface, args.stack, args.limit, args.domain, args.design_system)
    if args.as_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    if result["stack"]:
        note = result["stack"]
        print("Stack: " + note["name"])
        for label in ("inspect", "decide", "check", "reference"):
            print("  " + label.capitalize() + ": " + note[label])
    if args.design_system:
        direction = result["design_system"]
        if direction:
            print("\nDesign-system starting point: " + direction["title"])
            print("  Adapt this proposal to the brief; it is not a validated product specification.")
            print(json.dumps(direction["system"], ensure_ascii=False, indent=2))
        else:
            print("\nNo matching design direction. Do not substitute an unrelated preset.")
    for card in result["matches"]:
        print("\n" + card["title"] + " [" + card["id"] + "]")
        print("  Matched: " + ", ".join(card["matched_terms"]))
        for label in ("decision", "cost", "check", "reference"):
            print("  " + label.capitalize() + ": " + card[label])
        if card.get("example"):
            print("  Example: " + card["example"])
    if args.query and not result["matches"]:
        print("No matching decision. Use the brief or inspect a relevant reference.")
    print("\n" + result["ranking"])


if __name__ == "__main__":
    main()
