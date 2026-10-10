# Getallenwereld

Online ingang: `games/getallenwereld/`. De startpagina bevat een eigen tegel.
Deze integratie behoudt de aangeleverde `Speel-Getallenwereld-v0.2.html`:
8 onderdelen Machten en 7 onderdelen Vierkantswortels. Vier begeleide onderdelen
Wetenschappelijke schrijfwijze zijn toegevoegd: grote getallen, kleine
getallen, terugschrijven en normaliseren. Elk van de 19 onderdelen heeft zes
verschillende opgaven.
Een onderdeel aanklikken selecteert het; de knop **Start dit onderdeel** of
**Verder oefenen** opent de werkbank. Herhalen maakt een nieuwe reeks.

De werkplaats groepeert de acht bestaande machtenonderdelen in Begrijpen,
Bewerken, Haakjes en Zelf kiezen. De zeven wortelonderdelen krijgen hun eigen
pad: Begrijpen, Bewerken, Vereenvoudigen en Zelf kiezen. Wetenschappelijke
schrijfwijze heeft een eigen pad met de vier nieuwe doelen. Alle negentien
gebruiken dezelfde werkbank, hulpweergave en resultaatpagina; de oorspronkelijke
vijftien behouden hun vragen en antwoorddelen. Aanvullende reeksen, speelvormen
en oefenbladen blijven bij de bestaande provider. Lees [WORKSHOP.md](WORKSHOP.md) voor de behouden identiteit,
bewaarde reeksen en controles.

De leerling kiest eerst de rekenregel en bouwt vervolgens de uitwerking met
aanklikbare antwoorddelen. Bij elk deel verschijnen passende getalkeuzes,
ook voor negatieve exponenten, tellers/noemers en kwadraatfactoren. Er is geen
cijferkeyboard of antwoordtekstveld. De bestaande exacte kern blijft beoordelen.
Hulp gebruikt een ander voorbeeld en bewaart de eigen invoer. Ook het exacte
hulpvoorbeeld en de hulpstap blijven bij herladen of een menu-uitstap bewaard. Een onderdeel
is afgerond na zes verschillende uitgewerkte opgaven; de interface vermeldt
apart hoeveel daarvan zelfstandig zijn opgelost. Afgerond is dus geen
uitspraak dat een leerling de vaardigheid beheerst.

## Platformkoppeling

- Eigen `game_id`: `getallenwereld`; eigen opslag:
  `leraarbob.getallenwereld.v1`. `AxiomaGame.storage` scheidt gast,
  leerling en leerkracht en synchroniseert leerlingwerk met het platform.
- De topbar en de catalogus tonen het echte aantal afgeronde onderdelen op
  19. Deze begeleide leerroute kent geen XP toe. De genereerbare reeksen en
  online sessies binnen dezelfde wereld verdienen wel eigen, echte XP. De
  historische voltooiingen worden niet omgerekend naar XP.
- De bron deelde een opslagnaam en een vertaaltabel met de Bewerkingentrainer.
  Die koppeling is verwijderd; bestaande Bewerkingentrainer-data blijven
  ongewijzigd. Er is geen automatische overname van ongekoppeld offlinewerk
  naar een leerlingaccount.
- KaTeX, het account, de voortgangslaag en de inklapbare topbar worden lokaal
  hergebruikt. `lessons.js` gebruikt de bestaande exacte `BewerkingenCore`.
  De historische machten- en wortelgeneratie blijft gelijk; wetenschappelijke
  provider-generatie is met expliciete versie 2 uitgebreid. Versieloze
  historische taken blijven exact versie 1. De grote ingebedde
  lettertypes en de offline-accountstubs zijn niet gedupliceerd.
- Het kruimelpad volgt Getallenwereld → hoofdstuk → onderdeel. Directe
  licht/donker- en schermvullende knoppen veranderen geen opgave. De voorkeur
  voor inklappen blijft bij herladen bewaard; de herstelknop heeft eigen ruimte.
