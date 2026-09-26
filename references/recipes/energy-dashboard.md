# Energy dashboard with synchronized chart state

Use for a small operational overview: a clearly scoped metric, a period
comparison and an action with observable feedback.

## Working source

- [PULSE demo](../../samples/index.html#pulse).
- [Markup](../../samples/index.html): `#pulse`, `.energy-grid`, SVG chart,
  `.segmented`, `#charging` and its live feedback text.
- [Behavior](../../samples/app.js): `energy`, `updateEnergy`, charging toggle.
- [Styles](../../samples/styles.css): `pulse`, chart and battery rules.

## Construction

1. Define the time buckets and units before chart styling. The sample has 12
   two-hour intervals, with values in kWh per interval, not instantaneous kW.
2. Keep one selected dataset. Derive the line, area, total, peak interval,
   accessible chart title and pressed-state buttons from that same array.
3. Draw the chart in a fixed SVG viewBox so it scales with the layout. Keep
   textual units and period labels outside the marks as well as in the title.
4. Place a secondary battery card beside it, with percentage both as text and
   a ring. Below 680 px, use one main column and a compact horizontal battery card.
5. Make the charging toggle update its pressed state and a nearby live status.
   The reference is a local demonstration; it never contacts a physical charger.

Shared data summary core:

```javascript
function summarizeIntervals(values, hoursPerBucket = 2) {
  if (!values.length) return { total: 0, peak: null, peakHour: null };
  const peak = Math.max(...values);
  return { total: values.reduce((sum,value)=>sum+value,0),
    peak, peakHour: values.indexOf(peak)*hoursPerBucket };
}
```

The example chooses the first maximum when peaks tie. For other data semantics,
label the chosen rule or present all tied periods rather than silently implying
uniqueness.

## Starting values

| Element | Baseline |
| --- | --- |
| Main layout | `minmax(0,2fr) minmax(230px,1fr)`; 18 px gap |
| Chart viewBox | 680×210 |
| Point mapping | `x=i*680/11`; `y=190-value*54` for the supplied 12-value datasets |
| Area path | Close to y=210; use the same points as the line |
| Today / yesterday totals | 12.4 / 16.0 kWh from the supplied arrays |
| Battery | Illustrative fixed 72%; 165 px ring, 153 px inner circle |
| Sample charging interval | 00:00–02:00, 6.8 kWh planned; explicitly no device connected |

The fixed Y scale fits the reference datasets. For live values, use a shared
domain across compared periods or visibly label a changing domain. Do not
silently clip larger values or compare differently scaled charts as equal.

## Acceptance and adaptation

- Toggle periods: chart points, total, peak, accessible description and active
  button all change together. Summing the array must reproduce the shown total.
- Preserve the distinction between kWh per bucket and a power reading. No data
  means unavailable, not automatically zero consumption.
- The stored-energy card is independent illustrative data; changing the chart
  period must not imply a real battery measurement or forecast.
- Toggle charging twice and inspect both feedback states with keyboard access.
  A real integration needs confirmed scheduling, pending/error feedback and
  actual device status; the local boolean is not a production backend.
- At phone width, keep the period buttons and the action accessible without
  horizontal scrolling. Color must not be the only indication of selection.
