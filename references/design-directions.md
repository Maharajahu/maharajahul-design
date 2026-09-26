# Design directions and product recipes

Use this when the task needs a coherent visual system, not an isolated effect.
The eight authored directions live in [directions.json](../data/directions.json).
They combine decisions rather than claiming a style is suitable for an entire
industry. They are a compact collection, not a font service or an exhaustive
database of product categories.

## Find a starting point

```sh
python scripts/lookup.py "liquid glass coast" --design-system --surface application
python scripts/lookup.py "operations queue dashboard" --design-system --stack react
python scripts/lookup.py "editorial journal paper" --domain typography --design-system
python scripts/lookup.py "chart trend distribution" --domain chart
```

Lookup is offline, literal and repeatable. `--design-system` selects the highest
matching direction under the active filters; no match returns no proposal.
It does not invent a new system, query a model, create files or install fonts.
If a brief names an existing brand, use its values instead of a preset.

| Direction | Distinguishing relationship | Avoid when |
| --- | --- | --- |
| Lensed Coast | Quiet controls over a lit, refractive scene | Background variability makes important information unreadable |
| Orbital Instrument | Large subject, restrained annotation rails | No spatial subject or interaction needs the rendering cost |
| Workshop Ledger | Queue, selection and next action on a common baseline | The primary job is leisurely reading or exploration |
| Archive Paper | Display headline against a continuous reading column | Dense operational updates dominate the screen |
| Material Room | Object construction and finish controls explain a product | Actual variants or product facts are unavailable |
| Night Signal | One luminous subject, stable control plane | The user needs a motionless low-stimulation workspace |
| Civic Clear | Requirements, current step and recovery in reading order | The brief explicitly needs an expressive exhibition |
| Field Atlas | Place, layered context and selected detail | Decorative terrain could be mistaken for navigational information |

## Apply the returned system

1. Keep the proposal's *relationship*: what leads, what supports, where an
   action lives. Replace fictional content with the actual product.
2. Map palette roles to existing semantic variables. `ink` and `muted` are
   text on `canvas` or `surface`; `on_accent` is text on `accent`. `border`
   is not automatically an adequate focus or error indicator.
3. The listed colors are opaque baselines. The tests measure these text
   pairs; transparency, hover, disabled states, imagery and gradients need
   their own checks after integration. Do not invent success/error meanings
   for palette accents; use the product's semantic status tokens.
4. Use the font stacks as fallback-safe roles. Custom fonts require available
   glyphs, weights, loading behavior and applicable licenses. This package
   neither downloads nor redistributes fonts or an icon catalogue.
5. Treat spacing/radius lists as a small scale. Promote only the values used
   by shared components. Do not copy all tokens into a one-control fix.
6. Read the linked effect recipe only when the product actually needs it.
   A system without an effect recipe is intentionally usable without a GPU.

## Typography construction

Start with body copy at the profile's size, line-height and measure. Add a
label role, a numeric role and a title role, then test them with actual text.
A useful fluid title seed is `clamp(2.4rem, 1.2rem + 4vw, 5.6rem)`; do not
apply it to dense workspace headings. Let a narrow reading view keep its
body size while losing decorative gutters first.

For tabular values, align decimals or right edges and use tabular numerals
when the selected font supports them. For translations, check punctuation,
diacritics, scripts, fallback width and long unbroken tokens. Avoid spacing
uppercase letters so widely that short labels dominate the reading column.
Use real font weight files instead of depending on synthesized extremes.

## Product-to-layout recipes

| Job | Assembly order | State that exposes a bad design |
| --- | --- | --- |
| Explain an offer | Audience/problem → concrete outcome → evidence → offer/conditions → action | Image unavailable; important price conditions still findable |
| Compare products | Stable attribute names → comparable values → differences → selection summary | One missing value or unavailable variant |
| Complete a service | Requirements → labeled fields → review when necessary → actual confirmation | Validation failure without losing correct input |
| Operate a queue | Filters → prioritized rows → selection → contextual action → result | Empty, stale or partially failed refresh |
| Read a publication | Title/context → coherent article → attached figures/captions → related work | Long heading and larger text at narrow width |
| Edit a document | Document model → selection → commands/history → preview → save status | Undo after a failed save or leaving a dirty document |
| Explore a collection | Meaningful facets → results → detail → return to previous state | No results; back preserves the search and position |

Select one route that serves the brief; do not add every section as a landing
page template. Evidence may be a real demonstration, example, specification
or supplied testimonial. Never generate customer counts or endorsements to
fill an empty proof section.

## Choose the chart by the question

| Question | Baseline encoding | Essential guard |
| --- | --- | --- |
| Which is larger? | Sorted bars or aligned dots | Common scale; bars should not silently omit the baseline |
| How did it change? | Time series with labeled units | Preserve gaps and irregular intervals; no fabricated continuity |
| What is the spread? | Histogram or interval/box summary | Bin meaning, sample size and outliers remain visible |
| How is a whole divided? | Stacked bars or direct proportions | Consistent denominator and a truthful missing category |
| Do two values relate? | Scatter plot | Units, overlap, sample selection; association is not causation |
| Which exact record? | Table | Sorting, precision, units, nulls and keyboard access |

Give the chart a short textual conclusion and access to important values.
Do not use color as the only series distinction. A 3D decorative network
from the demos is not an automatic replacement for an analytical graph.

## Icons and asset families

Prefer the installed icon family. Pick one optical weight, then test at its
actual small size on a text baseline. Keep names or adjacent text for actions
whose symbols are ambiguous. Decorative SVGs can be hidden from assistive
technology; icon-only buttons still need a meaningful accessible name.
Do not auto-install a large library for a few basic shapes.

For a custom family, constrain stroke, corner treatment, view box, fill rules
and apparent size. Verify mirrored actions separately in RTL interfaces:
directional navigation can change while logos and media symbols may not.
