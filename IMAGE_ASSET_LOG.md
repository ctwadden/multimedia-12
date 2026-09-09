# Original Image Asset Log

Mode: built-in image generation/editing. Final assets were copied into `assets/` so the package does not depend on the generator’s storage path.

## `gallery-products.png`

Prompt: Create a polished 16:9 four-panel contact sheet of high-end, unbranded photo-compositing concepts: a white sneaker transformed into a miniature green city; an ocean wave and island inside a clear bottle; a smartphone opening into a forest; and fruit/liquid suspended around a blank can. Use believable edges, perspective, shadows, and colour grading. No people, logos, text, UI, or watermark.

## `gallery-issues.png`

Prompt: Create a classroom-appropriate 16:9 four-panel social-issue contact sheet: a melting glacier/polar-bear metaphor held in a hand; an empty school desk contrasted with fading notification symbols; lungs formed from forest, half healthy and half smoky; and a turtle approaching a plastic bag shaped like a jellyfish. Photorealistic, thoughtful, non-graphic. No logos, text, UI, gore, or watermark.

## `01-phone-base.png`

Prompt: A high-resolution top-down product photo of a generic portrait-oriented smartphone on a dark wood desk. The phone has a flat, uniform gray blank screen with visible rounded corners and minimal reflections, generous negative space at left, soft upper-left light, and a subtle cast shadow. No logos, text, UI, hands, accessories, or watermark.

## `02-forest-insert.png`

Prompt: A high-resolution portrait photograph of a luminous forest trail leading toward a warm opening, with realistic green ferns, moss, centered stone path, sunbeams, and strong leading lines. No people, buildings, signs, text, logos, or watermark.

## `target-exemplar.png`

Edit prompt: Use the phone photo as the unchanged base and place the forest only inside its blank screen with clean rounded edges and a subtle glow. Add the exact headline “STEP OUTSIDE,” the exact subline “One screen can open another world.”, and a short green accent rule at left. Preserve the phone, desk, crop, perspective, and shadow. Add no other objects, logos, UI, or watermark.

## `03-butterfly-source.png`

Prompt: Create a high-resolution, realistic macro studio photograph of one vivid blue morpho butterfly with wings fully open on a uniform light-gray background. Show the entire butterfly, antennae, legs, and wing tips with generous clear space, a strong silhouette, natural edge detail, soft upper-left light, and a gentle shadow. No flowers, people, text, logos, watermark, blur, or extra insects.

## `target-exemplar-out-of-bounds.png`

Edit prompt: Preserve the Tier 1 phone-portal exemplar and add the blue morpho butterfly as a realistic out-of-bounds composite. Place its body within the upper-middle of the phone screen, let both wings cross the phone screen and black side bezels, and tuck one small lower section behind a bezel. Match the existing light and add only a subtle contact shadow. Preserve all existing text; add no logos, watermark, or extra objects.

## `butterfly-cutout-demo.png`

Edit prompt: Preserve the butterfly exactly while removing the full gray studio background and floor shadow. Output a true transparent-background PNG with complete wings, body, antennae, legs, and crisp natural edges. Add no text, borders, shadows, objects, logos, or watermark. This derivative is used only by the browser layer simulator; students receive the uncut source.
