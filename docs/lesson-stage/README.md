# Lesson Stage · Rechtenwereld — Arbeid

De les staat in [`lessons/rechten-arbeid/index.html`](../../lessons/rechten-arbeid/index.html), bereikbaar via **Rechtenwereld → spelvorm kiezen → Open Lesson Stage**. Het is een uitbreiding van de bestaande statische LeraarBob-site. Er is geen afzonderlijke app, accountdatabase of battle-engine.

## Klaarzetten voor de les

1. Voor een nieuwe installatie: pas `supabase/migrations/20261006201006_lesson_stage.sql` en daarna `supabase/migrations/20261006202818_lesson_live_follow.sql` toe. Hiervoor zijn de bestaande klasbattle- en kleiduifmigraties nodig. De bestaande `rechten-class` Edge Function blijft ongewijzigd. Publiceer de sitebestanden via de gebruikelijke GitHub Pages-route.
2. Open de les met je bestaande leerkrachtaccount. Klik bovenaan **Live** of onderaan **Les starten**. Kies **Nieuwe les starten · 5 minuten aftellen**; de timer begint meteen en je krijgt een lescode. Een lopende les verschijnt met **Les hervatten** en **Les beëindigen**. Hervatten bewaart de code, activiteit en lespositie. Een open try-out beëindig je eerst; daarna start je een nieuwe les met een nieuwe code. Beëindigen sluit ook een open vraag of groepsactiviteit, zonder het verslag te wissen. Een recente open les wordt teruggevonden wanneer je sessiebeheer opent, ook als deze browser de code niet meer bewaart. Een eventueel andere actieve Rechtenwereld-battle moet eerst via zijn bestaande scherm afgerond worden.
3. Kies via de lesroute **Taak 1 · samen corrigeren** en **Taak 2 · aan het werk**. Laad daar je eigen PDF’s. Er zijn geen oorspronkelijke taken aangeleverd: de les verzint die niet. Via **Oefenblad maken in Rechtenwereld** kun je de bestaande generator gebruiken. PDF’s worden in IndexedDB op dit toestel opgeslagen, niet naar leerlingen geüpload. De ingebouwde PDF-viewer bedient pagina’s en zoom; schakel **Tekenen** uit om de viewer te bedienen. Inkt is een bewaarde schermlaag, niet aan een PDF-pagina verankerd: wis die bij een paginawissel.
4. Bij **Nieuwe les starten** verschijnt automatisch “We starten weldra” met vijf minuten en de aansluitcode. **Aftelling opnieuw starten · 5 minuten** is alleen een extra optie voor een lopende les. Leerlingen volgen dezelfde aftelling, ook als ze later aansluiten. Bij nul verschijnt automatisch “We gaan samen lezen”, met de afspraak over namen, duo’s en meelezen. Dit scherm wacht op jouw klik. Eerder verder klikken mag; **R** start de aftelling opnieuw en herladen bewaart de resterende tijd. Volledig scherm en licht/donker staan rechtstreeks in de gedeelde bovenbalk. Inklappen laat een bereikbare herstelknop staan. De lespositie, balkvoorkeur en documenten worden bij herladen hersteld; een actieve groepssessie blijft bestaan.
5. Projecteer. **→ / spatie / klik op het lege bord** gaat verder; **←** gaat terug; **R** herhaalt alleen de scène. Op formulieren en in een PDF blijven toetsen bij die invoer. Onderaan zitten vorige, volgende, herhalen en lesmenu. De bediening vervaagt als je ze niet gebruikt. Geluid staat standaard uit en kan in het lesmenu aan.

