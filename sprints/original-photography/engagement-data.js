"use strict";
// Student-facing additions only. Assessed tasks and IDs live in index.html.
window.SPRINT_EXPERIENCE = {
 "studentOsUrl": "https://script.google.com/a/macros/gnspes.ca/s/AKfycby3lAqgW184t9EnOZg2XHDh6C8jYGZUBFpXeLICFZnAu0Yrkab3hcw6QFboHR7FWVTo/exec",
 "hook": {
  "lesson": "d01",
  "title": "Same photo, two captions",
  "prompt": "Imagine one photo of an empty school cafeteria at noon. Caption A: “Budget cuts close the lunch program.” Caption B: “New quiet study space opens.” Which caption is true?",
  "options": [
   "Caption A",
   "Caption B",
   "You can’t tell from the photo"
  ],
  "followUp": "What would you need to know besides the picture to decide?"
 },
 "videos": [
  {
   "lesson": "d01",
   "title": "How photography connects us",
   "channel": "TED · David Griffin",
   "url": "https://www.ted.com/talks/david_griffin_how_photography_connects_us",
   "length": "14:39",
   "watch": "Suggested 0:00–4:00; teacher to confirm the window",
   "captions": "TED transcript and captions available",
   "questions": [
    "What makes a photograph tell a story rather than just show a scene?",
    "What did the photographer choose to include?"
   ],
   "after": "Name one choice from the talk you could use in your campaign."
  },
  {
   "lesson": "d02",
   "title": "What cameras see that our eyes don’t",
   "channel": "TED · Bill Shribman",
   "url": "https://www.ted.com/talks/bill_shribman_what_cameras_see_that_our_eyes_don_t",
   "length": "3:05",
   "watch": "Whole talk (3:05)",
   "captions": "TED transcript and captions available",
   "questions": [
    "Which camera setting makes these images possible?",
    "What does speeding up or slowing down time reveal?"
   ],
   "after": "Which setting will you change first at Station B, and why?"
  },
  {
   "lesson": "d03",
   "title": "The magic ingredient that brings Pixar movies to life",
   "channel": "TED · Danielle Feinberg",
   "url": "https://www.ted.com/talks/danielle_feinberg_the_magic_ingredient_that_brings_pixar_movies_to_life",
   "length": "11:54",
   "watch": "Suggested 0:00–5:00; teacher to confirm the window",
   "captions": "TED transcript and captions available",
   "questions": [
    "How does light change the mood of the same scene?",
    "Where does light guide the viewer’s eye?"
   ],
   "after": "Plan your two light studies using one idea from the talk."
  },
  {
   "lesson": "d06",
   "title": "Impossible photography",
   "channel": "TED · Erik Johansson",
   "url": "https://www.ted.com/talks/erik_johansson_impossible_photography",
   "length": "6:04",
   "watch": "Whole talk (6:04)",
   "captions": "TED transcript and captions available",
   "questions": [
    "How does he make impossible images look real?",
    "When is an obviously altered image honest?"
   ],
   "after": "Where is the line between art and misleading for your campaign?"
  }
 ],
 "simulation": [
  {
   "lesson": "d02",
   "name": "Exposure Lab",
   "sourceName": "AI_STUDIO_PROMPTS.md · Exposure Lab",
   "status": "Not built yet: build it in Google AI Studio from the prompt.",
   "directions": "Use it after the stations, to test a prediction you could not try with the real camera.",
   "returnQuestion": "Which setting did you give up to get the shot you wanted?"
  },
  {
   "lesson": "d03",
   "name": "Light the Object",
   "sourceName": "AI_STUDIO_PROMPTS.md · Light the Object",
   "status": "Not built yet: build it in Google AI Studio from the prompt.",
   "directions": "Use it after your two real light studies.",
   "returnQuestion": "What changed when you moved the key light to the side?"
  },
  {
   "lesson": "d08",
   "name": "Reframe It",
   "sourceName": "AI_STUDIO_PROMPTS.md · Reframe It",
   "status": "Not built yet: build it in Google AI Studio from the prompt.",
   "directions": "Optional warm-up before the independent task; it uses invented layouts, not yours.",
   "returnQuestion": "What did you have to give up in the tallest format?"
  }
 ],
 "discussion": {
  "lesson": "d06",
  "title": "Remove the stranger?",
  "mode": "debate",
  "prompt": "Your best campaign photo has a stranger in the background. Is it honest to remove them in Photoshop?",
  "positions": [
   "Yes, it is a campaign, not news",
   "Only if the poster says it was edited",
   "No, reshoot instead"
  ],
  "followUp": "Would your answer change if the photo were in the school newsletter as a news story?",
  "respondFirst": true,
  "stimulus": {
   "label": "Scenario described in the prompt (no image needed)."
  },
  "reply": "Reply to a classmate by naming who could be misled by their choice, and who it protects."
 },
 "choice": {
  "lesson": "d08",
  "title": "Choose your new format",
  "prompt": "Before you start, write which format you chose and the first thing you expect to move.",
  "note": "Choose the new format if your teacher has not assigned one. All three assess the same skill.",
  "contexts": [
   "9:16 phone story",
   "11×17 portrait poster",
   "16:9 website banner"
  ]
 },
 "selfChecks": {
  "d02": [
   {
    "q": "You want to freeze a runner. What do you change?",
    "options": [
     "Slower shutter",
     "Faster shutter",
     "Lower ISO"
    ],
    "answer": 1,
    "why": "A fast shutter (e.g. 1/1000 s) freezes motion."
   },
   {
    "q": "f/2.8 compared with f/11 gives…",
    "options": [
     "More background blur",
     "Less light",
     "More noise"
    ],
    "answer": 0,
    "why": "A smaller f-number opens the aperture: more light and shallower depth of field."
   },
   {
    "q": "Raising ISO makes the photo…",
    "options": [
     "Sharper",
     "Brighter but noisier",
     "Darker"
    ],
    "answer": 1,
    "why": "Higher ISO brightens but adds grain."
   }
  ],
  "d04": [
   {
    "q": "Where should the headline go?",
    "options": [
     "Over the subject’s face",
     "In clean space you planned",
     "Anywhere, then fix it later"
    ],
    "answer": 1,
    "why": "Plan text space when you shoot."
   },
   {
    "q": "A friend agrees to be photographed. What else is needed before public use?",
    "options": [
     "Nothing",
     "Teacher confirms they are on the photo-permission list",
     "A filter"
    ],
    "answer": 1,
    "why": "School permission must be confirmed."
   },
   {
    "q": "Why have a backup route?",
    "options": [
     "To take more photos",
     "So the shoot still works if a person or place is unavailable",
     "It is optional decoration"
    ],
    "answer": 1,
    "why": "Plans fail; a backup protects your deadline."
   }
  ],
  "d06": [
   {
    "q": "Which is reversible?",
    "options": [
     "Image › Adjustments › Curves",
     "Layer › New Adjustment Layer › Curves",
     "Eraser tool"
    ],
    "answer": 1,
    "why": "Adjustment layers keep the original pixels untouched."
   },
   {
    "q": "On a layer mask, black…",
    "options": [
     "Reveals",
     "Hides",
     "Deletes pixels"
    ],
    "answer": 1,
    "why": "Black hides, white reveals; nothing is deleted."
   },
   {
    "q": "Adding a crowd from another photo to a campaign presented as real is…",
    "options": [
     "Fine",
     "Misleading unless labelled",
     "Required"
    ],
    "answer": 1,
    "why": "It changes what the viewer believes happened."
   }
  ],
  "d08": [
   {
    "q": "Moving to 9:16, the first thing to protect is…",
    "options": [
     "The exact font size",
     "The reading order and message",
     "Every element from the original"
    ],
    "answer": 1,
    "why": "The message must survive; details can change."
   },
   {
    "q": "Why use a Smart Object when re-cropping?",
    "options": [
     "Adds effects",
     "Keeps full quality when resizing",
     "Makes files smaller"
    ],
    "answer": 1,
    "why": "Smart Objects keep the original data."
   }
  ]
 },
 "supports": {
  "start": {
   "today": "Read the route and the rules for photos of people.",
   "glossary": [
    [
     "Campaign",
     "A set of images and words with one message for one audience"
    ],
    [
     "Original",
     "A photo you took yourself"
    ]
   ],
   "summary": "You will plan, shoot and edit your own photos, then build a campaign image and change its format on your own in lesson 8.",
   "checklist": [
    "I know what lesson 8 is",
    "I know the rules for photographing people"
   ],
   "worked": {
    "title": "Example message",
    "text": "“Bring a reusable bottle”: audience grade 9s; seen on hallway screens; action: fill up at the new station."
   },
   "frames": [
    "My campaign will tell ___ to ___."
   ],
   "stretch": [
    "Find a campaign image you think is misleading. What made it so?"
   ]
  },
  "d01": {
   "today": "Choose a feasible message and write your ethics rules.",
   "glossary": [
    [
     "Documentary",
     "A photo that records what happened"
    ],
    [
     "Persuasive",
     "A photo made to influence feelings or action"
    ],
    [
     "Context",
     "The caption, place and surroundings that shape meaning"
    ]
   ],
   "summary": "A photo’s meaning depends on its caption and context. Choose a message you can shoot at school and decide which edits are honest.",
   "checklist": [
    "Brief written",
    "Three allowed and two banned edits",
    "Two references annotated"
   ],
   "worked": {
    "title": "Worked example: a different brief",
    "text": "Audience: parents. Message: “Visit the art show Thursday.” Seen: newsletter banner. Allowed: colour fixes, cropping. Banned: adding artwork that is not in the show."
   },
   "frames": [
    "My audience is ___ and I want them to ___.",
    "I will not ___ because it would make viewers believe ___."
   ],
   "stretch": [
    "Find a famous photo whose meaning changed with a new caption. What changed?"
   ]
  },
  "d02": {
   "today": "Change ONE setting on purpose and label it on your contact sheet.",
   "glossary": [
    [
     "Aperture",
     "The lens opening; the f-number"
    ],
    [
     "Shutter speed",
     "How long the sensor collects light"
    ],
    [
     "ISO",
     "Sensor sensitivity; higher is brighter and noisier"
    ],
    [
     "Depth of field",
     "How much of the scene is sharp"
    ]
   ],
   "summary": "Aperture, shutter and ISO all change brightness, and each has a side effect: background blur, motion blur or grain. Change one at a time and compare.",
   "checklist": [
    "Camera checked",
    "Three framings shot",
    "One variable changed across three shots",
    "Contact sheet labelled"
   ],
   "worked": {
    "title": "Worked example: different subject",
    "text": "A spinning fan at 1/30 s looks like a blur; at 1/1000 s the blades freeze, but the photo is darker unless ISO goes up."
   },
   "frames": [
    "When I changed ___ from ___ to ___, the photo became ___."
   ],
   "stretch": [
    "Freeze and blur in one frame: pan the camera with a moving subject at 1/30 s."
   ]
  },
  "d03": {
   "today": "Two light studies of one subject, same framing.",
   "glossary": [
    [
     "Soft light",
     "Light with gentle shadow edges"
    ],
    [
     "Hard light",
     "Light with sharp shadow edges"
    ],
    [
     "Reflector",
     "A white surface that bounces light into shadows"
    ]
   ],
   "summary": "Light position and softness change mood and visible detail. Keep framing the same so light is the only difference.",
   "checklist": [
    "Subject chosen",
    "Soft study done",
    "Contrasting study done",
    "Comparison written"
   ],
   "worked": {
    "title": "Worked example: different subject",
    "text": "A sneaker by a window looks clean and commercial; lit from the side by one lamp, its texture and shape look dramatic."
   },
   "frames": [
    "Study 1 feels ___ because the light ___.",
    "For my brief I choose ___ because ___."
   ],
   "stretch": [
    "Make the same subject look friendly and then threatening using light only."
   ]
  },
  "d04": {
   "today": "A shot list with text space and permission checked.",
   "glossary": [
    [
     "Shot list",
     "A planned list of photos to take"
    ],
    [
     "Text-safe space",
     "Clean area left for the headline"
    ],
    [
     "Rule of thirds",
     "Placing key parts on imaginary thirds lines"
    ]
   ],
   "summary": "Plan five shots, leave room for text, check who and where needs permission, and have a backup.",
   "checklist": [
    "Five shots planned",
    "Text space marked",
    "Permission checked",
    "Backup route written",
    "Teacher approval"
   ],
   "worked": {
    "title": "Worked example: different plan",
    "text": "Lead: bike rack at 8 a.m., low angle, sky top third for text. Backup: a close-up of a helmet if the rack is empty."
   },
   "frames": [
    "If ___ is not available, I will ___."
   ],
   "stretch": [
    "Plan one shot that works in both portrait and landscape."
   ]
  },
  "d05": {
   "today": "Shoot the plan, check focus and histogram, reshoot one problem.",
   "glossary": [
    [
     "Histogram",
     "Graph of brightness from dark to bright"
    ],
    [
     "Clipping",
     "Detail lost at pure black or pure white"
    ],
    [
     "Select",
     "A frame you mark as a strong candidate"
    ]
   ],
   "summary": "Check focus and the histogram after each shot and fix problems while you can still reshoot.",
   "checklist": [
    "Shot list done",
    "Focus checked",
    "Histogram checked",
    "One reshoot",
    "Files copied"
   ],
   "worked": {
    "title": "Worked example: different shoot",
    "text": "A trophy case photo had glare. Moving 30 degrees to the side removed the reflection; reshot on the spot."
   },
   "frames": [
    "The problem was ___, so I reshot by ___."
   ],
   "stretch": [
    "Shoot a bracket (−1, 0, +1) of your lead image and compare the histograms."
   ]
  },
  "d06": {
   "today": "Choose by the brief; edit reversibly; log every edit.",
   "glossary": [
    [
     "Adjustment layer",
     "A separate layer that changes the look without altering pixels"
    ],
    [
     "Layer mask",
     "Hides parts of a layer without erasing"
    ],
    [
     "Non-destructive",
     "Every change can be undone later"
    ]
   ],
   "summary": "Pick the photo that serves the brief. Use adjustment layers and masks so the original is untouched, and note whether each edit changes what the photo claims is true.",
   "checklist": [
    "Select chosen",
    "Saved as .psd",
    "Adjustment layers only",
    "Non-destructive crop",
    "Edit log"
   ],
   "worked": {
    "title": "Worked example: different photo",
    "text": "A dim gym photo: a Curves adjustment brightens mid-tones; a mask keeps the bright windows from blowing out. Nothing is added."
   },
   "frames": [
    "I changed ___ because ___; this does / does not change what is true."
   ],
   "stretch": [
    "Make two mood versions (warm and cool) with adjustment layers only, and log the ethics."
   ]
  },
  "d07": {
   "today": "Build the layered campaign and run the 5-second test.",
   "glossary": [
    [
     "Smart Object",
     "A layer that keeps full quality when resized"
    ],
    [
     "Hierarchy",
     "The order the viewer reads things"
    ],
    [
     "Call to action",
     "The line telling the viewer what to do"
    ]
   ],
   "summary": "Place the photo as a Smart Object, add type on separate layers in the planned space, and test what a viewer reads first.",
   "checklist": [
    "Document at size",
    "Photo as Smart Object",
    "Headline, line, CTA",
    "Contrast checked",
    "Audience test and revision"
   ],
   "worked": {
    "title": "Worked example: different campaign",
    "text": "“Join the choir”: a photo of an open songbook, the headline in the empty top third, and the CTA in the bottom corner. The 5-second test showed people read the CTA first, so the headline was enlarged."
   },
   "frames": [
    "My viewer read ___ first, so I ___."
   ],
   "stretch": [
    "Design a version for a colour-blind viewer and check contrast."
   ]
  },
  "d08": {
   "today": "Adapt to the new format on your own and explain your changes.",
   "glossary": [
    [
     "Aspect ratio",
     "Width compared with height, e.g. 9:16"
    ],
    [
     "Reading order",
     "The sequence the eye follows"
    ],
    [
     "Re-crop",
     "Choosing a new frame from the same photo"
    ]
   ],
   "summary": "Keep the message and reading order in the new shape. Re-crop, move and resize; you may swap the lead photo for another original.",
   "checklist": [
    "Format known",
    "Plan written",
    "Adapted",
    "Explanation written",
    "Self-check"
   ],
   "worked": {
    "title": "No worked example today",
    "text": "This is independent evidence, so no example of the task is given. Use your success criteria."
   },
   "frames": [
    "To keep ___ readable in the new format, I moved/re-cropped ___ because ___."
   ],
   "stretch": [
    "Make a third format and compare which one lost the most."
   ]
  },
  "d09": {
   "today": "Defend two choices, compare two careers, export motion layers.",
   "glossary": [
    [
     "Layer export",
     "Saving each layer as its own file"
    ],
    [
     "Background plate",
     "A clean photo of the scene without the subject"
    ],
    [
     "Art director",
     "The person who leads the visual style of a campaign"
    ]
   ],
   "summary": "Explain one capture and one edit choice with evidence, compare two creative jobs, and separate your layers so they can move next sprint.",
   "checklist": [
    "Defence done",
    "Careers note",
    "Subject, background and text separated",
    "Layers exported",
    "Gallery post and two comments"
   ],
   "worked": {
    "title": "Worked example: different handover",
    "text": "A poster of a bike: the bike cut out with Select › Subject, the road extended by hand behind it, and three PNGs exported."
   },
   "frames": [
    "I chose ___ when shooting because ___; you can see it in ___."
   ],
   "stretch": [
    "Shoot a clean background plate next time and compare it with a hand-extended background."
   ]
  }
 }
};
