# Personal Site Context

This context defines the language used to discuss the public-facing personal site and its homepage priorities.

## Language

**Professional Landing Page**:
The homepage mode that quickly establishes Kim Jungho's professional identity and directs visitors toward project work.
_Avoid_: CV page, full resume landing

**First Screen**:
The content visible on the homepage before a visitor scrolls.
_Avoid_: first page, top area

**Portfolio CTA**:
The primary action that moves a visitor from the homepage into selected project work.
_Avoid_: generic link cluster

**Hero-First Layout**:
A homepage layout where the identity statement is the strongest visual and reading priority on the First Screen.
_Avoid_: profile-first layout, CV-sidebar-first layout

**Mobile Hero Order**:
The mobile reading order where the hero identity statement appears before profile metadata.
_Avoid_: mobile profile-first order

**Compact Profile Rail**:
A low-emphasis profile area that confirms identity without competing with the hero statement.
_Avoid_: full CV sidebar, profile-first rail

**Homepage Gate**:
A small top-level pathway that helps visitors choose what to inspect next on the homepage.
_Avoid_: CV category, resume section, taxonomy label

**CV Archive**:
The detailed career record that supports credibility after the homepage gates.
_Avoid_: homepage category stack, first-screen resume

**Background Summary**:
A visible homepage section that summarizes experience, education, and teaching after the work and research gates.
_Avoid_: hidden CV archive, full resume section, research area list

**News Index**:
A compact chronological update list that helps visitors scan activity without reading full explanatory news cards.
_Avoid_: news archive, announcement article list, blog page

**Modern Gothic Sans**:
A visual tone that uses Futura-like geometry, restrained contrast, and solemn archive colors instead of ornate serif or fantasy gothic cues.
_Avoid_: blackletter gothic, horror gothic, serif editorial gothic

**Archive Lab Palette**:
A warm bone paper base with deep ink, muted stone, and steel-blue accents for research and portfolio pages.
_Avoid_: pure white corporate blue, neon tech palette, dark fantasy palette

**Interactive Proof**:
A small interaction that lets visitors sense the relationships between Kim Jungho's projects, methods, and media systems without adding decorative motion for its own sake.
_Avoid_: interactive decoration, motion background, visual gimmick

**Work System Map**:
An Interactive Proof near Featured Work that shows how selected projects connect through practice axes such as generative AI, real-time engines, digital twins, and exhibition contexts.
_Avoid_: decorative project map, portfolio filter widget, animated background

**Practice Axis**:
A short conceptual axis inside the Work System Map that groups projects by working method rather than by resume category.
_Avoid_: tag, category, filter label

**Student Handout**:
A teaching document meant to be followed during class while the instructor is guiding the activity.
_Avoid_: reference page, reading article, documentation page

**Learning Hierarchy**:
The teaching-page priority order that tells students what to understand first, what to use as reference, what to execute, and what to remember.
_Avoid_: generic layout, visual styling, decoration

**Reading Flow**:
The student-facing sequence that moves from concept to definition, example, execution result, and takeaway.
_Avoid_: content dump, article flow

**Concept Card**:
A Student Handout block that teaches one concept and contains the explanation, reference, example, and takeaway for that concept.
_Avoid_: practice card, summary box, generic section

**Quiet Section Card**:
A Concept Card presentation that makes the learning unit clear without turning the page into a stack of heavy boxes.
_Avoid_: card stack, decorative card, floating panel

**Practice Step Card**:
A Student Handout block that guides one practice step while using the same quiet presentation as a Concept Card.
_Avoid_: generic step, exercise page fragment

**Explanation-First Flow**:
A Reading Flow where prose frames the concept before code confirms it.
_Avoid_: code-first tutorial, example dump

**Confirmation Content**:
Supporting material, such as code or a table, that verifies a concept after the concept has been explained.
_Avoid_: primary content, main lesson object

**Reference Content**:
Supporting material, such as tables, rules, or checklists, that organizes information students may revisit while applying a concept.
_Avoid_: main explanation, confirmation content

**Takeaway Callout**:
A small end-of-card anchor that states what students should remember from a Concept Card.
_Avoid_: large callout, summary section, decorative note

## Relationships

