# Getallenwereld · eigen reeksen

De openbare ingang is `../getallenwereld/`. Deze map bevat de bestaande
Bewerkingentrainer als onderdeel van Getallenwereld: eigen reeksen, bordduo,
samen leren, oefenbladen en de klasbattle. Oude links blijven bruikbaar.
De opslag-ID `bewerkingen-trainer`, sleutel `leraarbob.bewerkingen.v1` en
klasprovider `bewerkingen` blijven intact. De 16 vraagvormen zijn een aparte
voortgangsreeks naast de 19 begeleide onderdelen; de aantallen worden niet opgeteld.

De rekenkern heeft zestien vraagvormen op drie niveaus: machten van machten,
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

Antwoorden bestaan uit aanklikbare wiskundige delen: voorgetal, exponent,
teken, teller, noemer en getal onder een wortel. `smart-answer.js/.css` tonen
contextkeuzes direct onder de formule, zonder antwoordtekstveld, keyboard of
zijpaneel. Een deel blijft aanklikbaar om de keuze te verbeteren. Dezelfde
component werkt in solo, Bordduo, nieuwe online sessies en oude klaswerkborden.
De opgebouwde uitdrukking gaat naar de bestaande exacte rekenkern. Bewaarde
oude tekstconcepten blijven zichtbaar tot de leerling nieuwe keuzes maakt.
Lokale KaTeX verzorgt de opgave en uitwerking. De rekenkern vergelijkt exacte
breuken, machten van positieve letters en vierkantswortels met BigInt. Bij ontbinden worden alle juiste producten van twee natuurlijke factoren met
minstens één volkomen kwadraat aanvaard, in beide volgordes (ook 3 · 4 of 3 · 2²).
Bij de andere rekenvragen moet een antwoord ook vereenvoudigd zijn; negatieve exponenten worden herschreven
als breuken. Wetenschappelijke schrijfwijze vereist een factor 1 ≤ a < 10.
Letters bij wortels zijn strikt positief; noemers moeten ongelijk aan nul zijn.
De ingevoerde tussenstapnotities worden bewaard, maar niet automatisch beoordeeld.

