# Open uitgang in de achterwand

Bestand: [exit-passage-v2.png](exit-passage-v2.png), 1254 × 1254 pixels, volledig dekkende PNG. Gemaakt met de ingebouwde `image_gen`-tool.

De uitgang beslaat één hele tegel, even breed als een klein vast blok. Het koperen kozijn is onderdeel van een wandpaneel; de opening heeft donkere dagkanten en een warm verlichte vloer die naar achteren loopt. De eerdere groene deur met venster wordt niet meer gebruikt.

`drawExit()` tekent de doorgang in de achterwand vóór de gewichten. Een gewicht kan hem dus echt afdekken. `drawCoveredExit()` toont dan lichte hoekmarkeringen en het kleine groene lampje op de vaste doelpositie. De logische uitgang, leveldata en voorwaarden om te winnen zijn ongewijzigd. Bij een ontbrekende PNG tekent de canvas-terugval ook een open doorgang.

## Gebruikte generatieprompt

Use case: stylized-concept.
Asset type: one square PNG EXIT PASSAGE tile for a 2D side-view gravity puzzle game. This replaces a small floating green door icon. The new asset must unmistakably read as an OPEN PASSAGE CUT THROUGH the BACK WALL, integrated into a retro industrial machine room.
Primary request: a broad, inviting open bulkhead passage, almost the full width of the square tile, with clear depth leading into a warmly lit room behind it. There is NO door leaf, window, glass pane or grille covering the opening.
Composition: square full-bleed architectural tile, direct frontal orthographic view of the outer wall. The passage and its frame fill about 94 percent of the image width and 96 percent of its height. Wide square-ish doorway with chamfered or softly rounded upper corners, NOT a tall narrow arch. The clear opening is at least 68 percent of total width, large enough for a squat robot. The whole outer wall panel extends seamlessly to the edges of the image with no blank padding or isolated-object backdrop. This is a ONE TILE wide, ONE TILE high passage.
Architecture: dark petrol-blue steel wall plate, aged copper/brass jambs bolted directly into it, a thick lintel, attached mounting flanges and clearly recessed dark inner reveals. Several visible inner wall planes and a short receding metal floor lead INTO the opening. Small sill flush with the wall along the bottom. Through the aperture see a short warmly lit empty corridor and a soft amber light deeper inside; strong warm light on the inner floor, darker side reveals to show depth. One small pale mint status light inset in the lintel. The interior must look spatial and open, with no flat surface spanning the aperture.
Art style: polished hand-painted 2D game environment sprite; tactile weathered teal enamel, warm copper, chunky bevels and bold readable forms. Matches a blue-gray machine-room backdrop with copper pipes, a cream capsule robot, dark teal foreground blocks and tan metal crates. Appealing to teenage players. Clear at 32–48 pixels square, so use a few large shapes rather than tiny details.
Palette: outside panel #405f68 and #34505a, dark recess #14272e, worn copper #ad7542 and #d3a45b, warm interior amber #e9bb6b and cream #fff1c9. Let the inner light make the destination stand out clearly.
Constraints: NO closed door, door panel, door leaf, window, glass, gray pane, vertical bars, grille, fence, transparent hole, freestanding object, pedestal, floor outside the frame, cast shadow outside the image, character, crate, arrow, text, lettering, number, logo, caption or watermark. No purple swirling energy (those are separate transport portals). Frame must attach visually to the surrounding steel panel, not float on it. Output one opaque square PNG, no transparency, no margin.