- A **Professional Landing Page** has exactly one primary **First Screen**.
- The **First Screen** foregrounds one identity statement and one **Portfolio CTA**.
- A **Hero-First Layout** makes the identity statement more prominent than profile metadata.
- **Mobile Hero Order** preserves the **Hero-First Layout** on narrow screens.
- A **Compact Profile Rail** supports a **Hero-First Layout** by keeping portrait and contact details secondary.
- A **Professional Landing Page** presents a few **Homepage Gates** instead of many CV categories.
- A **CV Archive** can contain detailed CV material on supporting pages or lower-priority views.
- Detailed CV material belongs after the **First Screen** or on supporting pages.
- A **Background Summary** makes experience, education, and teaching visible without reopening the homepage as a full CV.
- Publications and patents belong under **Writing & Research**, not inside the **Background Summary**.
- Research area lists are omitted when the **Work System Map** and selected work already communicate the practice axes.
- A **News Index** presents dates, titles, and short activity axes instead of full explanatory card bodies.
- A **News Index** should match the scanning density of the work index.
- **Modern Gothic Sans** is the visual tone for the public personal site.
- The **Archive Lab Palette** supports **Modern Gothic Sans** while preserving readability.
- An **Interactive Proof** should reveal working relationships between projects, methods, or media systems.
- An **Interactive Proof** remains secondary to the **Hero-First Layout** and must not compete with the First Screen identity statement.
- A **Work System Map** is the first preferred Interactive Proof for the homepage.
- A **Work System Map** belongs near **Featured Work**, where visitors judge the practice through selected projects.
- A **Work System Map** explains connections rather than filtering, hiding, or resorting projects.
- A **Work System Map** uses four **Practice Axes**: Generative AI, Real-Time Engine, Digital Twin, and Exhibition System.
- A **Student Handout** should express a clear **Learning Hierarchy**.
- A **Learning Hierarchy** is visible through the **Reading Flow** of each lesson section.
- A **Concept Card** belongs to exactly one concept, while exercises and code examples support that concept inside the card.
- A **Concept Card** should usually appear as a **Quiet Section Card**.
- A **Practice Step Card** uses the same quiet presentation as a **Concept Card**, but its unit is a practice step instead of a concept.
- A **Concept Card** uses an **Explanation-First Flow** unless the lesson is explicitly assessing code reading.
- Code examples are **Confirmation Content** inside a **Concept Card**.
- Tables, rules, and checklists are **Reference Content** inside a **Concept Card**.
- A **Concept Card** can end with a **Takeaway Callout** that anchors the concept without overpowering the explanation.

## Example dialogue

