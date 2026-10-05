# Fase 1: gedeeld register, hervatbare routes en compacte klasbattle

Geïmplementeerd op 5 oktober 2026. Algebra-release 0.6.0.

## Wat nu centraal werkt

`games.json` is de enige bewerkbare spelcatalogus. `scripts/build-catalog.cjs`
valideert echte routes, providers, verwijzingen, historische IDs en mogelijkheden
en maakt `js/catalog.js`. Startpagina en leerkrachtconsole gebruiken ditzelfde
register. De leerkrachtconsole haalt speldefinities niet meer uit een tweede
catalogus in de database; leerlingvoortgang blijft via de bestaande adapters komen.

`shared/game-registry.js` biedt `ready`, `list`, `game`, `modes`, `worksheets`,
`destination`, `current`, `presentation` en `components`. Een mogelijkheid beschrijft afzonderlijk **deelname**
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
met virtuele leerlingen. Ze opent bij een ronde standaard het **leerlingbeeld**,
met dezelfde actieve invoervelden en antwoordknoppen. Via **Virtuele klas** kun
je naar **Leerkrachtbeeld** en terug naar **Leerlingbeeld** wisselen. Beide
werkborden blijven in hun eigen DOM staan, zodat een half ingevuld antwoord
behouden blijft. De beeldkeuze wordt lokaal bewaard; na indienen blijft het
leerlingantwoord vergrendeld. De volgende ronde toont weer haar eigen opgave. Ze schrijft geen sessies, punten, XP of ranglijsten
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
| Bestaande vijf spelproviders en lokale simulatie | `tests/class-battle-hub-browser.cjs`, `tests/classroom-simulation-browser.cjs`: directe leerlinginvoer; Algebra en Vector behouden native invoernodes bij beeldwissels |

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
   Getallenwereld heeft nu eigen rekenonderdelen, samenstelbare reeksen, bordduo,
   klasbattle, bordbespreking en papier binnen één wereld. Bordbespreking is één
   leerkrachtuitwerking; er zijn nog geen aparte inzendingen van meelerende
   leerlingen. Niet aangesloten combinaties worden niet beloofd.
4. Een apart ontworpen publiek profiel en publieke ranglijsten met duidelijke
   privacykeuzes. Bestaande privéaccounts en klasranglijsten blijven de basis.
5. Verdere Stelselsbattle-types en moeilijkheidsniveaus, zodra hun antwoordvormen
   en servercontrole bestaan. `S1` biedt nu eenvoudige unieke stelsels; andere
   solomissies zijn daarmee niet automatisch een battleprovider.

De naam **Klasbattle** blijft behouden. Een overkoepelende Klasruimte komt pas
wanneer ook echte gezamenlijke lessen zijn aangesloten.

## Vervolgaanpassing: direct leerlingbeeld in simulatie

De simulatie opent standaard met actieve leerlinginvoer. De laatste controle
bevestigt dit voor Algebra, Vectoren, Bewerkingentrainer, Rechtenwereld en
Wortelbouw. Wisselen via **Virtuele klas** bewaart tussentijdse invoer; ingediende
antwoorden worden daardoor niet opnieuw actief. Beeldkeuze, reload, volgende
ronde, menu en inklappen zijn op vijf schermformaten gecontroleerd. Een echte
Stelselsklasbattle met twee fictieve leerlingen behoudt het leerkrachtbord en
servercontrole. Er zijn geen echte leerlingresultaten aangemaakt in de tests.

Gewijzigde bestanden voor deze vervolgaanpassing:

- `shared/multiplayer/simulation.js` en `shared/multiplayer/classroom.js`
- De `classroom.html` van de vijf bovenstaande providers (nieuwe cacheverwijzing)
- `tests/classroom-simulation.test.cjs`
- `tests/classroom-simulation-browser.cjs`
- `tests/platform-battle-flow-browser.cjs`
- Deze implementatienotitie

## Vervolgaanpassing: één Getallenwereld

Getallenwereld is de enige publieke ingang voor machten, vierkantswortels en
wetenschappelijke schrijfwijze. De vroegere Bewerkingentrainer is een interne
reekscomponent. Zijn historische game-ID `bewerkingen-trainer`, opslagkey
`leraarbob.bewerkingen.v1`, oude routes en battleprovider `bewerkingen` blijven
behouden. Er is geen database- of antwoordmotorwijziging voor deze aansluiting.

Het register maakt dat onderscheid centraal: `list()` toont hoofdwerelden;
`list({includeComponents:true})` omvat ook de historische componenten.
`game()` behoudt de opgeslagen identiteit; `presentation()` en standaard
`current()` geven de publieke wereld. `components()` maakt beide bronhistories
beschikbaar voor het leerkrachtoverzicht en echte platform-XP. Er verschijnt
één wereldfilter met afzonderlijke resultaten voor **Rekenregels** (15 onderdelen)
en **Reeksen** (16 vraagvormen), zonder een verzonnen teller van 31 levels.

De wereld biedt drie hoofdstukken en dezelfde acties voor reeksen, duo,
klasbattle, klasbord en oefenblad. Wetenschappelijke schrijfwijze gebruikt de
bestaande reeksinstellingen en drie bestaande moeilijkheidsgraden. Een link of
modekeuze opent instellingen; alleen **Start** genereert een spelreeks.
**Oefenblad maken** genereert eigen printopgaven zonder een actieve solo-, duo-
of klasbordreeks te vervangen. De teruglink volgt de werkelijk geselecteerde
pagina en het onderdeel, ook wanneer een andere opgave nog actief is. De kop
van een hervatte reeks toont het onderwerp van de actieve opgave; een andere
selectie voor een volgende reeks blijft apart bewaard.

