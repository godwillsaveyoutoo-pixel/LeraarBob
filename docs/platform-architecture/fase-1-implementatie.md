# Fase 1: gedeeld register, hervatbare routes en compacte klasbattle

Geïmplementeerd op 5 oktober 2026. Algebra-release 0.6.0.

## Wat nu centraal werkt

`games.json` is de enige bewerkbare spelcatalogus. `scripts/build-catalog.cjs`
valideert echte routes, providers, verwijzingen, historische IDs en mogelijkheden
en maakt `js/catalog.js`. Startpagina en leerkrachtconsole gebruiken ditzelfde
register. De leerkrachtconsole haalt speldefinities niet meer uit een tweede
catalogus in de database; leerlingvoortgang blijft via de bestaande adapters komen.

`shared/game-registry.js` biedt `ready`, `list`, `game`, `modes`, `worksheets`,
`destination` en `current`. Een mogelijkheid beschrijft afzonderlijk **deelname**
(solo, duo of groep), **doel** (leren of battle), rollen, route en werkelijke
provider. Een verwijzing naar een andere trainer blijft een verwijzing.
`shared/play-modes.js` is de compatibiliteitslaag voor bestaande consumenten.
`shared/worksheet-hub.js` voedt de bestaande oefenbladpagina; dit is geen nieuwe
printmotor. Het centrale battleoverzicht ontdekt zijn vijf echte providers uit
het register en gebruikt hun bestaande classroomroutes en RPC/Edge-adapters.

`shared/platform-routes.js` bewaart presentatiecontext in de URL:
`game`, `world`, `topic`, `level`, `activeLevel`, `screen` en `returnTo`.
Onbekende oude parameters en uitnodigingscodes blijven bestaan. Teruglinks mogen
alleen naar dezelfde site en dezelfde projectbasis gaan. `activeLevel` hervat
uitsluitend een al opgeslagen ronde. Levelselectie, menu's, terug/vooruit en
weergavekeuzes maken geen nieuwe oefeningen, pogingen of XP.

Algebra en Getallenwereld bewaren werk met hun bestaande accountgebonden opslag;
hun geselecteerde en actieve level mogen verschillen. Bij een accountwissel
wordt het vorige werk meteen onzichtbaar en onbedienbaar. De gedeelde bovenbalk
behoudt account, echte voortgang, volledig scherm, weergave en herstelknop.
Ingebedde battlewerkborden krijgen geen tweede platformbalk.

## De vereenvoudigde Algebra-battle

De leerkracht kiest **Vergelijkingen** met één van de zeven bestaande levels, of
**Stelsels** met eenvoudige stelsels die één oplossing hebben. Daarna kiest die
3, 5, 10 of 20 rondes en de tijd. Stelsels gebruikt standaard drie minuten;
de andere bestaande tijden blijven beschikbaar. Geavanceerde vraagvormen en
getallen staan in een afzonderlijk uitklapbaar onderdeel voor Vergelijkingen.
Een keuze opent instellingen; pas **Maak battle** maakt een echte wachtkamer.
Een bestaande sessie heeft een expliciete hervatknop.

Provider-ID `algebra`, RPC `axioma_game_class`, Edge Function `algebra-class`,
bestaande roomtabellen en de 17 vergelijkingstypes blijven behouden. De nieuwe
skill `S1` gebruikt dezelfde Stelselskern als solo: deterministische, eenvoudige
stelsels met een unieke oplossing. Leerlingen vullen `x` en `y` rechtstreeks in.
Beide waarden worden exact op de server gecontroleerd. Rollen, deadlines,
laat aansluiten, begrensde invoer en idempotente herinzending blijven afgedwongen.
JWT-controle blijft aan. Battlepunten blijven afzonderlijk van leer-XP.

De lokale leerkrachtsimulatie gebruikt dezelfde generatie, invoer en controle,
met virtuele leerlingen. Ze schrijft geen sessies, punten, XP of ranglijsten
naar de server. Simulatie-instellingen vervangen tijdelijk het werkbord als
eigen inline scherm; ze staan niet als popup boven een opgave. De echte timer
blijft lopen. Via het gedeelde menu kan de leerkracht naar het overzicht en
terug zonder de bestaande module opnieuw te starten.

## Kleine schermen

Op 640 × 360 en 780 × 360 passen actieve Algebra- en Getallenopgaven zonder
pagina- of werkbordscroll. Lange keuzelijsten hebben pagina's; Stelsels wisselt
tussen invoer en bewerkingen, factoren en combineren, of aanwijzing en werk.
Dezelfde DOM-nodes en handlers bewaren invoer en werk. Formules blijven heel
zichtbaar, knoppen hebben minstens 44 × 44 px en de balk kan open, dicht en
na herladen hersteld worden. Instellingen, ranglijsten en afdrukvoorbeelden
mogen als afzonderlijke schermen scrollen.

