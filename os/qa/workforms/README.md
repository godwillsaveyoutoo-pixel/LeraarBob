# Centrale werkvormbediening · 10 oktober 2026

Deze ontwikkelversie vervangt de verschillende startmenu's door één OS-ingang. De eigen vragen, antwoordbediening, voortgang en sessieproviders blijven bij de app. Lokale preview: <http://127.0.0.1:8795/>. Reviewbranch: `codex/os-personal-pilot-20261010`, PR #13. Deze wijziging is niet naar de publieke startpagina uitgerold.

## Gedrag

- Appkaart, rechtermuisknop, toetsenbordmenu en OS-menu gebruiken dezelfde werkvormkeuze. Alleen bestaande, voor het account beschikbare modi worden aangeboden.
- Rechtenwereld en Zeeslag krijgen een herkenbaar begin voor Duo Battle; geen uitstap naar een oud werkvormoverzicht. Uitnodigen, intrekken en accepteren blijven in het OS. De gedeelde sociale dienst gebruikt dezelfde account- en tabidentiteit.
- Samen leren, lokale duo's, klasbattles en oefenreeksen gebruiken dezelfde kop en navigatie. De oorspronkelijke formulieren en handlers blijven bestaan. Tijdens de oefeningen verdwijnt deze startkop.
- Klasstart gaat rechtstreeks naar de oorspronkelijke provider, zonder extra klashub. Getallenwereld behoudt `numbers-session`; Algebra, Vectormissie, Wortelbouw en Rechtenwereld behouden hun bestaande klasproviders. Alleen het vertrouwde leraarsaccount kan een klas starten.
- De klascode op het bureaublad ondersteunt de bestaande zes- en achttekencodes en opent de juiste wereld. Gekopieerde klas-/Getallenlinks komen terug in het OS. De oorspronkelijke standalone routes blijven bestaan voor compatibiliteit.
- Oefenbladen leiden naar de centrale themamappen en maker. Gegenereerde vragen en sleutel blijven per account op dit toestel opgeslagen; dit is geen cloudsynchronisatie.
- Wisselen van werkvorm, minimaliseren en hervatten bewaren geopende DOM, invoer en spelstatus. Een vol bureaublad vraagt een venster te sluiten, zonder stilzwijgend werk te vervangen.
- Alle appvensters gebruiken één OS-bovenbalk en de bestaande compacte vensterknoppen. Focusstand houdt Terug, Balken tonen en Sluiten bereikbaar. Algebra's Werelden, Levels en Hulpmiddelen staan in het gedeelde menu; er komt geen tweede navigatierij terug.

## Aansluitingen per app

Het volledige capability-overzicht van alle 24 catalogusingangen staat in [app-inventory.json](app-inventory.json). Geen nieuwe werkvorm wordt geclaimd voor een app die deze niet ondersteunt.

| App | Centrale ingang naar bestaande functies | Diepte van deze controle |
|---|---|---|
| Rechtenwereld | Solo, Samen leren, duo op één toestel, online duo, klasbattle, papier | Werkelijke uitnodiging/acceptatie, native vraag, invoer, terugroutes en klasrun |
| Rechten Zeeslag | Solo, online duo | Uitnodigen/intrekken/acceptatie, beide vlootborden, eigen aim-regressie |
| Getallenwereld | Solo, eigen reeks, lokaal duo, Learn, online battle, klaslearn, klasbattle, borduitleg, papier | Alle ingangen; echte lokale sessieaanmaak, code, vraag en afsluiten; bestaande oefen- en klasregressies |
| Algebrawereld | Solo, klasbattle, papier | Vergelijkingen en stelsels, echte tussenstappen, accountrollen, behouden invoer/XP en terugkeer |
| Vectormissie | Solo, lokaal duo, klasbattle | Werkvormformulieren en desktop/telefoonlayout |
| Wortelbouw | Solo, lokaal duo, klasbattle | Werkvormformulieren en desktop/telefoonlayout |
| Kleiduifschieten | Solo, groepsbattle | Centrale lobby en primaire knoppen; geen volledige groepspartij |
| Rechten & arbeid | Solo, live les | Bestaande live-lesregressie met fictieve leerkracht/leerling |
| Overige solo-apps/lessen/ateliers | Eigen bestaande ingang en gedeelde OS-vensterbediening | Catalogus/padcontrole; geen volledige nieuwe speelronde per app |

## Belangrijke grenzen

Rechtenwereld en Zeeslag hebben uitnodigingen op alias. Getallenwereld gebruikt nog zijn bestaande sessiecodes. Dit is bewust geen nieuwe universele uitnodigingsbackend. De voltooiingsvoorwaarde van Rechtenwereld-Duo blijft gelden: beide leerlingen moeten de gekozen wereld hebben afgerond; een lege keuzelijst geeft dit nu duidelijk aan.

De Algebra-klasprovider heeft voor stelsels het bestaande vraagtype **S1**. De zes solo-stelsellevels zijn geen zes zelfstandige klasbattletypen. Het gekozen solo-level en de onafgewerkte berekening blijven wel behouden bij terugkeer. Vergelijkingen geven hun ondersteunde levelpreset door.