Startpagina, samen-spelenkeuze, centraal battleoverzicht, ranglijstfilter,
oefenbladpagina en leerkrachtconsole gebruiken dezelfde hoofdwereld. Oude
battlealiases en uitnodigingscodes blijven werken. De bovenbalk, breadcrumbs en
printkop heten Getallenwereld; de standaard wereldknop opent het hoofdstukoverzicht.

Verificatie: catalogus/111 routes; echte rekenregels en 4.800 gegenereerde
reeksopgaven; afzonderlijke historie en echte XP; selectie zonder nieuwe poging;
bewaarde invoer, menu, terug, browsergeschiedenis, accountwissel en herladen;
print met verbetersleutel; leerkrachtbord en onafhankelijke duo-invoer. De
native simulatie van alle vijf battleproviders blijft direct leerlinginvoer
geven zonder serverwrites. Schermproeven omvatten 1280 × 800, 390 × 844,
320 × 700, 780 × 360 en 640 × 360, met uitgeklapte en ingeklapte bovenbalk.

Gewijzigde bestanden voor deze Getallenwereld-aanpassing:

- `docs/platform-architecture/README.md`
- `docs/platform-architecture/fase-1-implementatie.md`
- `games.json`
- `games/bewerkingen-trainer/README.md`
- `games/bewerkingen-trainer/app.js`
- `games/bewerkingen-trainer/battle-config.js`
- `games/bewerkingen-trainer/battle-player.html`
- `games/bewerkingen-trainer/battle.html`
- `games/bewerkingen-trainer/classroom.css`
- `games/bewerkingen-trainer/classroom.html`
- `games/bewerkingen-trainer/index.html`
- `games/bewerkingen-trainer/style.css`
- `games/getallenwereld/app.js`
- `games/getallenwereld/index.html`
- `games/getallenwereld/style.css`
- `index.html`
- `js/catalog-progress.js`
- `js/catalog.js`
- `js/frontpage.js`
- `klasbattle/hub.js`
- `klasbattle/index.html`
- `oefenbladen.html`
- `scripts/build-catalog.cjs`
- `shared/axioma-game.js`
- `shared/axioma-social.js`
- `shared/game-registry.js`
- `shared/leraarbob-topbar.js`
- `shared/play-modes.js`
- `shared/worksheet-hub.js`
- `teacher/index.html`
- `teacher/teacher.js`
- `tests/catalog-progress.test.cjs`
- `tests/game-registry-browser.cjs`
- `tests/game-registry.cjs`
- `tests/getallen-unified-browser.cjs`
- `tests/getallenwereld-browser.cjs`
- `tests/getallenwereld.test.cjs`
- `tests/platform-pilots-browser.cjs`
- `tests/teacher-details-browser.cjs`

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


## Vervolgaanpassing: aanklikbare antwoorden en echte Getallenwereld-sessies

De reekscomponent heeft nu één gedeelde wiskundige antwoordbediening voor solo,
Bordduo, Duo Learn/Battle, Klaslearn/Battle en de historische battlewerkborden.
De leerling tikt een antwoorddeel aan en kiest uit passende waarden. Het
antwoordtekstveld, het virtuele keyboard en het zijpaneel zijn vervangen.
De app heeft directe acties voor oefenen, papier, duo, klas en resultaten.

Nieuwe sessies gebruiken een servergecontroleerde, aanvullende resultaatlaag.
De centrale battlepagina kan ze terugvinden en hervatten. Historische
progress-ID's en sessies blijven behouden. De startpagina telt werkelijke
online-XP één keer mee naast solo-XP. Datumfilters en exports gebruiken alleen
beschikbare geregistreerde gebeurtenissen; oude solo-historie is niet volledig.

Zie `games/bewerkingen-trainer/README.md` voor gedrag, XP-regels, grenzen en
publicatiestappen. Dit is de prioritaire pilot voor machten, wortels en
wetenschappelijke schrijfwijze; de eerdere platformbrede vervolgfases blijven
relevant. Een beknopte bespreekbevestiging in Duo Learn vervangt nog geen
uitgebreide beoordeling van elkaars wiskundige tussenstappen.

Validatie: 5.760 gegenereerde antwoordtemplates tegen de exacte kern; 64
solo-/Bordduo-werkborden zonder keyboard op 640×360 en 390×844; nieuwe online
Klaslearn, Duo Learn en Duo Battle met aparte browsercontexten; verbeteren,
reconnect, éénmalige XP, filters en export; oude klasbattle, accountisolatie en
offline opslaan; vijf schermformaten met open/dichte bovenbalk, terugkeer en
herladen. De toetsen gebruiken fictieve accounts zonder productieresultaten.


Backend gepubliceerd op 5 oktober 2026: migratie
`20261005202025_numbers_learn_battle` en `numbers-session` versie 1 met JWT-controle.
De publieke RPC is alleen door service_role uitvoerbaar. Alle vier nieuwe
private tabellen hebben RLS. Er zijn geen nieuwe securitywaarschuwingen; de
[vier informatieve RLS-meldingen zonder directe policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
horen bij de bewuste toegang uitsluitend via de serverfunctie. De
[drie nog ongebruikte indices](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)
zijn nieuw en bedoeld voor eigen sessies, deelnemers en datumfilters. Bestaande
platformadviezen blijven ongewijzigd.