De leerling klikt op **Live** naast het account in de gedeelde bovenbalk en voert de lescode in, of opent de deelnamelink met ingevulde code. Een leerlingaccount dat de leerkrachtpresentatie opent, wordt automatisch naar deze leerlingweergave gestuurd. **Live** hervat een bewaarde deelname; **Andere sessie** maakt de code-invoer weer beschikbaar zonder antwoorden te wissen. De bestaande leraarBob-aanmelding blijft ongewijzigd: de code sluit de leerling aan bij jouw sessie. Dezelfde code geldt voor het verhaal, vragen, battle en kleiduifschieten. Leerlingen zien jouw huidige scène en leesnamen op hun eigen scherm, ook als ze later aansluiten. Synchronisatie gebeurt ongeveer elke twee seconden; dit is geen videostream. De leerlingweergave heeft geen presentatiebediening: leerlingen volgen jouw stappen en kunnen alleen antwoorden wanneer jij een vraag of activiteit opent. Na het sluiten van een stemming verschijnt de klasgrafiek ook bij hen; individuele antwoorden blijven uitsluitend in jouw verslag. Lokale PDF’s blijven op het klasbord.

Direct na **Sessie starten?** komt een vaste opwarming: twee hellingbeelden (verandering van y per stap in x; positief, negatief en nul), gevolgd door **Kleiduifschieten** op stap 7. Klik **Open twee oefenschoten**, geef leerlingen tijd om te proberen en klik daarna **Start samen**. Na **Stop activiteit · terug naar verhaal** gaat de les verder bij **Ik heb iets voor jullie gebouwd**. Navigeren of herladen start geen extra race. Via **Lessessie → Kleiduifschieten klaarzetten** kun je het spel ook later opnieuw inzetten en het tempo kiezen. Leerlingen krijgen het bestaande spel in hun lesscherm, met drie grote antwoordknoppen rechts. Terwijl de groep wacht, proberen ze twee oefenschoten zonder klok of score. Jij geeft hun daarvoor de tijd en start daarna de gezamenlijke race. Een gezamenlijke start onderbreekt eventuele resterende oefenschoten veilig. Ook tijdens de race kan een leerling aansluiten. De server controleert de antwoorden en bewaart pogingen en resultaten bij dezelfde alias. Herladen maakt geen nieuwe race. De klasbattle neemt hetzelfde lesscherm over zodra jij de eerste vraag start. Leerlingen zijn al aangesloten met hun alias en hoeven niet opnieuw in te loggen. Wanneer jij naar het verhaal teruggaat, volgen zij automatisch weer de presentatie.

**Lessessie → Bekijk huidig lesverslag** toont de gesloten klasvragen, battle-antwoorden en kleiduifresultaten per alias. **Download CSV** exporteert die antwoorden. Je kunt ook eerdere sessies openen. De deelnamecode blijft acht uur geldig; alleen de oorspronkelijke leerkracht kan het verslag daarna nog raadplegen.

## Verloop

De presentatie volgt het nadien aangeleverde gesprek: 70 stappen, gegroepeerd rond de twaalf korte hoofdstukken van de inleiding en de echte lesactiviteiten. De intro is bedoeld als gesprek van ongeveer 6–8 minuten. Sommige momenten zijn één zin of een stilte van enkele seconden; het zijn geen 70 volgeschreven slides.

De film bevat nu de donkere systeemstart, het pakketje, de twee verantwoordelijkheden, LeraarBob OS met cumulatieve regels en serverhumor, het gereedschap dat naar één doel terugkeert, een hoofd met grote oren/ogen en een oplopende CPU-meter, expliciete stilte en werkgesprekken, een geïllustreerde stad die teruggaat naar een leerling met papier, verschillende startpunten, HELPEN.EXE met terugspoelen, het kopieerwezentje, ethiek, het kleine schuitje dat volloopt en verder vaart, de wederzijdse belofte en de stille “Deal?”. Daarna volgen dezelfde live lesactiviteiten. Het slot luidt “Vandaag hebben we niet bewezen dat iedereen alles kan. Wel dat we kunnen werken.”

De tijdstap is een zichtbare vijftienminutentimer: de leerkracht houdt de regie en gaat zelf verder. Een scène teruggaan of herhalen maakt geen nieuwe sessie, heropent geen stemming en start geen battleronde opnieuw. Tijdens de battle bedient dezelfde volgende-knop start, vroegtijdig sluiten en volgende vraag. **Overslaan** in het lesmenu verlaat het onderdeel zonder de actieve sessie te stoppen.

