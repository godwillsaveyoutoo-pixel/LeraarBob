# Bewerkingentrainer

Open `index.html` of de tegel Bewerkingentrainer op de startpagina. Deze eerste
versie heeft zestien vraagvormen op drie niveaus: machten van machten,
producten/quotiënten van machten, eentermen, negatieve machten, gemengde
bewerkingen, wetenschappelijke schrijfwijze, wortelproducten en -quotiënten,
wortels van breuken, wortels en machten, wortels vereenvoudigen, wortels met
positieve letters en gelijksoortige/gemengde worteltermen, en getallen ontbinden met een kwadraatfactor.

- Zelf oefenen: vrije selectie, exacte antwoordcontrole, hints, uitwerking en
  bewaarde tussenstapnotities. De eerste zelfstandige oplossing van een
  vraagvorm telt als geoefend; hulp, verbeteren en overslaan tellen daarvoor
  niet. Dit is geen uitspraak dat de vaardigheid al beheerst is.
- Met twee aan het bord: dezelfde reeks, onafhankelijke invoer en aantallen
  juiste antwoorden. Een afgerond antwoord blijft verborgen tot beide spelers
  klaar zijn. Daarna kan de volgende vraag worden geopend. Geen leerling-XP.
- Leraarmodus: uitwerking per stap, alles tonen/verbergen, bordnotities en een
  oefenblad met optionele uitwerkingen. Hiervoor is geen leerkrachtlogin nodig.
- Klasbattle: centrale leerling-/leerkrachtaccounts, sessiecode, rondetijd,
  servercontrole, uitslag en bespreking via de bestaande gedeelde klaslaag.

Invoer gebruikt `x^2`, `1/x^2`, `4sqrt(5)` en `1,7*10^8`; √ en superscripts
worden ook herkend. Knoppen voegen machten, wortels en breuktekens in. De
voorbeeldweergave gebruikt lokale KaTeX. De rekenkern vergelijkt exacte
breuken, machten van positieve letters en vierkantswortels met BigInt. Bij ontbinden worden alle juiste producten van twee natuurlijke factoren met
minstens één volkomen kwadraat aanvaard, in beide volgordes (ook 3 · 4 of 3 · 2²).
Bij de andere rekenvragen moet een antwoord ook vereenvoudigd zijn; negatieve exponenten worden herschreven
als breuken. Wetenschappelijke schrijfwijze vereist een factor 1 ≤ a < 10.
Letters bij wortels zijn strikt positief; noemers moeten ongelijk aan nul zijn.
De ingevoerde tussenstapnotities worden bewaard, maar niet automatisch beoordeeld.

Voortgang en alle drie lokale reeksen gebruiken `AxiomaGame.storage`, met de
accountscheiding, offline cache en revisiecontrole van het platform. De
gedeelde topbar toont het echte aantal zelfstandig geoefende vraagvormen.
Inklappen, licht/donker en volledig scherm veranderen geen opgave of invoer.
Bordbattle en leraarmodus vervangen de bewaarde zelfstandige reeks niet.
Klasconcepten staan apart per leerling/sessie/ronde in `sessionStorage`.

## Online uitrol

De trainer is op 1 oktober 2026 gepubliceerd via GitHub Pages. De registratie,
accountopslag en klasbattle zijn uitgerold op het bestaande Supabase-project.
De publieke pagina is https://godwillsaveyoutoo-pixel.github.io/LeraarBob/games/bewerkingen-trainer/.

Bij een nieuwe omgeving zijn beide onderstaande stappen nodig:

1. Pas `supabase/migrations/20261001060102_bewerkingen_trainer.sql` toe ná de
   bestaande Algebra-klasbattle-migratie. Deze registreert het spel en breidt
   de bestaande klaslevenscyclus uit, zonder oude resultaten te verwijderen.
2. Deploy `supabase/functions/bewerkingen-class/` met de configuratie uit
   `supabase/config.toml`. De worker is uitsluitend voor `service_role`
   bereikbaar; het gewone klasverzoek controleert identiteit en deelnemerschap.

Bouw de gebundelde policy na iedere wijziging aan core/config:

```sh
LB_ESBUILD_MODULE=/pad/naar/esbuild node scripts/build-bewerkingen-class-worker.cjs
node scripts/build-catalog.cjs
```

De productie-worker vereist een geldig accounttoken. Alleen de server mag
de vertrouwde beoordelingsfunctie in de database aanroepen.

## Controle

```sh
node tests/bewerkingen-trainer.test.cjs
VECTOR_PGLITE_MODULE=/pad/naar/@electric-sql/pglite node tests/bewerkingen-class.test.cjs
node tests/bewerkingen-trainer-browser.cjs
VECTOR_PGLITE_MODULE=/pad/naar/@electric-sql/pglite node tests/bewerkingen-class-browser.cjs
node scripts/build-catalog.cjs --check
```

De browsersuites gebruiken een geïsoleerde Chromium op poort 9245 en een lokale
webserver op 8775. `VECTOR_BROWSER_PORT` en `VECTOR_BASE_URL` overschrijven die.
Externe requests worden geblokkeerd; accounts en inzendingen zijn fictief. De
klasproef voert de echte migraties en Edge-handler uit in lokale PGlite.
Screenshots staan in `/tmp/leraarbob-v10-screenshots/`.
