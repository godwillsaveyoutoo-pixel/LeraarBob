# Rechtenwereld — oplevering 30 september 2026

De vijf migraties en de drie Edge Functions uit dit opleverpakket zijn op het bestaande Supabase-project toegepast na goedkeuring. Het bijbehorende websitepakket is bestemd voor de `main`-branch van GitHub Pages. Er zijn geen bestaande leerlingresultaten of historische XP-waarden overschreven.

## Bekijken

- [Rechtenwereld openen](http://127.0.0.1:8775/games/rechten/rechtenwereld/index.html)
- [Keuze tussen leren en battle](http://127.0.0.1:8775/games/rechten/rechtenwereld/play.html)
- [Samen Leren](http://127.0.0.1:8775/games/rechten/rechtenwereld/learn.html)
- [Klasbattle](http://127.0.0.1:8775/games/rechten/rechtenwereld/classroom.html)
- [Online duel](http://127.0.0.1:8775/games/rechten/rechtenwereld/online.html)

Deze links gebruiken de lokale webserver. De publieke versie staat onder https://godwillsaveyoutoo-pixel.github.io/LeraarBob/games/rechten/rechtenwereld/. De benodigde serverfuncties zijn actief. De onderstaande beelden komen uit de browserproeven met fictieve leerlingen en een lokale testdatabase; zij bevatten geen echte leerlinggegevens.

| Samen Leren | Klasbattle |
| --- | --- |
| [Liggend scherm](release-preview/samen-leren-landschap.png) | [Smartphone](release-preview/klasbattle-smartphone.png) |
| [Smartphone](release-preview/samen-leren-smartphone.png) | [Uitslag voor de leerkracht](release-preview/klasbattle-resultaten.png) |

## Wat is uitgevoerd

### Whiteboard en navigatie

De bestaande werkborden, grafieken, handgeschreven koppen en lichte papierkleuren blijven behouden. De schematische schermen uit `SCHERMEN.svg` zijn niet als vervangende spelstijl overgenomen. Nieuwe bediening gebruikt rechte kaders en minimaal 44 px hoge actieknoppen.

Er is één ingang voor alleen leren, Samen Leren, lokale duo, online duel en klasbattle. Samen Leren staat als leeractiviteit in het menu. De gedeelde bovenbalk blijft inklapbaar; herstel en herladen zijn getest. De losse schermen tonen de echte Rechtenwereld-XP naast het profiel. Geïsoleerde werkborden krijgen geen tweede accountbalk.

### Centrale keuze ‘Samen spelen’

Het centrale paneel laat eerst een spel kiezen en toont daarna de beschikbare modi. Rechtenwereld biedt Samen leren, Duo-battle op één toestel, Online duel en Klasbattle. Wortelbouw en Vectormissie bieden hun bestaande lokale duo- en klasbattle. Op een smalle telefoon wordt de spelkeuze een keuzelijst; grotere schermen tonen drie spelknoppen.

`shared/play-modes.js` levert de namen, bestemmingen, uitleg en vormgeving aan het centrale paneel en de Rechtenwereld-keuzepagina. De bovenbalk gebruikt dezelfde namen, met aparte groepen Leren en Battles. Uitnodigingen voor een online duel worden niet meer als Zeeslag aangekondigd. Bestaande uitnodigingshandelingen en eerdere spellen blijven beschikbaar.

Vanuit een wereld blijft die context behouden in de ondersteunde instelschermen en bij teruggaan naar de spelvormkeuze. Geen modus wordt automatisch gestart door alleen een keuze te openen.

Gecontroleerd met de sociale menuproef (leerling/leerkracht, licht/donker, 320–1440 px, uitnodiging/weigeren, focus, uitloggen), de bovenbalkproef voor de drie spellen en de Online Duo-browserproef. Een aanvullende browsercontrole doorloopt alle vijf Rechtenwereld-bestemmingen inclusief solo, de wereldkeuze, terugweg en beide standen van de bovenbalk.

[Centraal paneel op smartphone](release-preview/samen-spelen-smartphone.png) · [Centraal paneel op desktop](release-preview/samen-spelen-desktop.png)

### Samen Leren: afgebakende eerste versie

- Twee of drie leerlingen uit dezelfde klas vormen een groepje via uitnodigingen op alias. De maker kiest een oefening en nodigt beschikbare klasgenoten uit; de ontvanger kiest **Meedoen** of **Niet nu**. De groepscode blijft beschikbaar als alternatief.
- Beschikbaar voor punten plaatsen, Δx/Δy en een rechte tekenen uit een voorschrift. Formulewerf vraagt passende voorkennis.
- Iedereen geeft eerst een eigen idee, zonder het antwoord van de anderen te zien. ‘Nog geen idee’ is toegestaan.
- Daarna één bouwer en één of twee controleurs. Eigen ideeën kunnen op het native bord vergeleken worden.
- Iedereen bevestigt hetzelfde voorstel. Een wijziging maakt oude goedkeuringen ongeldig. Alleen de bouwer start de gezamenlijke controle.
- Zes gezamenlijke opgaven, wisselende rollen en daarna een eigen eindcheck per leerling.
- Bij netwerkverlies blijft onbevestigd werk lokaal beschikbaar voor opnieuw versturen. Herladen hervat de sessie. Een afwezig derde groepslid wordt alleen na twee expliciete stemmen uitgesloten. Alleen verder leren blijft beschikbaar.

Uitnodigingen zijn bereikbaar via het centrale menu, ook vanuit een ander spel. Bij een ingeklapte bovenbalk verschijnt het aantal uitnodigingen binnen de bestaande herstelknop. Er komt geen zwevende online-teller over de oefening. Alleen accepteren brengt de ontvanger naar het groepje; de maker start de reeks afzonderlijk.

De server controleert klas, voorkennis, beschikbaarheid en de vrije plaatsen. Een uitstaande uitnodiging reserveert een plaats. Weigeren, intrekken of verlopen geeft die plaats vrij. Dubbel versturen of accepteren maakt geen extra deelnemer. Beginnen annuleert nog onbeantwoorde uitnodigingen; een afwezige partner verhindert starten totdat die terug is of de groep wordt aangepast. Een leerling die in een andere actieve leergroep of battle zit, wordt niet opnieuw gekoppeld.

[Uitnodiging ontvangen in Vectormissie](release-preview/uitnodiging-ander-spel.png) · [Groepje op smartphone](release-preview/groepje-smartphone.png)

De wachtkamer houdt de startknop bereikbaar op smalle en lage schermen. Ontvangen uitnodigingen staan ook op de instelpagina van Samen leren. Alleen verder leren blijft bereikbaar wanneer er niemand beschikbaar is of het netwerk uitvalt. Deze actie meldt je ook af bij het groepje. Bij netwerkverlies blijft het afmeldverzoek per account bewaard en probeert de sociale service het op de solopagina opnieuw; de leerling hoeft daarop niet te wachten.

Deze pilot schrijft nog **geen individuele mastery of voltooiing van leerhaltes** vanuit Samen Leren weg. De eigen eindcheck geeft wel feedback binnen de sessie. Verdergaan op de bestaande individuele leerroute blijft mogelijk. Een gezamenlijk goed antwoord is geen automatische ontgrendeling en geen XP voor alle deelnemers.

### Klasbattle

De leerkracht maakt een sessie, kiest wereld/onderdeel, ziet leerlingen binnenkomen en start de rondes. Laatkomers sluiten vanaf de volgende ronde aan. Sessiecode, tijd, opgave en werkbord gebruiken minder verticale ruimte.

Nieuwe Rechtenwereld-sessies worden nagekeken door een serverfunctie met dezelfde validators als het spel. Ook een aanvraag van een leerling kan de uitslag laten verwerken als het toestel van de leerkracht tijdelijk offline is. De leerkracht houdt de regie over de volgende ronde. Zonder enige verbinding kan een online ronde niet verder synchroniseren; de soloroute blijft beschikbaar.

Een juist antwoord verdient 1000 battlepunten plus maximaal 250 voor snelheid; een fout antwoord 0. De uitslag toont tien leerlingen plus je eigen positie wanneer je daarbuiten valt. Gelijke scores delen een rang. Battlepunten blijven apart van leer-XP. Er is nog geen permanente klas- of schoolranglijst op totale XP.

### Online duel

Alleen beschikbare klasgenoten die dezelfde geselecteerde wereld volledig hebben afgerond kunnen elkaar voor die wereld uitnodigen. Toekomstige, nog niet speelbare haltes tellen niet als vereiste. De server controleert de voorwaarden bij uitnodigen, accepteren en starten; ongeldige uitnodigingen blijven niet als speelbare uitnodiging staan.

Inzendingen en punten worden op de server afgehandeld. Onbevestigde antwoorden kunnen na herladen opnieuw verstuurd worden. Maximaal zeven rondes voorkomt eindeloze verlenging; gelijkspel is mogelijk. Solo blijft een uitweg wanneer er geen geschikte tegenstander is.

### XP en avatars

Een volledig afgewerkte opgave geeft 10 XP zelfstandig of 5 XP met hulp. Tussenstappen en herhaalde versies van dezelfde opgave geven geen extra XP. Een latere zelfstandige oplossing kan 5 XP aanvullen tot 10. Al opgeslagen Rechtenwereld-XP wordt bij overgang naar het nieuwe beloningsregister behouden; deze wijziging doet geen massamigratie van oude Rechtentrainer-accounts.

Avatarplaatsen werken voorlopig met initialen. Er is een gedeelde helper met een gesloten catalogus voor later aangeleverde portretten. Een keuzescherm en blijvende avatarvoorkeur in het centrale profiel zijn nog niet aangesloten.

## Verificatie

Geslaagd:

- 48 gerichte tests voor XP, de coöperatieve rollen, online pool/validators, opslag, herstel, accountscheiding en de bestaande soloroute.
- Drie suites met echte SQL en Edge-handlers in lokale PGlite: online duel, Samen Leren en klasbattle. Inclusief rechten, privé-antwoorden, herhaalde verzoeken, deadlines en laat aansluiten. Oude Vectormissie-klasgrading blijft werken.
- Browserproeven met twee leerlingcontexten en een leerkracht: eigen ideeën blijven privé, samen controleren, rolwissel, herladen, offline antwoordherstel en klasuitslag terwijl de leerkracht offline is.
- Native werkborden op 1366×768, 780×360 en 390×844; beide standen van de topbalk en bereikbare herstelknop. Geen JavaScript-fouten in die proeven. De badge leest het verwachte opgeslagen XP-getal.
- Bestaande Online Duo-browserproef en gedeelde topbalkproef voor Rechtenwereld.
- Cataloguscontrole en twaalf catalogustests; `git diff --check`.
- Uitnodigingssuite met de echte SQL en Edge-handler: klas- en voorkennisgrenzen, plaatsreservering, offline uitnodiger, verlopen en ingetrokken uitnodigingen, herhaalde verzoeken, codes en duo/trio-capaciteit.
- Uitnodigingsbrowserproef met drie geïsoleerde leerlingen: uitnodiging ontvangen in Vectormissie, melding bij ingeklapte balk, weigeren, opnieuw uitnodigen, expliciet accepteren en na herladen hetzelfde groepje terugvinden. Wachtkamer op 1366×768, 780×360, 390×844 en 320×640 met beide standen van de bovenbalk. Geen JavaScript-fouten.
- Sociale menuregressie: leerling en leerkracht, licht/donker, kleine telefoons, focusbehoud en uitloggen.

De brede reken-, route-, catalogus- en XP-controle slaagt: 213 tests. Verouderde mock-uphashes zijn vervangen door concrete contracten voor routes, sloten en echte XP. De bewaarde evidence, opslag en skill-ID's blijven byte-identiek. De controle vond en herstelde een ontbrekend aanhalingsteken bij de Verder-knop; de browserproef klikt deze knop nu werkelijk aan.

Daarnaast: de gedeelde bovenbalk op Startpagina, Rechtenwereld, Wortelbouw, Vectormissie, Gravity Maze en Algebra Trainer; de Gravity-aanraakbediening en herstart; de Algebra-rekenregels, accountopslag, hervatten, offline herstel en afdrukvoorbeeld.

Dit vervangt nog geen klasproef: echte live accounts, schoolwifi, langere sessies, uitstappen en opnieuw aansluiten op meerdere fysieke telefoons moeten na uitrol gecontroleerd worden. De uiteindelijke avatarillustraties en wereldkaart-zijactiviteiten vallen buiten deze eerste werkende pilot.

## Productiepakket

Toegepast op het bestaande Supabase-project:

1. `20260929235619_rechten_online_duo.sql`.
2. `20260929235623_rechten_class_server_grading.sql`.
3. `20260929235628_rechten_samen_leren.sql`.
4. `20260929235633_rechten_learn_invitations.sql`.
5. `20260929235636_algebra_trainer_catalog.sql`: registratie van 17 oefenvormen in de bestaande spelcatalogus.

Edge Functions `rechten-duo`, `rechten-class` en `rechten-learn` zijn actief, versie 1, met JWT-verificatie en extra gebruikerscontrole bij Auth. De SQL-workers zijn alleen uitvoerbaar door `service_role`; `anon` en `authenticated` hebben geen rechtstreekse workerrechten. Alle negen live verzoeken zonder sessie, met ongeldig token of met alleen de publieke anonieme sleutel geven 401.

De veiligheidscontrole vermeldt de bewuste, afgesloten [RLS-tabellen zonder directe policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). De al bestaande waarschuwingen over [privileged RPC-toegang](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) en [wachtwoordlekbescherming](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) zijn niet als onderdeel van deze uitrol gewijzigd.

Het frontendpakket gebruikt de bestaande GitHub Pages-publicatie vanaf `main`. De uitgepakte archiefmap `LeraarBob_world_unlocks_v9/` en gegenereerde browserrapporten blijven buiten de publicatie. De gedeelde navigatieaanpassingen voor de actieve spellen zijn meegenomen en met browserproeven gecontroleerd.

Er worden geen bestaande games, accounts of historische XP-tabellen verwijderd. De solo-opslag blijft accountgebonden. Een gewonnen wedstrijd is geen beheersingsbewijs. Spellen met alleen voltooiingen krijgen geen automatische omrekening naar XP. Een volledige klasproef met echte leerlingaccounts op schoolwifi is nog niet uitgevoerd; de volledige spelstromen zijn met geïsoleerde testaccounts en lokale PostgreSQL getest.

## Reproduceerbare lokale checks

Met `esbuild` en `@electric-sql/pglite` beschikbaar (eventueel via `LB_ESBUILD_MODULE` en `VECTOR_PGLITE_MODULE`):

```sh
node scripts/build-rechten-online-worker.cjs
node scripts/build-rechten-learn-worker.cjs
node --test tests/rechten-xp.test.cjs tests/rechten-learn.test.cjs tests/rechten-online.test.cjs tests/rechten-v2-storage.test.cjs tests/rechten-v2-progress.test.cjs tests/rechten-v2-route-policy.test.cjs
node tests/rechten-online-database.cjs
node tests/rechten-learn-database.cjs
node tests/rechten-learn-invitations.cjs
node tests/rechten-class-server.cjs
```

De browserproeven gebruiken een lokale webserver op `127.0.0.1:8775` en een geïsoleerde Chromium-debugsessie op poort 9245:

```sh
node tests/rechten-release-browser.cjs
node tests/rechten-learn-invitations-browser.cjs
SOCIAL_MENU_ONLY=1 node tests/social-browser.cjs
node tests/rechten-online-browser.cjs
LB_PAGES=Rechtenwereld node tests/platform-topbar-browser.cjs
```
