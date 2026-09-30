# Algebra Trainer

Gebaseerd op het aangeleverde `Algebra_Trainer_v1.0.html`; het oorspronkelijke bestand is ongewijzigd. De exacte breukrekenkern, 17 oefenvormen, drie niveaus, keuze van getalsoorten en werkbladen met verbetersleutel zijn behouden.

De nieuwe uitvoering staat bij de vernieuwde spellen op de startpagina, met een eigen omslag. Licht papier, blauwgrijze accenten en rechte knoppen sluiten aan bij leraarBob. De centrale bovenbalk heeft account, voortgang, instellingen, menu en een blijvend bereikbare inklap-/herstelknop. De trainer past zich aan telefoonportret en lage liggende schermen aan.

Vorige en volgende bewaren de bewerkingen per opgave. Herladen hervat dezelfde reeks en dezelfde stappen. Het afdrukvoorbeeld gebruikt de bevestigde reeks. Maximaal zestig opgaven per reeks begrenst de opslag. Wiskundige notatie en lettertypen worden lokaal geleverd met KaTeX 0.18.9 (MIT), zodat een externe CDN niet nodig is.

De bestaande centrale, accountgebonden opslag bewaart reeks en opgeloste oefenvormen. Een vorm telt pas na een juiste oplossing, niet door verder te klikken. De bovenbalk toont het aantal geoefende vormen van de 17; dit is geen beheersingsbeoordeling en geen verzonnen XP. Gasten oefenen op hun toestel. Een ingelogde leerling bewaart offline wijzigingen voor latere synchronisatie. Een accountwissel stopt de vorige sessie voordat een nieuw account start.

Gecontroleerd:

- Elke oefenvorm, alle acht combinaties van getalsoorten en 27.200 voorbeelden met vaste testseed: exacte gelijkwaardigheid van bewerkingen, bereikbare keuzewaarden, eindoplossing en verbetersleutel.
- De generator weigert afgeleide getallen die een noodzakelijke keuzewaarde buiten de gekozen getalsoorten zouden plaatsen; oplossingsmetadata volgt de werkelijk opgeloste vergelijking.
- Onveilige gehele getallen en delen door nul worden geweigerd.
- 1366×768, 780×360, 390×844 en 320×568, met beide standen van de bovenbalk.
- Bedienbare vorige/volgende, oplossen via echte knoppen, afdrukken, herladen, offline opnieuw bewaren en accountscheiding.

```sh
node --test tests/algebra-trainer.test.cjs tests/catalog.test.cjs tests/catalog-progress.test.cjs
node tests/algebra-trainer-browser.cjs
```

De browserproef gebruikt de lokale server op poort 8775 en een geïsoleerde Chromium-debugsessie op 9245. Deze proef gebruikt fictieve accounts, geen leerlinggegevens.
