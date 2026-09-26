# Implementation

Locate the owner of state, layout, and resources before changing a screen.

For detailed construction, use only the applicable guide: [Web](web-patterns.md),
[native mobile](native-patterns.md), or [desktop and JavaFX](desktop-patterns.md).

## Web

Use the existing route structure, components, and styling mechanism. A small
visual adjustment rarely requires a new state layer or UI framework.
Keep values that describe shared design decisions together; leave genuinely
local exceptions near the element that needs them.

Build the document in the intended reading order. Use native elements for
actions, navigation, and form inputs. Inspect generated markup when wrapping
native elements in components; component names do not establish semantics.

For asynchronous data, separate initial loading from a refresh of usable
content. Retain work and selection through recoverable errors. Prevent stale
responses from replacing a newer result when the affected interaction races.

Render large collections according to the project's needs: pagination,
incremental loading, or virtualization. Preserve keyboard behavior and
accessible structure when introducing virtualization.

## Framework decisions

| Family | Decision that affects the design |
|---|---|
| React, Next.js | Put interactive state with its owner; avoid making a whole page client-rendered for one control. Verify hydration and route transitions. |
| Vue, Nuxt, Nuxt UI | Reuse the project's reactive state and component conventions; inspect slot content and actual rendered semantics. |
| Svelte | Update the framework-owned state rather than mutating the same element through a second renderer. |
| Angular | Respect the current forms and change-detection strategy; keep validation connected to the rendered inputs. |
| Astro | Add interaction to the relevant island and check that reading and navigation remain useful before hydration. |
| Laravel | Keep validation and authorization grounded in the application; preserve entered values when rendering errors. |
| HTML, Tailwind, shadcn | Follow the installed version and local component implementations; styling utilities do not supply missing behavior. |

The offline catalogue has a focused note for each supported stack. It is not
an API reference. For version-specific APIs, inspect installed types or the
official documentation before implementing unfamiliar behavior.

## Mobile and native surfaces

Account for safe areas, the on-screen keyboard, system text scaling, navigation
gestures, and lifecycle events. A desktop breakpoint is not a mobile
interaction model. On a foldable or resizable window, consider the new space
as an opportunity to change pane relationships.

| Target | What to establish |
|---|---|
| SwiftUI | Stable identity, ownership of observable state, navigation, and Dynamic Type behavior |
| Jetpack Compose | State hoisting, recomposition boundaries, lifecycle-aware work, and semantics |
| Flutter | Bounded constraints, widget identity, text scaling, and controller disposal |
| React Native | Platform controls, keyboard avoidance, list behavior, and expensive work on interaction paths |
| WPF | Binding and command ownership, dispatcher work, DPI behavior, and collection virtualization |
| WinUI / UWP | Adaptive panes, focus navigation, scaling, and the application's window model |
| Avalonia / Uno | Target-specific behavior, input methods, resource lookup, and verification on the actual platform |

A native build succeeding does not demonstrate native usability. Verify the
relevant target when available and describe any platform that remains untested.

## JavaFX

Use layout panes and sizing constraints to describe relationships; hardcoded
coordinates are appropriate only when the surface itself requires them.
Inspect the smallest supported window and scaling before tuning the large view.

Keep application work off the JavaFX Application Thread and apply UI updates
on that thread. Define cancellation and view-disposal behavior for background
tasks. A fast operation in a sample can still block the UI on real input.

Separate observable application state from transient visual state. In editors
and dashboards, know who owns selection, dirty state, validation, and undo.
Reuse cells carefully: reset state and release listeners when a cell is reused.

Use CSS and the existing theme resources for control styling. Keep the focus
indicator visible in the resulting skin. For tables and lists, inspect long
values, empty data, sorting, editing, and keyboard movement.

Stop timelines, media playback, and background work when their owning view
ends. For a multi-window application, verify that one window closing does not
dispose resources still used by another.
