# Google AI Studio build prompt — Colour Choices

Paste the full prompt below into Build mode. Reference assets must be supplied and checked before student release. This file is a specification, not a completed/verified application.

Build a small, clear browser teaching lab for Nova Scotia Multimedia 12 students learning graphic design and Photoshop. This is teacher-created instructional software; the students are not being asked to generate their assessed designs with AI.

Implementation and classroom constraints
- Deliver a static HTML/CSS/JavaScript application, or a static build if the environment requires a frontend framework. No Gemini/API calls, server, authentication, database, cloud deployment or external analytics. It must be usable without installing software or requiring students to use Google AI Studio.
- Use relative asset paths so the exported application can later run on the existing course GitHub Pages site. Do not publish it. Include a README identifying the actual entry point/build command and dependencies.
- Design for one task per screen. Show current task/total, Back, Next, and an optional glossary/explanation. Show no more than two active conceptual controls in a task. Keep download/print utilities separate. Do not add a chatbot, spinning rewards, countdown or points for button clicks.
- Use the sequence notice -> predict -> change -> observe -> explain -> apply. Students answer a brief prediction before seeing the comparison feedback. After a worked example and one faded practice, give an unfamiliar transfer task.
- Preserve responses when changing screens or reloading. Store anonymously in the local browser, disclose this simply, and allow a local JSON/text evidence export. Clear all responses requires explicit confirmation and is separated from download.
- Inputs, diagrams and controls need labels, visible keyboard focus, keyboard alternatives to dragging, readable contrast, meaningful alt text, reduced-motion behaviour and 390px/1280px layout checks. Instruction cannot depend on colour alone.
- Use genuine supplied reference images with maker, source page, date/version and context. Keep the authentic source image unchanged. Editable reconstructions must be labelled "Teaching study — reconstructed for comparison"; do not pass them off as real ads. Never generate fake brand logos or invent official HEX codes.
- If an authentic asset is not supplied, identify the missing asset in teacher preview. Do not replace it with an invented image or call the source gallery complete. Use source-page links for teacher review until materialised assets are supplied. The offline classroom release requires local assets.
- No fabricated eye-tracking, brain responses or scientific claims about what every viewer feels. Human interpretation is discussed/tested, not calculated from a design slider.
- Auto-check only factual answers and explicit measurable constraints. Do not score creativity, taste, student achievement or infer mastery from completion. Teacher review remains authoritative.
- Use anonymous local activity keys only. Do not create course/project/learner/step/outcome/rubric/Form IDs or submit to external systems. Provide an integration description listing unresolved existing bindings; do not claim connected.
- Supply a private teacher guide, source/asset manifest, learning targets, conceptual limits, technical tests and an honest status report. Do not fabricate Photoshop interface screenshots or claim native Photoshop/cold-run verification.

Specific learning target
Students make and justify a palette for a message/audience, distinguish hue harmony from legibility, assign colour roles and carry exact colour values into Photoshop. This is not a random palette slot machine.

Professional companion and references
Link to Adobe Color https://color.adobe.com/create/color-wheel as a professional palette generator/refinement companion; do not depend on an iframe loading. Use genuine, versioned IKEA, Pepsi and Nintendo reference imagery supplied by the teacher. IKEA's source is https://www.ikea.com/ph/en/this-is-ikea/about-us/the-ikea-logo-history-and-design-pub55d85f50/ ; Pepsi's is https://www.pepsico.com/en/innovation/case-studies/2023/pepsi-global-redesign ; Nintendo's exact asset must be chosen from official material https://www.nintendo.com/us/ . No invented brand-colour values or generated logos.

Colour model
- Name the wheel model explicitly. For the creation view implement an RGB hue circle/HSB controls and accurate conversions to 8-bit sRGB HEX/RGB. Include a short separate labelled traditional RYB comparison explaining that its red/green complementary relationship is different from RGB red/cyan.
- Separate a palette's RGB file encoding from the harmony geometry used to choose it. Do not claim the local algorithm reproduces Adobe Color exactly.
- Teach hue, saturation and value one at a time. Implement monochromatic variation, analogous neighbours, complementary and triadic relationships in the explicitly named digital model, with visible labelled hue positions.
- Neutrals can serve the palette without acquiring a fabricated hue. Do not force a red/white Nintendo mark into a two-hue complementary scheme or a Pepsi identity into an exact mathematical harmony.
- Wheel membership does not guarantee readability or cultural appropriateness. Colour meaning is contextual; omit universal "red means danger/raises blood pressure" rules.

Learning route
1. Notice the genuine source and identify the main/accent/neutral roles and source context. Compare a documented historical/current example where supplied. Source statements of intention are labelled as such.
2. Predict what changing saturation or value does to the same labelled teaching composition; test one control, observe, explain.
3. For an original community-film-night or equivalent brief, develop two palette candidates. Assign five named roles: dominant, supporting, accent, background, text. Limit the screen to the current role and at most hue plus value/saturation, introducing controls sequentially.
4. Apply both candidates to identical composition content. Let the student vary the accent's proportion, test a specific text/background pair and choose a candidate with an explanation of the rejected option. Proportion rules are heuristics, not universal design laws.
5. Provide an unfamiliar changed audience/background/format constraint as transfer; do not give the answer. Produce before/after evidence.
6. Export the selected palette and apply it to an editable Photoshop design.

Contrast
Implement the WCAG sRGB relative-luminance formula correctly, including sRGB linearisation. Black/white must be 21:1; the identical colour pair must be 1:1. Show the specific foreground/background pair being measured. Use 4.5:1 as the normal-text AA check and distinguish large text's 3:1 threshold when applicable. Preserve precision for the threshold comparison. State that this flat-pair test is not a whole-poster quality grade; logos have an exception in the underlying guideline. Do not claim a colour-vision simulation or accessibility certification unless correctly implemented/tested. Source: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html .

Palette export and Photoshop handoff
- Export a real UTF-8 CSS file with one simple colour declaration per selected named role, all five HEX values exactly as shown. Include a labelled visual SVG/PNG card and JSON/text decision log. A CSV renamed to ASE is prohibited.
- Offer a genuine ASE export only if implemented to a verified format specification, binary-tested and actually imported into school Photoshop. Otherwise do not show an ASE button.
- The proposed additive handoff is Window > Swatches > the panel's import/load action > the CSS file. Menu wording varies by installed version. Do not use Replace Swatches in the beginner task. Refer to https://helpx.adobe.com/photoshop/desktop/adjust-color/choose-colors/manage-color-swatches-and-swatch-libraries.html .
- Include a manual HEX/foreground-colour-to-New-Swatch fallback. Do not fabricate a Photoshop screenshot or claim the interface path was run. Native import/naming/group/save/reopen verification is a release dependency.
- Ask the student to apply the palette to editable type/shapes, save, reopen and justify the accent placement. Include source/medium notes; an RGB value is not a guaranteed printed colour match.

Required tests
Known RGB primary/secondary conversions, hue wrap at 360/0, grey with no meaningful hue, contrast ratios and threshold boundaries, five distinct values matching preview/CSS/JSON/SVG, names/filenames escaping, local evidence save/reload, no surprise extra colours in the CSS. Do not force distinct colours if a student's justified palette intentionally repeats a role; explain that Photoshop may deduplicate identical values. Document all native-import and source-asset checks still pending.

