# Live graphics

Start by naming the visible cues that would make the requested subject
convincing. A scene can compile, animate, and still fail to depict its subject.

## Readability before rendering complexity

Establish silhouette, scale, camera, lighting, and depth. Inspect that simple
scene before layering materials and post-processing.

For water meeting a rocky coast, the cues may include waves traveling toward
the shore, shallower behavior near contact, foam that follows those contacts,
and coherent movement around obstacles. A repeated foam texture across open
water does not establish a shoreline.

For an object such as a boat, identify the hull, bow, stern, deck, and scale
cues needed by the camera. A detailed material cannot substitute for the
geometry that makes the object recognizable.

Use supplied visual references to resolve those cues. Do not claim physical
simulation when the implementation uses an artistic approximation.

## A renderer with explicit boundaries

Choose the path that matches the project and target. Simple UI decoration may
fit CSS or canvas; a spatial scene may need Three.js or another established
renderer; compute and custom pipelines may justify WebGPU.

Keep camera and controls, scene state, assets, simulation, and rendering passes
separable enough to identify where a defect originates. There should be one
animation loop with clear ownership of elapsed time.

Define units and coordinate spaces for every shader input. Know whether a
position, direction, or normal is in model, world, view, or tangent space.
Use a consistent linear-light workflow and apply output transformation once.

Inspect shader compilation and resource binding errors directly. An empty
canvas or an all-white frame is a failed visual result even if the page loads.

## WebGPU and shader work

Check the adapter features and limits the selected pipeline needs. Use the
project's existing compatibility path when a feature is absent; if none exists,
show an honest unsupported state rather than an unexplained blank surface.

In WGSL, make host buffer layout, alignment, binding declarations, and element
counts agree. Guard partial workgroups and screen-edge sampling where the
actual dispatch or texture dimensions require it.

For GLSL or WGSL materials, examine normals, roughness, light response,
transparency ordering, and exposure independently. Add bloom, blur, and color
treatment after the base image remains legible without them.

Treat resolution and device pixel ratio as memory and fill-rate decisions.
Resize render targets when needed and release superseded GPU resources.

## Simulations and temporal behavior

Separate simulation time from render time when frame variation changes the
result. Bound catch-up work after a pause. For iterative compute, use explicit
read/write ownership, such as alternating buffers, to avoid unintended
same-step dependencies.

Inspect fast motion, camera movement, and resizing for shimmer, trails, and
discontinuous state. Deterministic seeds help compare revisions, but they do
not demonstrate stability on every input.

For audio-reactive work, map a small set of measured envelopes or frequency
bands to deliberate visual roles. Smooth according to the effect, retain
headroom, and test silence and sudden transients. Handle audio activation
through the target platform's interaction requirements.

## Performance that preserves the subject

Measure the complete frame before optimizing a suspected pass. Separate CPU
submission, GPU work, asset upload, and sustained memory growth where the tools
allow it. Report target hardware, render resolution, and scene conditions.

Reduce costs in an order that preserves recognition: remove unnecessary work,
reduce the expensive pass's resolution or samples, then simplify detail that
the camera cannot read. Reinspect the image after changing the quality tier.

Judge the result in motion at its intended size. A screenshot cannot establish
stable frame pacing or believable shoreline interaction.