De vraag “Heb jij deze taak volledig zelf gemaakt?” wordt per alias opgeslagen. Dat staat vooraf op het leerlingenscherm. In de correctie kan de leerkracht een vraag met twee tot zes keuzes invoegen; ook daar staat antwoorden per alias standaard aan. Anoniem is een expliciete optie. Er staan drie bewerkbare startvragen klaar: zelf een stap uitleggen, “Waar zat jouw grootste probleem?” en een foutbespreking. Na sluiten leidt **Terug naar de correctie** naar hetzelfde PDF-iframe, met dezelfde viewerpositie. Ook de oorspronkelijke groepsuitslag blijft later beschikbaar.

## Samen lezen

De twintig opgegeven leerlingen zijn verdeeld over tien vaste duo’s. Boven elke leerlingbeurt staan beide namen, bijvoorbeeld **Imane / Ibtissam**. Het duo kiest zelf wie leest; er is geen vaste verdeling per zin en ook een extra zin krijgt geen aparte leerlingnaam. Hetzelfde duo blijft staan binnen het leesblok. Bij reacties van de leerkracht staat **LeraarBob**. De eigen belofte van de leerkracht blijft in zijn stem. Leerlingteksten spreken vanuit “wij” en “ons”. In de systeemscène vraagt een leerling naar onderhandelen en antwoordt de leerkracht; bij “Deal?” gebeurt het omgekeerde. De boot blijft één leesblok voor Paris en Souraya. De generieke leerlingfiguren hebben verschillende meisjeskapsels. In de volle boot staan negentien meisjes en één jongen, naast de leerkracht. Deze illustraties zijn niet aan individuele leesnamen gekoppeld.

Via **Lesmenu → Wie leest mee?** kun je afwezigen uitvinken. De aanwezige duopartner neemt de beurt over. Zijn beiden afwezig, dan verschijnt een ander aanwezig duo; als niemand beschikbaar is, leest de leerkracht. **Ander duo** op de scène stelt twee lezers voor het hele blok in. Dezelfde naam tweemaal kiezen laat één persoon alles lezen. Dit wijzigt geen lesstap, animatie, sessie of leerlingvoortgang. Aanwezigheid en vervangingen blijven lokaal bewaard; **Iedereen aanwezig · oorspronkelijke duo’s** herstelt de oorspronkelijke indeling voor een volgende les.

De opening is nu een antwoordspel: “U hebt de les voorbereid” / “Wij maken er samen iets van.” Upload sluit om 23:00 **de avond vóór de les**. De doel- en reiswegscènes gebruiken een groot geïllustreerd landschap met een doelvlag en een route via uitleg, oefenen en zelf doen. Vier grote beelden verbinden wiskunde met vorm, richting, data en verandering, en vervolgens met de les zelf. Bij eerlijk leren blijft eerst het toneelmasker staan; de volgende klik zet het opzij en toont “IK STA HIER” en een haalbare volgende stap.

## Repository-audit en hergebruik

| Bestaande bouwsteen | Gebruik in Lesson Stage |
| --- | --- |
| `shared/leraarbob-topbar.*`, `shared/collapsible-topbar.*` | Account, navigatie, fullscreen, weergave en bewaarde inklapkeuze. Voortgang toont echte afgeronde battlerondes. |
| `shared/axioma-auth.js`, `js/account-ui.js` | Bestaande teacher/student-identiteit en aanmelddialoog. |
| `shared/multiplayer/classroom.js`, `vector_class_rooms/members/answers` | Bestaande leerlinginterface, codes, lidmaatschap, late deelname en antwoorden. |
| `games/rechten/kleiduiven/`, `axioma_private.clay_v2` | Bestaande vraaggeneratie, race en servercontrole via een adapter voor de lessessie. |
| `supabase/functions/rechten-class/` | Bestaande geauthenticeerde servercontrole en puntentoekenning. |
| `games/rechten/rechtenwereld/battle-config.js`, `mission-runtime.js`, `battle-player.html` | Native vraaggeneratie, validatie en geïsoleerd werkbord. De ontbrekende `values-view.js`-afhankelijkheid van de huidige shell is aan het battle-werkbord toegevoegd. Geen tweede platformbalk in het iframe. |
| `worksheets.html`, `shared/worksheet-*`, `shared/proof-pdf.js` | Bestaande werkblad-/PDF-generatie blijft de bron. Er was geen algemene bewaarde documentstage; deze gebruikt de ingebouwde PDF-viewer. |
| Vectormissie Kahoot-flow en Rechtenklasbattle | Bestaande vraag/resultaat/volgende-ronde-lifecycle hergebruikt. Er was geen algemene anonieme opiniepoll. |
| `games/pythagoras.html` | Visuele referentie voor grote werkruimte, handschrift, één idee en click progression. |
| Heaven | Geen herkenbare implementatie aangetroffen in de actieve repository. De door de gebruiker beschreven lijnkunst, stilte en scènegrammatica zijn als ontwerprichting gebruikt. |

