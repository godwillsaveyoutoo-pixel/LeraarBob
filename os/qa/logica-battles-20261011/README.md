# Vergelijkingen-mix en Logicawereld-battles · 11 oktober 2026

Deze ontwikkelversie voegt een zichtbare mixkeuze bij Vergelijkingen toe en sluit Logicawereld aan op online Duo Battle en Klasbattle. Samen leren is uit de Logicawereld-startopties gehaald. Oude bewaarde lokale rondes blijven leesbaar.

## Bekijken

- [Logicawereld Klasbattle als leerkracht](http://127.0.0.1:8797/os/?previewUser=teacher&app=logicawereld&entry=classroom)
- [Vergelijkingen als leerkracht](http://127.0.0.1:8797/os/?previewUser=teacher&app=algebra-trainer&entry=classroom)
- [Duo Battle als Alex](http://127.0.0.1:8797/os/?previewUser=alex&app=logicawereld&entry=online) en [als Sam](http://127.0.0.1:8797/os/?previewUser=sam&app=logicawereld&entry=online), in twee tabs openen.

De preview draait uitsluitend lokaal, met fictieve accounts en echte SQL/Edge-handlers. Het bestaande toetswerk is gekopieerd uit de vorige preview; die oude preview blijft beschikbaar. Nieuwe wijzigingen op beide adressen worden niet onderling gesynchroniseerd.

## Gedrag en bestanden

| Onderdeel | Wijziging |
|---|---|
| `games/algebra-trainer/classroom.html`, `shared/multiplayer/classroom.js` | Zichtbare **Mix · alle levels**, alle 17 eigen vraagvormen, automatisch 20 rondes zodat elke vorm voorkomt. Eigen selectie en herladen blijven werken. De verouderde Algebra-Stelselsmodule komt niet terug. |
| `games/logicawereld/{classroom,duo}.html`, `sessions.css` | Centrale OS-werkvormbediening, gebied of mix, echte uitnodiging/wachtkamer, klascode en resultaten. |
| `games/logicawereld/{app,battle-board,battle-config}.js`, `battle-player.html`, `battle.css` | De oorspronkelijke opgaven en antwoordbediening in een geïsoleerd werkbord. Geen tweede platformbalk. Eén antwoord per ronde; invoer blijft behouden bij minimaliseren en herladen. |
| `shared/multiplayer/logica-battle-policy.cjs`, `supabase/functions/logica-*` | De oorspronkelijke logica-validator bepaalt de serveruitslag; ontvangen client-scores en identiteiten worden niet vertrouwd. |
| De twee `2026101114272*_logica_*` migraties | Bestaande klas- en uitnodigingsafhandeling, met afzonderlijke Logicawereld-gegevens en afgeschermde workers. De bestaande uitnodigingsvergrendeling voorkomt een tweede reservering. |
| `games.json`, `js/catalog.js`, OS- en sociale koppelingen | Leerling ziet online Duo Battle; leerkracht ziet Klasbattle. Klascode en uitnodigingen openen de juiste app. Samen leren is geen startoptie. |

Online duo speelt vijf rondes, eventueel twee extra bij gelijkstand, met maximaal drie minuten per opgave. De bestaande snelheidsregel en 300 ms gelijkheidsmarge blijven van toepassing. Klasbattle gebruikt de bestaande juistheids- en snelheidspunten. Geen omzetting naar solo-XP of beheersing.

## Werkelijk gecontroleerd

- **97 gerichte tests** geslaagd: catalogus, desktop, logica, Algebra, uitnodigingen en nieuwe databaseflows; zie [commando’s en uitslagen](verification.json).
- Alle **90 native opgaven** door de battle-validator gecontroleerd. Volledige klasbattle van 20 rondes en duo van vijf rondes: juiste/onjuist ingediende antwoorden, dubbele inzendingen, gespoofte scores, rolcontrole, andere klas, gekruiste uitnodigingen, annuleren/weigeren en afgeschermde workers.
- Bestaande volledige Rechtenwereld- en Algebra-databaseproeven blijven slagen, inclusief historische Stelsels-beoordeling.
- [Nieuwe browserflow](report.json): uitnodigen op alias, accepteren, beide spelers klaar, native antwoord, tweemaal herladen, minimaliseren/hervatten, uitslag; centrale klascode, twee leerlingen, drie volledig gespeelde rondes en eindranglijst. Een tabel met acht rijen is in beide balkstanden getest op 1366 × 768 en 390 × 844, met bereikbare cellen, paginakeuze en antwoordactie.
- [Oorspronkelijke appregressie](solo-regression.json): alle 18 haltes en 90 opgaven daadwerkelijk aangeklikt; tien antwoordvormen, hulp, voortgang, accountwissel en zes papiergebieden. Ook compacte liggende schermen en bewaarde inklapkeuze gecontroleerd.

Screenshots: [Vergelijkingen-mix](vergelijkingen-mix.png), [duo-uitnodiging](duo-uitnodiging.png), [duo-opgave](duo-opgave-false.png), [klasmix](klas-mix.png), [wachtkamer](klas-wachtkamer.png), [eindranglijst](klas-eindstand.png), [mobiele waarheidstabel](tabel-390-true.png).

## Open voor productie

Deze wijziging is **nog niet op de publieke backend uitgerold**. De nieuwe migraties en beide Edge Functions moeten na review samen worden uitgerold, gevolgd door een proef met echte leerling- en leerkrachtaccounts. Ook eventuele eerdere open migraties moeten in hun volgorde worden meegenomen. Lokale tests bewijzen geen productieaanmelding of werking op twee fysieke toestellen via het internet.

De bestaande uitnodigingsafspraak reserveert één duo tegelijk; dit is geen uitbreiding naar meerdere gelijktijdige uitgaande uitnodigingen. Logicawereld is nog geen onderdeeladapter in de samengestelde toetsengine. Dat blijft een aparte vervolgstap.
