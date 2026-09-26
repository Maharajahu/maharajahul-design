# Spectral crystal

Use for a suspended cut object with changing internal views, restrained color
separation and stronger reflections at grazing angles.

## Working source

- [CHROMA demo](../../samples/future/index.html#chroma).
- [Renderer](../../samples/future/future.js): mode-4 `shape`, `normalAt`,
  the glass branch of `objectScene`, `glassRoom` and `studio`.
- [Styles](../../samples/future/future.css): light `chroma` palette and inspection.
- Read the [shared runtime](../recipes.md#shared-graphics-contract).

## Construction

1. Build a closed, rounded octahedral distance estimate. The sample uses
   `sqrt(p*p*vec3(1,0.4356,1)+0.005)` before summing components, elongating Y.
2. Find the entry surface with the primary ray march and compute its normal.
3. Refract the incoming direction with the air-to-glass ratio. Move the origin
   slightly inside the object, then march through its interior to the exit.
4. Compute the exit normal and refract with the glass-to-air ratio. Detect a
   zero transmitted vector; use the reflected direction for the sample's
   simplified total-internal-reflection treatment.
5. Sample the environment in slightly separated directions for R, G and B.
   Attenuate by interior path length, then blend with the surface reflection.
6. Add edge polishing and a small spectral treatment last. An opaque rainbow
   gradient with no changing transmitted view does not reproduce the effect.

Thickness attenuation core:

```javascript
function attenuateGlass(rgb, absorption, distance) {
  return rgb.map((channel, i) => channel * Math.exp(-absorption[i] * distance));
}
```

This is one part of the optical calculation, not a color filter that replaces
entry/exit refraction. Keep ray and normal directions in the same coordinate space.

## Numerical starting points

| Quantity | Baseline |
| --- | --- |
| Shape | `(sum(roundedCoordinates)-1.30)*0.5` |
| Camera Z / focal term | 5.9 / 2.35 |
| Dispersion control | 0.63, range 0–1 |
| Index of refraction | `1.35 + 0.22*control` |
| Interior start / initial travel | Entry minus normal ×0.015 / 0.02 |
| Interior march | At most 44 steps; step `max(-distanceEstimate*0.9,0.008)` |
| Spectral direction spread | `0.015 + 0.17*control` |
| Default absorption | `(0.11,0.06,0.08)` |
| Fresnel-like term | `0.045 + 0.955*(1-facing)^4` |

Spectrum, Glacier and Rose vary absorption. The control couples spread and IOR
in this artistic sample; separate them if the product needs independent
material density and dispersion controls.

## Acceptance and limits

- Rotate the object: its interior and edge response must change with viewing
  direction. Uniform opacity or color alone is not enough.
- A longer path through the same material must not become brighter from
  absorption. Check that distances stay positive and attenuation stays bounded.
- Inspect the silhouette and normals at all orientations. When adapting the
  geometry, track whether the capped interior march actually reached an exit;
  choose a visible fallback instead of treating an unfinished march as valid.
- Reduce spectral spread if colored fringes dominate the material. Keep one
  recognizable transmitted environment and a controlled reflection hierarchy.
- The reference is a single-entry/exit approximation with heuristic highlights.
  It does not compute multiple internal bounces, physical caustics or true
  wavelength-dependent ray tracing. Preserve that distinction when describing it.
