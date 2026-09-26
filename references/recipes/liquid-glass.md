# Liquid glass interface

Use for rounded controls that visibly bend a background while keeping labels
crisp. This is screen-space lensing, not simply a translucent blurred card.

## Working source

- [LUCENT demo](../../samples/future/index.html#lucent).
- [Renderer](../../samples/future/future.js): `roundedPanel`, `liquidGlass`,
  `landscape`, the `render` branch for `lucent`, and `glassRects`/`glassRadii`.
- [Markup](../../samples/future/index.html): `#glass-interface` and five `.glass-pane` elements.
- [Styles](../../samples/future/future.css): `.glass-pane`, `.glass-main`,
  `.glass-scenes`, and the `lucent` responsive rules.
- Read the [shared graphics contract](../recipes.md#shared-graphics-contract).

## Build in this order

1. Render a background with recognizable edges. The sample generates sand
   ridges and a coast in `landscape`; a flat gradient hides the lensing.
2. Place real HTML buttons, labels and ranges over that canvas. Keep text out
   of the optical pass. Start with one glass panel before adding the five-panel UI.
3. Measure each panel relative to the canvas container. Upload center, half-size
   and border radius in framebuffer pixels, with the vertical axis flipped.
4. Evaluate a rounded-rectangle signed distance. Inside the rounded bevel,
   displace the background sampling coordinate along the edge normal. Add a
   smaller center magnification. Sample the background again at that coordinate.
5. Add slight RGB separation at the rim, soft scattering, a directional edge
   highlight and a displaced shadow. Keep the center relatively calm for text.
6. Update pointer position, depth, finish, daylight and brightness through
   state. Re-measure if layout changes; a CSS transform without a matching
   optical silhouette makes the glass appear detached from its controls.

The coordinate conversion can be kept independently of the renderer:

```javascript
function panelToBuffer(rect, stage, bufferWidth, bufferHeight) {
  const sx = bufferWidth / stage.width;
  const sy = bufferHeight / stage.height;
  return [
    (rect.left - stage.left + rect.width / 2) * sx,
    (stage.height - (rect.top - stage.top + rect.height / 2)) * sy,
    rect.width * sx / 2,
    rect.height * sy / 2,
  ];
}
```

The rounded-box core used by the shader:

```glsl
float roundedPanel(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}
```

Let `d` be this signed distance, `g` the depth control in `[0,1]`, and `s` the
buffer/CSS scale. The sample uses `bevel = (12 + 20*g)*s`,
`edge = 1-smoothstep(0, bevel, -d)`, and an edge displacement magnitude of
`pow(edge,1.4)*(8+28*g)*s`. Divide pixel offsets by framebuffer dimensions
before adding them to UVs. Orient the edge normal toward the nearest side or
rounded corner; normalizing the vector from the panel center alone gives
incorrect refraction along long straight edges.

## Baseline and controls

| Parameter | Reference value | Visible effect |
| --- | --- | --- |
| Glass depth | 0.64, range 0–1 | Wider bevel and stronger lens displacement |
| Main panel radius | 36 CSS px; 32 on phone | Rounded lens silhouette |
| Four-sample scattering radius | 1 px clear; 5.5 px frosted, scaled to buffer | Local softening, not a full Gaussian blur |
| RGB separation | Up to `1.3*g*s` pixels at the rim | Restrained chromatic edging |
| Transmitted intensity | 0.89 clear/frosted; 0.62 smoked | Body brightness |
| Brightness | 0.78, range 0.25–1 | Actual generated environment brightness |
| Daylight | Dawn / Dusk / Night | Changes the underlying scene, not just button color |

The reference uploads five rectangles. Adding a sixth panel requires changing
the shader array/loop and host arrays together, checking uniform limits, and
updating hit geometry. Overlapping glass panels currently sample the original
background, not recursively refracted layers.

## Adaptation and failure checks

- For an image or 3D background, sample a texture/render target instead of
  calling `landscape`. Clamp image UVs or define edge behavior explicitly.
  This shader cannot see arbitrary HTML, an iframe, or a video behind the canvas
  automatically. A CSS `backdrop-filter` fallback is a different, non-refractive treatment.
- Keep text contrast readable at Dawn and Night, and at both brightness ends.
  If necessary, add a quiet tint behind text rather than increasing every highlight.
- Inspect at 390 px and after scrolling: panel edges and controls must coincide.
  For long phone layouts, a sticky gallery bar must not cover the glass controls.
- Freeze animation, then change depth and finish: the background edge must move
  inside the panel. A border-only change or plain blur does not pass.
- Move across an edge, use the keyboard controls, resize, and toggle pause from
  both locations. Optical geometry and displayed state must stay synchronized.

This is an original web interpretation, not Apple's native material. The
reference uses a generated background and heuristic optics; it is not physical
glass, arbitrary-DOM refraction or a verified iPhone GPU-performance claim.