De map `LeraarBob_world_unlocks_v9/` en andere bestaande lokale wijzigingen zijn geen bron voor een tweede implementatie. De nieuwe lesingang is toegevoegd aan de bestaande `play.html` zonder andere lokale ingangen weg te halen.

## Eventcontract

`shared/lesson-stage/engine.js` is onafhankelijk van DOM, authentication en backend. Een les heeft `id`, `version: 1` en `steps`. Elke stap heeft een unieke `id`, een `title` en `events`. `at` is een vertraging in milliseconden vanaf de scène-start. Alle geplande effecten krijgen een `AbortSignal`; navigatie annuleert oude callbacks. Content registreert zich als `window.LessonStageContent`. `reading` bevat een stabiel duo-index (`pair`) en een leesrol (`lead`: `pair` of `teacher`); de les levert `readers` en `readerPairs`. Optionele `chapter`- en `notes`-velden verzorgen hoofdstuklabels en spreekcues in het lesmenu. Lespositie wordt per stabiele stap-id bewaard, zodat ingevoegde scènes de hervatplek niet verschuiven. De cursor van de eerste 33-stappenversie wordt eenmalig naar die ids vertaald.

| Event | Payload / gedrag van de huidige adapters |
| --- | --- |
| `scene` | `art`, `seed`, `phase`, `tone`, `color` en tekeningparameters: tijdgestuurde canvas-scène. Een donkere verhaalbeat wijzigt de bewaarde licht/donkervoorkeur niet. |
| `clay` | Bestaande groepsactiviteit: expliciet openen voor twee oefenschoten, samen starten en afsluiten om naar de volgende lesstap te gaan. Navigatie alleen maakt geen race. |
| `text` | `text`, optioneel `note`, `noteSpeaker` en `choices`: centrale zin, kleine droge noot en doorklikknoppen. Alle tekst wordt veilig via tekstnodes geplaatst; `emphasis` markeert gekozen woorden en `impact` geeft belangrijke zinnen een korte entree. Betekenisvolle zinnen worden niet automatisch door een volgende zin vervangen. |
| `draw` | `paths` met punten in een 1000 × 620-coördinatenruimte, `duration`; `action: 'erase'` wist. |
| `animate` | `action: 'silence'`; of `action: 'morph'`, `from`, `to`, `duration`, met corresponderende paden/punten. |
| `audio` | `cue`: korte zachte synthetische klank, alleen na expliciet inschakelen. |
| `pause` | `duration`: zichtbare wachttimer; geen gedwongen scèneovergang. |
| `liveJoin` | Toont/maakt de bestaande groepssessie en deelnamelink. |
| `poll` | `id`, `question`, `options`, `anonymous`; openen/sluiten via docentbediening. |
| `pdf` | `slot`: lokaal document met eigen bewaarde iframe. |
| `exercise`, `game` | `src`, `title`: bestaande module op dezelfde origin, persistent iframe. Geïsoleerde werkborden gebruiken hun bestaande kale ingang. |
| `battle` | De les levert `deck`, `band(round)` en optioneel `battleResultStep`. De huidige live-adapter koppelt Rechtenwereld. |
| `results` | `source: 'poll'` met `poll`-id, of `source: 'battle'`. |

Voor een ander spel blijft de sequence-engine dezelfde; vervang de live-/werkbordadapter door die van het spel. Er is bewust geen tweede generieke multiplayerdienst geïntroduceerd. Een eigen les kiest zijn contentbestand en adapters; de huidige HTML-ingang en docentvoorbereiding zijn voor Arbeid ingericht.

