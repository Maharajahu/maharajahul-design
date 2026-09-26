# Timeline workspace and synchronized preview

Use for a lightweight sequence inspector with selectable clips, transport and
scrubbing. CUTROOM plays four vector scene states, not actual video files.

## Working source

- [CUTROOM demo](../../samples/index.html#cutroom).
- [Behavior](../../samples/app.js): `scenes`, `syncPlayback`, transport handlers,
  `schedule`, `tick` and `selectStudy`.
- [Markup](../../samples/index.html): `.clip-bin`, `#scene-preview`,
  `.transport`, `#playhead`; [styles](../../samples/styles.css): `cutroom` rules.

## Construction

1. Keep one time value, one playing flag and a scene list. Derive the active
   clip, preview treatment, caption, timecode, slider and pressed states together.
2. Arrange clip selection beside a 16:9 preview; place the timeline below.
   Use actual buttons and a native range rather than a canvas-only toolbar.
3. Selecting a clip seeks to its start. Scrubbing changes the same time state.
   Neither path should create an independent animation loop.
4. On play, reset to zero only if already at the sequence end. On rewind,
   explicitly reset time and stop. At the end, stop on the final valid scene.
5. Schedule frames only while this workspace is active, visible and playing.
   Reset the last timestamp when resuming; clamp elapsed time to avoid jumps.
6. On phone, put the preview first and the clip buttons in a two-column group
   underneath, followed by the timeline and its text label.

Time-to-scene core for equal-duration clips:

```javascript
function sequencePosition(time, count = 4, duration = 4) {
  const end = count * duration;
  const clamped = Math.max(0, Math.min(end, time));
  return { time: clamped, index: Math.min(count-1, Math.floor(clamped/duration)),
    ended: clamped === end };
}
```

The final clamp prevents time=16 from selecting a nonexistent fifth scene.
For unequal durations, replace division with cumulative clip boundaries.

## Numerical starting points

| Element | Baseline |
| --- | --- |
| Scenes / sequence | 4 scenes ×4 seconds =16 seconds |
| Preview art | SVG 960×540; 16:9 frame |
| Desktop columns | 190 px clip bin + remaining preview; 26 px gap |
| Scrubber | 0–16 seconds, step 0.05 |
| Maximum elapsed step | 0.1 second |
| Scene treatments | Dawn, noon, dusk, night |
| Timecode announcement | `aria-live="off"`, not a live announcement each frame |

## Acceptance and limits

- Seek to 0, 3.95, 4, 8, 12 and 16 seconds. The active clip, caption, palette
  and displayed frame index must agree with the playhead at every boundary.
- Play, scrub while playing, pause, rewind, and play from the end. Verify there
  is still only one active loop and no hidden/background progress jump.
- Leaving the study stops playback. Reduced-motion users are not forced into
  autoplay: explicit transport controls retain access to the sequence.
- Do not label the vector preview as decoded video, rendering/export progress
  or an NLE backend. Adding media decoding and export is a separate implementation.
- Keep the preview and transport visible on phone; do not preserve a desktop
  sidebar at the cost of an unreadably small monitor.
