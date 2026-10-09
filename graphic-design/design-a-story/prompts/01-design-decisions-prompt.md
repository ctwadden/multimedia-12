# Google AI Studio build prompt — Design Decisions

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
Students distinguish elements (line, shape, colour, texture, type, image) from principles that organise them, and explain a purposeful composition decision for an audience. Include contrast, emphasis/hierarchy, balance, alignment/proximity, repetition/unity, negative space and scale/proportion, organised into three short episodes rather than seven simultaneous tabs.

Sources and authentic examples
Use supplied teacher references and these source pages: IKEA logo/history https://www.ikea.com/ph/en/this-is-ikea/about-us/the-ikea-logo-history-and-design-pub55d85f50/ ; Pepsi's redesign case study https://www.pepsico.com/en/innovation/case-studies/2023/pepsi-global-redesign ; Nintendo official material https://www.nintendo.com/us/ . Include an actual ad/catalogue/package/campaign example as well as the logo. Do not treat a logo alone as a complete composition lesson. The teacher must review the exact assets/version; missing assets remain declared dependencies.

Learning route
1. Read a short audience/message brief and inspect an authentic source. Ask "What do you notice/read first? What visible evidence led you there?" Do not automatically claim where the eye goes.
2. Worked episode: same information and imagery in two labelled teaching studies, with only relative title/CTA emphasis changed. Student predicts before comparison. Overlay labels reveal the changed relationship after their answer.
3. Faded practice: show an alignment/proximity problem. Offer at most alignment and spacing controls. Keep the content, font and palette unchanged so the student can isolate what the arrangement does.
4. A balance/repetition/space comparison: demonstrate that equal symmetry is one option, not the definition of all balance. Use plain explanations of visual weight. A peer/student observation can disagree with the model's suggested reading; preserve and discuss that response.
5. Transfer: give one of four new audience/format constraints. The student creates a simple layout from fixed message/image/type elements, chooses the appropriate principle and defends a tradeoff. Do not provide the finished layout. Cards can include distant-view school-screen message, small phone poster, a two-event programme requiring clear grouping, and a calm exhibition notice requiring deliberate space.
6. Handoff: export the layout study as SVG or PNG plus a concise decision log; ask the student to reproduce the chosen relationships in their own editable Photoshop design. A flattened export is a planning reference, not the Photoshop source.

Controls and feedback
No sprawling drag-and-drop editor with 20 settings. Use one change at a time and numeric/keyboard alternatives. Reference images and the editable study are clearly separate. Feedback may say "These elements share an alignment edge" or "The CTA is now larger than the secondary text." It may not say "Your design is 92% creative" or assert measured audience attention.

Required tests
Hold content constant in comparison pairs; verify only intended properties change. Check alignment edges/group gaps numerically. Check no factual feedback depends on arbitrary colour taste. Test all four transfer cards, response persistence and evidence export. Confirm that the transfer does not disclose its solution. Record the real-reference assets still missing and keep draft status until they are supplied and the learning route has been tried by a non-author.