## Verificatie

| Controle | Bewijs |
| --- | --- |
| Eén register, historische IDs, rollen en vijf providers | `tests/game-registry.cjs`: 108 geregistreerde routes; catalogus- en voortgangtests |
| Dynamisch register en eerlijke verwijzingen | `tests/game-registry-browser.cjs`, bestaande teacher-details- en topbarbrowser |
| Selectie/start, terug/vooruit, afdrukken, herladen, accountisolatie | `tests/platform-routes.test.cjs`, `tests/platform-pilots-browser.cjs`: 269 layouts op vijf schermformaten |
| Alle drie Stelselsmethodes, uitzonderingen, invoer, XP en compacte schermstappen | Bestaande Stelsels-browser: 797 controles |
| Vergelijkingen en breuken, echte bewerkingen en compacte keuzevensters | `tests/algebra-operation-editor-browser.cjs`, `tests/algebra-landscape-browser.cjs` |
| Exacte antwoorden, verlopen deadline, rechten en retry | `tests/algebra-systems-class-database.cjs`: echte Edge-handler, bundle en geïsoleerde Postgres |
| Leerlingwerkbord, optionele stappen, drafts en lage iframes | `tests/algebra-battle-player-browser.cjs`: 57 toestanden, ook 176 px hoog |
| Live Stelselsklasbattle met twee fictieve leerlingen | `tests/algebra-systems-class-browser.cjs`; bestaande vergelijkingen-klasbattlebrowser |
| Centrale Stelselsflow, drie minuten, drie rondes, terugweg en sessiebehoud | `tests/platform-battle-flow-browser.cjs`: vijf schermformaten |
| Bestaande vijf spelproviders en lokale simulatie | `tests/class-battle-hub-browser.cjs`, `tests/classroom-simulation-browser.cjs` |

Browsers en databasefixtures gebruiken fictieve accounts; tests voegen geen echte
leerlingresultaten toe. Bouwcontrole: `node scripts/build-catalog.cjs --check` en
`git diff --check`. Worker opnieuw bouwen met
`LB_ESBUILD_MODULE=/pad/naar/esbuild node scripts/build-algebra-class-worker.cjs`.

## Publicatie

De gerichte migratie `20261005171003_algebra_systems_class_battle.sql` voegt `S1`,
drie rondes en 180 seconden uitsluitend voor Algebra toe. Ze controleert eerst
de verwachte bestaande functie en behoudt de bestaande rechten. Publiceer daarna
`algebra-class` met `index.ts`, `handler.js` en de gegenereerde `policy.js`, met
`verify_jwt=true`. Publiceer pas daarna de frontend. Gebruik geen brede `db push`:
oude productiemigraties hebben deels andere tijdstempels dan lokale bestanden.

## Gecontroleerde serverpublicatie

De gerichte productiemigratie is toegepast en `algebra-class` versie 2 is actief
met `verify_jwt=true`. De drie gepubliceerde bestanden zijn byte voor byte gelijk
in inhoud aan de gecontroleerde lokale worker. Productiecataloguscontroles
bevestigen `S1`, drie rondes en 180 seconden uitsluitend voor Algebra. Leerlingen
hebben geen directe uitvoerrechten op de private routine of de nakijkworker.

