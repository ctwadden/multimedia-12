# Google AI Studio build prompt — Type That Communicates

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
Students choose a type hierarchy for a message, diagnose pair/range/line spacing and apply the relevant control. Typography includes typeface, weight, scale, hierarchy, alignment, line length and space; it is not a kerning game alone.

Source foundation
Use the teacher's "The Printed Image Book - Chapter 4.pdf" for type history/anatomy/classification as contextual source material. Modern Photoshop control definitions come from Adobe: https://helpx.adobe.com/sg/photoshop/using/line-character-spacing.html . Use authentic supplied brand/ad type imagery as a reference gallery, with source/date. Do not claim to have identified a custom logo font unless a reliable source identifies it; do not replace custom brand letters with Arial and label the result authentic.

Learning route
1. Start with a message, audience and viewing size. Compare a genuinely sourced type-led design and a labelled teaching study. Ask what must read first.
2. Demonstrate hierarchy using only size and weight: same words, same typeface and palette. The student predicts, tests and explains the reading order. Avoid grading taste.
3. Kerning task: show a large word such as AVATAR or a pair such as AV/To. Highlight the one pair being adjusted and provide a manual pair-spacing control. The change must affect only that pair's gap; subsequent letters may shift as the run reflows, but their own inter-letter gaps must remain unchanged.
4. Tracking task: highlight a whole selected word/run. Change spacing across that range. Show, with labels, how this differs from pair kerning.
5. Leading task: show a short paragraph with baseline guides and one line-spacing control. Explain baseline-to-baseline distance. A subsequent alignment task compares left/centre/right/justified treatments for a named context; it does not teach one universally correct alignment. Discuss line length/rivers when relevant.
6. Faded diagnosis: student names whether the fault is pair, range, line or hierarchy before seeing the matching control.
7. Independent transfer: supply one of four unfamiliar messages/viewing constraints. The student selects a face category, builds title/supporting/action hierarchy, adjusts justified spacing decisions and explains one tradeoff. Keep the final solution hidden.
8. Export a visual type study and a settings/decision log. Ask the student to set the same message using live editable Photoshop text and demonstrate a selected pair versus selected range.

Technical model
Kerning adjusts a pair; tracking affects spacing over selected text; both are measured in Photoshop in 1/1000 em and scale with type size. Do not implement kerning as CSS letter-spacing over the whole word. Use a clearly labelled manual teaching model, for example a pair offset with units converted to em. Disable double-applied automatic kerning where the controlled demonstration requires it and explain the baseline setting.
Browser fonts/shaping and line-height may differ from Photoshop. Do not label browser "font-kerning: normal" as Photoshop Optical kerning or promise pixel-identical results. For the manual model, show units and their relative change; do not fabricate exact software UI.
Use available/licensed local fonts or system fallbacks; expose the actual font used rather than silently claiming a missing brand font loaded. Keep editable text in the app and in the required Photoshop evidence.

Feedback and evidence
Auto-check whether the selected control matches the diagnosis, whether a pair operation altered unintended gaps, and whether essential message text was retained. Do not claim that every chosen font is objectively correct/incorrect. Ask why it suits audience, hierarchy and reading conditions.
Export prediction, diagnosis, before/after settings, observation and explanation. Ask a real viewer to read the message once and report what they understood. No fabricated eye-tracking or AI creativity grade.

Required tests
Change manual AV kerning and verify other pair gaps remain unchanged; change tracking and verify the selected run is affected; verify changing size scales an em-based offset; leading changes baselines without changing glyph width; alignment changes arrangement without inserting decorative spaces; fallback font labels are honest; the independent task supplies no finished solution. Test 390px/1280px, keyboard operation, save/reload, exports and actual later Photoshop pair/range/leading application. Record the source images/native checks still pending.

