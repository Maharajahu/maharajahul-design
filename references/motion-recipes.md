# Motion recipes

Choose a pattern by the state change it explains. These are implementation
starting points, not a command to animate every element. Working scene
examples are indexed in [Implementation recipes](recipes.md).

## Pick the owner and budget

| Situation | Mechanism | Starting timing |
| --- | --- | --- |
| Press or selection feedback | CSS state, native transition | 90–140 ms |
| Panel changes context | CSS or Web Animations API | 180–300 ms |
| Reordered items need continuity | FLIP transforms using stable item identity | 220–340 ms |
| A section narrates progress | Existing scroll timeline or animation library | Progress-controlled, not a fixed timer |
| Spatial subject changes view | The scene's single render loop | 350–600 ms, then inspect comfort |

These ranges are tuning seeds. Keep application feedback prompt even when an
expressive scene has a slower transition. Do not make a network response wait
for an animation. Use the project's existing Motion, GSAP or native animation
system where it already owns those elements. A library is not needed for a
simple CSS transition. For authored Lottie/dotLottie assets, retain their player
lifecycle, failure image and pause path; an exported timeline is not UI state.

## A panel that can change direction

1. Give application state ownership of open/closed; animation only presents it.
2. Read the current rendered opacity/transform before cancelling the old
   animation, then animate from that sampled state to the new target.
3. Apply the durable final style outside the temporary animation. Remove the
   animation after completion so a retained fill does not override later CSS.
4. Only the current transition may remove the panel or restore focus. Check
   its identity in completion handlers; an older completion must not close a
   panel reopened by newer input. Handle cancelled `finished` promises.
5. For reduced motion, skip travel and apply the requested state immediately.

Changing opacity does not change keyboard reachability. A closed panel needs
appropriate hidden/inert semantics. A modal needs an actual modal boundary;
prefer a native dialog and preserve its focus behavior. Verify open → close →
open before the first transition completes, plus navigation during closing.
API behavior: [Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate).

## Reordering without layout animation on every frame

Use FLIP only when visible continuity helps:

1. Record all visible item rectangles using stable keys (First).
2. Commit the new order and read the final rectangles as one batch (Last).
3. For each surviving item compute `dx = first.x - last.x` and the corresponding
   `dy`; invert with a temporary transform and animate back to identity (Play).
4. Use a wrapper when the item already has a transform owner. For dimension
   changes, avoid scaling readable text if a translation-only treatment works.
5. Restore actual DOM reading order; transforms do not repair semantics.

Handle entering/exiting items separately and preserve selection by key.
On an interrupted reorder, measure the current visual positions before
cancelling. Do not use array indices as identity or animate hundreds of
offscreen rows. In reduced motion, commit the new order and retain focus.

## Scroll scenes and staged entrances

Keep progress clamped to 0–1 and define the actual start/end boundaries from
content, not a guessed screen height. A full layout after fonts or media load
can change those boundaries. Use a platform timeline or existing library
instead of creating a permanent scroll-driven layout/read/write loop.

For a short group, start with 25–45 ms stagger and cap the whole arrival near
300 ms; a list of 100 items must not accrue seconds of animation debt. Important
content exists in its resting state before script runs. Do not make `.js`
failure leave the page transparent. In reduced motion, show the same content
without travel or pinning. Never require precise scrolling to reach a link.

## Continuous easing without frame-rate drift

For noncritical ambient follow, exponential smoothing is independent of frame
subdivision when the target is constant. `dt` and `tau` are seconds; `tau` is
positive. Use direct input for precision dragging, where lag hurts control.

```javascript
function followValue(current, target, dt, tau) {
  return target + (current - target) * Math.exp(-dt / tau);
}
```

Begin with `tau = 0.10` for a soft follower and inspect on the target device.
Pause hidden ambient loops, clamp the resumed frame interval, and snap to the
requested state for reduced motion. In a scene, update uniforms through the
existing clock rather than starting another `requestAnimationFrame` chain.

## Verification boundary

Inspect one intermediate frame, the resting state, rapid reversal, keyboard
focus during exit and the reduced-motion equivalent. A smooth final capture
does not prove interruption or cleanup. Dispose observers, animation handles
and event listeners with the owner; do not leave temporary `will-change` on
every control indefinitely.
