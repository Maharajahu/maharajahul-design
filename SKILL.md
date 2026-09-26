---
name: maharajahul-design
description: "Turn interface briefs into a visual direction, working screens, and inspected results. Use for web and native UI design, redesign, interaction, design-file handoff, generated visual assets, and real-time graphics."
---

# Maharajahul Design

Build a screen around what somebody needs to notice, decide, and do.
Let its identity come from the subject and the behavior of the product.

This skill has three working modes:

- **Create:** establish a visual direction and implement the requested experience.
- **Repair:** trace an observed interface problem to its cause and change that part.
- **Review:** explain problems using visible or executable evidence. A review alone does not authorize edits.

Choose the mode from the request. A named technology does not turn a review into a rebuild.

## Start with a scene

Determine who is using the screen, where they are, what they already know,
and what successful use would look like. For example, a field worker closing
a repair ticket has different needs from a buyer comparing the same service.

Read enough of the existing product to identify its real content, routes,
shared components, styles, and assets. On an existing interface, locate the
specific state in question before proposing a replacement.

Resolve these decisions before implementation; keep them internal unless a
handoff or a material tradeoff makes them useful to the user:

| Decision | Evidence to use |
|---|---|
| What leads the composition? | The user's immediate question or action |
| What makes the result recognizable? | An attribute of the product, material, place, or brand |
| What must survive on a smaller surface? | The next action, current state, and necessary context |
| What happens after interaction? | The actual state transition and its recovery path |
| What would demonstrate completion? | A visible result and the affected behavior |

## Read the reference for the difficult part

The references are independent. Read the ones relevant to the current work.

| When the task depends on... | Read |
|---|---|
| Art direction, type, color, layout, charts, icons | [Composition](references/composition.md) |
| Navigation, forms, UI states, motion, scroll behavior | [Interaction](references/interaction.md) |
| A web framework, mobile UI, desktop UI, or JavaFX | [Implementation](references/implementation.md) |
| Shaders, 3D scenes, WebGPU, simulations, audio-reactive work | [Live graphics](references/live-graphics.md) |
| Figma, design libraries, or component mappings | [Design handoff](references/design-handoff.md) |
| Images, illustrations, textures, or video | [Visual assets](references/visual-assets.md) |
| Critique, screenshots, accessibility, regression checks | [Inspection](references/inspection.md) |

## Consult the decision library when a choice is unclear

The package includes its own small, editable catalogue of design decisions.
The lookup tool runs offline with Python's standard library. It ranks literal
word matches and shows why an entry matched; the score is not a confidence
estimate or a quality rating.

From this package directory:

~~~sh
python scripts/lookup.py "keyboard focus modal recovery" --surface application
python scripts/lookup.py "water shoreline foam" --surface immersive --stack threejs
python scripts/lookup.py --stack javafx --json
python scripts/lookup.py --list-stacks
~~~

Query it when it can settle a concrete decision. The query and catalogue are
English. Do not force a match: an empty result means reason from the brief or
inspect the relevant implementation. Read the JSON directly if Python is
unavailable. The catalogue does not prescribe a complete design.

## Establish one visual argument

Choose a visual relationship that explains the product. A comparison tool may
align alternatives on a common baseline; a field guide may tie navigation to
location; a material showcase may let lighting reveal construction.

Express that relationship through hierarchy, spacing, typography, and content
before adding effects. Use enough variety to distinguish roles without making
every component compete for attention. A supplied reference or an established
brand can already settle these decisions.

In an existing project, adapt the available tokens and components. In a new
project, introduce only the shared decisions the implemented screens need.
Do not create an empty design-system framework ahead of the actual interface.

## Build a complete interaction

Implement the requested path using the project's available stack. Tie visible
state to real application state. Where data is unavailable, make the absence
explicit rather than filling it with invented business facts.

For each affected control, know its activation, result, pending state, failure,
and recovery. Include only states that can occur in this product. A screenshot
of the default view cannot demonstrate these transitions.

Treat browser, mobile, desktop, and immersive surfaces as different environments.
Read their implementation guidance when it affects input, lifecycle, sizing,
or resource ownership.

## Inspect the result at its intended scale

For a visual change, examine the rendered screen at a relevant wide and narrow
size and exercise the changed interaction. For an effect, inspect it over time.
For an accessibility claim, inspect the relevant semantics and input behavior.

When automated captures help, use the optional helper described in
[Inspection](references/inspection.md). It uses an existing project installation
of Playwright; the package neither bundles nor installs a browser.

Fix what the inspection demonstrates. If rendering or a target device is
unavailable, state exactly which part remains unverified.

Finish with the delivered files or working surface, significant decisions,
and the observed validation result. Follow the user's requested scope and
the repository's conventions when they differ from an example in this skill.