Voortgang en alle drie lokale reeksen gebruiken `AxiomaGame.storage`, met de
accountscheiding, offline cache en revisiecontrole van het platform. De
gedeelde topbar toont echte verdiende XP, of het aantal geoefende vraagvormen als er nog geen XP zijn.
Inklappen, licht/donker en volledig scherm veranderen geen opgave of invoer.
Bordbattle en leraarmodus vervangen de bewaarde zelfstandige reeks niet.
`?world=machten|wortels|wetenschappelijk&mode=solo|duo|teacher&screen=setup`
kiest alleen instellingen. Een nieuwe reeks begint pas via Start; Hervatten
opent de bestaande reeks. `?intent=worksheet&screen=setup` biedt Oefenblad
maken: de gegenereerde `sheetTasks` staan apart van alle speelreeksen en
geschiedenis. Oefenblad bij een bestaande reeks gebruikt juist diezelfde vragen.
Historische Algebra-missies via `?topic=op-*` blijven ondersteund.
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
node tests/smart-answer.test.cjs
node tests/bewerkingen-trainer-browser.cjs
VECTOR_PGLITE_MODULE=/pad/naar/@electric-sql/pglite node tests/bewerkingen-class-browser.cjs
node scripts/build-catalog.cjs --check
```

De browsersuites gebruiken een geïsoleerde Chromium op poort 9245 en een lokale
webserver op 8775. `VECTOR_BROWSER_PORT` en `VECTOR_BASE_URL` overschrijven die.
Externe requests worden geblokkeerd; accounts en inzendingen zijn fictief. De
klasproef voert de echte migraties en Edge-handler uit in lokale PGlite.
Screenshots staan in `/tmp/leraarbob-v10-screenshots/`.

## Oefenen en samen: pilot machten, wortels en wetenschappelijke schrijfwijze

`start.html` biedt Solo, Oefenblad, Duo Learn, Duo Battle, Ranglijsten en Bordduo;
leerkrachten krijgen daarnaast Klaslearn, Klasbattle, Leerlingen en Borduitleg.
Keuzes maken start geen oefening. In solo blijven niveau, selectie, bestaande
reeksen en hun historische opslag-ID behouden. Op compacte schermen gebruikt
Bordduo één werkbord met twee spelerknoppen; beide conceptantwoorden blijven
apart bewaard. Hint en Uitwerking zijn terugkeerbare werkbordtoestanden.

De nieuwe online sessies lopen via `numbers-session`, met een eigen toestel en
centraal account per deelnemer. Een code of link verbindt deelnemers. Klaslearn
heeft herhaalbare eigen antwoorden en leerkrachtsturing; Duo Learn vraagt na
beide juiste antwoorden een afzonderlijke bevestiging van hun bespreking.
Battle heeft één inzending per ronde en een serverdeadline (standaard 3 minuten).
Een leerkracht kan meedoen. Simulatie gebruikt dezelfde antwoordkeuzes maar
alleen lokale voorbeelddeelnemers en schrijft geen resultaten naar de server.
Het centrale battleoverzicht toont en hervat ook deze nieuwe sessies; oude
zescijferige codes en oude sessies gebruiken hun bestaande provider.

XP: 10 voor een eerste zelfstandig juist antwoord, 5 na hulp/verbetering,
0 na de volledige uitwerking of overslaan. Een afgeronde oefening krijgt maar
één beloning; nieuwe opgaven in een nieuwe reeks kunnen weer XP opleveren.
Historische Algebra-missies houden hun bestaande beloningsregel. Bordduo met
alleen twee namen geeft geen persoonlijke leerling-XP. Server-XP uit online
sessies telt één keer mee naast opgeslagen solo-XP op de startpagina.

Het overzicht filtert op datum (Europe/Brussels), klas en alias, sorteert op XP,
battlepunten, juiste antwoorden, activiteit en actieve tijd, en exporteert CSV.
Leerlingen zien hun eigen klas; actieve tijd van anderen is alleen voor de
leerkracht. Actieve tijd is een schatting bij een zichtbaar, recent bediend
scherm. Solo-periodes gebruiken de beschikbare historie (maximaal 250
opgeslagen opdrachten); oude ontbrekende gebeurtenissen worden niet verzonnen.
Oudere klasbattles blijven via hun eigen historisch overzicht bereikbaar.

Dit is de Getallenwereld-pilot. Platformbrede uitnodigingen aan online aliases,
publieke profielen, één nieuwe printmotor en aansluiting van alle andere
werelden zijn afzonderlijk vervolgwerk. Duo Learn registreert eigen oplossingen
plus bespreking; dit is nog geen gedeeld, stap-voor-stap bewerkingsbord.

Backend: gerichte additive migratie `numbers_learn_battle`, vier private tabellen
met RLS, uitsluitend via een service-rolefunctie na identiteitcontrole in de
Edge-handler. Nakijken gebruikt dezelfde exacte kern op de server. Herhaalde
inzendingen gebruiken dezelfde request-ID, zodat reconnect geen dubbele XP geeft.
Geen brede `supabase db push`: bestaande productiemigraties hebben deels andere
tijdstempels. Deploy daarna `numbers-session` met `verify_jwt=true` en de bestanden
`index.ts`, `handler.js`, `core.js`; publiceer vervolgens de frontend.

## Wetenschappelijke schrijfwijze: drie nieuwe niveaus en veilig hervatten

Nieuwe eigen reeksen, Bordduo, borduitleg, oefenbladen en simulaties gebruiken
voor de bestaande vraagvorm `scientific` generatorversie 2:

- Start: grote gehele getallen met één significant cijfer en exponenten 2–6.
- Basis: grote en kleine getallen met twee of drie significante cijfers,
  met positieve en negatieve exponenten van −6 tot 7.
- Verdieping: vier of vijf significante cijfers met interne nullen, bij heel
  grote en heel kleine getallen, met exponenten tot ±20.

De bestaande aanklikbare keuze voor het voorgetal en de exponent blijft intact.
De BigInt-controle vergelijkt de waarde exact en eist nog steeds 1 ≤ a < 10.
Opgeslagen taken bevatten `generatorVersion: 2` naast skill, seed, level en
variant. Taken zonder versie zijn altijd historisch versie 1, ook na herladen
van een solo- of duoreeks, blad of actieve online sessie. Nieuwe taken hebben
een `:v2`-suffix in hun taak-ID zodat oude conceptinvoer nooit ongemerkt aan een
andere vraag wordt gekoppeld. Accountopslag, voortgangs-ID `scientific`, de
16 vraagvormen, geschiedenis en XP-regels veranderen niet.

De productiebackend voor de drie nieuwe online niveaus is op **10 oktober
2026** uitgerold. De gerichte migratie is toegepast; `numbers-session` is actief
als versie 2 met `verify_jwt=true`. De gedeployde `index.ts`, `handler.js` en
`core.js` zijn bytegelijk aan de reviewbranch. Het catalogustotaal is 19 en de
RPC-rechten blijven beperkt tot de service-role. Hashes vóór en na uitrol
bevestigen behoud van de oorspronkelijke sessiefunctie, alle 41 voortgangsrijen
en de bestaande ruimte met twee deelnemers. De anonieme HTTP-controle geeft
401. Er zijn geen nieuwe sessies of leerlingantwoorden aangemaakt.

De frontend wordt via GitHub Pages vanaf `main` gepubliceerd; publieke ingangen
zijn [het bureaublad](https://godwillsaveyoutoo-pixel.github.io/LeraarBob/os/)
en [Getallenwereld](https://godwillsaveyoutoo-pixel.github.io/LeraarBob/games/getallenwereld/).
Actuele releasecontroles staan in [PR #7](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/pull/7)
en [het verificatierapport](../../os/qa/verification.json).
Oude servers blijven de historische reeksen aanbieden; de instellingen
melden dan dat Basis en Verdieping dezelfde bestaande vraagmix gebruiken.
De oude klasprovider `bewerkingen-class` houdt zijn historische generator en
sessiecontract. Een volledige controle met twee ingelogde productieaccounts
blijft open.

Uitrolvolgorde; stap 1 en 2 zijn op 10 oktober 2026 afgerond:

1. Pas uitsluitend
   `supabase/migrations/20261009202541_numbers_scientific_generator_versions.sql`
   toe na de bestaande numbers- en Getallenwereld-migraties. De oorspronkelijke
   private sessiefunctie blijft als `numbers_session_v1` beschikbaar voor de
   wrapper, maar is niet rechtstreeks aanroepbaar door een client of service-
   rol. De wrapper controleert de benodigde generator vóór inschrijving,
   vraagbediening of beoordeling. Hij verandert geen bestaande vragen,
   deelnemerschappen, antwoorden, XP, RLS of leerlingvoortgang. Alleen het
   catalogustotaal van Getallenwereld wordt 19 begeleide onderdelen.
2. Bouw `core.js` met de bestaande `scripts/build-numbers-session.cjs` en deploy
   `numbers-session` met de gewijzigde `handler.js` en `core.js`. Het frontend
   verklaart versie 2; de handler kiest versie 2 alleen als de database de
   versiecontrole ondersteunt. Een nieuwe handler op de oude database valt
   veilig terug op versie 1. Een oude handler op de nieuwe database maakt ook
   nog versie-1-ruimtes. In beide gevallen blijven de zichtbare vragen en de
   serverbeoordeling gelijk.
3. Publiceer de frontend met de bijgewerkte scriptversies. Een oude client mag
   nog eigen versie-1-sessies gebruiken, maar krijgt vóór inschrijving in een
   versie-2-ruimte de melding Getallenwereld te vernieuwen. Het openbare RPC-
   delegaat wordt opnieuw aangemaakt zodat eerder gecachte SQL-plannen de
   nieuwe guard niet kunnen omzeilen.
4. Controleer met twee bestaande echte accounts een wetenschappelijke Duo
   Learn, Duo Battle, Klaslearn en Klasbattle. De lokale test is bewijs voor
   SQL/Edge en browsergedrag, niet voor productie-login of internetverbindingen.

Gebruik geen brede `supabase db push`: historische productietijdstempels kunnen
afwijken. Deze uitrol heeft uitsluitend de gerichte migratie en Edge Function
bijgewerkt; de bestaande leerling- en sessiegegevens bleven behouden.

Gerichte verificatie:

```sh
node --test --test-isolation=none tests/scientific-provider.test.cjs
NODE_PATH=/pad/naar/node_modules node --test --test-isolation=none tests/scientific-session-version.test.cjs
```

De providercontrole bevriest 3600 historische taken met een SHA-256-controle en
controleert 3600 nieuwe taken met onafhankelijke gehele-decimaalrekenkunde.
De sessiecontrole gebruikt de echte lokale SQL-migraties en Edge-handler,
bedient alle vier online werkvormen op elk niveau, en controleert afwijzing vóór
inschrijving, geen dubbele XP, historische sessies, catalogusbehoud, veilige
terugval op een oude database en de gelijkheid van browser- en Edge-generatie.

Aanvullende controle:

```sh
LB_ESBUILD_MODULE=/pad/naar/esbuild node scripts/build-numbers-session.cjs
VECTOR_PGLITE_MODULE=/pad/naar/@electric-sql/pglite node tests/numbers-session.test.cjs
NODE_PATH=/pad/naar/node_modules node tests/numbers-space-browser.cjs
NODE_PATH=/pad/naar/node_modules node tests/numbers-smart-layout.cjs
NODE_PATH=/pad/naar/node_modules node tests/getallen-unified-browser.cjs
NODE_PATH=/pad/naar/node_modules node tests/classroom-simulation-browser.cjs
```

De nieuwe browsersuites starten zelf lokale servers. Ze gebruiken geïsoleerde
browsercontexten en fictieve accounts. De online controle draait de echte
Edge-handler met lokale PostgreSQL (PGlite), geen productie-inzendingen.
