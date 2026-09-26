# Orbital planet and rings

Use for an inspectable planetary hero with a lit surface, atmosphere and rings
that visibly pass both behind and in front of the sphere.

## Working source

- [ORBIS demo](../../samples/future/index.html#orbis).
- [Renderer](../../samples/future/future.js): `planet`, `terrain`, `noise`,
  `stars`; `u_mode == 0`, the `orbis` state and sun-angle control.
- [Layout](../../samples/future/future.css): `.world-content`, `.scene-vignette`,
  and `body[data-world=orbis]`; [shared runtime](../recipes.md#shared-graphics-contract).

## Construction

1. Form a camera ray and analytically intersect a sphere. Retain its nearest
   positive hit distance for later ring occlusion. The normal is normalized
   sphere position; rotate the texture coordinates separately from lighting.
2. Use low-frequency 3D noise for continents and a higher-frequency field for
   surface variation. Blend ocean, land and polar colors before illumination.
3. Put clouds in a separate noise field. Sample an offset cloud field for a
   cheap shadow mask, then shade the combined surface with the sun direction.
4. Add a narrow atmosphere on the silhouette and a small ocean specular lobe.
   Gate night lights by land, cloud cover and the dark side of the terminator.
5. Intersect a tilted plane for the rings. Keep samples only in an annulus and
   only when their ray distance is nearer than the sphere hit. Add radial bands,
   gaps and a shadow approximation after the depth relationship is correct.

Portable sphere-intersection core, for a sphere centered at the origin:

```javascript
function sphereHit(ro, rd, radius) {
  const b = ro[0]*rd[0] + ro[1]*rd[1] + ro[2]*rd[2];
  const c = ro[0]**2 + ro[1]**2 + ro[2]**2 - radius**2;
  const h = b*b - c; // rd must have unit length
  if (h < 0) return null;
  const near = -b - Math.sqrt(h), far = -b + Math.sqrt(h);
  return near > 0 ? near : far > 0 ? far : null;
}
```

For the rings, use `t = -dot(ro, planeNormal) / dot(rd, planeNormal)`.
When adapting the camera, reject a near-zero denominator and non-positive
distance before constructing the ring position.

## Numerical starting points

| Quantity | Baseline |
| --- | --- |
| Sphere radius / camera Z | 1.12 / 5.0; inspection subtracts 0.85 from camera Z |
| Ray focal term | `normalize(vec3(uv,-2.45))` |
| Terrain octaves | 6; initial weight 0.55, frequency ×2.04, amplitude ×0.48 |
| Continents / relief / clouds | Coordinate scales 3.8 / 38 / 9 |
| Land transition | `smoothstep(0.481,0.494,continental+0.035*relief)` |
| Ring radii / normal | 1.42–1.98 / normalized `(0.25,0.90,0.35)` |
| Main ring gap | Radius 1.72 |
| Sun control | Default 40%; azimuth `value/100 * PI` |

Change large shapes before high frequencies. If moving to photographic planet
textures, replace the texture evaluation without changing the ray-distance
comparison. This baseline is an invented world, not Earth imagery or an
astronomically calibrated system.

## Acceptance checks

- At the default camera, the rear rings disappear behind the sphere and the
  front rings remain visible. Fix hit ordering before changing opacity.
- Move the sun through its range: day/night shading and specular response must
  move without rotating the continent map along with the light.
- Inspect at phone resolution: dense ring bands can shimmer or form moiré.
  Reduce high-frequency bands or filter them before simply adding more samples.
- Verify a readable silhouette at every palette and a working exit from
  inspection. Clouds must not erase all land/ocean separation.
- The cloud and ring shadows are artistic approximations. A bright rim is not
  evidence of volumetric scattering, weather simulation or physical accuracy.
