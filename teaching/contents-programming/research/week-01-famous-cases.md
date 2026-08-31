# Week 01 famous-case replacements

Research for the Fall 2026 *Contents Programming* orientation (humanities / art / design first-years, Python / Colab). Students already analyse works as **INPUT / RULE / OUTPUT**. The current week-01 pair is Casey Reas, *Process* (generative) and Giorgia Lupi & Stefanie Posavec, *Dear Data* (data art). Extended cases already in the course — Aaron Koblin, *Flight Patterns*; Fernanda Viégas & Martin Wattenberg, *Wind Map*; Rafael Lozano-Hemmer, *Pulse Room* — are out of bounds for case 1 / case 2.

This note proposes three generative candidates and three data-art candidates that are more canonical for first-years than Reas’s *Process* series and *Dear Data*, then recommends one pair that keeps the generative vs data-art contrast and can be taught in about twenty minutes.

**Method.** Claims below are taken from artist sites, museum collection and exhibition pages, and original objects or artist statements. Blog roundups and Wikipedia are not used as evidence.

**Classroom image rule.** Do not copy copyrighted photographs onto the course site. Open official pages in class. Public-domain plates (Minard 1869; Du Bois 1900) may be hosted with institutional credit.

---

## Why replace the current pair

| Current case | Official page | Pedagogical slot | Fame problem for first-years |
| --- | --- | --- | --- |
| Casey Reas, *Process* | [reas.com/process](https://reas.com/process) | Generative / rule-based, no external dataset | Canonical inside creative coding; not a household art-history name |
| Giorgia Lupi & Stefanie Posavec, *Dear Data* (2014–15) | [dear-data.com/theproject](https://www.dear-data.com/theproject); MoMA acquired the 104 postcards in 2016 ([MoMA Magazine](https://www.moma.org/magazine/articles/309)) | Personal data mapped by hand to visual form | Design-world famous, MoMA-collected, still younger and less textbook-canonical than the works below |

Reas’s instruction-and-software systems sit in a longer line that museums already teach as “the idea becomes a machine that makes the art” (Sol LeWitt, “Paragraphs on Conceptual Art,” *Artforum*, June 1967; full text via [Artforum on the Internet Archive](https://web.archive.org/web/20200726100127/https://www.artforum.com/print/196706/paragraphs-on-conceptual-art-36719)). *Dear Data* sits in a longer line of personal and public data given visual form (On Kawara’s daily records; Du Bois’s 1900 charts; Minard’s 1869 flow map). Replacing the current pair with those parents is the fame move.

---

## Case 1 — generative / rule-based (no external real-world dataset)

Ranked for first-year name recognition, museum canonicity, and INPUT / RULE / OUTPUT clarity.

### 1. Sol LeWitt, *Wall Drawing #289*, 1976 (recommended Case 1)

**Artist / title / year.** Sol LeWitt (1928–2007), *Wall Drawing #289*, July 1976. Medium at MASS MoCA and in the Whitney collection: white crayon lines and black pencil grid on black wall. Whitney accession 78.1.1–4.

**Why more famous.** LeWitt is a standard name in introductory art history as a founder of Conceptual Art. MASS MoCA’s *Sol LeWitt: A Wall Drawing Retrospective* installs 105 wall drawings on three floors of a mill building, on view through 2043, produced from instructions and diagrams rather than unique handmade objects ([MASS MoCA exhibition page](https://massmoca.org/event/sol-lewitt-a-wall-drawing-retrospective/)). MoMA’s collection label states that the works are “executed by others according to the artist’s instructions” and quotes LeWitt’s rule that “once the idea of the piece is established in the artist’s mind and the final form is decided, the process is carried out blindly,” comparing the artist to a composer and the drafter to a pianist ([MoMA, *Wall Drawing #1187*](https://www.moma.org/collection/works/175905)). In 1967 LeWitt wrote: “When an artist uses a conceptual form of art, it means that all of the planning and decisions are made beforehand and the execution is a perfunctory affair. The idea becomes a machine that makes the art” ([*Artforum*, June 1967, archived text](https://web.archive.org/web/20200726100127/https://www.artforum.com/print/196706/paragraphs-on-conceptual-art-36719)). Whitney education materials already use a wall drawing as a classroom instruction exercise ([Whitney, “Drawing Instructions”](https://whitney.org/education/families/kids-art-challenge/sol-lewitt)).

**INPUT / RULE / OUTPUT.** Input is a wall, a 6-inch (15 cm) grid, and a written instruction. The instruction for the fourth wall — the wall LeWitt chose to show at MASS MoCA — is: “A 6-inch (15 cm) grid covering each of the four black walls. White lines to points on the grids. Fourth wall: twenty-four lines from the center, twelve lines from the midpoint of each of the sides, twelve lines from each corner. (The length of the lines and their placement are determined by the drafter.)” ([MASS MoCA, *Wall Drawing 289*](https://massmoca.org/event/walldrawing289/)). The rule does not use an external dataset: starting locations are fixed; endpoints are chosen by the drafter on the grid. Output is a unique wall drawing; MASS MoCA notes that the instructions “present a sort of drawing problem that the draftsmen must solve” and that this work “define[s] the starting locations of the lines, but not where they end” ([same page](https://massmoca.org/event/walldrawing289/)). First installation: Detroit Institute of Arts; first installation of the fourth wall only: The Museum of Modern Art, January 1978; first drawn by Jo Watanabe ([same page](https://massmoca.org/event/walldrawing289/)).

**Official URLs (open in class).**

- Work + full instruction: [https://massmoca.org/event/walldrawing289/](https://massmoca.org/event/walldrawing289/)
- Retrospective context: [https://massmoca.org/event/sol-lewitt-a-wall-drawing-retrospective/](https://massmoca.org/event/sol-lewitt-a-wall-drawing-retrospective/)
- Classroom instruction analogue, with Whitney collection photo of the fourth wall: [https://whitney.org/education/families/kids-art-challenge/sol-lewitt](https://whitney.org/education/families/kids-art-challenge/sol-lewitt)
- Artist statement on idea vs execution (openable full text): [https://web.archive.org/web/20200726100127/https://www.artforum.com/print/196706/paragraphs-on-conceptual-art-36719](https://web.archive.org/web/20200726100127/https://www.artforum.com/print/196706/paragraphs-on-conceptual-art-36719)
- MoMA on instruction-based execution: [https://www.moma.org/collection/works/175905](https://www.moma.org/collection/works/175905)

**Images: link vs host.** © Sol LeWitt / Artists Rights Society (ARS), New York ([MoMA object page](https://www.moma.org/collection/works/175905); [Whitney education page](https://whitney.org/education/families/kids-art-challenge/sol-lewitt)). Link the museum pages. Do not host installation photos. The instruction text itself can be quoted and, in class, executed on paper (Whitney already publishes a simplified instruction exercise).

**Classroom-fit risks.** Not computational on the surface — some students may not see the Python connection until you say “the instruction is the program, the drafter is the runtime.” That is a feature for week 01: it separates *rule* from *computer*. Slightly more abstract than Reas’s on-screen *Process* drawings; the Whitney paper exercise (24 circles, straight vs wavy lines) closes that gap in five minutes. Not similar to the extended cases.

---

### 2. Vera Molnár, *Interruptions*, 1968

**Artist / title / year.** Vera Molnár (1924–2023), *Interruptions*, 1968. Computer drawing, black ink on Benson plotter paper. Example in the Morgan Library: 12 5/8 × 12 5/8 in. (32 × 32 cm), gift of Agnes Gund, 2017.353 ([Morgan, *Interruptions*](https://www.themorgan.org/drawings/item/405692)). Closely related colour plotter work, easier to see on a projector: *(Des)Ordres* [(Dis)Order], Paris, 1974, V&A E.271-2011 ([V&A](https://collections.vam.ac.uk/item/O1193781/desordres-drawing-molnar-vera/)).

**Why more famous.** Centre Pompidou’s 2024 retrospective *Vera Molnár: Speak to the Eye* (28 Feb–26 Aug 2024) presented her as “a pioneer of digital art” and “the first artist in France (1968) to produce digital drawings using a computer connected to a plotter,” after years of running an “imaginary machine” by hand ([Centre Pompidou](https://www.centrepompidou.fr/en/program/calendar/event/PA7jRZ5)). The museum holds multiple works from the donation and purchase of her estate, including *OTTWW* (1981–2010) and *Identiques mais différents* (2010) ([Pompidou *OTTWW*](https://www.centrepompidou.fr/fr/ressources/oeuvre/cqpGk6d)). The Morgan calls her “a pioneer of computer art” and *Interruptions* “one of the first she produced with a computer” ([Morgan](https://www.themorgan.org/drawings/item/405692)). Toledo Museum of Art’s 2025 *Infinite Images: The Art of Algorithms* uses *Interruptions* to define generative art for a general audience ([Toledo / Infinite Images](https://infiniteimages.toledomuseum.org/artwork/interruptions)).

**INPUT / RULE / OUTPUT.** Input is a regular grid of equal-length straight lines and a small set of parameters — not a census, sensor feed, or other real-world table. Toledo’s catalogue text, drawing on Molnár’s process, states: she began with a 25-by-25 grid, randomly rotated each line, and “introduced random interruptions that result in sections where the lines are erased to create voids,” changing “a single parameter at a time” ([Infinite Images](https://infiniteimages.toledomuseum.org/artwork/interruptions)). The Morgan notes that “the voids in the drawing are the result of randomness that Molnar built into the program” and quotes her preference for a “disturbed equilibrium” over an all-over field ([Morgan, Order and Disorder](https://www.themorgan.org/morganmobile/order-and-disorder/molnar)). Output is a unique plotter drawing. The V&A’s *(Des)Ordres* makes the same order/disorder rule visible in colour: “she changed the parameters of her algorithm to randomly disrupt the regularity of the concentric squares” on a 20 × 20 grid of nested squares ([V&A](https://collections.vam.ac.uk/item/O1193781/desordres-drawing-molnar-vera/)). Centre Pompidou summarises the 1970s plotter work as “the introduction of a certain percentage of disorder in simple geometric compositions” ([Pompidou](https://www.centrepompidou.fr/en/program/calendar/event/PA7jRZ5)).

**Official URLs (open in class).**

- Morgan object (1968 plotter drawing): [https://www.themorgan.org/drawings/item/405692](https://www.themorgan.org/drawings/item/405692)
- Toledo exhibition label (clear process description): [https://infiniteimages.toledomuseum.org/artwork/interruptions](https://infiniteimages.toledomuseum.org/artwork/interruptions)
- V&A *(Des)Ordres* (colour, 1974): [https://collections.vam.ac.uk/item/O1193781/desordres-drawing-molnar-vera/](https://collections.vam.ac.uk/item/O1193781/desordres-drawing-molnar-vera/)
- Centre Pompidou retrospective: [https://www.centrepompidou.fr/en/program/calendar/event/PA7jRZ5](https://www.centrepompidou.fr/en/program/calendar/event/PA7jRZ5)

**Images: link vs host.** © Vera Molnár / ADAGP, Paris / ARS, New York ([Morgan](https://www.themorgan.org/drawings/item/405692); [Infinite Images](https://infiniteimages.toledomuseum.org/artwork/interruptions)). Link museum pages. Do not host. V&A collection images are viewable on the object page.

**Classroom-fit risks.** Name recognition is high in generative-art and museum circles after the 2024 Pompidou show, still lower than LeWitt for Korean first-years who have had a standard contemporary-art survey. Visually close to Nees’s *Schotter* (order collapsing into disorder), so do not teach both as the two week-01 cases. Not AI-hype if you stay on 1968 FORTRAN / plotter work and skip NFT/AI magazine framing ([Pompidou magazine title “AI, NFT: Vera Molnár, a step ahead”](https://www.centrepompidou.fr/en/pompidou-plus/magazine/article/ai-nft-vera-molnar-a-step-ahead) is a risk if students land on that page). Not similar to the extended cases.

---

### 3. Georg Nees, *Schotter* (*Gravel*), 1968–70

**Artist / title / year.** Georg Nees (1926–2016), *Schotter* (*Gravel*), Germany, 1968–70. Lithograph in black ink after a computer-generated graphic. V&A museum no. E.217-2008, given by the Computer Arts Society ([V&A](https://collections.vam.ac.uk/item/O221321/schotter-print-nees-georg/)).

**Why more famous.** *Schotter* is the single most reproduced image of early computer art. The V&A identifies Nees as “one of the founders of computer art and graphics” and one of the first to exhibit computer graphics, at the Studiogalerie of the Technische Hochschule Stuttgart in February 1965 ([V&A](https://collections.vam.ac.uk/item/O221321/schotter-print-nees-georg/)). He received a doctorate in 1969 on generative computer graphics under Max Bense; the V&A notes he used ALGOL on a Siemens system and a Zuse Graphomat plotter ([same page](https://collections.vam.ac.uk/item/O221321/schotter-print-nees-georg/)). For a programming course this is the canonical “loop + random()” picture, more historically prior than Reas’s *Process* series.

**INPUT / RULE / OUTPUT.** Input is a set of identical squares and a random-number generator — no external dataset. The V&A gallery label for *Chance and Control: Art in the Age of Computers* (2018) states: “Nees was fascinated by the relationship between order and disorder in picture composition. To create this work, he introduced random variables into the computer program, causing orderly squares to descend into a heap” ([V&A](https://collections.vam.ac.uk/item/O221321/schotter-print-nees-georg/)). Output is a plotter drawing (later lithograph) in which rotation and displacement increase down the page until the grid reads as gravel.

**Official URLs (open in class).**

- V&A object (image + label): [https://collections.vam.ac.uk/item/O221321/schotter-print-nees-georg/](https://collections.vam.ac.uk/item/O221321/schotter-print-nees-georg/)

**Images: link vs host.** Link the V&A page, which already displays the work. Do not scrape and rehost. The Computer Arts Society gift record is V&A E.217-2008.

**Classroom-fit risks.** The *image* is famous; the *name* Georg Nees is not more famous than Casey Reas for first-years. Best as a three-minute supporting slide if LeWitt is Case 1, or as the Case 1 if the instructor wants a work students can re-code in Colab the same week. Visually similar to Molnár’s order/disorder plots. Not AI, not similar to the extended cases. Slightly “computer-history” rather than “art-history textbook.”

---

## Case 2 — data art / public or personal data mapped to visual form

Ranked for first-year fame, clarity of data-to-form mapping, and a usable official page.

### 1. Charles-Joseph Minard, *Carte figurative des pertes successives en hommes de l’armée française dans la campagne de Russie 1812–1813*, 1869

**Artist / title / year.** Charles-Joseph Minard (1781–1870), *Carte figurative des pertes successives en hommes de l’armée française dans la Campagne de Russie 1812–13 (comparées à celle d’Hannibal durant la 2ème Guerre Punique)*, Paris, 20 November 1869. Lithograph sheet with two figurative maps (Hannibal above, Russia below). Bibliothèque nationale de France, département Cartes et plans, GE DON-4182 ([Gallica](https://gallica.bnf.fr/ark:/12148/btv1b52504201x)).

**Why more famous.** This is the most cited statistical graphic in the world. The original object is on Gallica as a public-domain BnF sheet ([Gallica](https://gallica.bnf.fr/ark:/12148/btv1b52504201x)). The story it pictures — Napoleon’s 1812 invasion of Russia — is already in first-year world-history memory, so the sheet is readable before anyone learns Minard’s name. Unlike *Dear Data* (2014–15, MoMA 2016), it has had 150 years of textbook circulation as *the* demonstration that numbers can be given a visual body.

**INPUT / RULE / OUTPUT.** Input is historical data Minard prints on the sheet itself: successive troop counts, the route into and out of Russia, and (on the retreat) temperature, compiled from named sources on the legend (Thiers, de Ségur, de Fezensac, de Chambray, and the unpublished diary of Jacob, pharmacist of the army). The rule is also printed on the work: the numbers of men present are represented by the widths of the coloured zones at a rate of one millimetre for every ten thousand men; tan/red marks the advance, black the retreat; a temperature graph is aligned to the return march ([Gallica original](https://gallica.bnf.fr/ark:/12148/btv1b52504201x)). Output is a single flow map on which a band that begins 422,000 men wide collapses to about 10,000. No software is required to see the mapping.

**Official URLs (open in class).**

- Original sheet (zoomable, public domain): [https://gallica.bnf.fr/ark:/12148/btv1b52504201x](https://gallica.bnf.fr/ark:/12148/btv1b52504201x)

**Images: link vs host.** Author died 1870; BnF marks the Gallica record as public domain. Hosting a scan *from Gallica*, with credit “Bibliothèque nationale de France, GE DON-4182,” is legally the cleanest Case 2 option in this list. Prefer linking Gallica in class so students see the original object, including the Hannibal comparison on the same sheet.

**Classroom-fit risks.** Not “contemporary art”; some students will file it under history class. Counter: the printed legend *is* a program, and the sheet is the ancestor of every later data artwork in the course. Not similar to *Flight Patterns*, *Wind Map*, or *Pulse Room* (no live feed, no sensors). Too little “art-world” aura if the instructor wants a museum-artist name to match LeWitt — in that case use Du Bois (next). Twenty minutes is easy: read the legend, trace the band, name the encodings.

---

### 2. W. E. B. Du Bois and Atlanta University, *The Georgia Negro: A Social Study* and the 1900 Paris data portraits

**Artist / title / year.** W. E. B. Du Bois (1868–1963) with students at Atlanta University, 63 hand-drawn statistical charts for the *Exhibit of American Negroes* at the Exposition Universelle, Paris, 1900. Lead plate: *The Georgia Negro: A Social Study*, ink and watercolor, Library of Congress Prints and Photographs Division, LOT 11931, no. 1, LC-DIG-ppmsca-33863 ([LoC item](https://www.loc.gov/pictures/item/2013650420/)).

**Why more famous.** Du Bois is a world-historical name in a way Lupi and Posavec are not. The Library of Congress holds the original boards and states they were “prepared by Du Bois for the Negro Exhibit of the American Section at the Paris Exposition Universelle in 1900 to show the economic and social progress of African Americans since emancipation,” with “no known restrictions on publication” ([LoC item](https://www.loc.gov/pictures/item/2013650420/)). Cooper Hewitt, Smithsonian Design Museum, showed them as design, not only as sociology: *Deconstructing Power: W. E. B. Du Bois at the 1900 World’s Fair* (9 Dec 2022–29 May 2023) placed “20 innovative data visualizations” from the LoC loan in dialogue with decorative arts, and stated that “Du Bois and his Atlanta University students made 63 hand-drawn diagrams that used shape, line, and color” ([Cooper Hewitt exhibition](https://www.cooperhewitt.org/exhibition/deconstructing-power-w-e-b-du-bois-at-the-1900-worlds-fair/)). The LoC item record notes the same charts were exhibited in that Cooper Hewitt show ([LoC item](https://www.loc.gov/pictures/item/2013650420/)).

**INPUT / RULE / OUTPUT.** Input is public sociological and census data on Black life in Georgia and the United States (population, occupations, literacy, land, migration, etc.). The rule is a designed visual encoding, different on each plate: area, length, spiral, map, comparative bar, colour. Cooper Hewitt: the diagrams “used shape, line, and color to showcase the success Black Americans had achieved despite facing pervasive racism” ([Cooper Hewitt](https://www.cooperhewitt.org/exhibition/deconstructing-power-w-e-b-du-bois-at-the-1900-worlds-fair/)). Output is a set of presentation boards — modernist in look, rhetorical in purpose — made for a world’s fair, not a dashboard. Pick one plate for a 10-minute read (the Georgia spiral/map is the usual opener).

**Official URLs (open in class).**

- *The Georgia Negro: A Social Study* (LoC, high-res, no known restrictions): [https://www.loc.gov/pictures/item/2013650420/](https://www.loc.gov/pictures/item/2013650420/)
- Full Paris 1900 photographs and charts collection: [https://www.loc.gov/collections/african-american-photographs-1900-paris-exposition/](https://www.loc.gov/collections/african-american-photographs-1900-paris-exposition/)
- Cooper Hewitt exhibition (design-museum frame): [https://www.cooperhewitt.org/exhibition/deconstructing-power-w-e-b-du-bois-at-the-1900-worlds-fair/](https://www.cooperhewitt.org/exhibition/deconstructing-power-w-e-b-du-bois-at-the-1900-worlds-fair/)

**Images: link vs host.** LoC: “No known restrictions on publication” ([item record](https://www.loc.gov/pictures/item/2013650420/)). Hosting LoC scans with credit is permitted. Still prefer linking the LoC viewer in class so students see cataloguing, dates, and the rest of the set.

**Classroom-fit risks.** Historical racism and the word “Negro” in period titles need a one-sentence content note (Cooper Hewitt already does this in its public programs). Not computational originally (hand-drawn), which matches *Dear Data* and is an advantage in week 01 before Python. Political density is real but one plate in ten minutes is teachable. Not similar to the extended cases. Stronger “famous person” than Minard; slightly weaker “single iconic image.”

---

### 3. Mark Hansen and Ben Rubin, *Listening Post*, 2001–05

**Artist / title / year.** Mark Hansen and Ben Rubin, *Listening Post*, 2001 (artist’s date) / 2005 (Science Museum acquisition edition). Vacuum-fluorescent text displays, 8-channel audio, software, electronics; 231 screens in 11 rows × 21 columns. Artist page: EAR Studio ([earstudio.com](https://www.earstudio.com/projects/project-page/listening-post)). Collections: Science Museum, London, object 2014-47 ([Science Museum Group](https://collection.sciencemuseumgroup.org.uk/objects/co8091687/listening-post)); second edition acquired by the San Jose Museum of Art (listed on the artist page). Whitney Museum exhibition: 17 Dec 2002–9 Mar 2003, curated by Debra Singer ([Whitney](https://whitney.org/exhibitions/listening-post)).

**Why more famous.** This is the canonical live-internet data artwork of the early 2000s. The artist’s page records a Prix Ars Electronica Golden Nica for interactive art (2004), a Webby for net art (2003), and exhibition at the Whitney, Reina Sofía, Science Museum, San Jose Museum of Art, and BAM ([EAR Studio](https://www.earstudio.com/projects/project-page/listening-post)). The Science Museum describes “an audio visual art installation… [that] immerses the audience in computer-synthesised text, voice and other audio fragments sampled from the internet” ([Science Museum Group](https://collection.sciencemuseumgroup.org.uk/objects/co8091687/listening-post)). It is more institutionally awarded as electronic art than *Dear Data*, and unlike *Wind Map* / *Flight Patterns* it is a room-scale text-and-voice system, not a map.

**INPUT / RULE / OUTPUT.** Input is a live harvest of public internet language. The artists: “*Listening Post* culls text fragments in real time from thousands of unrestricted Internet chat rooms, bulletin boards and other public forums. The texts are read (or sung) by a voice synthesizer, and simultaneously displayed across a suspended grid of more than two hundred small electronic screens.” It “cycles through a series of six movements, each a different arrangement of visual, aural, and musical elements, each with its own data processing logic” ([EAR Studio](https://www.earstudio.com/projects/project-page/listening-post)). Output is a hanging grid plus eight-channel sound: data as choir, not as chart.

**Official URLs (open in class).**

- Artist statement + exhibition history: [https://www.earstudio.com/projects/project-page/listening-post](https://www.earstudio.com/projects/project-page/listening-post)
- Science Museum collection (photos of the installed work): [https://collection.sciencemuseumgroup.org.uk/objects/co8091687/listening-post](https://collection.sciencemuseumgroup.org.uk/objects/co8091687/listening-post)
- Whitney exhibition record: [https://whitney.org/exhibitions/listening-post](https://whitney.org/exhibitions/listening-post)

**Images: link vs host.** Artwork © Mark Hansen and Ben Rubin / EAR Studio ([Science Museum credit line](https://collection.sciencemuseumgroup.org.uk/objects/co8091687/listening-post)). Science Museum installation photographs are released CC BY-NC-SA 4.0 on that page — still not a reason to rehost on a course site; link the collection page. Do not scrape other installation photos.

**Classroom-fit risks.** Chat-room source text can include sexual, hostile, or otherwise unusable language — a real orientation-week problem; use artist-approved documentation rather than a live feed. The work is an installation; without a video clip on the artist or museum page, first-years only see stills. Slight kinship with *Pulse Room* (room-scale grid of human signals) but the data is language, not heartbeats, and there is no body sensor. Chat rooms as a social form will need one sentence of historical framing. Harder than Minard or Du Bois to finish in ten minutes.

---

## Recommended pair (20 minutes)

**Case 1: Sol LeWitt, *Wall Drawing #289* (1976)**  
**Case 2: Charles-Joseph Minard, *Carte figurative… campagne de Russie 1812–1813* (1869)**

| Criterion | Why this pair |
| --- | --- |
| Generative vs data contrast | LeWitt uses no external dataset: a written rule plus a drafter. Minard is nothing but external data given a visual body. |
| More famous than Reas / *Dear Data* | LeWitt is a survey-course name; Napoleon’s 1812 march is a survey-course story; the Minard sheet is the most canonical data picture in existence. |
| INPUT / RULE / OUTPUT in 20 minutes | Ten minutes: read LeWitt’s fourth-wall instruction, execute a paper version (Whitney already wrote one). Ten minutes: open Gallica, read the millimetre legend, trace the shrinking band. Both works print their “source code” on or beside the object. |
| Official pages students can open | [MASS MoCA *Wall Drawing 289*](https://massmoca.org/event/walldrawing289/); [Whitney instruction exercise](https://whitney.org/education/families/kids-art-challenge/sol-lewitt); [Gallica original](https://gallica.bnf.fr/ark:/12148/btv1b52504201x). |
| Images on the course site | Do not host LeWitt photos (ARS). Do not need to host Minard; if a still is required, use the BnF public-domain scan with credit. |
| Distance from extended cases | No live sensor, no wind, no flight paths. |
| Later Colab hook | Week 03–05 can re-code LeWitt as random line endpoints on a grid; week 09–11 can re-code Minard as a flow map. Nees *Schotter* remains available as a same-week coding demo without stealing Case 1. |

**Script (approx. 20 minutes).**

1. Open [MASS MoCA *Wall Drawing 289*](https://massmoca.org/event/walldrawing289/). Read the instruction aloud. Name INPUT (wall, grid, sentence), RULE (24 / 12 / 12 lines from center, midpoints, corners; drafter chooses length and end-grid-point), OUTPUT (this unique wall). One sentence from LeWitt 1967: the idea is the machine ([*Artforum* via Internet Archive](https://web.archive.org/web/20200726100127/https://www.artforum.com/print/196706/paragraphs-on-conceptual-art-36719)). Optional 3-minute paper run of the Whitney circle exercise ([Whitney](https://whitney.org/education/families/kids-art-challenge/sol-lewitt)).
2. Open [Gallica, GE DON-4182](https://gallica.bnf.fr/ark:/12148/btv1b52504201x). Name INPUT (troop counts, route, temperature), RULE (1 mm = 10,000 men; colour = direction; lower graph = cold), OUTPUT (a band that is an army). Ask: what is *not* in the picture (faces, flags, Napoleon)?
3. Contrast sentence: Case 1 generates form from a rule; Case 2 maps facts onto form. Both are programs. Python is one way to run a program.

**If the instructor wants a design-museum Case 2 instead of a statistical graphic,** swap Minard for Du Bois, *The Georgia Negro* ([LoC](https://www.loc.gov/pictures/item/2013650420/); [Cooper Hewitt](https://www.cooperhewitt.org/exhibition/deconstructing-power-w-e-b-du-bois-at-the-1900-worlds-fair/)). That pair stays inside art/design institutions, gives a more famous *named author* for humanities students, and is still public domain. It is slightly slower to teach because encodings change plate by plate.

---

## Considered, not ranked as Case 1 / Case 2

| Work | Primary sources | Why not ranked |
| --- | --- | --- |
| Harold Cohen, *AARON* (from late 1960s; Whitney collected software includes *AARON KCAT*, 2001) | [Whitney exhibition](https://whitney.org/exhibitions/harold-cohen-aaron) | Genuinely generative (Whitney: flora generated from rules about size, branching, leaf pattern, not stored pictures). The 2024 Whitney show frames it as “the earliest artificial intelligence (AI) program for artmaking” beside DALL·E / Midjourney — too much AI-hype for an orientation that must teach *rules*, not models. |
| Ryoji Ikeda, *datamatics* (2006– ) | [ryojiikeda.com/project/datamatics](https://www.ryojiikeda.com/project/datamatics/); Centre Pompidou co-production of *datamatics* [ver.2.0] (2008) listed on that page; Korean presentation at ACC Gwangju 2025 (*data.gram [nº8]*, *data.flux [nº2]*) on the same official page | Famous in East Asia, official site is excellent, but INPUT is “pure data” (hard-drive errors, code, scientific sets) and OUTPUT is immersive black-and-white spectacle. Too abstract for a 20-minute I/R/O lesson; sensory kin to *Pulse Room*. Use later in the term if needed. |
| On Kawara, *I Got Up* (1968–79) and *I Went* (1968–79) | [Guggenheim, *On Kawara—Silence*](https://www.guggenheim.org/exhibition/on-kawara-silence); [Met, *I Got Up*](https://www.metmuseum.org/art/collection/search/284464); Guggenheim teaching materials on postcards and maps ([teaching page](https://www.guggenheim.org/teaching-materials/on-kawara-silence)) | More famous in art history than *Dear Data*; *I Went* literally traces daily paths on photocopied maps. Visual encoding is almost too thin for a “data mapped to form” demo (a rubber stamp; a red line). Better as a one-slide ancestor of *Dear Data* than as Case 2. |
| Hans Haacke, *Shapolsky et al. Manhattan Real Estate Holdings, a Real-Time Social System, as of May 1, 1971* | [Whitney collection](https://whitney.org/collection/works/29487) | Canonical public-records data art; Guggenheim cancelled the 1971 show over it (Whitney label). 142 photographs plus charts is too dense, too political, and too installation-scale for 20 minutes of orientation. |

---

## Source list (primary only)

**LeWitt.** [MASS MoCA, *Wall Drawing 289*](https://massmoca.org/event/walldrawing289/); [MASS MoCA retrospective](https://massmoca.org/event/sol-lewitt-a-wall-drawing-retrospective/); [Whitney, “Drawing Instructions”](https://whitney.org/education/families/kids-art-challenge/sol-lewitt); [MoMA, *Wall Drawing #1187*](https://www.moma.org/collection/works/175905); Sol LeWitt, “Paragraphs on Conceptual Art,” *Artforum* (June 1967), [archived full text](https://web.archive.org/web/20200726100127/https://www.artforum.com/print/196706/paragraphs-on-conceptual-art-36719).

**Molnár.** [Centre Pompidou, *Speak to the Eye*](https://www.centrepompidou.fr/en/program/calendar/event/PA7jRZ5); [Morgan, *Interruptions*](https://www.themorgan.org/drawings/item/405692); [Morgan, Order and Disorder](https://www.themorgan.org/morganmobile/order-and-disorder/molnar); [V&A, *(Des)Ordres*](https://collections.vam.ac.uk/item/O1193781/desordres-drawing-molnar-vera/); [Toledo / Infinite Images, *Interruptions*](https://infiniteimages.toledomuseum.org/artwork/interruptions); [Pompidou, *OTTWW*](https://www.centrepompidou.fr/fr/ressources/oeuvre/cqpGk6d).

**Nees.** [V&A, *Schotter*](https://collections.vam.ac.uk/item/O221321/schotter-print-nees-georg/).

**Minard.** [BnF Gallica, GE DON-4182](https://gallica.bnf.fr/ark:/12148/btv1b52504201x).

**Du Bois.** [LoC, *The Georgia Negro*](https://www.loc.gov/pictures/item/2013650420/); [LoC, Paris 1900 collection](https://www.loc.gov/collections/african-american-photographs-1900-paris-exposition/); [Cooper Hewitt, *Deconstructing Power*](https://www.cooperhewitt.org/exhibition/deconstructing-power-w-e-b-du-bois-at-the-1900-worlds-fair/).

**Hansen & Rubin.** [EAR Studio, *Listening Post*](https://www.earstudio.com/projects/project-page/listening-post); [Science Museum Group, 2014-47](https://collection.sciencemuseumgroup.org.uk/objects/co8091687/listening-post); [Whitney exhibition](https://whitney.org/exhibitions/listening-post).

**Current cases (for comparison only).** [reas.com/process](https://reas.com/process); [dear-data.com/theproject](https://www.dear-data.com/theproject); [MoMA Magazine on the 2016 acquisition](https://www.moma.org/magazine/articles/309).

**Not ranked, still primary.** [Whitney, *Harold Cohen: AARON*](https://whitney.org/exhibitions/harold-cohen-aaron); [Ryoji Ikeda, *datamatics*](https://www.ryojiikeda.com/project/datamatics/); [Guggenheim, *On Kawara—Silence*](https://www.guggenheim.org/exhibition/on-kawara-silence); [Met, *I Got Up*](https://www.metmuseum.org/art/collection/search/284464); [Whitney, Haacke *Shapolsky et al.*](https://whitney.org/collection/works/29487).