Animatieposities volgen verstreken tijd, vaste parameters en een seed; er is geen `Math.random()` of frame-afhankelijke integratie. Canvas schalen behoudt verhoudingen. De getekende cast heeft ingevulde silhouetten, kleding, gezichten en handen; voorwerpen krijgen materiaalvlakken en schaduwen. Blauw markeert routes, amber systeemmomenten, rood overbelasting/kopiëren en groen denkruimte/samenwerken. Korte inktuitbarstingen, verende bewegingen en tekstaccenten leggen nadruk op gekozen momenten. Er zijn geen herhalende flitsen. Bij opeenvolgende zinnen met dezelfde tekening loopt het beeld door; teruggaan of R speelt het opnieuw. Na tien seconden stopt de renderlus, met opnieuw tekenen bij schalen of een weergavewissel. `prefers-reduced-motion` toont de uitgewerkte tekening; de betekenisvolle tekst- en stiltebeats blijven bestaan.

## Twintig vragen en resultaten

1–5: coördinaten lezen/plaatsen, stijgen/dalen, bijzondere rechten en nulwaarde aflezen. 6–10: verschillen, richtingscoëfficiënt, voorschrift, grafiek en tabel. 11–15: helling, nulwaarde berekenen, formule uit grafiek en twee ongelijkheden. 16–19: rekenen met breuken, tekenschema, formule afleiden en zelf een rechte tekenen. Vraag 20 combineert een nulwaardeberekening en negatief gebied. De native varianten lopen van 0 naar 3. Elke vraag krijgt maximaal twee minuten; de docent kan vroeger sluiten. De bandlabels veranderen volgens de gevraagde vijf fasen.

Alle twintig vragen zijn oplosbaar getest met de bestaande antwoordhelpers én de bestaande serverpolicy. Ze blijven de vraagvormen van Rechtenwereld: sommige zijn meerkeuze, andere constructie of meerstapsinvoer. Papierwerk is een didactische aanwijzing; de software beweert niet te kunnen vaststellen of papier daadwerkelijk gebruikt werd.

Het klasbeeld telt per vaardigheid werkelijke kansen, juiste antwoorden en ontbrekende inzendingen uit de bestaande battletabellen. Late deelnemers tellen vanaf hun eerste geldige ronde. Er zijn geen fictieve XP, voorbeeldresultaten of nieuwe masteryclaims. De bestaande leerlingranglijst blijft beschikbaar in de oorspronkelijke klasbattle-interface.

## Privacy en lifecycle

De toevoeging bestaat uit private lesmetadata met actuele presentatiestap, polls, stemontvangstbewijzen, een antwoordtabel voor niet-anonieme vragen, koppelingen naar native kleiduifraces en een journaal van geaccepteerde schoten. Alle tabellen hebben RLS en geen directe rechten voor `anon`/`authenticated`. De publieke RPC is `SECURITY INVOKER`; de private functie controleert `auth.uid()`, bestaande kamereigenaar, lidmaatschap en vervaltijd. Mutaties vergrendelen dezelfde kamer als de bestaande battle; dubbel stemmen en herhaalde verzoeken zijn idempotent.

Bij een anonieme vraag wordt de keuze uitsluitend in een groepsteller verwerkt. Het ontvangstbewijs bevat account/poll voor ontdubbeling, zonder keuze of tijdstip. Er is geen API die een anonieme keuze aan een leerling koppelt, geen live stemmenteller en geen tussentijdse uitslag. Ook de docent ziet de totalen pas na sluiten. Dit is anonimiteit in de applicatie, geen claim over infrastructuurlogs of wat uit een zeer kleine groep afgeleid kan worden. Niet-anonieme vragen melden vooraf dat de docent individuele antwoorden kan zien; alleen de eigenaar krijgt die namen na sluiten.

Lespositie en weergave zijn presentatievoorkeuren. Sessieverwijzingen zijn per centraal account opgeslagen. Een accountwissel negeert oude asynchrone antwoorden. PDF’s en tekeningen blijven lokaal. Geen productiegegevens zijn voor tests aangemaakt of gewijzigd.

