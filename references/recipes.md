# Implementation recipes

Read one matching recipe, then inspect the named functions and markup in its
linked source. These are mechanisms extracted from working web demos, not
promises that an agent will reproduce a screenshot from a style name alone.

## Choose the mechanism

| Request or visible result | Recipe | Working example |
| --- | --- | --- |
| Liquid glass, refractive controls, lensing, frosted panels | [Liquid glass](recipes/liquid-glass.md) | [LUCENT](../samples/future/index.html#lucent) |
| Planet, atmosphere, cloud shadows, rings | [Orbital planet](recipes/orbital-planet.md) | [ORBIS](../samples/future/index.html#orbis) |
| Reflective sculpture, warped torus, liquid chrome | [Liquid metal](recipes/liquid-metal.md) | [MORPH](../samples/future/index.html#morph) |
| Refractive crystal, spectral edges, optical absorption | [Spectral crystal](recipes/spectral-crystal.md) | [CHROMA](../samples/future/index.html#chroma) |
| Connected nodes, depth projection, traveling signals | [Spatial network](recipes/spatial-network.md) | [SYNAPSE](../samples/future/index.html#synapse) |
| Light rails, infinite corridor, hyperspace motion | [Kinetic tunnel](recipes/kinetic-tunnel.md) | [VELOCITY](../samples/future/index.html#velocity) |
| Editorial spread, illustrated story, reading overlay | [Editorial spread](recipes/editorial-spread.md) | [OFF HOURS](../samples/index.html#edition) |
| Energy dashboard, period filters, synchronized chart and totals | [Energy dashboard](recipes/energy-dashboard.md) | [PULSE](../samples/index.html#pulse) |
| Product options, live finish, light level, selection summary | [Product configurator](recipes/product-configurator.md) | [FORM](../samples/index.html#form) |
| Clip selection, preview, playhead, transport, timeline | [Timeline workspace](recipes/timeline-workspace.md) | [CUTROOM](../samples/index.html#cutroom) |
| Animated contour field, layered line terrain, subtle parallax | [Contour landscape](recipes/contour-landscape.md) | [DRIFT](../samples/index.html#drift) |

## Use a recipe without cloning a whole demo

1. Match the requested behavior, not just a color or a fashionable label.
2. Read the recipe's source map. Inspect its named shader/functions, markup,
   and style selectors before extracting them.
3. Keep only the mechanism and controls needed for the requested product.
   The sample routers, fictional names and shared gallery chrome are optional.
4. Establish the listed baseline, then change composition, content and exposed
   parameters together. Recipe snippets illustrate cores; linked files contain
   the complete runtime and their dependencies.
5. Exercise the recipe's acceptance checks on the result. Distinguish a check
   you performed from one still needed on a real target device.

## Shared graphics contract

The six Future Studies share [future.js](../samples/future/future.js),
[future.css](../samples/future/future.css) and [index.html](../samples/future/index.html).
Five use a WebGL 1 full-screen triangle; Synapse uses Canvas 2D with 3D projection.
The current fragment shader dispatches on `u_mode`. Extracting a function alone
does not bring its uniforms, helpers, camera mapping or event loop with it.

For a standalone extraction, keep one canvas, native DOM controls, the selected
renderer, its dependencies, and one animation owner. Wire range inputs to state
and uniforms, and render immediately after manual changes, even while paused.
Keep shader compilation/link failures visible. Synapse is a separate usable
example without WebGL, not an automatic equivalent renderer for the other scenes.

Baseline buffer scale is `min(devicePixelRatio, 1.5, sqrt(budget / (w*h)))`,
with a 650,000-pixel budget below 680 CSS pixels and 1,400,000 otherwise. The
loop targets at most 30 updates/second and clamps a time step to 0.1 seconds.
These are example limits, not a measured FPS guarantee. Stop scheduling when
hidden or paused; start paused for reduced motion. Reset elapsed-time history
on resume so a hidden tab does not produce a large jump.

Map DOM and framebuffer coordinates explicitly. Use the actual buffer/CSS
size ratio, not an assumed device pixel ratio. Recompute geometry on resize.
The example keeps `preserveDrawingBuffer` enabled for pixel comparison tests;
it is not a universal production-performance recommendation.

The existing output curve and studio functions are artistic. If moving a
recipe into a color-managed renderer, use that renderer's linear-light and
output pipeline once; do not stack the demo's grading on top blindly.

## Validation already available

[Future Studies tests](../tests/future.test.mjs) exercise six scenes at 1440×1050
and 390×844, pixel changes from controls, inspection mode, and motion behavior.
[Earlier collection tests](../tests/samples.test.mjs) cover five layouts,
dialogs, filtering, configuration, playback, and contour motion.

They use an existing Playwright installation through
`MAHARAJAHUL_BROWSER_PROJECT`; they skip explicitly when it is absent.
These are tests of the reference implementations. Reusing a recipe still
requires checking the new implementation; it does not inherit a test pass.

Recipe lookup and local links are checked by [lookup tests](../tests/test_lookup.py).
Small portable algorithm examples are exercised by [recipe tests](../tests/recipes.test.mjs).
