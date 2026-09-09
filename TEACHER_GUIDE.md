# Teacher Guide — Photoshop Foundations: Decode the Impossible

## Learning intentions

Students will:

- identify likely tools and techniques behind product advertising and social-issue imagery;
- explain the relationship among layers, selections, masks, transforms, type, and adjustments;
- use a non-destructive workflow to combine two photographs and communicate a message;
- explain how layer order and a refined subject mask create an out-of-bounds illusion;
- save an editable PSD, export a web-ready JPG, and explain one technical decision;
- discuss when image manipulation becomes misleading.

## Success criteria

I can:

- name at least three clues that reveal a composite;
- select the correct layer before moving or transforming content;
- use a layer mask rather than permanently erasing source pixels;
- create a clear hierarchy with image, headline, subline, and accent;
- submit a working file, export, and process screenshot;
- explain the purpose of one tool and one design choice.
- place a subject partly inside and partly outside a frame, then conceal one small edge on its mask to create depth.

## Before class — 10 minutes

1. Open `index.html` and test Teacher mode.
2. Put `photoshop-foundations-student-files.zip` in a shared class location, or have students use the lesson’s **Get the files** section. The ZIP contains the phone, forest, and butterfly source images.
3. Project the lesson at 100% browser zoom.
4. Confirm Photoshop opens and students can write to their working drive.
5. Preview any external campaign links you plan to use. The core lesson does not need them.

## Lesson sequence

| Time | Teacher | Students | Evidence |
|---|---|---|---|
| 0–3 | Show target and big question. | Silent notice/wonder. | Initial vocabulary. |
| 3–15 | Run eight-image gallery. Reveal builds after guesses. | Analyze two product + two issue images. | Conversation. |
| 15–23 | Teach the six-move decoder. | Name tools/techniques and believability clues. | Cold-call retrieval. |
| 23–30 | Use the workspace diagram. | Locate Tools, Options, Canvas, Layers, Contextual Task Bar. | Point-and-name check. |
| 30–38 | Use layer/mask simulator; ask for predictions. | Toggle layers and mask reveal. | Explain non-destructive visibility. |
| 38–73 | Demonstrate one step ahead. Stop at checkpoints 4, 6, 8. | **Tier 1:** build the phone portal. | Observation + v01 PSD. |
| 73–83 | Run retrieval questions 1–6 and exit ticket if the block ends. | Retrieve, repair, explain. | Quiz + exit ticket. |
| 83–90 | Run the five-stage mask lab: Source → Select → Mask → Paint → Layers. | Predict each change; hide and restore one butterfly edge; test layer eyes/order. | Oral explanation + simulator action. |
| +25–35 | Demonstrate Steps 11–17, pausing after selection, refined mask, and tucked edge. | **Tier 2:** add the butterfly out-of-bounds effect. | v02 PSD + mask screenshot. |

For a 60-minute block, use gallery images 1, 3, 5, and 7; demonstrate the first simulator in two minutes; stop after Step 8; complete Tier 1 next class. Tier 2 is designed as the following block or an early-finisher extension—not a rushed add-on.

## Formative assessment

- **Observation:** Can the student select the Forest layer, transform it, and produce a mask thumbnail?
- **Conversation:** Can the student explain one gallery image using message, audience, technique, and ethical effect?
- **Product:** Does the PSD retain separate phone, forest, mask, adjustment, type, and shape layers?
- **Tier 2 product:** Does the Butterfly layer retain a refined mask, cross a phone boundary, and use a small concealed edge to imply depth?

Quick record: **Ready** / **Developing** / **Needs a restart**. Do not grade polish heavily on Day 1.

## Quiz key

1. B — Layer mask.
2. C — Check the selected layer.
3. A — PSD preserves editable layers.
4. B — Perspective and lighting.
5. C — The clipping mask limits Curves to the forest.
6. A — Ethical risk rises when an edit changes evidence or meaning while presenting itself as truthful.
7. B — Painting black on that portion of the Butterfly mask conceals it and reveals the phone below.
8. C — Layer order determines what appears in front.

## Troubleshooting triage

| Symptom | Likely cause | Fast repair |
|---|---|---|
| Wrong object moves | Wrong layer selected | Select Forest image thumbnail, then press V. |
| Forest vanished after mask | Outside was selected or mask inverted | Undo; select screen area, or invert selection before masking. |
| Desk also changes with Curves | Adjustment not clipped | Right-click Curves → Create Clipping Mask. |
| Jagged screen edge | Too few lasso points / no feather | Paint carefully on mask; next time feather 1 px. |
| Transform handles missing | Transform not active | Select Forest; Ctrl/Cmd + T. |
| Only JPG exists | Working file exported but not saved | File → Save As → PSD with layers. |
| Interface differs | Custom workspace/panels hidden | Window → Workspace → Essentials (Default) → Reset Essentials. |
| Butterfly still has gray box | Selection was not converted to a mask | Select Butterfly → Select Subject → Add Layer Mask. |
| Antennae disappear | Refinement was too broad/aggressive | Undo; use a smaller Refine Edge Brush only on detailed edges. |
| Black paint appears on image | Image thumbnail selected instead of mask | Undo; click the mask thumbnail, then paint black/white. |
| Butterfly disappears behind phone | Butterfly layer is below Phone | Drag Butterfly above Phone and other image layers. |

## Safety, ethics, and AI

- Use only provided, self-created, or appropriately licensed source images.
- Do not manipulate a classmate’s body or face without clear, informed consent.
- Distinguish persuasive/artistic composites from documentary evidence.
- If generative tools are later permitted, students disclose the tool, prompt/edited area, and human decisions. Day 1 intentionally builds manual comprehension first.

## Submission evidence

- `Step_Outside_YourName_v01.psd`
- `Step_Outside_YourName.jpg`
- one screenshot showing canvas + Layers panel
- one sentence: “I used ___ because ___.”

Tier 2 adds:

- `Step_Outside_YourName_v02.psd`
- `Step_Outside_OOB_YourName.jpg`
- one screenshot showing Butterfly + mask in the Layers panel
- one sentence: “The out-of-bounds effect works because ___.”

## Next-day retrieval opener

Project the Tier 2 target with the Layers panel hidden and ask: “What are the minimum layers needed to rebuild this?” Expected: phone base, forest with screen mask, adjustment, headline, subline, shape accent, and butterfly with refined layer mask. Follow with: “Which layer must be on top, and which tiny part should be concealed?”
