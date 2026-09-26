# Visual assets

Give each asset an assignment in the composition before producing it.

## Specify the useful image

Determine subject, viewing distance, intended crop, light, background,
negative space, and output dimensions. Choose transparency when the interface
needs a cutout, rather than trying to hide an unwanted background with CSS.

Use a supplied reference to preserve the requested identity, object, or style.
Do not treat a vague stock image as equivalent to a specific requested subject.
When a generation or editing tool is available, produce the actual requested
asset; a written prompt alone is not the asset deliverable.

Avoid baking interface labels into generated imagery when the application
needs selectable, localized, or accessible text.

## Integrate at the real placement

Inspect the image in its actual container. Check the desktop and phone crops,
the focal point, adjacent text, and contrast across the image's lightest and
darkest regions. A successful standalone image can still fail in a narrow hero.

Store the selected asset with the project and make its path explicit.
Keep dimensions predictable during loading. Generate or export a sensible
resolution instead of asking every device to decode a much larger original.

For an illustration series, define shared perspective, line weight, palette,
and detail density. Inspect the set together; matching prompts alone do not
prove matching assets.

For delivery, derive only the widths/crops the layout consumes. Use the existing
image pipeline or responsive `picture`/`srcset` sizing, reserve intrinsic space,
and keep offscreen media out of the critical path. An alpha cutout needs edge
inspection against both light and dark surfaces; a repeating material needs a
tile-seam check on geometry, not just a single image preview.

For larger asset families, use the project's existing inventory to retain
master/source, dimensions, role, crop/focal point, permitted usage and consuming
components. Do not create a parallel manifest for a one-image change. Keep
text, product controls and analytical charts semantic rather than baking them
into raster art.

## Textures and procedural material

Identify the map's intended use and color interpretation before import.
Do not apply display color conversion indiscriminately to normal, roughness,
height, or other data maps.

Inspect tiling, scale, seams, and tangent conventions on the target geometry.
Make sure surface detail supports the object's silhouette and illumination.
For procedural textures, test the camera distances at which patterns repeat
or alias.

## Video and audio-reactive media

Choose the video's role: background, demonstration, narrative, or material.
Define duration, framing, loop behavior, and whether sound is essential.
Use a poster and a usable static state when playback is delayed or unavailable.

Inspect the start, middle, end, and any loop join. Test text readability over
moving frames and the target platform's playback behavior. A valid file is
not evidence that the requested movement or composition was achieved.

Ambient video needs an honest poster, a static reduced-motion/failure state and
a pause when hidden or offscreen. Use muted inline playback where appropriate;
do not depend on autoplay for content or sound. Meaningful speech needs the
project's caption/transcript path. Avoid decoding multiple invisible decorative
videos. For textures, introduce GPU compression only when the existing renderer
supports it and the measured memory or transfer benefit justifies conversion.

## Rights and provenance in the consuming project

Use assets the user supplied, generated assets under the tool's applicable
terms, or material the project is entitled to use. Keep any required license
notices with imported material. This package supplies instructions and tools;
it does not supply a licensed collection of fonts, images, videos, or icons.