- Portret blijft bruikbaar: de draai-toestelblokkade van de bron is verwijderd,
  de bovenbalk en hoofdacties blijven op hun plaats. De onderdelenlijst
  scrollt binnen haar eigen vak. Het werkbord gebruikt het beschikbare
  scherm; bij uitzonderlijk weinig ruimte kan de inhoud intern scrollen.
  Acties hebben aanraakdoelen van minstens 44 × 44 pixels.

Diepe links: `?thema=machten`, `?thema=wortels`, `?thema=wetenschappelijk` of
`?onderdeel=machten-product` (alle ids staan in `lessons.js`). Een diepe link
selecteert een onderdeel zonder een bewaarde reeks te vervangen.

## Beschikbare werkvormen

Getallenwereld toont één ingang met Machten, Vierkantswortels en
Wetenschappelijke schrijfwijze. **Oefenen & samen** opent de speelvormen:
solo met XP, Duo Learn, Duo Battle, Bordduo en voor leerkrachten Klaslearn,
Klasbattle en Borduitleg. **Oefenblad**, **Ranglijsten** en voor leerkrachten
**Leerlingen** zijn rechtstreeks bereikbaar. De implementatie van reeksen en
sessies staat intern in `games/bewerkingen-trainer/`; die is geen aparte
publieke wereld.

`GetallenLessons.practiceSkills` koppelt de gekozen rekenregel aan de passende
vraagvormen voor reeksen, papier en sessies. Betekenis/nulmacht en de toetsing
van geldige wortelregels hebben nog geen equivalente reeksprovider: hun link
opent zichtbaar een **hoofdstukselectie**, zonder een gelijkwaardig level te
beloven. Dat geldt ook voor wetenschappelijk terugschrijven en normaliseren:
de aanvullende provider oefent de voorwaartse omzetting van een decimaal getal
naar wetenschappelijke schrijfwijze. De begeleide werkplaats heeft wel echte
terugschrijf- en normaliseeropgaven. Een selectie verandert geen lopend werk
en start geen sessie. Ook
**Volgend onderdeel** selecteert alleen; starten blijft een expliciete actie.

Online instellingen (vraagvormen, niveau, aantal, tijd, duo/klas en meedoen)
blijven bij herladen behouden. Lege selecties worden niet stilzwijgend alle
vragen. Checkboxkeuzes houden hun focus. Meer over beoordeling, XP en de
scheiding van simulatie/echte deelname staat in
[de reekscomponent](../bewerkingen-trainer/README.md).

Nieuwe wetenschappelijke eigen reeksen, Bordduo, borduitleg, oefenbladen en
simulaties hebben drie verschillende niveaus: Start gebruikt grote gehele
getallen met één significant cijfer; Basis gebruikt grote en kleine getallen
met twee of drie significante cijfers; Verdieping voegt interne nullen en
exponenten tot ±20 toe. De aanklikbare keuzes voor voorgetal en exponent blijven
bestaan. Nieuwe taken bewaren versie 2, zodat herladen dezelfde vragen en
conceptantwoorden herstelt. Opgeslagen historische taken houden versie 1.

