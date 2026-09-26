# Implementatierapport — Rechtentrainer v2

Datum: 25 september 2026. Uitvoering van `AXIOMA_RECHTEN_ASTRA_MASTER_PROMPT_v2.md`
en de toegevoegde uitvoeringspreambule van `v2_1_EXECUTE`.

**Opgeleverd:** audit en research, een matrix voor alle 27 IDs, ontwerp- en
migratiecontracten, een geteste low-fidelity prototypeproef, een werkende shell en
alle drie speelbare vertical slices. De overige skills zijn niet gemigreerd.

## Branch en isolatie

- Repository: `godwillsaveyoutoo-pixel/LeraarBob`.
- Branch: **`feat/rechten-radical-redesign-v2`**.
- Werkboom: **`/tmp/leraarbob-rechten-v2`**.
- Basis: lokale commit **`1d9d3da`**, afkomstig van `feat/rechten-world-prototype`.
- De oorspronkelijke werkboom `/home/johan/Documenten/GitHub/LeraarBob` en de
  bestaande niet-gecommitte UI-experimenten zijn behouden. Ze zijn niet stilzwijgend
  in deze branch opgenomen. Dit is geen claim dat de branch op remote `main` staat.
- Nieuwe siblingroute: `games/rechten/trainer-v2/`. Geen productieroute, catalogus,
  database, RPC, gedeelde authmodule of bestaande test gewijzigd.
- Geen deployment of push uitgevoerd; geen tests op echte leerlingaccounts.

| Commit | Concrete oplevering |
| --- | --- |
| `3c64a73` | Audit, research, 27-skillmatrix en ontwerp-/migratiecontracten vóór runtimecode |
| `35a378f` | Losse interval-/deltaproef, exacte wiskundeadapter, semantische componenten en seeded tests |
| `72c0900a026aca151f7a1b42f559d78b51e740d5` | Werkende shell, drie missies, opslag/evidence, mobile/a11y- en integratietests |

Dit rapport, de inventaris en screenshots worden als afzonderlijk
opleveringscommit toegevoegd. De SHA daarvan is op te vragen met
`git log -1 --format=%H -- docs/rechten-v2/IMPLEMENTATION_REPORT.md` en staat ook
in het afsluitende bericht. [Uitvoeringsvolgorde](IMPLEMENTATION_SEQUENCE.md)
legt de checkpoints en hun grenzen vast.

## Openen en spelen

De lokale previewserver is tijdens de oplevering gestart op poort 8765 vanuit de
aparte werkboom. Na een herstart: `cd /tmp/leraarbob-rechten-v2` en
`python3 -m http.server 8765 --bind 127.0.0.1`.