## Verificatie

```sh
node --test tests/lesson-stage.test.cjs tests/multiplayer-core.test.cjs
node tests/lesson-stage-database.cjs
node tests/lesson-stage-live-database.cjs
node tests/lesson-stage-browser.cjs
node tests/lesson-countdown-browser.cjs
node tests/lesson-session-browser.cjs
node tests/platform-live-browser.cjs
node tests/lesson-stage-story-browser.cjs
```

Database-/browsertests gebruiken `@electric-sql/pglite`, eventueel via `VECTOR_PGLITE_MODULE`. De browsertest gebruikt `playwright`, `VECTOR_BASE_URL` (standaard `http://127.0.0.1:8775`) en `LB_CHROMIUM` (standaard de aanwezige Brave-binary). Screenshots gaan naar `/tmp/leraarbob-lesson-stage` of `LB_SCREENSHOT_DIR`. Alle accounts en sessies zijn geïsoleerd; externe netwerkverzoeken zijn geblokkeerd. De test gebruikt echte SQL en de bestaande Edge-handler, met lokale auth-identiteiten.

Gecontroleerd: schema, native oplossingen/serverbeoordeling, twintig rondes, juiste en ontbrekende antwoorden, privacy, rollen, dubbele stem, historische uitslag, ingevoegde check, PDF-herstel, actieve battle bij teruggaan, drie schermformaten, fullscreen, weergavewissel, inklappen/heropenen/herladen en JavaScript-fouten. De browsertests gebruiken geïsoleerde testaccounts, geen echte leerlinggegevens.

De verhaaltest doorloopt alle 57 getekende/typografische scènes op 1440 × 900, 390 × 844 en 812 × 375. Hij controleert tekstbegrenzingen, blijvende zinnen, de startknop, reproduceerbare tekeningen en het verschil tussen ruis en stilte. Beelden staan in `/tmp/leraarbob-lesson-story`. De twintig battlevragen zijn nog de geteste native selectie hierboven; de uitgebreidere voorbeeldreeks uit het gesprek (onder meer foutdetectie, contextmodel en punt + nulwaarde) is niet als identieke nieuwe vragenbank ingevoerd. De bestaande puntentelling van de klasbattle is ongewijzigd.

De animatietest controleert daarnaast normale beweging bij opbouw/impact/rust, doorlopende tekeningen, expliciet herhalen, het stoppen van onnodige frames, themaverandering na stilstand en annulering bij snel doorklikken.

De verhaaltest controleert ook alle leesbeurten op drie schermformaten, vervanging zonder navigatie, herstel bij herladen, één of twee afwezige duoleden en de wissel tussen leerling- en leerkrachtstem.

Aanvullend gecontroleerd: live scènewissels en leesnamen, eigenaarcontrole, laat aansluiten bij een lopende kleiduifrace, native beoordeling, idempotente schoten, stoppen zonder gegevensverlies, privéverslagen en toegang tot verslagen na het verlopen van de deelnamecode.

Productie: beide migraties zijn op 6 oktober 2026 toegepast op de bestaande LeraarBob-database. De bestaande account- en Edge Function-configuratie is behouden. De tabellen blijven privé en de publieke les-RPC vereist een bestaand account; er zijn geen leerlinggegevens gebruikt voor de productiecontrole.

De productiecontrole bevestigt RLS, geen directe tabeltoegang en de authenticatiecontrole. De Supabase-advisor meldt voor deze private tabellen alleen [RLS zonder directe policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy): toegang loopt bewust uitsluitend via de gecontroleerde RPC. Bestaande waarschuwingen van andere platformonderdelen zijn ongewijzigd.

De stap `voortgang-klas` toont vóór de vraag over de papieren taak een anonieme, statische momentopname van de 15 aangeleverde voortgangsstanden van 4TMW: gemiddeld 12,8/28 onderdelen, verdeeld over 0–6 (2), 7–13 (7), 14–20 (4) en 21–28 (2). Geen leesbeurt, waardeoordeel of verzonnen voldoendegrens. Dezelfde grafiek volgt live op het leerlingenscherm; deze momentopname verandert geen opgeslagen leerlingvoortgang.
