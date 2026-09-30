# Algebra Trainer

Gebaseerd op het aangeleverde `Algebra_Trainer_v1.0.html`; het oorspronkelijke bestand is ongewijzigd. De exacte breukrekenkern, 17 oefenvormen, drie niveaus, keuze van getalsoorten en werkbladen met verbetersleutel zijn behouden.

De nieuwe uitvoering staat bij de vernieuwde spellen op de startpagina, met een eigen omslag. Licht papier, blauwgrijze accenten en rechte knoppen sluiten aan bij leraarBob. De centrale bovenbalk heeft account, voortgang, directe scherm- en weergaveknoppen, menu en een blijvend bereikbare inklap-/herstelknop. De trainer past zich aan telefoonportret en lage liggende schermen aan.

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

## Alternatieve oplossingsvolgordes

De bewerkingskeuzes volgen ook afgeleide termen en coëfficiënten uit de actuele vergelijking. De getalinstellingen bepalen de gegenereerde opgaven; ze verbergen geen noodzakelijke breuk die ontstaat wanneer een leerling een andere geldige volgorde gebruikt. Noodzakelijke actuele termen vallen niet meer weg door de limiet van acht knoppen. Vermenigvuldigen met een getal past die factor toe op iedere bovenliggende term van beide leden; haakjes binnen die termen blijven behouden.

Aanvullend gecontroleerd: eerst delen bij `4x + 6 = 2x + 10`, daarna verder met breuken; x links of rechts vrijmaken; afgeleide coëfficiënten; terug vermenigvuldigen; meer dan acht actuele termen. Voor E1–E3 zijn 2.400 alternatieve routes over alle acht getalinstellingen exact nagerekend. De afleiding bewaart haar scrollpositie bij het kiezen van een bewerking of opnieuw tekenen van de formules. Na een nieuwe stap of hervatten komt de actuele regel direct in beeld. De browsercontrole voltooit de breukenroute via zichtbare knoppen, ook na herladen, op vier schermformaten met beide standen van de bovenbalk en controleert de zichtbaarheid van de eindoplossing.

## Vervolgontwerp: klassikaal leren (nog niet geïmplementeerd)

De leerkracht heeft een projecteerbaar klasbord en bepaalt per vraag de fasen:

1. Iedereen probeert individueel. De klas ziet hoeveel antwoorden zijn ingediend, nog geen oplossing of live juistheidspercentage.
2. De leerkracht sluit de eerste poging en toont een anonieme responsbalk: percentage juiste eerste antwoorden onder de ingediende antwoorden, plus het aantal ingediend ten opzichte van het aantal deelnemers. Bij nul antwoorden staat “Nog geen antwoorden”, geen misleidende nulscore. Kleur ondersteunt een altijd leesbaar percentage en label.
3. Samen bespreken: de leerkracht toont de oplossing of geeft expliciet één leerling tijdelijk de bediening van het bord. De leerkracht kan die bediening altijd terugnemen.
4. Leerlingen verbeteren hun eigen uitwerking. De eerste meting blijft bewaard; eventuele verbetering wordt afzonderlijk aangeduid.
5. De leerkracht gaat naar de volgende vraag.

Individuele juistheid en namen horen niet in de geprojecteerde responsbalk. Klassikaal leren heeft standaard geen ranglijst of tijdsbonus. Alleen aantoonbaar eigen werk kan meetellen voor individuele leerprogressie; een gezamenlijke demonstratie is geen individueel beheersingsbewijs. Bij uitval blijven eigen pogingen bewaard; het klasbord mag niet afhankelijk zijn van een onbereikbare leerling. Dit patroon is ook bedoeld voor Rechtenwereld en Vectormissie, met behoud van hun eigen werkborden.
