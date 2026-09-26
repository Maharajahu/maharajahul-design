# Spatial network and traveling signals

Use for a readable rotating node structure with depth, local connections and
visible signal activity. Canvas 2D is sufficient for this small projected network.

## Working source

- [SYNAPSE demo](../../samples/future/index.html#synapse).
- [Implementation](../../samples/future/future.js): `vertices`, `edges`,
  `renderNetwork`, and the `synapse` action branch.
- [Styles](../../samples/future/future.css): `synapse` palette and layout.
- Use the animation and resize rules in the [shared contract](../recipes.md#shared-graphics-contract).

## Construction

1. Create a 5×5×5 lattice at 0.48-unit spacing. Connect only positive X, Y and
   Z neighbors, so each undirected edge is stored once: 125 nodes, 300 edges.
2. Rotate X/Z, tilt Y/Z, then apply perspective. Keep unprojected depth for
   ordering and visual intensity. Projection alone does not provide occlusion.
3. Draw a dark field and faint ground rings. Stroke each selected connection
   with a wide low-alpha glow and a narrow, brighter core.
4. Draw nodes far-to-near with perspective-scaled radius and a small shaded
   sphere gradient. Reserve large halos for a subset so the structure stays readable.
5. Animate a short segment along edges. A signal action raises a pulse envelope;
   decay it with elapsed time, not a fixed amount per frame.
6. Derive the displayed active-edge count from the same selection used to draw.

Perspective and segment cores, after rotation into camera space:

```javascript
function projectNode(point, center, radius, focal = 3.6) {
  const scale = focal / (focal + point[2]);
  return { x: center[0] + point[0]*radius*scale,
    y: center[1] + point[1]*radius*scale, depth: point[2], scale };
}
function edgePoint(a, b, t) {
  return [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t];
}
```

These functions assume the reference camera range; clip points approaching
`depth == -focal` when adapting to arbitrary geometry.

## Baseline and controls

| Quantity | Reference value |
| --- | --- |
| Yaw / tilt | `time*0.13 + 0.5 + pointerX*0.65` / `0.38 + pointerY*0.35` |
| Perspective focal distance | 3.6 |
| Connectivity | 66%; select if `(edgeIndex*73 % 301)/301 <= 0.12+0.88*value` |
| Node radius | `1.1 + 1.45*projectedScale` CSS px |
| Larger halos | Every seventh node |
| Idle / active packet phase speed | 0.27 / 1.8 per second |
| Pulse decay | 0.32 per second, clamped at zero |
| Palette | Emerald / Ultraviolet / Amber |

Here `value` is normalized to 0–1. The minimum connectivity intentionally
retains about 12% of edges; it does not mean an empty graph. Remove that floor
if a real application defines zero connectivity literally.

## Acceptance and adaptation

- Verify 125 nodes and 300 unique edges before rendering. Increasing lattice
  size changes neighbor strides; do not keep `+5` and `+25` for another dimension.
- Check depth by rotation: front nodes grow while distant nodes shrink. If
  all nodes look equally bright, reduce background grid and rear-edge contrast.
- Activate a signal while moving the pointer and while paused. Labels and
  controls must remain usable; manual activation still renders a changed state.
- At 100% connectivity, the count is 300. At lower settings, count selected
  edges rather than estimating the number from a percentage.
- The packet animation is decorative, not a network simulator, inference trace
  or real neural activity. A live-data version must connect phase and topology
  to actual events and state.
