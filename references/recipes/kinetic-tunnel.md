# Kinetic light tunnel

Use for a controllable sense of forward travel with structural wall panels,
emissive rails and a stable vanishing point. The baseline is a screen-space
polar field, not a traversable 3D environment.

## Working source

- [VELOCITY demo](../../samples/future/index.html#velocity).
- [Shader](../../samples/future/future.js): `tunnel`, the `velocity` action,
  and `u_pulse`; [styles](../../samples/future/future.css): `velocity` rules.
- Read the [shared graphics contract](../recipes.md#shared-graphics-contract).

## Construction

1. Aspect-correct screen coordinates around the desired vanishing point.
   Make a faceted radius from the maximum of two weighted absolute-coordinate sums.
2. Convert that radius to inverse depth. Clamp near the center before division
   so the singularity does not create unbounded coordinates.
3. Evaluate angular rails and depth rings as separate periodic functions.
   Move the depth phase with elapsed time to create forward movement.
4. Use the fractional angular/depth coordinates for panel seams, bevels and
   fine brushed variation. Keep these wall layers darker than the light rails.
5. Combine a broad low-intensity rail glow with a narrow bright core. Fade
   repeated detail into the center instead of displaying infinitely dense rings.
6. Drive speed from the intensity slider. A jump changes phase and raises a
   short-lived brightness pulse; it must settle back into ordinary travel.

Core coordinates, before color and panel shading:

```javascript
function tunnelCoordinates(x, y, time, drive, pulse = 0) {
  const radius = Math.max(Math.abs(x)*0.93 + Math.abs(y)*0.33,
    Math.abs(y)*0.93 + Math.abs(x)*0.33);
  const depth = 1.2 / Math.max(radius, 0.06);
  return { depth, phase: depth*5 - time*(1.3 + drive*8) - pulse*4 };
}
```

The angular field adds `0.1*sin(depth*0.18 + time*0.12)` to `atan(y,x)`.
Use GLSL's two-argument `atan` when transferring this core into the shader.

## Numerical starting points

| Quantity | Baseline |
| --- | --- |
| Drive | 0.38, range 0–1 |
| Rails | `(0.5+0.5*cos(angle*12))^110` |
| Rings | `(0.5+0.5*cos(phase))^32` |
| Panel coordinates | `(angle*6/PI, phase/(2*PI))` |
| Center-detail fade | `smoothstep(0.055,0.35,length(uv))` |
| Pointer influence | Add pointer ×0.05 to UV |
| Jump | Pulse set to 1; time advanced by 2.1 |
| Color treatment | Solar / Ion / Violet; output `color/(color+0.75)` |

## Acceptance and limits

- Pause: rails, panels and phase stop. A slider or jump may still update the
  image once. Reduced motion begins paused and does not hide the controls.
- Test drive at zero and maximum. Zero is the minimum speed, not stationary;
  the separate pause control stops motion.
- Inspect the center for shimmer and bright speckling. Reduce distant detail
  before increasing overall resolution or sharpening the image.
- If walls disappear, lower rail glow or restore panel contrast; more bloom
  cannot reveal structure that has been overexposed.
- Changing `time * speed` can jump phase. If smooth acceleration is required,
  integrate `phaseTravel += speed*dt` instead; that is an adaptation, not
  behavior already guaranteed by the reference.
- Do not reuse this as geometric collision, camera navigation or depth data.
