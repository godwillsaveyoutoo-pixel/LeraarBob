# Gravity Maze — PNG-afbeeldingen

Gemaakt met de ingebouwde `image_gen`-tool. Robot, gewichten en transportportalen gebruiken PNG's met gecontroleerde alpha-transparantie. De uitgang, muurtextuur, platformtegel en machinekamerachtergrond zijn volledig dekkende PNG's. De originele beeldbestanden zijn behouden; `game.js` snijdt eventuele transparante marges tijdens het tekenen weg en bewaart een versie op schermresolutie voor hergebruik tijdens animaties.

| Afbeelding | Bestand | Functie |
| --- | --- | --- |
| Robot / spookje | [player-v1.png](player-v1.png) | Draait en kleurt mee met de zwaartekracht: blauw ↓, rood ↑, groen ←, goudgeel →. |
| Contragewicht | [crate-v1.png](crate-v1.png) | Dezelfde afbeelding voor alle 2×2-gewichten. |
| Transportportaal | [portal-v1.png](portal-v1.png) | Paarse opening in een groen frame, passend in één kolom en twee rijen. |
| Uitgang | [exit-passage-v2.png](exit-passage-v2.png) | Open, warm verlichte doorgang met koperen kozijn in de achterwand, één hele tegel breed. |
| Buitenmuur | [wall-texture-v1.png](wall-texture-v1.png) | Donkere groen-grijze minerale textuur op de vaste randtegels. |
| Vaste platforms en blokken | [platform-block-v1.png](platform-block-v1.png) | Bijpassende steen met afgeschuinde rand op alle vaste binnentegels. |
| Machinekamer | [machine-room-v1.png](machine-room-v1.png) | Blauwe paneelwand, koperen leidingen, roosters en amberkleurig licht achter het speelveld. |

De afbeeldingen laden lokaal en asynchroon. Tijdens het laden of bij een ontbrekend bestand tekent de game canvasvormen. Pijlen blijven boven de gewichten zichtbaar. De uitgang ligt achter de gewichten; bij afdekking houden lichte hoekmarkeringen zijn vaste doelpositie zichtbaar. De spelregels, botsingen en leveldata zijn niet gewijzigd.

De figuur gebruikt vier lichtere versies van de pijlkleuren, zodat hij zichtbaar blijft op de donkere achtergrond. De kleur wordt bij het tekenen uit de zichtbare zwaartekrachtrichting afgeleid. `drawArtwork()` bewaart de vier ingekleurde varianten per schermresolutie; schaduwen, gezicht en transparantie blijven behouden. Het losse kleurlijntje onder de voeten is verwijderd. Ook de canvas-terugval gebruikt dezelfde figuurkleuren.

De muurtextuur en platformtegel vullen exact de bestaande tegelvormen. Langere platforms bestaan uit aaneengesloten vaste tegels. De contourlijnen langs vrije randen houden de botsingsgrens zichtbaar. Beide nieuwe afbeeldingen gebruiken dezelfde cache als de objectsprites, zodat het grote bronbestand niet bij iedere bewegingsframe opnieuw wordt verkleind.

De prompts voor [muren en vaste platforms](terrain-prompts.md) staan apart.

De rijkere machinekamerstijl gebruikt een [nieuwe achtergrondprompt](machine-room-prompt.md). `finishArtwork()` voegt in de spritecache koperen hoekstukken, bouten, metalen rails en verstevigingen toe aan de bestaande muur-, platform- en kist-PNG's. De buitenrand en bediening gebruiken een donkerblauwe omlijsting met messingkleurige accenten. Pijlen hebben een lichte contour voor contrast met de achtergrond.

## Prompt voor de robot

Zie de [oorspronkelijke prompt](../concepts/player-idle-v1.md).

## Prompt voor het contragewicht