Dezelfde niveaus zijn voor Duo Learn, Duo Battle, Klaslearn en Klasbattle lokaal
getest met echte SQL/Edge-code. Op **10 oktober 2026** zijn de gerichte migratie
en `numbers-session` versie 2 naar productie uitgerold. De gedeployde bron is
gelijk aan de reviewbranch; bestaande voortgang en sessiegegevens bleven
ongewijzigd. De frontend wordt via GitHub Pages vanaf `main` gepubliceerd;
publieke ingangen zijn [Getallenwereld](https://godwillsaveyoutoo-pixel.github.io/LeraarBob/games/getallenwereld/)
en [het bureaublad](https://godwillsaveyoutoo-pixel.github.io/LeraarBob/os/).
Actuele releasecontroles staan in [PR #7](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/pull/7)
en [het verificatierapport](../../os/qa/verification.json).
De versie van de ontvangen sessie bepaalt steeds de opgave en beoordeling;
historische sessies blijven hun oorspronkelijke vragen gebruiken. Bij een
oude server vermeldt de interface nog steeds eerlijk dat Basis en Verdieping
dezelfde historische vraagmix bevatten.

De opgeslagen momentopname bevat de reeks, invoer, hulp en oplossingsbewijzen,
maar geen volledige tijdlijn, actieve oefentijd of gebeurtenissenlogboek.
Die behoren tot de toekomstige centrale analysearchitectuur.

## Controle

```sh
node --test tests/getallenwereld.test.cjs tests/getallen-guided-choices.test.cjs tests/catalog.test.cjs
node scripts/build-catalog.cjs --check
NODE_PATH=/pad/naar/node_modules node --test tests/getallen-workshop-dom.test.cjs
NODE_PATH=/pad/naar/node_modules node --test --test-isolation=none tests/getallen-scientific-lessons.test.cjs tests/scientific-provider.test.cjs tests/scientific-session-version.test.cjs
NODE_PATH=/pad/naar/node_modules ALGEBRA_CHROMIUM_PATH=/pad/naar/chromium \
  node tests/getallenwereld-browser.cjs
NODE_PATH=/pad/naar/node_modules LB_CHROMIUM=/pad/naar/chromium \
  node tests/getallen-scientific-browser.cjs
```

De kerncontrole maakt deterministische opgaven en controleert alle
uitwerkingsstappen exact. De geïsoleerde browsercontrole gebruikt fictieve
accounts, blokkeert externe requests en schrijft geen echte leerlinggegevens.
Ze speelt alle 19 begeleide routes, controleert herladen en accountwisseling en
bekijkt vijf schermmaten in beide topbarstanden. Screenshots staan in
`/tmp/leraarbob-getallenwereld/`.

De interactieve stappen zijn bovendien op 640×360 en 390×844 gecontroleerd
met `tests/getallen-guided-layout.cjs`: 106 formulecontroles, inclusief de
nieuwe wetenschappelijke stappen, met zichtbare aanraakdoelen en echte
antwoordcontrole. De eerdere keuzetoets dekte
11.941 antwoorddelen in de oorspronkelijke vijftien doelen, inclusief
alternatieve geldige kwadraatfactoren. De nieuwe wetenschappelijke toets
controleert aanvullend de afzonderlijke cijferkeuzes. Accountisolatie, terugkeer en bewaarde invoer worden in de
bestaande Getallenwereld-browsertests gecontroleerd.

De uitgebreide werkplaats wordt daarnaast met `tests/getallen-workshop-dom.test.cjs`
gecontroleerd: de leerpaden, alle negentien antwoordflows, fouten,
zelfstandig/hulp, historische negatieve vragen, resultaatlinks, bewaren en
providerlinks. De aanvullende wetenschappelijke browsercontrole slaagt met
67 interactiegroepen en 190 gemeten layouts: alle vier nieuwe onderdelen,
werkelijke antwoorden in beide balkstanden, navigatie/hervatten, drie nieuwe
provider-niveaus, papier en klas-/duokeuzes. Het eerdere OS-bewijs van
128 interactiegroepen en 876 layouts blijft bewijs voor de vijftien
oorspronkelijke werkbanken. De actuele browsercontroles en eventuele beperkingen
staan in [os/PILOT.md](../../os/PILOT.md).

Deze lokale controles vervangen geen bewijs van een echte, ingelogde
klasactiviteit. Twee daadwerkelijk ingelogde productieaccounts, cloudhervatting
en externe realtimeverbindingen zijn nog niet gecontroleerd. De migratie en
Edge Function zijn uitgerold; de controle met twee echte accounts blijft
een afzonderlijke vervolgstap.
