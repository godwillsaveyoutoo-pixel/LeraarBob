# Toetsopbouw en Kleiduifschieten · 11 oktober 2026

Deze afwerkronde levert de eerste samengestelde opdracht en de ontbrekende Kleiduifroutes. De lokale preview gebruikt fictieve accounts en een tijdelijke PostgreSQL-database. Dit is geen bewijs van productieaanmelding, externe toestellen of een publieke uitrol.

## Wat werkt

- **Start → Mijn taken → Opdrachten en toetsen.** De leerkracht stelt een taak samen met 1–12 onderdelen: Glasraam, een vaste Kleiduifreeks en/of Rechtenwereldvragen. De voorgestelde toets heeft één raam, tien doelen en tien vragen. Per onderdeel zijn instructies, punten en relevante instellingen aanpasbaar.
- Uitdelen aan geselecteerde leerlingen bevriest de taakconfiguratie. Ontwerpen, tussentijdse antwoorden en definitieve antwoorden horen bij de toegewezen leerling en taakversie. De oorspronkelijke oefenopslag en XP worden niet gebruikt als toetscijfer.
- Het originele Glasraam-atelier, het Kleiduifspel en de afzonderlijke Rechtenwereldwerkborden blijven hun eigen bediening houden. Er komt geen tweede platformbalk in deze werkborden. Minimaliseren behoudt de frames; afsluiten probeert de laatste invoer te bewaren en blijft bij een fout open.
- Indienen kan zodra alle onderdelen klaar zijn. Daarna zijn ze onveranderlijk voor de leerling. De leerkracht ziet het ontwerp, de oorspronkelijk ingevulde vragen en de afzonderlijke schoten, geeft punten en feedback en kan de resultaten als CSV downloaden. Scores komen pas na beoordeling terug bij de leerling.
- **Kleiduif:** solo, privéduel met één klasgenoot, groep met meerdere leerlingen en een door de leerkracht gestarte klasbattle. De bestaande vragen, tijdcontrole en regel van zeven juiste antwoorden op rij blijven behouden. Tijdens de klassessie observeert de leerkracht.
- Afgeronde OS-battles bewaren 10 XP voor een deelnemende leerling met minstens één verwerkt schot en 10 extra voor de winnaar. Eén serverregistratie per sessie/leerling voorkomt dubbele beloning. Geannuleerde sessies en toetsdelen geven geen battle-XP. Oude voortgang blijft bestaan; er is geen terugwerkende omzetting van levels naar XP.
- De OS-ranglijst bevat Kleiduifschieten. De leerkracht kiest een klas en ziet ook de gespeelde sessies en deelnemersresultaten.

## Werkelijk gecontroleerd

De browserproeven gebruiken Chromium op 1366 × 768 bij 100% zoom en daarnaast 390 × 844 en 640 × 360. Ze klikken de echte controls; de backend is de echte SQL en voor Rechtenwereld de bestaande native validator via de nieuwe Edge-handler.

- Toets maken, uitdelen aan Alex en Sam, één echte lijn in Glasraam tekenen, bewaren en herladen.
- Twee getimede Kleiduifantwoorden als toetsdeel; tien Rechtenwereldvragen via het echte antwoordbord. De browserreeks kiest voor alle tien **Coördinaten lezen**. De maker biedt vijftien bestaande vraagtypes; dit verslag claimt geen afzonderlijke browserdoorloop van alle vijftien binnen een toets.
- Invoer behouden bij minimaliseren; een onafgemaakt Rechtenwereldantwoord terughalen in een tweede geïsoleerde browser.
- Indienen, terugkijken, beoordelen, feedback ontvangen en CSV-export.
- Solo door beide oefendoelen naar het getimede spel; achtergrondverversing opent het startscherm niet opnieuw. Tijdens een wedstrijd opent **Deze sessie** de compacte bediening, zonder het oude groepsvenster.
- Kleiduifduel van twee leerlingen, groepswedstrijd van drie en klassessie met een observerende leerkracht: telkens volledige serverbevestigde overwinning. Ranglijst, 20/10-XP-verdeling, verlaten en opnieuw kiezen.
- SQL/Edge: niet-toegewezen accounts weigeren, uitgedeelde configuratie vastzetten, verouderde revisies weigeren, tijdslimieten, herhaalde en concurrerende antwoorden, geen vertrouwen in een client-score, beoordelingsgrenzen en ontbrekende directe tabel-/workerrechten.
- Oude Kleiduifroutes mogen geen privé-uitnodigingen tonen en mogen de observerende leerkracht niet laten meeschieten.