> **Dev:** "Should the First Screen list current roles, research areas, and links equally?"
> **Domain expert:** "No — as a Professional Landing Page, it should first make the identity clear and then point people to the Portfolio CTA."
>
> **Dev:** "Should the portrait and contact details lead the First Screen?"
> **Domain expert:** "No — in a Hero-First Layout, they support the identity statement instead of competing with it."
>
> **Dev:** "On mobile, should the portrait come before the identity statement?"
> **Domain expert:** "No — Mobile Hero Order keeps the identity statement first, then moves profile metadata below it."
>
> **Dev:** "Should the desktop profile rail be visually equal to the hero?"
> **Domain expert:** "No — the Compact Profile Rail should confirm who this is while letting the hero statement lead."
>
> **Dev:** "Should the homepage expose publications, patents, projects, teaching, and research interests as equal sections?"
> **Domain expert:** "No — the homepage should use a few Homepage Gates, place publications and patents under Writing & Research, and keep experience, education, and teaching in a Background Summary."
>
> **Dev:** "Should CV Archive remain a collapsed block on the homepage?"
> **Domain expert:** "No — use a Background Summary for experience, education, and teaching, and move publications and patents into Writing & Research."
>
> **Dev:** "Should news entries read like mini articles?"
> **Domain expert:** "No — use a News Index so visitors can scan dates, titles, and activity axes quickly."
>
> **Dev:** "Should the site use serif gothic typography?"
> **Domain expert:** "No — Modern Gothic Sans keeps the Futura-like voice and expresses gothic through tone, color, contrast, and structure."
>
> **Dev:** "Should interactive elements make the site feel more dynamic?"
> **Domain expert:** "Only when they act as an Interactive Proof: they should reveal how the work connects instead of decorating the page."
>
> **Dev:** "Should the first Interactive Proof go on the news page?"
> **Domain expert:** "No — use a Work System Map near Featured Work so the interaction explains the practice, not just the chronology."
>
> **Dev:** "Should the Work System Map behave like a portfolio filter?"
> **Domain expert:** "No — it should keep the project set visible and quietly highlight the projects connected to the selected practice axis."
>
> **Dev:** "How many axes should the Work System Map expose?"
> **Domain expert:** "Use four Practice Axes: Generative AI, Real-Time Engine, Digital Twin, and Exhibition System. Keep the names short and let the selected description explain them."
>
> **Dev:** "Should a teaching page optimize for long-form reading?"
> **Domain expert:** "No — as a Student Handout, it should make the Learning Hierarchy obvious while class is moving."
>
> **Dev:** "Can tables, code, explanations, and takeaways carry the same visual weight?"
> **Domain expert:** "No — the Reading Flow should distinguish what students read, reference, run, and remember."
>
> **Dev:** "Should one card represent one exercise?"
> **Domain expert:** "No — one Concept Card represents one concept, and the exercise exists to prove that concept."
>
> **Dev:** "Should Concept Cards look like prominent boxed panels?"
> **Domain expert:** "No — they should appear as Quiet Section Cards so the structure is clear but the page still reads as a handout."
>
> **Dev:** "Should practice pages use the same visual language?"
> **Domain expert:** "Yes — use Practice Step Cards so Step sections are easy to follow without pretending each step is a concept."
>
> **Dev:** "Should students see code before the idea is explained?"
> **Domain expert:** "No — the Concept Card should explain the idea first, then use code to confirm it."
>
> **Dev:** "Should the code block be the strongest visual object in a Concept Card?"
> **Domain expert:** "No — code is Confirmation Content, so it should support the explanation without overpowering it."
>
> **Dev:** "Should tables behave like code examples?"
> **Domain expert:** "No — tables are Reference Content, so they should organize information without taking over the card."
>
> **Dev:** "Should each concept end with a large summary block?"
> **Domain expert:** "No — use a small Takeaway Callout so students can recover the point without breaking the handout flow."

## Flagged ambiguities

- "first page" was used to mean both the whole homepage and the visible opening viewport — resolved: use **First Screen** for the opening viewport.
- "category" was used for both visitor pathways and detailed CV groupings — resolved: use **Homepage Gate** for visitor pathways and **CV Archive** for detailed career groupings.
- "CV Archive" was too broad for the visible homepage — resolved: use **Background Summary** for experience, education, and teaching, while publications and patents live under **Writing & Research**.
- "news archive" suggested long-form stored announcements — resolved: use **News Index** for compact chronological scanning.
- "interactive" was used ambiguously as either visual motion or evidence of working logic — resolved: use **Interactive Proof** for interaction that reveals project and method relationships.
- "interactive map" was used ambiguously as either filtering or explanation — resolved: a **Work System Map** explains connections without hiding projects.
- "axis" was used to mean a conceptual working method, not a portfolio tag — resolved: use **Practice Axis** inside the Work System Map.
- "layout" was used to mean both visual arrangement and teaching priority — resolved: use **Learning Hierarchy** for the student-facing priority order in teaching pages.
- "learning card" was used ambiguously as either an exercise unit or a concept unit — resolved: use **Concept Card** for one-concept teaching blocks.
- "card" was used ambiguously as either a heavy boxed panel or a learning unit — resolved: use **Quiet Section Card** for the visual presentation.
- "Step" sections in practice pages were not concepts — resolved: use **Practice Step Card** for practice-step teaching blocks.
- "code example" was used ambiguously as either the main lesson object or a confirmation tool — resolved: use **Explanation-First Flow** so code confirms the concept.
- "code" was used ambiguously as either primary content or supporting evidence — resolved: use **Confirmation Content** for code inside a Concept Card.
- "table" was grouped with code as supporting material — resolved: use **Reference Content** for tables, rules, and checklists.
- "summary" was used ambiguously as either a section-level recap or a small learning anchor — resolved: use **Takeaway Callout** for end-of-card anchors.
