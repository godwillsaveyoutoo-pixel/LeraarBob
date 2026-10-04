# Rechtenarcade op leraarBob

De oorspronkelijke **Rechtenwereld** blijft de eerste hoofdkaart op de
startpagina, met dezelfde wereldkaart, oefeningen, XP en opgeslagen voortgang.
**Rechtenarcade** staat in het uitklapmenu **Reserve** onder de hoofdspellen en
in het spelmenu van Rechtenwereld. De arcade vervangt geen hoofdkaart.

Route: `/games/rechten/arcade/`.

De arcade bevat Zeeslag, Brandweer & kabelbaan, Kleiduifschieten en **Glasraam**.
De eerste drie gebruiken de engines en vormgeving uit
`RechtenArcade_ontwikkelversie.zip`. Solo en de bestaande duo-spelvormen blijven
beschikbaar. De engines draaien in een iframe met één platformbalk erboven;
de bediening en timers blijven onder die balk. De bestaande platformvoortgang
van brandweer en kleiduiven verschijnt naast de profielknop. De Zeeslag-badge
telt de gewonnen partij in de actuele ronde. Arcadepunten staan apart en worden
niet naar XP omgerekend. Resultaten en pogingen kunnen lokaal als CSV worden
geëxporteerd.

Glasraam opent rechtstreeks vanuit de arcade. Het bevat acht ontwerpen,
punten tekenen en slepen, ongedaan maken, kleuren, een eigen ontwerp en
SVG-export. De technische route `../rechtenwereld/glasatelier.html` en
opslagsleutel `leraarbob-glasatelier-draft-v1` blijven behouden, zodat eerder
getekend werk kan worden hervat. De bovenbalk en het optiemenu bieden een
terugweg naar de arcade en Rechtenwereld. Glasraam schrijft geen wereld-XP.

De nieuwe klassessie-RPC uit het ontwikkelpakket is geen onderdeel van deze
publicatie. De arcade biedt daarom solo en duo; bestaande online duels en
kleiduivengroepen gebruiken hun bestaande diensten.

## Verificatie

```sh
node scripts/build-catalog.cjs --check
node --test tests/catalog.test.cjs tests/catalog-progress.test.cjs tests/rechten-arcade.test.cjs tests/rechten-glasatelier.test.cjs tests/clay-game.test.cjs tests/clay-questions.test.cjs tests/clay-service.test.cjs tests/rechten-v2-shell-preservation.test.cjs
node tests/rechten-arcade-browser.cjs
node tests/rechten-arcade-navigation-browser.cjs
node tests/rechten-glasatelier-browser.cjs
```

De browserproeven gebruiken Playwright en een tijdelijke browsercontext zonder
externe accountverzoeken. `NODE_PATH` of `PLAYWRIGHT_MODULE` kan de modulelocatie
aanwijzen. `CHROME_EXECUTABLE` (arcade) en `CHROMIUM_PATH` (Glasraam) wijzen naar
Chromium. `ARCADE_SCREENSHOTS` en `GLAS_SCREENSHOTS` zetten afbeeldingen buiten
de repository.

De spelproef doorloopt alle zestien reddingen, wiskundige geometrie,
kleiduivenherkansing, verborgen schepen, beide duo-vormen, score-export en de
platformvoortgang. De navigatieproef controleert de oorspronkelijke hoofdkaarten,
de arcade in Reserve en het menu van Rechtenwereld, bewaren bij inklappen en
herladen, vrije herstelknoppen en Arcade ↔ Glasraam op 1366×768, 390×844,
780×360, 640×360 en 320×568. De Glasraam-proef controleert alle acht ontwerpen,
bediening, kleuren, eigen ontwerpen, export en 174 layouts op die formaten.