| Route | Werkelijk speelbaar |
| --- | --- |
| [Wereld](http://127.0.0.1:8765/games/rechten/trainer-v2/) | Compact profielicoon en menu, startadvies uit bestaande planner, afzonderlijk hervatten van drie plekken, veldboek |
| [Grenspas](http://127.0.0.1:8765/games/rechten/trainer-v2/?slice=grenspas) | Grenspin → strikt interval → eigen symbolische notatie; daarna dalend positief, dalend negatief en horizontaal geval |
| [Hellingrug](http://127.0.0.1:8765/games/rechten/trainer-v2/?slice=hellingrug) | Richting A→B of B→A, exacte Δx/Δy, verticale hellingsbreuk, causale lijnproef, derde punt; tweede case negatieve rate uit tabel |
| [Signaalstad](http://127.0.0.1:8765/games/rechten/trainer-v2/?slice=signaalstad) | Maximaal twee gekozen representaties, x=0- of verschilprobe, defect lokaliseren, één atomische a/b-repair, nieuwe invoer x=10, negatief contrast |
| [Losse mechaniekproef](http://127.0.0.1:8765/games/rechten/trainer-v2/prototype.html) | Twee geïsoleerde bedieningsproeven zonder opslag of beoordeling |

Slicelinks maken bij een eerste bezoek een missie. Een bestaande missie behoudt
haar opgeslagen scherm en deelwerk; de wereldknop hervat de missie. Gameplay
gebruikt de afgesproken landscapegate van minimaal 640×360. Wereld, veldboek en
profiel werken in portret. In het menu blijft de huidige trainer bereikbaar.

De interface gebruikt placeholders en native SVG/HTML. De wereldschets verandert
blijvend na een voltooide missie. Er is geen claim dat het geïllustreerde eindniveau
van de referentiemockups al is bereikt.

## Documenten en code

Alle verplichte ontwerpdocumenten staan onder `docs/rechten-v2/`:

- [CURRENT_STATE_AUDIT](CURRENT_STATE_AUDIT.md) en [REDESIGN_AUDIT](REDESIGN_AUDIT.md): codecontracten, onderzoeksbasis, behouden/vervangen/adapters, bronconflicten.
- [QUESTION_MECHANICS_MATRIX](QUESTION_MECHANICS_MATRIX.md): alle 27 actuele IDs, elk 21 vereiste velden, echte generator-/validatorbronnen en migratiegrenzen.
- [MISCONCEPTION_CATALOG](MISCONCEPTION_CATALOG.md) en [INTERACTION_COMPONENTS](INTERACTION_COMPONENTS.md).
- [WORLD_AND_NAVIGATION_SPEC](WORLD_AND_NAVIGATION_SPEC.md), [CONTENT_SCHEMA](CONTENT_SCHEMA.md) en [EVIDENCE_AND_ADAPTIVITY](EVIDENCE_AND_ADAPTIVITY.md).
- [MIGRATION_PLAN](MIGRATION_PLAN.md), [ACCESSIBILITY_AND_DEVICE_TEST_PLAN](ACCESSIBILITY_AND_DEVICE_TEST_PLAN.md), [ART_PLACEHOLDER_MANIFEST](ART_PLACEHOLDER_MANIFEST.md), [VERTICAL_SLICE_TEST_PLAN](VERTICAL_SLICE_TEST_PLAN.md).
- [UI_CONTRACT](UI_CONTRACT.md), [IMPLEMENTATION_SEQUENCE](IMPLEMENTATION_SEQUENCE.md), [V1_BASELINE_SHA256](V1_BASELINE_SHA256.json).

| Nieuwe code / tests | Functie |
| --- | --- |
| `games/rechten/trainer-v2/index.html`, `app-shell.js`, `styles/*` | Shell, native bediening, profiel/menu, veldboek, mission layouts en gate |
| `mission-runtime.js` | Pure hervatbare taakfasen, fout→lokale repair, undo, hints, expliciet verder |
| `semantic-math-core.js` | Exacte W-adapters, semantische taakmetadata, contrasten, causale feedback |
| `components/workbench.js` | Grenspin, interval, deltabouwer, verticale breuk, tabel, formule en SVG |
| `storage.js`, `evidence-adapter.js`, `scheduler-adapter.js` | Bestaande auth/progress/planner hergebruiken; aparte proefevidence |
| `content/skills.json`, `content/assets.json` | Stabiele IDs en zeven werkelijke rendererslots |
| `prototype.html`, `prototype.js`, `README.md` | Losse proef en reproduceerbare speel-/testinstructies |
| `tests/rechten-v2-{math,runtime,storage,regression}.test.cjs` | Exacte oracle, scenario's, opslagraces, isolatie en contrast |
| `tests/rechten-v2-browser.cjs`, `tests/rechten-v2-shell-integration.cjs` | Echte inputevents, mobile/a11y-layout en synthetische accountintegratie |

De volledige bestandsinventaris staat in [CHANGED_FILES](CHANGED_FILES.txt).
De [README](../../games/rechten/trainer-v2/README.md) beschrijft modulegrenzen en
commando's. Taakmetadata/hints hebben één bron in het taskfactory; de korte
missievolgorde staat in de runtime. Niet-gebruikte componenten voor de overige
skills zijn ontwerpcontracten, geen lege implementatiebestanden.

## Validatie

| Controle | Resultaat |
| --- | --- |
| Relevante unit-/generator-/auth-/catalogus-/docenttests | **126/126 geslaagd**: 78 bestaande + 48 nieuwe tests |
| Nieuwe exacte mathsuite | 10 tests; **32.000 seeded taakgevallen**, beide deltarichtingen, equivalente breuken, onafhankelijke BigInt-oracle |
| Nieuwe runtime | 10 tests: alle fasen, vier Grenspascases, JSON-hervat, hints, behoud juiste stappen, undo en dubbelcommit |
| Nieuwe opslag/evidence/planner | **25/25**: eigenaar, timestampbackup, onbekende velden, quota, offline, gelijktijdige tabs, accountwissel, revisionconflict, werkelijk bestaand progressprotocol |
| Nieuwe regressiegate | 3 tests: 87 ongewijzigde bestanden, assetresolutie, tekstcontrast ≥4.5:1 |
| V2-browser | **145 checks/groepen**, 28 screenshots; alle drie complete flows met touch én toetsenbord |
| Los prototype | **5 groepen**, 4 screenshots; 640×360 en 780×360, geen opslagmutatie |
| V2-shellintegratie | **5 groepen**: echte shell + bestaande AxiomaProgress; synthetische auth/RPC, al het externe verkeer onderschept |
| Bestaande browsersuites opnieuw | **10 suites groen**; zie onderstaande lijst |
| Productiebestanden | **87/87 SHA-256 identiek** aan de auditbasis |
| Patchhygiëne | `git diff --check` geslaagd |

De browsercheck bevat 1920×1080, 1366×768, 1024×768, 780×360 en 640×360,
portretwereld/veldboek, rotatiegate, reduced motion, equivalente CSS-reflow bij
200% zoom, zichtbare focus, benoemde controls, targets ≥44px, geen verborgen
controls achter de footer, maximaal twee views, geen oplossing vóór commit en
leesbare gerenderde SVG-labels. Toetsenbord- en touchflows testen een fout,
behouden juiste component, hulp, exact herladen, structureel contrast, hidden
input en voltooiing. Vijf hints leiden tot een nieuw contrasterend model dat
niet het uitgewerkte voorbeeld kopieert.

Opnieuw groene bestaande browsersuites:
`rechten-shell`, `rechten-training-proof`, `rechten-transfer-workbench`,
`rechten-redesign`, `rechten-journey`, `rechten-leave-round`, `rechten-polish`,
`account-progress`, `trainer-teacher`, `teacher-details`.

### Zes reeds bestaande falende browsersuites

Deze faalden al op de ongewijzigde basis, vóór het bouwen van de nieuwe runtime.
Ze zijn niet aangepast of als geslaagd gerapporteerd:

| Suite | Bestaande fout |
| --- | --- |
| `rechten-answer-flow-browser` | Verwacht knop `Plaats`, die deze huidige flow niet heeft |
| `rechten-construction-browser` | Verwacht knop `Plaats` |
| `rechten-wave-browser` | Verwacht knop `Controleer` |
| `rechten-algebra-browser` | Verwacht oude knop `− op beide leden` |
| `rechten-transfer-browser` | Verwacht oude knop `wis` |
| `rechten-ux-browser` | Verwacht `Start bij dit leerdoel`; huidige tekst is `Start bij deze stop →` |

Dit is bestaande testschuld. De actuele flow-suites hierboven slagen; alle
betrokken productiebronnen en oude tests zijn byte-identiek gebleven. Daarmee
wordt geen volledig groene historische browsersuite geclaimd.

Machineleesbare resultaten: [VALIDATION_SUMMARY](validation/VALIDATION_SUMMARY.json),
[browserreport](validation/browser-report.json),
[prototype](validation/prototype-browser-report.json),
[bestaande reruns](validation/final-browsers.json),
[unitlog](validation/final-unit.log) en
[shellintegratie](validation/final-v2-shell-integration.log).
Baselinefouten en overige uitvoer zijn daarnaast onverkort in `validation/` bewaard.

## Screenshots

Alle 32 screenshots uit de definitieve suites staan in `screenshots/`.
Selectie voor review:

| Scherm | Desktop | Minimum mobile | A20-reference |
| --- | --- | --- | --- |
| Wereld | [1366×768](screenshots/world-1366x768.png) | [Portret](screenshots/world-390x844.png) | — |
| Grenspas | [1366×768](screenshots/grenspas-1366x768.png) | [640×360](screenshots/grenspas-640x360.png) | [780×360](screenshots/grenspas-780x360.png) |
| Hellingrug | [1366×768](screenshots/hellingrug-1366x768.png) | [640×360](screenshots/hellingrug-640x360.png) | [780×360](screenshots/hellingrug-780x360.png) |
| Signaalstad | [1366×768](screenshots/signaalstad-1366x768.png) | [640×360](screenshots/signaalstad-640x360.png) | [780×360](screenshots/signaalstad-780x360.png) |

Ook: [lokale intervalrepair](screenshots/grenspas-repair-feedback.png),
[deltarepair](screenshots/hellingrug-repair-feedback.png),
[parameterrepair](screenshots/signaalstad-repair-feedback.png),
[veldboek in portret](screenshots/book-390x844.png) en
[landscapegate](screenshots/rotate-gate-390x844.png).

## Opslag en behouden leerlogica

De proef leest een oude voortgangssnapshot readonly en maakt een versie- en
accountgebonden backup. De bestaande W/J-planner levert een startadvies; de
repair-/refreshwachtrijen, unlocks, XP en gespecialiseerde `axioma_progress` blijven
ongewijzigd. `equation_from_context` blijft gepauzeerd.

V2-presentatiestate en observaties gaan via de bestaande `AxiomaProgress`-API in
de aparte `rechtenV2`-namespace van het generieke `rechten-trainer`-record.
Onbekende velden worden behouden. Gast en docentproef blijven lokaal. Er is geen
nieuw authsysteem of cloudprotocol. Backendsupport is in synthetische integratie
getest, niet met live leerlingdata of databasewijzigingen.

Pogingen bewaren task/seed, fase, invoer, richting, pins, hintniveau/zichtbaarheid,
feedback, locks en observaties. Accountwisseling maakt de vorige leerlingstate
onzichtbaar. Een lokaal tabconflict krijgt direct een duurzame herstelkopie en
blijft na reload een expliciete keuze. Export bevat de eigen herstelkopieën.
Een syntax-/interactiefout wordt geen misconceptielabel. Hulp en reparatie geven
ondersteunde evidence. Voltooiing geeft geen productie-mastery of XP.

## Resterende risico's en volgende golf

1. **Leeropbrengst en wereldbetekenis:** geen echte leerling-/think-aloudproef of
   vergelijkende controlegroep uitgevoerd. De mechanismen zijn speelbaar en
   technisch getest; betere transfer of motivatie is nog een hypothese. Voer de
   vooraf beschreven eenvoudige controle, hidden transfer en kill criteria uit.
2. **Echte apparaten en assistieve technologie:** viewport- en toetsenbordproeven
   vervangen geen fysieke Samsung A20, mobiele browser met schermtoetsenbord,
   NVDA/TalkBack of echte browserzoom. Meet die vóór productiegoedkeuring.
3. **Live backend:** de bestaande RPC/owner/revisioncontracten zijn met de echte
   clientmodule en synthetische service getest. Verifieer de geïnstalleerde
   Supabase-schema/RLS-versie met een aparte testaccount vóór een online pilot.
4. **Browsers zonder Web Locks:** stampcontrole detecteert stalen state, maar
   localStorage alleen biedt geen volledig atomaire cross-tabtransactie. De
   geteste Chromiumvariant gebruikt Web Locks; zie het migratieplan.
5. **Prototypegrenzen:** wereldart is low fidelity; de observatiereeks en backups
   hebben nog geen productie-retentiebeleid. Statische clienttaken zijn geen
   beveiligde examenomgeving. De nieuwe proefevidence wordt bewust nog niet in
   gespecialiseerde productiemastery omgezet.
6. **Historische testschuld:** de zes verouderde flows hierboven vragen een
   afzonderlijke afstemming op de huidige productie-UI, zonder verwachtingen te
   verwijderen die nog echte contracten bewaken.

Volgende golf, pas na beoordeling van deze slices: eerst de drie mechanismen met
leerlingen en echte hardware toetsen; daarna de aangrenzende skills `zeroRead`,
`zero`, `sign`, `signchart`, `delta`, `slope`, `slope_from_two_points`, `intercept`
en `ab` stapsgewijs aan de bestaande planner/evidence koppelen. Elke migratiestap
krijgt eigen authoring- en regressiegates. Verdere formule-/algebraskills volgen
later; `equation_from_context` blijft uitgesloten tot een afzonderlijke inhoudsreview.
