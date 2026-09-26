# Gebiedskaarten in de bestaande trainer-v2

Uitgevoerd in `/home/johan/Documenten/GitHub/LeraarBob-rechten-shell`, branch
`feat/rechten-v2-world-shell`. De bestaande verankerde Grenspas-layout is
uitgebreid; de wiskundige core, runtime, skillcatalogus, scheduler-/evidence-adapters
en opslag zijn behouden. De vooraf aanwezige wijzigingen aan de map-stages
blijven behouden.

## Navigatie en inhoud

- Puntenbaai: 2 afzonderlijke haltes.
- Hellingrug: 5 afzonderlijke haltes langs de klimroute.
- Signaalstad: 7 afzonderlijke haltes in een stadsnetwerk.
- Formulewerf: 9 afzonderlijke haltes in twee fullscreen werkplaatsen (4 + 5).
- Grenspas: de bestaande 5 haltes; `sign` blijft gesplitst in positieve en negatieve vraagvariant.

Alle 27 bestaande skill-ID’s staan in `content/area-maps.js`. De test vergelijkt
ze met `content/skills.json`. Alleen de positieve Grenspas-halte start de
bestaande oefening. Andere haltes openen een preview met hun eigen volledige
skillnaam. Ook een vergrendelde halte kan worden bekeken; bezoeken ontgrendelt
of voltooit niets. Beschikbaarheid en voltooiing uit een bestaande v1-snapshot
worden read-only via de bestaande core weergegeven. Zonder zo’n snapshot is
de eerste halte van elk nieuw gebied een huidige preview. De aanbevolen halte
heeft een gouden markerrand en een primaire knop met het haltenummer.

`Terug naar kaart` gaat altijd naar `#wereld`. De andere terugknop op een
haltepreview herstelt hetzelfde gebied, dezelfde werkplaats en toetsenbordfocus.
Refresh, browser Vorige/Volgende en heropenen zonder hash behouden de opgeslagen
navigatie. De actieve oefening en gedeeltelijke antwoorden blijven behouden
wanneer je andere gebieden bekijkt.

## Layout en vervangbare art

Alle zes kaartschermen gebruiken dezelfde `.area-map → .area-stage` met expliciete
3:2-verhouding. Afbeelding, SVG-route en HTML-hotspots delen exact dezelfde stage.
Een node bevat marker, label en status; zijn markercentrum ligt op het x/y-anker
uit `content/area-maps.js`. Er zijn geen viewport-afhankelijke nodecoördinaten.
`clamp()` en container-units schalen de componenten. Een afzonderlijke topbar en
footer reserveren ruimte voor navigatie. Formulewerf wisselt van map-state;
er wordt geen scrolvlak geopend.

Vier waterverfillustraties zijn gemaakt met de ingebouwde imagegen-tool en als
transparante WebP opgeslagen onder `games/rechten/trainer-v2/assets/`:
`puntenbaai-island.webp`, `hellingrug-island.webp`, `signaalstad-island.webp` en
`formulewerf-island.webp`. Grenspas gebruikt zijn bestaande asset. De twee
werkplaatsen gebruiken dezelfde Formulewerf-illustratie met eigen routes.

[De gebruikte prompts](ART_PROMPTS.json) en het assetregister
`content/assets.json` documenteren de bestanden. Bij vervangen: behoud het
volledige 1536×1024-canvas, transparantie en de huidige landmarkposities uit de
[ankertabel](ANCHORS.json); niet bijsnijden of afzonderlijk verschuiven. Teksten en statussen
staan uitsluitend in HTML. De kaart blijft navigeerbaar als decor niet laadt.

## Verificatie

- 57 v2-unit- en regressietests geslaagd, inclusief bytevergelijkingen van de behouden cores.
- 1920×1080, 1366×768, 1024×768, 780×360 en 640×360, elk op 80%, 100% en 125%.
- Echte Chromium-browserzoom ingesteld via `chrome.settingsPrivate` in een
  geïsoleerd testprofiel. Het JSON-rapport registreert ook de effectieve CSS-viewport
  en pixelverhouding. 640×360 op 125% geeft 512×288 CSS-pixels.
- Controle op document-scroll, onderlinge label-/marker-/badge-overlap,
  afsnijding, vrije topbar/footer, raakbare knoppen en drift ten opzichte van art.
- 65 bestaande browsercontroles/groepen geslaagd, inclusief de volledige
  Grenspas-route via touch en toetsenbord, herstel, hervatten, contrastgeval,
  menu, portret, reduced motion en forced colors. Zie het
  [Grenspas-regressierapport](grenspas-regression-report.json).
- Alle 28 mogelijke aanbevolen haltes aanvullend met synthetische bestaande
  voortgang op 640×360 bij 125% gecontroleerd.
- Alle 27 haltepreviews getest op refresh, terugkeer naar dezelfde werkplaats, browsergeschiedenis,
  behoud van leerstatus en behoud van oefenbewijs/actieve antwoorden.

Dit zijn Chromium-viewporttests; er is geen fysieke Samsung A20 gebruikt.

## Screenshots

[Open de visuele galerij](index.html). De PNG’s hieronder hebben hun originele
resolutie; er zijn geen labels achteraf op de screenshots geplaatst.

| Kaart | Desktop 1366×768 | 780×360 |
| --- | --- | --- |
| Puntenbaai | [Desktop](screenshots/puntenbaai-1366x768.png) | [780×360](screenshots/puntenbaai-780x360.png) |
| Hellingrug | [Desktop](screenshots/hellingrug-1366x768.png) | [780×360](screenshots/hellingrug-780x360.png) |
| Signaalstad | [Desktop](screenshots/signaalstad-1366x768.png) | [780×360](screenshots/signaalstad-780x360.png) |
| Formulewerf · Voorschrift bouwen | [Desktop](screenshots/formulewerf-bouwen-1366x768.png) | [780×360](screenshots/formulewerf-bouwen-780x360.png) |
| Formulewerf · Representaties omzetten | [Desktop](screenshots/formulewerf-omzetten-1366x768.png) | [780×360](screenshots/formulewerf-omzetten-780x360.png) |
| Grenspas | [Desktop](screenshots/grenspas-1366x768.png) | [780×360](screenshots/grenspas-780x360.png) |

Zie [het volledige kaarttestrapport](area-maps-report.json).
