# Getallenwereld

Online ingang: `games/getallenwereld/`. De startpagina bevat een eigen tegel.
Deze integratie gebruikt de aangeleverde `Speel-Getallenwereld-v0.2.html`:
8 onderdelen Machten en 7 onderdelen Vierkantswortels, elk met zes opgaven.
Een onderdeel aanklikken selecteert het; de knop **Start dit onderdeel** of
**Verder oefenen** opent de werkbank. Herhalen maakt een nieuwe reeks.

De leerling kiest eerst de rekenregel en vult vervolgens de uitwerking aan.
Hulp gebruikt een ander voorbeeld en bewaart de eigen invoer. Een onderdeel
is afgerond na zes verschillende uitgewerkte opgaven; de interface vermeldt
apart hoeveel daarvan zelfstandig zijn opgelost. Afgerond is dus geen
uitspraak dat een leerling de vaardigheid beheerst.

## Platformkoppeling

- Eigen `game_id`: `getallenwereld`; eigen opslag:
  `leraarbob.getallenwereld.v1`. `AxiomaGame.storage` scheidt gast,
  leerling en leerkracht en synchroniseert leerlingwerk met het platform.
- De topbar en de catalogus tonen het echte aantal afgeronde onderdelen op
  15. Deze versie kent geen XP toe. Getallenwereld telt niets automatisch
  als een oplossing of XP van de Bewerkingentrainer.
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
  onderdelen en de werkbank kunnen op kleine schermen scrollen en acties
  hebben aanraakdoelen van minstens 44 × 44 pixels.

Diepe links: `?thema=machten`, `?thema=wortels` of
`?onderdeel=machten-product` (alle ids staan in `lessons.js`). Een diepe link
selecteert een onderdeel zonder een bewaarde reeks te vervangen.

## Beschikbare werkvormen

Deze versie heeft een eigen solo-leerroute. Het menu benoemt de
**Bewerkingentrainer** als bestemming voor een oefenblad of bespreking en
voor een battle met machten en wortels. Klasbattle opent de centrale
Klasbattle-pagina met `game=bewerkingen`. Dat gebruikt de bestaande
Bewerkingen-battle; de uitslagen horen bij Bewerkingen. Getallenwereld heeft
nog geen eigen printprovider, multiplayerbeoordeling of projectormodus.
Leerkrachten kunnen de gewone route gebruiken in de bestaande oefenmodus;
die schrijft geen leerlingvoortgang online.

De opgeslagen momentopname bevat de reeks, invoer, hulp en oplossingsbewijzen,
maar geen volledige tijdlijn, actieve oefentijd of gebeurtenissenlogboek.
Die behoren tot de toekomstige centrale analysearchitectuur.

## Controle

```sh
node --test tests/getallenwereld.test.cjs tests/catalog.test.cjs
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
