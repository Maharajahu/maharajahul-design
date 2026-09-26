# Native interface patterns

Use for SwiftUI, Jetpack Compose, Flutter and React Native. Shared brand tokens
can cross platforms; navigation, permission flows and system input behavior
must still fit each shipped target. Browser dimensions are not native QA.

## Preserve the task while changing composition

Keep selected item, draft content and meaningful navigation in an owner that
survives the presentation change. Derive a one-pane or multipane view from
current constraints. Do not infer layout permanently from the phone model or
an initial screen-size snapshot. Larger text can require a new composition
even when the physical window does not change.

Separate transient presentation (hover, a pressed state, an in-flight visual
transition) from restorable work. On a process restart, restore identifiers
and drafts as appropriate; do not attempt to serialize live network tasks,
view objects or renderer handles. Revalidate data that may have changed.

## SwiftUI

Treat view identity as part of state ownership. Keep durable models outside
ephemeral view reconstruction and follow the project's observation approach.
Use the application's navigation state to choose a stack or split presentation,
not several unrelated booleans that can open contradictory destinations.
Tie asynchronous work to the view/model owner and handle cancellation.

Test Dynamic Type, safe-area changes, VoiceOver names/actions, keyboard focus
and return navigation. A custom glass view should not discard native control
semantics. Use the target platform's material when appropriate; the web liquid
glass recipe is not a SwiftUI component or a guarantee of native material parity.

## Jetpack Compose

Hoist state according to durability and sharing. Distinguish locally remembered
presentation from state that must survive configuration or process recreation.
Key effects by the work they represent; recomposition must not start duplicate
jobs. Collect and cancel work with the appropriate lifecycle owner.

Use current window constraints and posture to choose navigation and pane
arrangements. Respect edge-to-edge insets, keyboard space, font scaling and the
project's back-navigation conventions. Test fold/unfold while an item is
selected, a recreation with unsaved text, and keyboard/pointer focus in an
expanded layout. Inspect semantics after introducing custom drawing.

## Flutter

Read local constraints for a component's layout and window/user information
for global concerns. A nested component should not assume it fills the window.
Keep keys and selected identity stable while swapping one-pane and two-pane
presentations. Dispose controllers, animation and listeners with their owner.

Inspect text scaling, safe areas, keyboard insets and focus traversal. For a
slow animation, distinguish UI work from raster work before changing widgets.
A shared widget tree is not proof that desktop menus, iOS navigation and Android
back behavior are correct; verify the actual target path.

## React Native

Use current window dimensions and the project's native navigation/state model.
Select platform behavior where semantics genuinely differ rather than adding
platform branches to every style. Virtualized lists require stable item identity
and responsive item work; test an actual populated collection, not four rows.

Inspect text scaling, keyboard avoidance, safe areas, RTL and accessible names,
roles and state on the shipped platforms. Keep expensive processing and
unnecessary component updates out of the interaction path. Match animation
work to the project's existing execution model; do not introduce a new library
before measuring the delay.

## Small useful verification matrix

Use the relevant combination, not every possible device:

- Compact and expanded presentations while preserving selection.
- Standard and large text; a long translated label.
- Touch plus keyboard/pointer where supported.
- Back/return, background/resume and actual recreation when state is affected.
- Permission refusal, offline state or interrupted work when the flow can reach it.

Previews can reveal layout mistakes. A simulator/device interaction establishes
navigation and lifecycle behavior. An accessibility claim also needs the
relevant assistive-technology observation. Name any untested platform explicitly.
