# Product configurator with live material controls

Use when an object has a small number of meaningful visual options and a
selection summary. The reference is an SVG product illustration, not a 3D model.

## Working source

- [FORM demo](../../samples/index.html#form).
- [Markup](../../samples/index.html): `#lamp-art`, `.lamp-finish`,
  `.finishes`, `#brightness`, `#review-lamp` and `#detail-dialog`.
- [Behavior](../../samples/app.js): `finishes`, finish change, brightness input,
  and configuration review handlers.
- [Styles](../../samples/styles.css): `product-grid`, `lamp-stage`, `form`.

## Construction

1. Build a recognizable silhouette before its material treatment. The lamp has
   a shade, underside, stem, base, cable, contact shadow and light pool.
2. Give all material-bearing surfaces the same fill variable. Layer highlight
   and shade gradients separately, so changing color preserves volume cues.
3. Use a native radio group for mutually exclusive finishes. Bind the selected
   radio, material variable and visible finish label to the same change event.
4. Bind a range to the light-pool opacity and numeric output. Update both on
   `input`, not only when the pointer is released.
5. Generate the review summary from current controls, not from initial copy.
   Open it in the shared native dialog and preserve the selections on close.
6. On phone, stack the object above the configuration. Keep every radio label
   clickable and the review action visible after the options.

Minimal light mapping, for an input declared with min=0 and max=100:

```javascript
function lampAppearance(percent) {
  const value = Math.max(0, Math.min(100, Number(percent)));
  return { opacity: value/100, label: value+'%' };
}
```

Assign the opacity to the halo layer only, not to the whole object. Otherwise
lowering the light level makes the lamp body disappear.

## Starting values

| Element | Baseline |
| --- | --- |
| Product art | SVG 640×650; up to 585 px tall desktop, 410 px phone |
| Desktop layout | `1.15fr 1fr`, 7% gap; one column below 680 px |
| Finishes | Terracotta `#ae6046`, Chalk `#e2dbc8`, Graphite `#454a44` |
| Light level | 70%; range 0–100 |
| Main halo | Ellipse centered at (320,448), radii 205×141 |
| Contact shadow | Ellipse at (334,555), radii 177×27 |
| Review content | Object name, selected finish, current light percentage |

## Acceptance and adaptation

- Test all finishes at 0%, 70% and 100% light. Material-bearing parts should
  remain coherent, with readable highlight and shadow even on the light finish.
- Change options, open review, close, change again and reopen. The summary
  must reflect the current selection; closing must not silently reset it.
- Verify keyboard radio navigation and range keys, not just colored swatches.
- The sample price is a concept price, with no checkout. Replace it with real
  product data only when that data is supplied; do not infer purchasability.
- State lasts until reload. Adding persistence, ordering or inventory requires
  explicit product behavior; none is supplied by the illustrated configurator.