Use case: stylized-concept.
Asset type: one square transparent PNG sprite, a movable 2-by-2-cell crate for a 2D gravity puzzle game.
Scene/backdrop: genuinely transparent background with alpha. Exactly one isolated square crate, no floor, background, cast shadow or scene.
Subject: the front face of a sturdy compact counterweight crate. Warm sand and muted ochre ceramic panels held by a dark desaturated brown metal perimeter frame. Four broad reinforced corners, a few large simple inset panels, restrained wear and subtle rounded bevels. It should look heavy, solid and movable. Clean continuous square silhouette with only very slightly rounded corners. Keep the central face relatively simple so game arrows can remain readable on top.
Style: polished hand-illustrated 2D indie puzzle game art, broad clear forms with soft material shading. Match a friendly cream ceramic robot with a dark green-gray visor and sage details. Appealing to teenagers, elegant and tactile rather than babyish.
Composition: direct orthographic FRONT view, no perspective or isometric view, no visible side or top faces, centered square object with small transparent padding. Entire object visible, nothing cut off. Symmetric construction with lighting mostly within bevels so it looks natural in any gravity direction. Square canvas.
Palette: warm tan #b69a76, sand #d3bda0, dark umber #514639, muted green-gray fasteners. Avoid bright saturated colors.
Constraints: clear at 48 pixels square; sparse details, no text, symbols, arrows, numbers, letters, logos, faces, glow, handles protruding outside the square, or additional objects. Output a PNG with actual alpha transparency.

## Prompt voor het transportportaal

Use case: stylized-concept.
Asset type: one transparent PNG portal sprite for a 2D orthographic gravity puzzle game.
Scene/backdrop: genuine alpha transparency around a single isolated upright portal; no environment, floor, ground shadow or backdrop.
Subject: a narrow vertical rectangular portal built into a dark sage-gray wall, a 1-unit-wide by 2-unit-tall architectural opening. Solid straight dark green-gray ceramic/metal perimeter with subtly beveled corners, ivory-gray highlights on the inside edge. Inside: a luminous muted lavender energy membrane, three broad gently wavering vertical light filaments, soft bright pale lilac center, darker dusty mauve sides. Paired tiny horizontal inset marks at the upper and lower ends suggest a matched transport connection.
Style: elegant tactile 2D hand-illustrated indie puzzle game asset with restrained soft depth, clean broad shapes, understated surface texture. Matches a cream ceramic robot and a warm sand-colored square counterweight with beveled metal corners. Designed for teenage players.
Composition/framing: perfectly FRONT-facing orthographic elevation. Rectangular silhouette ratio exactly 1:2, whole shape visible and centered with clear transparent padding. No perspective, no isometric angle, no visible top or side faces. Shading and glow entirely contained inside the frame. The interior must be colored, not a transparent hole. Render a tall image.
Palette: frame #46524d, #839782 highlights, #2f3937 recess; membrane #776886, #a89ab4, #d8d0dc with pale lilac light. Not neon purple.
Constraints: recognizable at 28 by 56 pixels; simple broad interior light structure, no small busy detail, no symbols, text, lettering, arrow, signage, faces, extra objects, separate particles or outside glow. Use a flat square top, NOT a rounded arch (the exit will have an arch). One asset only. Actual transparent PNG.

## Prompt voor de oorspronkelijke uitgang (vervangen)

De actieve uitgang gebruikt [exit-passage-v2.png en deze prompt](exit-passage-prompt.md). `exit-v1.png` blijft bewaard als eerder ontwerp.

Use case: stylized-concept.
Asset type: one transparent PNG exit-door sprite for a 2D orthographic gravity puzzle game.
Scene/backdrop: genuine alpha transparency outside one isolated door, no scene, floor, pedestal, shadows outside object or backdrop.
Subject: a small welcoming arched exit doorway. A sturdy dark sage-green ceramic/metal outer frame with subtle cream bevel highlights. A simple muted mint green door inside, with three broad upright recessed bars in the lower half. Warm pale green softly lit upper arch. Flat base and rounded arch at the top, silhouette slightly taller than wide, width-to-height ratio about 0.8. Visibly distinct from a rectangular purple transport portal.
Style/medium: polished 2D illustrated indie puzzle game sprite with broad clean shapes, tactile soft shading and restrained ceramic texture. Matches a cream capsule robot with a dark green-gray visor and a tan square counterweight crate with reinforced corners. Understated and appealing to teens.
Composition: centered perfectly frontal orthographic view with a little clear transparent padding. Whole shape visible, no perspective, no visible side surfaces. One object only.
Palette: dark sage #4d7859, deep green-gray #39443e, soft mint #b8c9a8, warm ivory #fffdf4. Strong dark silhouette and light green interior, shading kept inside silhouette.
Constraints: legible at 24 pixels tall. Simple large details, no text, lettering, arrows, numbers, signage, people, knobs, bricks, extra objects or outer glow. Square image. Deliver actual alpha-transparent PNG.
