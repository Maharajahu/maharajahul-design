# Inspection

Match the evidence to the claim. A successful build shows different things
from a screenshot, an interaction trace, or a screen-reader session.

## Choose the observation

| Claim | Useful observation |
|---|---|
| The new layout fits | Rendered wide and narrow views with real-length content |
| The control works | Activation, resulting state, and relevant recovery |
| Keyboard use works | Reachability, focus visibility, order, and escape path |
| Content is accessible | Names, roles, relationships, and relevant assistive-technology behavior |
| Motion is stable | Playback, interruption, reduced-motion behavior |
| The page is faster | Comparable measurements under stated conditions |
| The scene depicts the subject | Visible identifying cues in the final render |

Choose observations for the changed area. Do not claim a full accessibility
certification from a quick inspection or from the helper below.

## Review a rendered interface

Trace the intended reading and action path. Note where the viewer must guess:
the meaning of a value, whether something is clickable, where feedback appears,
or how to recover. Connect each finding to a specific visible element or state.

Check content pressure: a long title, an empty result, a validation message,
and a narrow viewport where relevant. Distinguish a defect from a stylistic
alternative. A review should explain the consequence, not merely name a taste.

For visual regression, compare equivalent state, content, viewport, theme,
font readiness, and animation phase. Keep dynamic regions controlled or explain
why they differ. An image difference is evidence to inspect, not automatically
a regression.

## Optional browser capture helper

Use an existing project installation of Playwright with its Chromium browser.
The helper searches that project's packages, including `@playwright/test`.
It does not add dependencies, install browsers, log in, or activate controls.

~~~sh
node scripts/capture.mjs --url http://127.0.0.1:3000 --project /path/to/app --out /path/to/captures
node scripts/capture.mjs --url http://127.0.0.1:3000 --project /path/to/app --out /path/to/captures --sizes 390x844,1440x960 --themes light,dark --motion reduce --wait-for main
~~~

Each run creates a new directory containing full-page PNG captures and
`report.json`. The report records page/console errors, failed requests, HTTP
errors, document overflow, and broken images. It also lists candidate elements
near an overflowing page edge to help investigation.

Exit code 0 means those checks found no issue; 2 means observations need
inspection; 1 means the capture command could not operate. None of these codes
assesses visual taste, subject accuracy, or complete accessibility.

Use a readiness selector when the meaningful state appears asynchronously.
Inspect screenshots with the available image or browser tool. If Playwright
is unavailable, use the existing browser tooling rather than installing it
solely to satisfy this helper.

## Finish with a bounded conclusion

State what was changed or observed, why it matters, and what evidence supports
the result. Name any target device, browser, or state that could not be checked.
Stop when the requested outcome and the relevant checks are satisfied.