Alle **30 lokale workflowcommando’s slagen**. De volledige [PR-controle](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/actions/runs/38143055641) en [branchcontrole](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/actions/runs/38143051977) zijn eveneens groen op codecommit `cef2622`; de daaropvolgende vastlegging wijzigt alleen documentatie. [Machineleesbaar CI-bewijs](github-ci.json). [Volledig overzicht](workflow.json), [toetsproef](tasks/report.json) en [Kleiduifproef](clay/report.json) bevatten de uitgevoerde controles; herhalingen en beperkingen zijn expliciet vastgelegd. `source-hashes.json` identificeert de geteste gewijzigde bronbestanden.

Screenshots: [uitgedeelde toets](tasks/teacher-assignment.png), [origineel raam](tasks/glass-working.png), [Rechtenwereldantwoord nakijken](tasks/teacher-native-answer.png), [compact met ingeklapte balken](tasks/review-390-true.png), [duelresultaat](clay/duo-result.png) en [Kleiduifresultaten voor de leerkracht](clay/teacher-results.png).

## Grenzen en vervolg

- Nog niet op productie uitgerold: `20261011121227_os_composite_tasks.sql`, `20261011123451_os_clay_modes.sql` en Edge-functie `task-activity`. De productiecontrole heeft alleen vastgesteld dat de bestaande Kleiduif-v2-functies aanwezig zijn en de nieuwe tabellen nog ontbreken. Bestaande productiegegevens zijn niet gewijzigd.
- De migraties gebruiken afgeschermde tabellen met alleen gecontroleerde RPC-toegang. Lokale rechten- en rolproeven zijn uitgevoerd. De bestaande productie-advisor meldt daarnaast oudere publiek aanroepbare definerfuncties; deze wijziging voegt geen dergelijke leerlingfunctie toe. [Uitleg van deze advisory](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- Een tijdgebonden Kleiduifdoel blijft op tijd lopen bij weggaan. Hervatten geeft geen extra antwoordtijd. Volledige offline afname en bewaargarantie zonder netwerk zijn geen onderdeel van deze eerste toetsversie.
- De maker houdt geen permanent bewaard concept bij voordat de leerkracht **Concept bewaren** kiest. Een gesloten opdracht kan niet door leerlingen verder worden ingediend; heropenen is nog geen aangeboden actie.
- Centraal ontvangen van alle Kleiduifuitnodigingen op het bureaublad en één gezamenlijke bezetheidsregeling voor alle spellen vallen nog onder C1/C2/C6. De Kleiduifuitnodigingen zijn nu rechtstreeks in de eigen gemeenschappelijke start zichtbaar. Er is geen Duo Learn-modus voor dit schietspel.
- Andere trainers aansluiten vraagt een eigen adapter: configuratievalidatie, een versievaste opgavespecificatie, de native renderer, antwoordvalidatie op de server en een weergave voor nakijken. De taak-, toewijzings-, inzendings- en beoordelingsstructuur kan worden hergebruikt. Onbekende onderdeeltypes worden geweigerd.

## Gewijzigde bestanden

| Onderdeel | Bestanden |
|---|---|
| Taakmaker, leerlingwerk en nakijken | `tasks/index.html`, `tasks/tasks.css`, `tasks/tasks.js`, `tasks/clay-bridge.js` |
| Opslag, rollen en originele vraagbeoordeling | twee nieuwe SQL-migraties, `supabase/functions/task-activity/`, `supabase/config.toml` |
| Kleiduifingangen en originele spelkoppeling | `os/clay-entry.js/.css`, `shared/axioma-groups.js`, `games/rechten/kleiduiven/index.html` en `kleiduiven.js` |
| Native taakwerkborden | `glasatelier/app.js`, `rechtenwereld/app-shell.js`, `shared/multiplayer/player.js` |
| OS, catalogus, profiel en leerkracht | `games.json`, `js/catalog.js`, `js/catalog-progress.js`, `shared/axioma-progress.js`, `os/desktop.js`, `os/personal-home.js`, `teacher/teacher.js` |
| Verificatie en preview | nieuwe taak-/Kleiduiftests, bestaande regressietests, fixturehelpers, preview-whitelist, CI-workflow |
