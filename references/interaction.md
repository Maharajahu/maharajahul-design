# Interaction

Design the transition between states, including what remains stable.

For numerical timing seeds, reversible panels, FLIP reordering and scroll
choreography, read [Motion recipes](motion-recipes.md).

## A control has a contract

For the control being changed, identify:

- the information required before activation;
- what changes immediately and what waits for a response;
- whether the action can be cancelled or undone;
- what the user sees if it fails;
- where keyboard focus and the current selection go afterward.

Use the application's actual persistence behavior. Do not show a saved state
before a save is confirmed unless the product deliberately supports optimistic
updates and recovery.

For forms, explain a requirement near its field. After failure, retain valid
work, connect each error to the affected input, and provide a useful route to
the first problem. A disabled button alone does not explain a blocked action.

For destructive or expensive actions, choose confirmation or undo according to
what recovery is actually possible. Do not promise an undo path the system lacks.

## Navigation and attention

Navigation should answer where the user is, what can be reached, and how to
return. Preserve the relevant filter, scroll position, or selection when that
continuity is part of the task.

A modal temporarily changes the interaction boundary. Inspect focus entry,
keyboard containment, dismissal, and focus return. A side panel may allow
continued work outside it; do not give it modal behavior accidentally.

Keep repeated controls predictable. If a change moves a control, make the
relationship to its previous location understandable. Do not sacrifice basic
navigation for a scroll effect or custom pointer treatment.

## Motion communicates a change

Identify what motion explains: origin, destination, progress, causality, or
attention. Choose duration from the distance and importance of that change.
Treat numerical timings as starting points to inspect, not universal values.

Keep input acknowledgement separate from a longer visual transition. A button
can acknowledge a press immediately while its result arrives later.

Test interruption. Repeated activation, reversing direction, resizing, and
navigation during an animation should settle into a valid state. Prefer one
owner for a property to two competing animation systems.

Use transforms and opacity where they express the intended movement. If the
effect changes layout, manage measurement and updates deliberately instead of
alternating reads and writes for every element on every frame.

## Scroll and reduced motion

Use scrolling to reveal a sequence when the content benefits from that
sequence. Provide a understandable static composition if the animated path
cannot run. Long pinning regions should earn the distance they consume.

For reduced motion, retain the information encoded in movement. Replace travel
with a direct state change or a quiet transition as appropriate. Do not hide
the destination or require an animation to complete before a control works.

Background motion should have a purpose and an appropriate pause behavior.
Consider hidden tabs, battery use, and whether the effect obstructs reading.

## Demonstrate the path

Exercise the affected interaction with keyboard and pointer or touch as
appropriate. Include one interruption or recovery case when it is relevant.
Inspect a frame during transition as well as the final resting state.