Accounts en netwerkgrenzen in de browserproeven zijn lokale fixtures. De SQL-regels en Edge-handlers voor Rechten-Duo/Learn, getallen en klasactiviteiten worden lokaal uitgevoerd. Zeeslag gebruikt in deze preview een lokale BroadcastChannel-transportfixture; productie-WebSockets, productieaanmelding en echte accounts op twee toestellen zijn **niet** bewezen. Er zijn geen echte leerlingen uitgenodigd en geen productieschema's gewijzigd.

## Bronwijzigingen

`os/activity-entry.js` en `.css` verzorgen uitsluitend de gedeelde ingang boven de native formulieren. `os/desktop.js`, `desktop-model.js`, `personal-home.js`, `index.html` en `personal.css` verzorgen routes, rolgebonden modi, klascode, compact menu en vensterhergebruik. De beperkte appwijzigingen in `online.js`, `zeeslag.js` en `numbers-space.js` verbinden native sessies met het OS en vermijden oude terugroutes. `shared/axioma-social.js` deelt de centrale dienst met same-origin appframes; `shared/multiplayer/classroom.js` maakt OS-deellinks. Bestaande rekenengines en opslagidentiteiten zijn niet vervangen.

De browsercontrole `tests/os-workforms-browser.cjs` is aan de CI toegevoegd. De andere gewijzigde tests volgen nu de zichtbare centrale bediening en blijven echte native invoer en sessies controleren. `uniform-class-flow-browser.cjs` blijft daarnaast de oudere, bewaarde klashubroutes testen.

## Uitgevoerde controles

[verification.json](verification.json) verwijst naar de feitelijke rapporten. Browserzoom en schaal zijn 100%; de werkvormmatrix meet 1366 × 768, 390 × 844 en 640 × 360, inclusief uitgeklapte en ingeklapte balk en bereikbare knoppen van minstens 44 px.

| Controle | Resultaat |
|---|---|
| Nieuwe werkvormmatrix | 20 groepen, 102 gemeten doelen; echte Rechten-Duo, Zeeslaguitnodigingen, hervatten en Getallen-codeflows |
| Algebra | 18 groepen, 249 gemeten doelen; native stappen, eigen levels, rollen en 30 echte XP |
| Volledige klas-/liveproef | 13 groepen; vijf Learnvragen (45 XP), vijf Getallen Battle-vragen (50 XP), vijf Rechten Battle-vragen, live les met stemmen en verslag |
| Getallen provider | 13 groepen via centrale keuze; oorspronkelijke dubbele invoer, print en juiste onderwerpselectie |
| Wetenschappelijke provider | 11 groepen; drie niveaus, papier, vier sessievormen en oudere-servercompatibiliteit |
| Oudere klashub | 32 controles; oorspronkelijke simulaties, gedeelde codes, hervatten en echte lokale SQL |
| Vier pilots | 32 groepen, 23 layouts; Pythagoras, Rechtenwereld, Zeeslag, Glasraam |
| Centrale oefenbladen | 8 groepen, 39 metingen; alle dertien Algebra-levels, exacte sleutel en accountscheiding |
| Rechten-navigatie | 7 groepen; eigen terugplek en geen oude werkvormpagina |
| Bureaublad en sociale inbox | 9 groepen; echte lokale Learn-uitnodiging/afwijzing/intrekking/acceptatie en rolwissel |
| Compacte balken / Zeeslagbediening | 5 respectievelijk 6 regressiegroepen; inclusief 63 combinaties van a en b |
| DOM/model/duobeleid | 35 tests geslaagd |
| Statische controles | Catalogus gelijk; 75 controls en 19 lokale dependencies; JS-syntax en `git diff --check` |

Alle hierboven opgenomen succesvolle rapporten hebben nul browserfouten en nul ontbrekende bestanden waar gemeten. De Getallen-hoofdproef doorliep daarnaast **133 oefengroepen en 1076 metingen**, maar stopte bij een testverwachting voor het verwijderde provider-menu. Die test is aangepast naar de echte centrale bediening; de 13 providercontroles zijn afzonderlijk opnieuw uitgevoerd en geslaagd. De 133 ongewijzigde oefencontroles zijn daarna niet nogmaals uitgevoerd. Dit is vastgelegd in [getallen-core-partial.json](getallen-core-partial.json); dit rapport wordt niet als een volledig geslaagde run voorgesteld.

Screenshots: [werkvormkeuze](shared-mode-menu.png), [Zeeslag](naval-duo-1366-false.png), [donker](naval-entry-dark.png), [telefoon met ingeklapte balk](naval-duo-390-true.png), [echte Duo-vraag](rights-duo-playing.png), [Rechten Learn](rechtenwereld-learn-1366.png), [Getallen Learn](getallenwereld-learn-1366.png), [Algebra klasstart](algebra-trainer-classroom-390.png). Bronbestanden zijn identificeerbaar via [source-hashes.json](source-hashes.json).

Volgende stap: deze bediening beoordelen in de preview; daarna een volledige productieproef met daadwerkelijk ingelogde leraar en leerlingen op verschillende toestellen. Het uitbreiden van alias-uitnodigingen naar de Numbers-provider is afzonderlijk backendwerk.
