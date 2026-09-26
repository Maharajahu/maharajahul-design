# Animated contour landscape

Use for a low-dependency generative background with legible ridge lines,
depth ordering and a small amount of pointer influence.

## Working source

- [DRIFT demo](../../samples/index.html#drift).
- [Renderer](../../samples/app.js): `resizeField`, `drawField`, `fieldButton`,
  the relief/palette controls and the shared `schedule`/`tick` functions.
- [Layout](../../samples/styles.css): `drift` rules and its phone controls;
  [markup](../../samples/index.html): `#terrain` and `.drift-controls`.

## Construction

1. Size the Canvas 2D buffer separately from its CSS size and set the context
   transform once after each resize. Draw in CSS-pixel coordinates.
2. Draw contour rows from far to near. At each horizontal sample, combine a
   broad Gaussian hill envelope with two differently phased sine waves.
3. Increase row displacement, stroke opacity and thickness with depth. Keep
   spacing recognizable; increasing amplitude without adjusting spacing
   quickly turns the terrain into tangled wires.
4. Accumulate an independent field time only when this scene is visible and
   unpaused. Shift the hill center slightly with the pointer; avoid moving
   the content layer together with it.
5. Add a horizontal shade over the copy side. Let the terrain remain brighter
   where the main ridge is visible, not directly behind every line of text.
6. Bind relief, palette and pause to actual state. Draw immediately after a
   manual relief/palette change, including while animation is paused.

The reference's height calculation, normalized by canvas height:

```javascript
function contourY(x, depth, time, relief, pointer = 0) {
  const hill = Math.exp(-Math.pow((x - 0.67 - pointer*0.04)*3, 2));
  const ridge = Math.sin(x*8 + depth*4 + time)*0.65
    + Math.sin(x*15 - depth*3 - time*0.7)*0.22;
  return 0.42 + depth*0.45 - hill*(ridge+0.9)*relief/420*(0.45+depth);
}
```

Multiply by canvas CSS height before drawing. In the reference, `time` here
is `state.fieldTime*0.24`; `x` and `depth` are normalized to 0–1.

## Numerical starting points

| Quantity | Baseline |
| --- | --- |
| Rows / horizontal samples | 54 /116 points per row |
| Relief | 55, exposed range 10–90 |
| Buffer scale | `min(devicePixelRatio,1.75)` |
| Stroke alpha | `0.12 + depth*0.57` |
| Stroke width | `0.7 + depth*0.6` CSS px |
| Ember / Tide | RGB `(231,171,109)` / `(142,205,194)` |
| Background | `#142025`; copy-side shading fades over 60% of width |

## Acceptance and adaptation

- Pause and wait: pixels stay unchanged. Change relief while paused: the
  terrain updates once and remains stable again. Resume must not jump by the
  time spent hidden or paused.
- At high relief and phone width, inspect contour spacing and clipping rather
  than increasing line count automatically. Keep the headline readable.
- Resize repeatedly: line width remains in CSS-pixel units and does not
  multiply each time. Reset the canvas transform after setting buffer dimensions.
- The sample ignores pointer movement while paused; do not promise interactive
  parallax in that state unless implementing it deliberately.
- This is a layered 2D field, not a terrain mesh, height-map export or physical
  wave simulation. Use a geometric renderer if the brief requires a free camera.
