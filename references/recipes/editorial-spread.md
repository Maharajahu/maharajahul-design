# Editorial spread with reading overlay

Use for a journal, cultural story or illustrated feature where typography,
image placement and the reading transition carry the identity.

## Working source

- [OFF HOURS demo](../../samples/index.html#edition).
- [Markup](../../samples/index.html): `#edition`, `.edition-grid`, `.city-art`
  and the shared `#detail-dialog`.
- [Styles](../../samples/styles.css): `edition` rules and `dialog`.
- [Behavior](../../samples/app.js): `showDetail`, `#read-essay` and dialog dismissal.

## Construction

1. Compose the actual title, deck, reading action and byline as one group.
   Pair it with one substantial illustration rather than several unrelated cards.
2. Use a wide typographic masthead, a narrow metadata line and a deliberate
   serif/sans contrast. The sample's Georgia/Arial stack needs no font download.
3. Set the desktop spread to `1fr 1.1fr` with a 5% gap. The art is slightly
   larger than the copy, not a decorative thumbnail beside it.
4. Draw or choose art that fits the subject and crop. The sample layers large
   SVG architectural shapes, window patterns, tree masses and diagonal shadows
   in a 660×590 viewBox. Label illustration honestly; it is not photography.
5. Open the complete story in a native dialog. Build paragraphs as text nodes,
   give the dialog an accessible title, and support close button and Escape.
6. Below 680 px, stack copy above the art, preserve the reading action, and
   let the illustration use its full aspect ratio instead of a desktop crop.

The sample dialog contract can be adapted directly:

```javascript
function openStory(dialog, body, title, paragraphs) {
  dialog.querySelector('[data-title]').textContent = title;
  body.replaceChildren(...paragraphs.map(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
  }));
  dialog.showModal();
}
```

The consuming markup supplies `[data-title]` and `aria-labelledby`; the
reference instead uses its existing `#dialog-title` selector. Do not inject
external article text as trusted HTML just to match the sample's formatting.

## Starting values

| Element | Baseline |
| --- | --- |
| Main art | SVG 660×590; maximum desktop height 540 px |
| Desktop split | 1 / 1.1 with 5% gap; one column below 680 px |
| Palette roles | Warm paper, terracotta architecture, forest green shadow |
| Reading overlay | Width `min(540px,100%-32px)`; 42 px desktop padding |
| Overlay body | Georgia, 15 px, line height 1.8 |
| Phone overlay padding | 35 px vertical, 25 px horizontal |

## Acceptance and adaptation

- Start with a long real title. At phone width, its wrap must not force the
  reading action behind navigation or crop out the meaningful subject.
- Open with keyboard, read, press Escape and verify focus returns to the
  invoking action. Verify long stories can scroll without losing dismissal.
- The sample checks true backdrop clicks using pointer coordinates; clicking
  padding inside the dialog must not accidentally dismiss it.
- If the layout feels like a generic landing page, adjust the relationship
  between masthead, story and art before adding gradients, badges or card borders.
- Adapt the illustration and article to the new subject. The fictional essay,
  brand and reading-time copy are demo content, not universal template facts.
