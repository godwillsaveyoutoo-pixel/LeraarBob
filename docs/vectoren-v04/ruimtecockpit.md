# Ruimtecockpit naar de visuele referentie

Het oefenscherm gebruikt één doorlopende donkere ruimteachtergrond, een transparant grid met subtiele halve rasterlijnen en lichtpunten, cyaan omlijnde knoppen, gereedschappen links en antwoordbediening rechts. Een uitgeklapte coach, uitleg en feedback behouden een leesbaar donker paneel. De extra-contraststand houdt een effen achtergrond.

- [Desktopvoorbeeld](screenshots/cockpit-reference-1672.png)
- [Compact voorbeeld](screenshots/cockpit-reference-954.png)
- [Achtergrondbestand](../../games/vectoren/assets/vector-cockpit-sky.png)
- [Stijllaag](../../games/vectoren/styles/mission-cockpit.css)

De achtergrond is gemaakt met de ingebouwde imagegen-tool; het bestand is naar de projectmap gekopieerd. Grid, vectoren, schepen, labels en bediening worden door de toepassing getekend en blijven interactief. De illustratie bevat geen knoppen of wiskundige inhoud. De bestaande modelcoördinaten, integer-snapping, antwoordcontrole, score en vluchtduur blijven gelijk. Rasterlijnen op halve intervallen zijn alleen een visueel hulpmiddel.

## Definitieve afbeeldingsprompt

Use case: stylized-concept. Asset type: production background texture for an interactive educational vector space game, landscape 16:9, ideally 2560x1440. Generate ONLY a cinematic deep navy almost-black space background, not a UI mockup. A richly detailed blue planet limb enters from the bottom left corner, occupies the bottom-left 23% at most, with delicate luminous cyan atmosphere and dark terrain. A faint violet and blue nebula mostly along the far right edge, with brighter wisps in the upper right. Small dark asteroids frame the far right edge and lower left edge; keep the middle free. Scattered fine pinpoint blue-white stars of varying small brightness, a few subtle cross twinkles. Main central 75% is very dark, low contrast starfield, suitable for a readable transparent mathematical grid and thin bright cyan vectors placed by the application. Premium realistic painted space illustration, restrained glow, dark navy, cyan, muted violet. No text, no lettering, no numbers, no grid, no interface, no buttons, no frames, no spacecraft, no vector arrows, no bright central objects. Entire image is the space setting, edge-to-edge.

## Verificatie

Bestaande missie- en vluchtbrowserproeven controleren bediening, coach, feedback, tekeninvoer, breuken, vectorlabels, verschillende oefenvormen en compacte schermen. Extra schermbeelden zijn nagekeken op 1672×941, 954×435 en 640×360. Ook de rekenbediening is gecontroleerd op 780×360 en 640×360.


De knop **Verder** blijft onderaan het resultaatpaneel zichtbaar; alleen lange feedback kan daarboven scrollen. De proefvlucht gebruikt één korte uitleg, zonder dubbele legenda of herhaald vrij-oefenenlabel. Gecontroleerd op 1200 × 568 met open en ingeklapte bovenbalk en op 640 × 360, ook met kunstmatig lange feedback: Verder bleef zonder scrollen klikbaar en startte de volgende vraag. De bestaande vlucht- en bewegingscontroles slagen ook.
