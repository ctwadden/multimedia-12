# QA Release Report

Status: **READY TO TEACH**  
Audit date: 2026-09-07  
Score: **99 / 100**  
Critical failures: **0**

## Technical QA

- Browser load: PASS (`index.html`, 11 lesson sections, 54 buttons/inputs including quiz choices).
- Local assets: PASS (all images loaded; no broken `src` values).
- Student-file distribution: PASS (four visible download links; 7.3 MB ZIP contains the three required source images and passes archive integrity testing).
- Console: PASS (no errors or warnings during load/interactions).
- Gallery reveals: PASS.
- Teacher mode and answer visibility: PASS.
- Tier 1 layer toggles and mask slider: PASS.
- Tier 2 five-stage mask lab: PASS (Source → Select → Mask → Paint → Layers).
- Live mask painting: PASS (black brush conceals; white brush repairs; artwork and black/white mask thumbnail update together; reset works).
- Layer experiment: PASS (individual eye controls; Butterfly row visibly moves below Base and the artwork responds).
- Quiz scoring: PASS (verified 8/8 answer path).
- Responsive layout: PASS at 390 × 844; no horizontal overflow.
- Desktop/projector layout: PASS at 1280 × 720.
- Offline core: PASS; external links are optional.

## Instructional QA

| Check | Result | Evidence |
|---|---|---|
| Beginner can follow without prior Photoshop knowledge | PASS | Tier 1 Steps 0–10 plus Tier 2 Steps 11–17, exact menu paths, checkpoints. |
| Every final visible effect is taught | PASS | Portal mask/grade/type/accent plus subject selection, edge refinement, overlap masking, layer order, optional shadow, save/export. |
| Every software action has visual support | PASS | Workspace diagram, Tier 1 simulator, five-stage Tier 2 mask lab, target exemplars, step-specific mini UI diagrams. |
| Hotkeys/tips are highlighted | PASS | Step callouts + 13-item cheat sheet including W, B, and X for Tier 2. |
| Required assets and destinations are explicit | PASS | Part 0 ZIP/direct downloads + manifest + Step 0 folder/filename check. |
| Required links verified | PASS | Core assets are bundled; optional links audited separately. |
| Simulation is introduced, prompted, and tested | PASS | Tier 1 visibility/mask simulator; Tier 2 source-selection-mask transformation, live mask painting, mask thumbnail, layer eyes, and layer order. |
| Real-world examples included | PASS | WWF, UN Women, Adobe artists/tutorials, Erik Johansson. |
| Target exemplars included | PASS | Tier 1 portal and Tier 2 out-of-bounds exemplars. |
| Process/product/defence evidence | PASS | v01/v02 PSDs, JPGs, mask/layer screenshots, one-sentence defence. |
| Student cannot pass with only flattened AI output | PASS | Editable layers, screenshot, live checkpoint, explanation required. |
| Questions have answers/grading route | PASS | Auto-check quiz + key; formative O/C/P evidence. |
| Separate course outcomes | PASS | Communication Technology 11 and Multimedia 12 maps. |

## Known limitations

- Mini UI visuals and the mask lab are accurate conceptual models, not screenshots of one specific Photoshop installation. This prevents version mismatch while preserving current menu/panel names and the true black/white mask logic.
- External campaign pages can change and should be previewed by the teacher. The core lesson does not depend on them.
- The exemplars were generated from the bundled practice images; student results will vary around the phone corners and butterfly’s fine antennae. Variation is expected and useful for edge diagnosis.

## Release decision

Approved as a tiered foundations sequence. Tier 1 is the common first-day build; Tier 2 is a 25–35 minute extension or next-class bridge; Tier 3 transfers the same method to a rights-safe subject chosen by the student.
