# Liquid metal sculpture

Use for a smoothly deforming chrome-like object whose shape is revealed by
reflected studio lights, rather than by a glow painted around its edge.

## Working source

- [MORPH demo](../../samples/future/index.html#morph).
- [Renderer](../../samples/future/future.js): `objectPoint`, mode-1 `shape`,
  `normalAt`, `studio`, and the non-glass branch of `objectScene`.
- [Styles](../../samples/future/future.css): `morph` rules and inspection state.
- Use the [shared runtime](../recipes.md#shared-graphics-contract).

## Construction

1. Start with a torus distance estimate. Rotate its coordinates, then twist
   `p.xy` as a function of `p.z`. The surface-tension control changes twist.
2. March from the camera along a ray until near the surface or outside the
   distance/iteration budget. The warped field is not guaranteed to remain a
   conservative signed distance; small steps help but do not prove safety.
3. Estimate the surface normal with central differences along all three axes.
4. Reflect the view ray about that normal. Use the reflected direction to
   evaluate `studio`: broad neutral regions, bright softboxes, a dark panel,
   colored side lights and a thin horizon strip.
5. Add subtle normal grain and surface variation only after the broad
   reflections describe curvature. Probe the distance field along the normal
   for a cheap local occlusion approximation, then apply the output curve once.

Distance-estimate core, after `objectPoint` has applied the global rotation:

```glsl
p.xy = turn(-0.35) * p.xy;
p.xy = turn(p.z * (0.4 + u_value * 2.7)) * p.xy;
float d = length(vec2(length(p.xz) - 0.88, p.y)) - 0.31;
d += 0.026 * sin(p.x*7.0 + u_time*0.6) * sin(p.y*9.0) * sin(p.z*6.0);
```

`turn` is the shared 2D rotation helper. This fragment is the shape calculation,
not a complete shader; keep the camera, marcher and normal calculation.

## Numerical starting points

| Quantity | Baseline |
| --- | --- |
| Major / tube radius | 0.88 / 0.31 world units |
| Tension | 0.48, range 0–1 |
| Camera Z / focal term | 4.7 / 2.35; inspection moves 0.8 closer |
| Primary march | At most 84 steps; multiply estimate by 0.70 |
| Hit epsilon / minimum step / far limit | 0.0015 / 0.0008 / 8.5 |
| Normal finite-difference offset | 0.002 |
| Grain coordinate scale / perturbation | 190 / 0.012 |
| Occlusion probes | 0.15 and 0.32 along the normal |

Chrome, Opal and Obsidian alter reflected color. They are artistic treatments,
not measured metal optical constants. A dark material still needs a broad
light source to communicate its curvature.

## Adaptation and acceptance

- For a different sculpture, replace the distance estimate first and tune
  camera distance before reusing the reflection environment.
- If holes, sparkling silhouettes or skipped lobes appear at high tension,
  inspect marcher overshoot and normal stability. Raising bloom hides neither.
- If it looks plastic, inspect the size and contrast of the reflected lights
  before increasing microdetail. If it turns white, reduce light/output exposure.
- Test both tension extremes, all finishes, slow rotation, and inspection exit.
  Keep the outline legible without relying on the headline or the label.
- This path has environment reflections and local occlusion approximations;
  it has no scene-wide ray-traced reflections or fluid simulation.
