# Current state audit — Rechtentrainer v2

Auditdatum: 2026-09-25. Baseline: `1d9d3da`, geïsoleerde worktree `/tmp/leraarbob-rechten-v2`; bestaande werkbestanden in de oorspronkelijke workspace worden niet overschreven. Deze audit beschrijft repositorycontracten, geen inspectie van echte leerlingrecords.

## Uitvoeringsgrens

De eerste ronde voegt een aparte v2-route, drie prototypes en tests toe. `games/rechten/trainer/index.html`, bestaande modules, auth, schema/RPC's en productie-entrypoints blijven ongewijzigd. De 27 identifiers blijven intact; `equation_from_context` blijft gepauzeerd. De v2-wereld is presentatie en proefevidence, geen tweede mastery-engine.

## Feitelijke architectuur

| Bron | Contract en gevolg |
|---|---|
| `games/rechten/trainer/index.html:150` | Gastslot `axioma-trainer-rechten-v0700:wave4`; eerdere wave-/versieslots blijven importeerbaar. `DEFAULT()` heeft stateversion 704/catalogVersion 4. |
| `index.html:169` | 27 behouden skill-ID's in code/catalogus; door transfer-workbench is context niet actief in de leerlingroute. Zie mechanics matrix voor alle identifiers. |
| `index.html:365–395` | `mergeState` gebruikt `W.migrate`, vult ontbrekende skills aan, bewaart onbekende skills, beperkt telemetry tot 360 en verwijdert drafts van gedeactiveerde skills. |
| `index.html:397–476` | Gespecialiseerde leerlingcache bevat state, revision, dirty, edit en updated_at. Sleutel bevat Supabase-URL plus account-ID. `axioma_progress` en `axioma_save_progress_for_account` zijn productie-opslag. |
| `index.html:415–432` | Snapshot/edit-counter verhindert dat wijzigingen tijdens een save verloren gaan; authEpoch negeert late antwoorden; revisionconflict stopt sync. |
| `index.html:449–476` | Accountwissel wist actieve werkcontext; nieuwe sessie herlaadt uitsluitend eigen remote/cache. Een dirty cache op andere revision wordt conflict, niet stilzwijgend samengevoegd. |
| `shared/axioma-auth.js` | Eén client/sessie, centrale rolcontrole, resolution-counter voor late sessie-antwoorden, `getAccount`, `onChange`; geen v2-loginimplementatie nodig. |
| `shared/axioma-progress.js` | Generieke `load`/`save` met accountcheck vóór en na netwerk, maximale 262144 bytes, game-ID-validatie; save gebruikt bestaande accountgebonden RPC. |
| `shared/axioma-game-adapters.js` | `rechten-trainer` is `external:true,tracking:false`. De generieke wrapper beheert geen mastery van de gespecialiseerde trainer. |
| `supabase_account_progress.sql` | Beide RPC-wrappers controleren `auth.uid() = p_user_id`; security invoker en execute alleen voor authenticated. |
| `wave-core.js` | Exacte gereduceerde rationale getallen `{n,d}`, veilige integers, exact parse/eq/model/check/submit. Niet vervangen door float-tolerantie. |
| `transfer-core.js`, `transfer-workbench-core.js` | Overlays voor bronrepresentaties en construction; `equation_from_context` wordt expliciet gedeactiveerd. |
| `journey-core.js` | Presentatie-/routevoorkeurlaag. `choice`, `recommend`, `due` gebruiken bestaande state; geen eigen skillstrength. |

De definitie van de onderliggende generieke `axioma_save_game_progress` en de complete `axioma_games`/`axioma_game_progress`-DDL staan niet in deze repository. De README bevestigt dat ze bestaan, maar dat bewijst niet dat een specifieke server reeds iedere namespace accepteert. Online v2-opslag vereist daarom runtime foutafhandeling; er komt geen fallback-write naar `axioma_progress`.

## Planner en evidence die behouden blijven

De productieplanner gebruikt unlock/prerequisites, recente nauwkeurigheid, strength, introductie, leergrens, afwisseling, sessiefasen, reparaties en refresh. Reparatiefouten plannen een terugkeer na 3–5 antwoorden; twee succesvolle reparaties zijn nodig. `REVIEW_GAPS=[4,9,20]`, `REFRESH_GAPS=[12,20,32]`; bestaande functies blijven de enige autoriteit. Timeouts plannen fluency zonder inhoudelijke strengthstraf. Productieclaim `stevig` vraagt bovendien onafhankelijke variantdekking en gescheiden bewijs voor de uitgebreide skills. `W.evidence` bewaart maximaal 16 unieke signatures en `W.mastered` vereist verplichte varianten plus een afstand van minstens drie antwoorden. V2 speelt hier geen voltooiingsaantallen als mastery in terug.

## UX-bevindingen

De huidige shell combineert menunavigatie, voortgang, hulp, routekaart en oefencontext; deze informatie kan de eigen wiskundige handeling verdringen. De mockups tonen de gewenste reductie: profiel + menu, één actuele opdracht en handelen op de visualisatie. De eerste mockup heeft echter een open punt op een volledige rechte en verraadt tekengebieden met kleur. V2 gebruikt het open punt alleen op de oplossingsverzameling; de rechte blijft volledig. Voorspellen en bevestigen gaan vooraf aan evaluatieve kleur of wereldreactie. Uitleg blijft lokaal op verzoek.

## Regressiebasis en onzekerheden

Bestaande suites omvatten `rechten-wave`, `rechten-algebra`, `rechten-construction`, `rechten-transfer`, `rechten-transfer-workbench`, `rechten-journey`, training-proof, account-auth en browser/account-progress. SQL-contracttests bestaan onder `tests/*database.sql`; ze zijn geen bewijs van uitvoering op de huidige cloud. Nieuwe tests gebruiken uitsluitend synthetische accounts en onderschepte netwerkverzoeken. Er worden geen echte leerlingrecords gelezen of geschreven voor testdoeleinden.

Geen gebruikersonderzoek, geen fysieke Galaxy A20-meting en geen productiecloudvalidatie worden door een browseremulatie bewezen. Het eindrapport onderscheidt uitgevoerde tests en uitgestelde checks.

## Security-broncontrole

De Supabase-skill is toegepast voor deze read-only audit. Officiële [RLS-documentatie](https://supabase.com/docs/guides/database/postgres/row-level-security) bevestigt het samenspel van grants en ownership policies. Bestaande wrappers worden behouden; geen nieuwe tabellen, privileges, RLS of sessiemetadata-autorisatie. De officiële [changelog](https://supabase.com/changelog.md) is via curl gelezen nadat de webreader markdown weigerde. De update van 2026-09-25 betreft Postgres-extensies/indexen; deze branch gebruikt of wijzigt die niet. De detailpagina was via de webreader niet beschikbaar. Er wordt geen nieuwe Supabase-feature geïntroduceerd.

## Uitgevoerde baselinecontrole

Root rapporteert vóór runtimewijzigingen: 78 unitchecks groen, shell- en training-proof-browsersuites groen. `rechten-answer-flow-browser.cjs` faalt op `Missing button Plaats`; dit is een vastgelegde baselinefout, geen door v2 geïntroduceerde regressie. Logs: `/tmp/rechten-v2-validation` (tijdelijk bewijs; eindrapport neemt relevante resultaten over).
