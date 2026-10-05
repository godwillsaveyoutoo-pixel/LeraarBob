# Getallenwereld

Online ingang: `games/getallenwereld/`. De startpagina bevat een eigen tegel.
Deze integratie gebruikt de aangeleverde `Speel-Getallenwereld-v0.2.html`:
8 onderdelen Machten en 7 onderdelen Vierkantswortels, elk met zes opgaven.
Een onderdeel aanklikken selecteert het; de knop **Start dit onderdeel** of
**Verder oefenen** opent de werkbank. Herhalen maakt een nieuwe reeks.

De leerling kiest eerst de rekenregel en bouwt vervolgens de uitwerking met
aanklikbare antwoorddelen. Bij elk deel verschijnen passende getalkeuzes,
ook voor negatieve exponenten, tellers/noemers en kwadraatfactoren. Er is geen
cijferkeyboard of antwoordtekstveld. De bestaande exacte kern blijft beoordelen.
Hulp gebruikt een ander voorbeeld en bewaart de eigen invoer. Een onderdeel
is afgerond na zes verschillende uitgewerkte opgaven; de interface vermeldt
apart hoeveel daarvan zelfstandig zijn opgelost. Afgerond is dus geen
uitspraak dat een leerling de vaardigheid beheerst.

## Platformkoppeling

- Eigen `game_id`: `getallenwereld`; eigen opslag:
  `leraarbob.getallenwereld.v1`. `AxiomaGame.storage` scheidt gast,
  leerling en leerkracht en synchroniseert leerlingwerk met het platform.
- De topbar en de catalogus tonen het echte aantal afgeronde onderdelen op
  15. Deze begeleide leerroute kent geen XP toe. De genereerbare reeksen en
  online sessies binnen dezelfde wereld verdienen wel eigen, echte XP. De
  historische voltooiingen worden niet omgerekend naar XP.
- De bron deelde een opslagnaam en een vertaaltabel met de Bewerkingentrainer.
  Die koppeling is verwijderd; bestaande Bewerkingentrainer-data blijven
  ongewijzigd. Er is geen automatische overname van ongekoppeld offlinewerk
  naar een leerlingaccount.
- KaTeX, het account, de voortgangslaag en de inklapbare topbar worden lokaal
  hergebruikt. `lessons.js` gebruikt de bestaande exacte `BewerkingenCore`,
  die bytegelijk was aan de meegeleverde rekenkern. De grote ingebedde
  lettertypes en de offline-accountstubs zijn niet gedupliceerd.
- Het kruimelpad volgt Getallenwereld → hoofdstuk → onderdeel. Directe
  licht/donker- en schermvullende knoppen veranderen geen opgave. De voorkeur
  voor inklappen blijft bij herladen bewaard; de herstelknop heeft eigen ruimte.
- Portret blijft bruikbaar: de draai-toestelblokkade van de bron is verwijderd,
  de bovenbalk en hoofdacties blijven op hun plaats. De onderdelenlijst
  scrollt binnen haar eigen vak. Het werkbord gebruikt het beschikbare
  scherm; bij uitzonderlijk weinig ruimte kan de inhoud intern scrollen.
  Acties hebben aanraakdoelen van minstens 44 × 44 pixels.

Diepe links: `?thema=machten`, `?thema=wortels` of
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
beloven. Een selectie verandert geen lopend werk en start geen sessie. Ook
**Volgend onderdeel** selecteert alleen; starten blijft een expliciete actie.

Online instellingen (vraagvormen, niveau, aantal, tijd, duo/klas en meedoen)
blijven bij herladen behouden. Lege selecties worden niet stilzwijgend alle
vragen. Checkboxkeuzes houden hun focus. Meer over beoordeling, XP en de
scheiding van simulatie/echte deelname staat in
[de reekscomponent](../bewerkingen-trainer/README.md).

De opgeslagen momentopname bevat de reeks, invoer, hulp en oplossingsbewijzen,
maar geen volledige tijdlijn, actieve oefentijd of gebeurtenissenlogboek.
Die behoren tot de toekomstige centrale analysearchitectuur.

## Controle

```sh
node --test tests/getallenwereld.test.cjs tests/getallen-guided-choices.test.cjs tests/catalog.test.cjs
node scripts/build-catalog.cjs --check
NODE_PATH=/pad/naar/node_modules ALGEBRA_CHROMIUM_PATH=/pad/naar/chromium \
  node tests/getallenwereld-browser.cjs
```

De kerncontrole maakt 2700 deterministische opgaven en controleert alle
uitwerkingsstappen exact. De geïsoleerde browsercontrole gebruikt fictieve
accounts, blokkeert externe requests en schrijft geen echte leerlinggegevens.
Ze speelt alle vijftien routes, controleert herladen en accountwisseling en
bekijkt vijf schermmaten in beide topbarstanden. Screenshots staan in
`/tmp/leraarbob-getallenwereld/`.

De interactieve stappen zijn bovendien op 640×360 en 390×844 gecontroleerd
met `tests/getallen-guided-layout.cjs`: 92 bestaande formulevarianten met
zichtbare aanraakdoelen en echte antwoordcontrole. De keuzetoets dekt 11.941
antwoorddelen uit oude en nieuwe opgaven, inclusief alternatieve geldige
kwadraatfactoren. Accountisolatie, terugkeer en bewaarde invoer worden in de
bestaande Getallenwereld-browsertests gecontroleerd.
