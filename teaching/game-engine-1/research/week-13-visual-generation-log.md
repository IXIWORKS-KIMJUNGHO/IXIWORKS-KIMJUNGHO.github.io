# Week 13 visual generation log

- Course: Game Engine I
- Week: 13
- Date: 2026-08-19
- Mode: OpenAI built-in image generation
- Output format: built-in PNG source converted locally to WebP with `cwebp -q 88`
- Final dimensions: 1536×1024px for every image
- Design continuity: dark top-down tactile process boards, warm paper and clear acrylic, forest-game artifacts, coral problem signals, teal evidence signals and lime verification lights

## Final workspace assets

1. `teaching/game-engine-1/assets/week-13-period1-feedback-orchestra.webp`
2. `teaching/game-engine-1/assets/week-13-period2-playtest-evidence.webp`
3. `teaching/game-engine-1/assets/week-13-period3-alpha-mission.webp`

## Period 1 · feedback orchestra

Final prompt:

```text
Use case: stylized-concept
Asset type: educational course hero image for a Unity 2D game-engine lesson
Primary request: a tactile top-down studio tableau explaining how one game event should communicate through coordinated visual and audio feedback
Scene/backdrop: matte black tabletop with a clear acrylic game-screen plate; inside it, a small mossy forest game scene with one teal-hooded adventurer, one glowing collectible, one thorn hazard, and one portal goal
Subject: each of the three gameplay events is paired with two clearly matched physical signals: a readable UI icon or status change and a clean concentric sound-wave object; include a restrained HUD with goal, current state, and next-action hierarchy, plus one obvious mute control whose critical information remains visible
Style/medium: premium handcrafted miniature product photography, physical interface artifacts, paper texture, glass and brushed metal, consistent with a high-end game design process board
Composition/framing: 3:2 landscape, overhead view, central game-screen plate, balanced teaching-diagram composition with generous margins; hierarchy must be understandable without labels
Lighting/mood: controlled soft studio light on a near-black background, calm analytical mood
Color palette: deep teal, moss green, warm parchment, muted coral for danger, small lime indicator lights
Constraints: no words, no letters, no numbers, no logos, no brand marks, no watermark; no computer-code text; exactly one adventurer; clearly distinguish visual feedback from audio-wave feedback; keep all important objects inside the frame
Avoid: neon cyberpunk, generic dashboard screenshot, clutter, flat vector art, floating holograms, excessive glow
```

Validation: one adventurer, three distinct event rows, paired visual/audio cues, a mute control, no prose labels or watermark, and all objects within frame.

## Period 2 · playtest evidence

Final prompt:

```text
Use case: stylized-concept
Asset type: educational course hero image for a professor-led Unity playtesting demonstration
Primary request: a tactile top-down evidence pipeline showing how three identical blind playtests become one small prioritized game fix and a regression check
Scene/backdrop: matte black studio tabletop with a sequence of clear acrylic and warm paper panels
Subject: on the left, exactly three separate tester stations, each with the same tiny game-screen card and one distinct wooden player token; in the center, observation artifacts representing success, elapsed time, hesitation, and a stuck point flow into a compact priority board organized by frequency and impact; on the right, one selected issue becomes a clear before-and-after pair of the same forest game screen, followed by a final green verification light
Style/medium: premium handcrafted miniature product photography, physical game-design research artifacts, paper cards, glass plates, metal pins, subtle natural textures, consistent with a high-end tabletop process board
Composition/framing: 3:2 landscape, overhead view, strong left-to-right flow, large readable objects, clean separation between observation, prioritization, repair, and regression; understandable without written labels
Lighting/mood: controlled soft studio light, calm and rigorous classroom demonstration
Color palette: near-black, deep teal, moss green, warm parchment, muted coral for problems, lime for verified state
Constraints: no words, no letters, no numbers, no logos, no brand marks, no watermark; exactly three tester tokens and exactly three test stations; each station must show the same task setup; only one issue is selected for the repair; keep all objects inside the frame
Avoid: teamwork scene, people editing together, surveys full of text, generic business analytics dashboard, neon cyberpunk, flat vector art, clutter, floating holograms
```

Validation: exactly three tester stations and three distinct tokens, repeated identical starting scene, a single selected repair, one before/after pair and final verified state.

## Period 3 · alpha mission

Initial prompt:

```text
Use case: stylized-concept
Asset type: educational course hero image for an individual goal-directed Unity lab
Primary request: a tactile top-down mission board showing one student taking a personal 2D forest game from alpha build through three independent playtests, one evidence-based repair, and final packaging
Scene/backdrop: matte black studio tabletop with clear acrylic plates, warm paper evidence cards, metal clips, and one central playable game screen
Subject: one central forest game screen with a teal-hooded adventurer, readable HUD, collectible, hazard, portal, and paired sound-feedback symbols; around it are exactly three separate tester tokens at three independent observation cards, not a team workspace; below is one before-and-after comparison of the same UI problem; include a verification rail with exactly eight illuminated green checkpoints and a final compact build package containing a game-screen thumbnail, a small evidence sheet, and two image cards
Style/medium: premium handcrafted miniature product photography, physical game-production artifacts, glass, paper, dark metal, subtle moss and fabric, consistent with a high-end course process board
Composition/framing: 3:2 landscape, overhead view, central game build as the clear focal point, testers placed on the outer edge, before-and-after and eight-checkpoint rail readable at a glance, generous margins
Lighting/mood: controlled soft studio light, focused and achievable mission atmosphere
Color palette: near-black, deep teal, moss green, warm parchment, muted coral for the issue, lime green for passed checks
Constraints: no words, no letters, no numbers, no logos, no brand marks, no watermark; exactly one adventurer, exactly three tester tokens, exactly three observation cards, exactly eight green checkpoint lights; make it visually clear that only one issue is repaired and the final package is an individual submission
Avoid: people collaborating on the project, crowded classroom, generic kanban board, surveys full of text, neon cyberpunk, flat vector art, clutter, floating holograms
```

The initial output contained nine green checkpoint lights. A single-change built-in edit was used rather than regenerating the whole composition.

Final edit prompt:

```text
Edit the most recent image only.
Change only the bottom horizontal verification rail: it currently has nine illuminated green checkpoint lights. Remove the rightmost green checkpoint and shorten or rebalance the rail so it contains exactly eight illuminated green checkpoint lights.
Keep everything else unchanged: the overhead composition, central forest game screen, exactly three tester tokens, exactly three observation cards, before-and-after comparison, final submission package, materials, color palette, lighting, and all object positions outside the verification rail.
Do not add any words, letters, numbers, logos, brand marks, or watermark.
```

Validation: exactly eight illuminated green checkpoints, three tester tokens, three observation cards, one central personal build, one before/after repair and a distinct final evidence package.

## Usage note

The images explain lesson relationships rather than substitute for UI screenshots or Unity configuration evidence. Each page includes a descriptive Korean `alt` string and intrinsic dimensions. The generated imagery is used as course presentation art; technical claims and UI steps remain text-based and link to official sources.