De Supabase security- en performanceadviezen vóór en na deze migratie zijn gelijk;
er kwamen geen nieuwe bevindingen bij. De bestaande meldingen gaan over
[private RLS-tabellen zonder directe policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
[bestaande publieke SECURITY DEFINER-routines](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[uitgeschakelde controle op gelekte wachtwoorden](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection),
[vier niet-geïndexeerde foreign keys](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
en [twee ongebruikte indices](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
Deze bestaande platformconfiguratie is geen onderdeel van deze battle-uitbreiding.

De frontend is gepubliceerd op GitHub Pages. Zeventien centrale publieke
bestanden zijn inhoudelijk gelijk aan de gecontroleerde commit `a45e141`.
De volledige centrale Stelselsflow is daarna op de publieke site geslaagd op
1280 × 800, 780 × 360, 640 × 360, 390 × 844 en 320 × 700, met fictieve
authenticatie en geblokkeerde echte resultaatwrites. De test controleert ook
terug/vooruit tussen live, simulatie, Vergelijkingen en Stelsels en expliciet
stoppen/opnieuw instellen/herladen. De gepubliceerde Edge Function weigert
anonieme verzoeken met HTTP 401.

De lokale nieuwe migratie heeft de door de publicatie geregistreerde versie
`20261005171003`; zo blijft deze wijziging gelijk aan de productiemigratiehistorie.
De oude, al bestaande verschillen in migratietijdstempels zijn niet herschreven.

## Wat fase 2 nog vraagt

1. Een uniforme activiteitenregistratie met datum en daadwerkelijk gemeten actieve
   oefentijd, plus filterbare analyse per alias, klas, spel en periode.
2. Eén documentmotor boven de huidige vakgebonden generators, voor gezamenlijke
   opmaak, antwoordbladen en uitvoer. De huidige registry-aansluiting maakt nog
   geen nieuwe printstudio.
3. Echte adapters voor samen leren, duo en deelnemende leerkracht in meer trainers.
   Getallenwereld heeft nu eigen solo; duo, battle en papier verwijzen expliciet
   naar Bewerkingentrainer. Niet aangesloten combinaties worden niet beloofd.
4. Een apart ontworpen publiek profiel en publieke ranglijsten met duidelijke
   privacykeuzes. Bestaande privéaccounts en klasranglijsten blijven de basis.
5. Verdere Stelselsbattle-types en moeilijkheidsniveaus, zodra hun antwoordvormen
   en servercontrole bestaan. `S1` biedt nu eenvoudige unieke stelsels; andere
   solomissies zijn daarmee niet automatisch een battleprovider.

De naam **Klasbattle** blijft behouden. Een overkoepelende Klasruimte komt pas
wanneer ook echte gezamenlijke lessen zijn aangesloten.

## Gewijzigde bestanden vóór publicatie

Deze lijst bevat uitsluitend deze fase; het oorspronkelijke werk met andere lokale
wijzigingen is behouden in de oorspronkelijke checkout.

- `docs/platform-architecture/README.md`
- `docs/platform-architecture/fase-1-implementatie.md`
- `games.json`
- `games/algebra-trainer/battle-config.js`
- `games/algebra-trainer/battle-player.css`
- `games/algebra-trainer/battle-player.html`
- `games/algebra-trainer/battle-player.js`
- `games/algebra-trainer/classroom.css`
- `games/algebra-trainer/classroom.html`
- `games/algebra-trainer/fraction.css`
- `games/algebra-trainer/index.html`
- `games/algebra-trainer/navigation.js`
- `games/algebra-trainer/shell.js`
- `games/algebra-trainer/stelsels.html`
- `games/algebra-trainer/stelsels/app.js`
- `games/algebra-trainer/stelsels/workspace.css`
- `games/algebra-trainer/touch.css`
- `games/algebra-trainer/trainer.js`
- `games/algebra-trainer/workbench.css`
- `games/getallenwereld/app.js`
- `games/getallenwereld/index.html`
- `games/getallenwereld/style.css`
- `games/rechten/rechtenwereld/play.js`
- `index.html`
- `js/catalog-progress.js`
- `js/catalog.js`
- `js/frontpage.js`
- `klasbattle/hub.css`
- `klasbattle/hub.js`
- `klasbattle/index.html`
- `oefenbladen.html`
- `scripts/build-catalog.cjs`
- `shared/axioma-social.js`
- `shared/game-registry.js`
- `shared/leraarbob-topbar.js`
- `shared/multiplayer/classroom.js`
- `shared/multiplayer/simulation.css`
- `shared/platform-routes.js`
- `shared/play-modes.js`
- `shared/worksheet-hub.js`
- `supabase/config.toml`
- `supabase/functions/algebra-class/policy.js`
- `supabase/migrations/20261005171003_algebra_systems_class_battle.sql`
- `teacher/index.html`
- `teacher/teacher.js`
- `tests/algebra-battle-player-browser.cjs`
- `tests/algebra-class-browser.cjs`
- `tests/algebra-class.test.cjs`
- `tests/algebra-landscape-browser.cjs`
- `tests/algebra-operation-editor-browser.cjs`
- `tests/algebra-systems-class-browser.cjs`
- `tests/algebra-systems-class-database.cjs`
- `tests/catalog.test.cjs`
- `tests/class-battle-hub-browser.cjs`
- `tests/classroom-simulation-browser.cjs`
- `tests/game-registry-browser.cjs`
- `tests/game-registry.cjs`
- `tests/getallenwereld-browser.cjs`
- `tests/getallenwereld.test.cjs`
- `tests/helpers/algebra-class-db.cjs`
- `tests/platform-battle-flow-browser.cjs`
- `tests/platform-pilots-browser.cjs`
- `tests/platform-routes.test.cjs`
- `tests/stelsels-layout-browser.cjs`
