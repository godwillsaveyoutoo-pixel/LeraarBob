# Vectorbattle

Open [battle.html](../../games/vectoren/battle.html), of kies **Menu → Battle met twee** in de gewone trainer.

Twee leerlingen spelen naast elkaar op hetzelfde scherm. Kies hun namen, een wereld, een onderdeel of een mix, en 5 of 10 rondes. **Mixed** staat bovenaan en is de standaard: ontbinden, vectoren in een figuur, kop-staart, aftrekken, parallellogram, combinaties en optellen. Deze selectie slaat de eenvoudige herkenningsvragen over; losse werelden en onderdelen blijven beschikbaar. Beide leerlingen krijgen exact dezelfde vraag. Het eerste juiste antwoord levert één punt op; daarna worden beide werkborden vergrendeld. De knop **Volgende ronde** verschijnt centraal tussen de twee speelhelften. Alleen een klik daarop start de volgende ronde; tijdens het spelen is de knop verborgen. Een fout antwoord geeft feedback en een wachttijd van 3 seconden, waarna de leerling opnieuw kan proberen. Met Pas geeft één speler de ronde op; als beiden passen, krijgt niemand een punt. De eindstand ondersteunt een winnaar of gelijkspel, en een revanche.

De twee speelhelften gebruiken dezelfde generator, validator, automatische zoom, vectornotatie en pijltekening als de bestaande trainer. Elk werkbord heeft zijn eigen antwoorden, gereedschap en pointergebaren. Een ronde kan maar één punt opleveren; dubbele of verouderde inzendingen veranderen de score niet. De buitenste pagina controleert het juiste antwoord opnieuw met de gedeelde validator.

De battle blijft lokaal. Afgeronde uitslagen worden bewaard in een afzonderlijke ranglijst op dit toestel. Via ★ Ranglijst op het start- of resultaatscherm zie je klassementspunten (3 voor winst, 1 voor gelijkspel), overwinningen en gespeelde battles. Bij evenveel punten telt het aantal overwinningen; volledig gelijke scores delen een plaats. De laatste 500 afgeronde battles tellen mee. Afgebroken battles tellen niet mee. Namen worden zonder verschil in hoofdletters of extra spaties herkend; beide spelers moeten verschillende namen gebruiken. De ranglijst is geen klasranglijst en is niet gekoppeld aan leerlingaccounts. De speelhelften laden geen account- of cloudopslagdiensten en schrijven niets naar de persoonlijke oefenvoortgang. De gewone trainer bewaart de lopende oefening voordat je via het menu naar de battle gaat.

Gebruik een laptop of een tablet in liggende stand. Een touchscreen ondersteunt gelijktijdig tekenen; met één muis delen de leerlingen de bediening. De twee werkborden blijven naast elkaar. Op zeer smalle schermen is horizontaal scrollen nodig; dit is geen telefoonindeling.

## Bronnen

- `games/vectoren/battle.html`, `vector-battle.js`, `styles/vector-battle.css`: setup, score en rondeverloop.
- `games/vectoren/vector-battle-player.js`, `styles/battle-player.css`: lokale speelhelft en compacte bediening.
- `games/vectoren/battle-player.html`: gegenereerd uit dezelfde trainerbronnen via `scripts/build-vector-trainer.cjs`; geen tweede wiskunde-engine.
- `games/vectoren/vector-battle-ranking.js`: uitslagen, naamherkenning, rangschikking en een begrensde historie.
- `tests/vector-battle-ranking.test.cjs`: puntentelling, gelijkspel, dubbele/ongeldige uitslagen en limiet.
- `tests/vector-battle-browser.cjs`: geïsoleerde Chromium-controles, inclusief opslaan, herladen, stoppen en de ranglijstdialoog op mobiel.

## Gecontroleerd

[Battlerapport](battle-report.json): Mixed als eerste en standaardkeuze, ontbinden met werkende puntentelling, twee gelijktijdige touchgebaren, aparte antwoorden, identieke opgaven, één punt voor de snelste juiste inzending, dubbele inzendingen, foutpauze en rondevergrendeling, beide spelers passen, vijf rondes tot gelijkspel, revanche, stoppen/annuleren en ongewijzigde persoonlijke opslag. Vijf invoervormen gecontroleerd op 1366×768, 1024×768 en 780×540; numerieke antwoorden ingevoerd met het ingebouwde toetsenbord. Geen JavaScript-excepties of accountdiensten in de battle.

De 26 bestaande Node-tests, 4 ranglijsttests en 102 controles van de gewone Vectormissie slagen eveneens. Touch is geëmuleerd in Chromium; geen fysieke tablet getest.

- [Setup](screenshots/battle/setup-1366.png)
- [Battle op tabletformaat](screenshots/battle/headtail-1024.png)
- [Klein liggend scherm](screenshots/battle/headtail-780.png)
- [Eindstand](screenshots/battle/result-1366.png)

Herhalen met de bestaande lokale server en testbrowser:

```sh
node scripts/build-vector-trainer.cjs
node tests/vector-battle-browser.cjs
node tests/vector-mission-browser.cjs
```

## Rechtstreeks openen vanuit de map

`battle.html` werkt ook via `file://`. Lokale frames communiceren met de ondoorzichtige oorsprong `null`; verzending gebruikt in die modus `*`, ontvangst controleert zowel de oorsprong als het echte venster. Bij HTTP(S) blijft de controle strikt op dezelfde oorsprong. De sterrenhemel wordt geladen ten opzichte van de externe stylesheet. `tests/vector-battle-file-browser.cjs` controleert daadwerkelijk laden, twee gelijke opdrachten, een juist antwoord, de volgende ronde en een schone browserlog zonder speciale browserveiligheidsvlaggen.
