# Web implementation patterns

Use the row for the detected stack, not a framework chosen from preference.
Check installed versions before relying on unfamiliar APIs. This reference
describes ownership and failure tests rather than version-specific boilerplate.

## A complete component path

Start with semantic markup in reading order. Add intrinsic Grid/Flex sizing,
then a content-driven composition change. A split detail pane can become a
single selected view without deleting the selection or its return route.
Container constraints matter for embedded components; viewport width alone
may not describe their available space.

For asynchronous data, represent initial loading, usable content refreshing,
and failure distinctly. Keep previously useful content during refresh when
the product permits it. Match a response to the current request identity or
cancel obsolete work. A slow response to query A must not replace query B.
Preserve focus and valid input when validation fails.

## Framework-specific ownership

| Stack | Implementation decision | Useful failure test |
| --- | --- | --- |
| React | Derive display values during render; keep state at the smallest shared owner. Effects own subscriptions and external synchronization, with cleanup. | Reverse request completion order; unmount during a subscription. |
| Next.js | Follow the installed server/client boundary. Keep browser interaction in the smallest client subtree and use the existing route loading/error model. | Initial HTML, hydration and back navigation retain useful content. |
| Vue | Use computed values for derivation and explicit props/events for shared ownership. Keep imperative effects inside the component lifecycle. | Change a parent value while an interaction is active. |
| Svelte | Follow the version's actual reactive conventions; do not mix direct DOM mutation with framework ownership of the same property. | Reverse a transition and destroy its component before completion. |
| Astro | Keep reading content static and hydrate only islands needing interaction. Do not turn a whole article into an island for one control. | Reading and links work before optional interaction loads. |
| Nuxt | Respect server data, route and shared state lifetimes. Avoid duplicate browser fetches for already rendered data. | A fast route change cannot install stale data in the next route. |
| Nuxt UI | Inspect installed component props, slots and theme tokens before overriding internals. | Long slot content and keyboard input preserve generated semantics. |
| Angular | Keep form validity in the existing form model and view updates within the project's change-detection conventions. | Server validation and local correction clear only the relevant errors. |
| Laravel | Keep permissions and validation on the server; use existing template, session and error facilities. | An invalid submission preserves permitted input and displays actual errors. |
| HTML / Tailwind | Native elements supply behavior; utilities express existing tokens. Use logical properties where text direction matters. | Disable optional script and inspect the primary reading/navigation path. |
| shadcn | The copied component source is the runtime truth. Customize variants where shared behavior lives; retain its primitive's accessibility contract. | Dialog nesting, focus return and a disabled/loading state after customization. |

For React performance, first determine whether cost comes from component
updates, expensive computation, DOM size, asset loading or GPU rendering.
Stable identity and avoiding duplicate derived state come before blanket
memoization. Do not rebuild a scene or heavy editor on every render. A client
boundary is not a performance optimization by itself.

## Form recipe

Render persistent labels, requirements, inputs and the action in source order.
On failure, retain valid input, associate messages with fields and expose an
error summary when several errors would otherwise be hard to locate. Do not
use placeholder text as the only label or a disabled action as the only
explanation. Announce completion only after the real persistence contract is
satisfied; optimistic presentation needs an actual rollback path.

## Collection recipe

Choose paging, incremental retrieval or virtualization from the data size and
interaction. Keep selected identity separate from viewport position. Reused
rows must receive current labels, selection, action availability and accessible
names. For a virtualized table, verify the library's semantics rather than
assuming divs acquire table behavior from their visual alignment.

## Loading and assets

Delay genuinely optional heavy experiences such as 3D inspectors; do not
fragment a small ordinary interface into needless chunks. Reserve image and
video dimensions. Load fonts and hero assets according to their actual role,
not a rule that every asset should preload. Inspect fallback font metrics and
late-loading content for movement of controls under the pointer.

For animation, use [Motion recipes](motion-recipes.md). For captures and
regression evidence use [Inspection](inspection.md). Exercise the affected
interaction before claiming that the route's build result proves usability.
