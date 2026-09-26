# Design handoff

Decide which artifact owns each decision before moving information between a
design file and an application.

## Establish the mapping

Record only the mappings needed for the task:

| Design decision | Typical owner | Runtime evidence |
|---|---|---|
| Brand values and reusable type roles | Shared design variables | Theme or token definitions |
| Layout relationship | Component/frame constraints | Layout rules at relevant sizes |
| Component state | Variants and interaction specification | Props, state, and events |
| Navigation and data | Application | Route and state transitions |
| Image or illustration | Approved asset | Source file, crop, and usage |

These are examples, not a rule that a design file always takes precedence.
Resolve disagreements using the user's brief and the product's actual contract.

Use the available integration's own prerequisite for the requested operation:
node inspection, creating a file, design-to-code, library generation, component
mapping and motion editing are distinct workflows. Do not create or publish a
design file merely because the task mentions Figma. If no integration is
available, inspect supplied exports and code; do not pretend a remote edit ran.

## From Figma to implementation

Inspect the relevant frame, components, variables, and assets through the
available integration. Capture a visual reference as well as the structure.
An exported image alone does not reveal auto-layout behavior or hidden states.

Map a design component to an existing runtime component when it represents
the same concept. Explain material differences in behavior before forcing
the match. Reuse real assets where permitted.

Translate relationships rather than copying every coordinate. Compare the
render at the design's dimensions, then check a width the design did not show.
Longer text and an open keyboard can expose constraints absent from a frame.

## From implementation to design

Identify the routes and states being represented. Build design structure from
those states and keep stable names for reusable concepts. Label any deliberate
visual exploration so it is not mistaken for the currently shipped interface.

If Code Connect or a similar mapping system is available, connect real
components and properties. Do not publish a mapping to a component that does
not exist or imply the connection was verified without exercising it.

## Interaction and motion handoff

Communicate trigger, starting state, ending state, interruption, and the
reduced-motion result. A video demonstrates appearance but does not specify
state ownership. Include that ownership where implementation could be ambiguous.

Verify that an edit did not detach variants or break a mapped component.
Report the actual design artifact and the corresponding implemented surface.
If the integration is unavailable, deliver the mapping and clearly identify
which design-file actions were not performed.

## A usable library and mapping recipe

Inventory the real component API, token aliases and representative states.
Translate supported props into design properties; exclude combinations the
runtime cannot render. An apparently identical component can have different
keyboard or selection behavior, so map semantics as well as appearance.

Validate one instance end to end before repeating mappings: selected design
variant → generated import and props → actual runtime component → rendered
state. Record code-only behavior such as virtualization or permission logic
instead of fabricating a design variant for it. A library update must preserve
the project's existing identifiers and references where consumers rely on them.

For motion handoff include duration/easing intent, origin, interruption and
responsive differences, not just the final pose. Do not import a fixed prototype
timeline as application state when real input can interrupt the sequence.
