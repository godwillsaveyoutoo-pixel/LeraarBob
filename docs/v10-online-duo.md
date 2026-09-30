# v10 — navigatie en Online Duo

Zie ook de [lokale oplevering van 30 september](rechtenwereld-samen-leren/OPLEVERING.md) voor Samen Leren, servercontrole in Klasbattle en de nog niet uitgevoerde productie-uitrol.

V9 is geïntegreerd in de projectroot. De aangeleverde uitgepakte map is als bron
behouden. Bestaande lokale aanpassingen aan startpagina, Gravity en de gedeelde
navigatie zijn meegenomen; de lokale Gravity-stijlen zijn samengevoegd met v9.

## Audit en keuzes

- `shared/leraarbob-topbar.js` blijft het enige gedeelde menu. De bestaande
  DOM-knoppen en handlers blijven de spelacties uitvoeren. Volgorde: Huidig spel,
  Battles indien aanwezig, leraarBob, Account. Spelvoortgang en Mijn leerpad hebben
  verschillende betekenissen. Eén compacte platformrij Samen spelen bewaart
  de bestaande uitnodigingen; bij een inkomende uitnodiging toont ze een teller.
  Vrij tekenen blijft bereikbaar; de extra
  Wortelbouw-cameraactie staat niet langer als apart bestemmingsscherm in het menu.
- De drawer gebruikt compacte rijen van minstens 44 px. Sluiten staat op dezelfde
  schermpositie als de geopende menuknop. Inklappen heeft een rechtstreekse
  herstelknop, bewaart de voorkeur en verandert geen oefening of voortgang.
- Auth, `online_sessions`, `game_invitations`, de Rechtenwereld-battleconfig,
  generators, validators, area-statussen en het geïsoleerde werkbord worden
  hergebruikt. Lokale Duo en Groepsbattle houden hun bestaande coördinatoren.
- De nieuwe Rechtenwereld-groepsbattle en Online Duo laten de server nakijken.
  Beide gebruiken dezelfde native wiskundevalidators in een gegenereerde bundle.
  De oude klas-RPC blijft alleen voor bestaande sessies en andere spellen behouden.
- Beide spelers moeten de **volledige geselecteerde wereld** hebben afgerond.
  De server leest hiervoor de opgeslagen Rechtenwereld-v2-voortgang; toekomstige,
  nog niet speelbare haltes tellen niet mee. Puntenbaai is optioneel en zit niet
  in de online pool. De eis wordt opnieuw gecontroleerd bij uitnodigen en accepteren.
- Geen battle-XP in deze versie. De bestaande platform-XP komt uit opgeslagen
  spelvoortgang en heeft geen afzonderlijk, betrouwbaar serverbeloningsregister.
  Matchuitslagen en rondepunten worden wel eenmalig vastgelegd. Battle speelt
  nooit in de solo-voortgang en kent geen fictieve XP-omrekening toe.

## Werking

Een leerling nodigt een beschikbare klasgenoot uit. Uitnodigingen verschijnen
ook in het bestaande platformpaneel, met Accepteren/Weigeren. Beide spelers
openen één volledig werkbord op hun eigen toestel. Beide drukken op Klaar,
waarna de server drie seconden aftelt. Iedere ronde duurt maximaal 75 seconden;
de eerste definitieve bevestiging beperkt de resterende tijd tot maximaal 20
seconden. De server gebruikt ontvangsttijd, geen clientklok. Een marge van 300 ms
maakt twee praktisch gelijktijdige juiste antwoorden gelijkwaardig.

Tussenstappen controleren niets in Online Duo. Ook de nulwaarde in Grenspas wordt
niet verraden na de eerste invoerstap: de tweede stap toont de eigen hypothese.
De definitieve Bevestig-knop bevriest het bord. Tegenstanders ontvangen alleen
bezig/bevestigd, geen antwoordwaarden. Na beide bevestigingen of timeout valideert
de Edge-worker beide antwoorden; pas daarna volgen juistheid en punten.

Eén juiste speler wint de ronde. Zijn beide juist, dan wint de eerste buiten de
fotofinishmarge. Zijn beide fout of binnen die marge juist, dan geen rondepunt.
Na vijf rondes wint de hoogste score; bij gelijkstand volgen maximaal twee extra
rondes. Na zeven rondes kan de wedstrijd dus als gelijkspel eindigen. Volgende ronde vereist beide spelers. Reload en een
tweede tab lezen dezelfde definitieve inzending. Een onbevestigd lokaal concept
wordt bij herladen opnieuw geopend; het is nog niet als antwoord opgeslagen.

## Backend en beveiliging

Migratie: `supabase/migrations/20260929235619_rechten_online_duo.sql`.

- Bestaande uitnodigingen krijgen `game`, standaard `rechten-zeeslag`.
- `axioma_private.rechten_duels` bewaart de match en serverstatus;
  `rechten_duel_answers` bewaart antwoorden met een unieke sleutel op
  match/ronde/leerling. Beide tabellen hebben RLS en geen directe clientrechten.
- `axioma_rechten_duo` is een invoker-wrapper rond een gecontroleerde private
  definer: identiteit via `auth.uid()`, leerlingrol, klas, deelname, fase, limieten
  en tijd worden in SQL gecontroleerd. Eigenlijke overgangen vergrendelen de
  matchrij. Uitnodigen gebruikt dezelfde korte lock als het sociale systeem.
- `axioma_rechten_duo_worker` is uitsluitend uitvoerbaar door `service_role`.
  De Edge-handler controleert de gebruiker via Auth, haalt daarna uitsluitend
  werk voor diens eigen match op en negeert meegestuurde correctheidsclaims.
  Rondetoestand voorkomt dubbele score bij concurrerende of herhaalde workers.
- De geïnstalleerde social-functie wordt behouden en krijgt een guard zodat de
  oude Zeeslag-RPC geen Online Duo-match kan accepteren of afsluiten.
- De publieke state is een expliciete projectie zonder ruwe antwoorden, ook na
  reveal. Servicecredentials komen uitsluitend uit Edge-omgevingsvariabelen.

Deze keuzes volgen de gecontroleerde [Supabase RLS- en grantregels](https://supabase.com/docs/guides/database/postgres/row-level-security)
en [authenticatie voor Edge Functions](https://supabase.com/docs/guides/functions/auth).
De private deny-all-tabellen zijn bewust alleen via gecontroleerde functies te
benaderen; er zijn geen open leerlingpolicies op antwoordopslag.

## Bestanden en uitrol

- Navigatie: `shared/leraarbob-topbar.js`, native menu-aansluitingen en `index.html`.
- Battlepagina: `games/rechten/rechtenwereld/online.{html,css,js}`.
- Feedbackvrij werkbord: `battle-config.js`, `app-shell.js`,
  `components/grens-view.js`, `shared/multiplayer/player.js`.
- Server: `shared/multiplayer/rechten-online-policy.cjs`,
  `supabase/functions/rechten-duo/{index.ts,handler.js,policy.js}`.
- Build: `scripts/build-rechten-online-worker.cjs`. `policy.js` is gegenereerd;
  bouw het opnieuw wanneer generators, validators of unlockregels wijzigen.

De live database is alleen op schema/RPC-structuur gelezen. **De migratie en
Edge Function zijn nog niet op productie uitgerold.** Voor live gebruik:

1. Pas bovenstaande migratie toe op het bestaande project met alle eerdere
   platform/social/classroom-tabellen. Dit is een additieve migratie.
2. Bouw de serverpolicy met `node scripts/build-rechten-online-worker.cjs`
   (esbuild 0.25.10; eventueel `LB_ESBUILD_MODULE` naar een lokale installatie).
3. Deploy `rechten-duo` met JWT-verificatie aan, zoals in `supabase/config.toml`.
   De handler verifieert daarnaast de sessie via Auth. De standaard Edge-envs
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` zijn vereist.
4. Publiceer de webbestanden en controleer twee echte leerlingauthsessies uit
   dezelfde klas. Wijzig geen secrets in `shared/supabase-config.js`.

## Grenzen

- Solo-voortgang is in het bestaande platform door de client geschreven. De
  backend kiest uit de opgeslagen voortgang, nooit uit een pool in een
  battleverzoek, maar die historische voortgang is geen cryptografisch bewijs
  van beheersing. Strengere attestatie vraagt een apart solo-validatietraject.
- Polling houdt de eerste implementatie eenvoudig en herstelbaar. Online state
  wordt circa elke seconde opgehaald; lobby iedere vier seconden. De zichtbare
  timer interpoleert de servertijd met een monotone browserklok. De SQL-deadline
  blijft beslissend. Netwerkvertraging boven de fotofinishmarge kan invloed hebben.
- Er is geen achtergrondjob. Timeouts worden bij de volgende deelnemeraanvraag
  verwerkt; beide offline betekent dat de verwerking bij terugkeer plaatsvindt.
  Uitnodigingen verlopen na 90 seconden. De bestaande social-opruiming kan een
  langdurig verlaten match sluiten; een match heeft bovendien een limiet van
  twee uur. Hervatten omzeilt geen verlopen ronde.
- Geen oplossingenvergelijking, XP, instelbaar rondeaantal of schooloverschrijdende
  matchmaking. Geen tweede sociaal systeem of tweede solo-voortgangsregister.

## Verificatie

De nieuwe unit-, SQL- en twee-browserproeven dekken pooldoorsnede, server-auth,
vervalste correctheid, timings, vijf rondes, sudden death, fotofinish, privacy,
rol/klasscheiding, dubbele inzendingen/afhandeling, timeout en reconnect/reload.
De twee-browserproef voert de echte Edge-handler en SQL uit in lokale PGlite;
alleen auth en transport worden vervangen. Geen echte leerlinggegevens gebruikt.

Navigatie is gecontroleerd in Rechtenwereld, Vectormissie, Wortelbouw en Gravity,
met gast-, leerling- en leerkrachtweergave, inklappen/terugopenen/herladen,
sluitpositie, 780×360, 390×844, 320 px breedte en desktop.

De brede bestaande unitselectie had **132 geslaagde tests en 6 historische
mislukkingen**. Diezelfde zes falen ook op de ongewijzigde aangeleverde v9:
`rechten-v2-formulewerf.test.cjs` (1), `rechten-v2-regression.test.cjs` (1) en
`rechten-v2-shell-preservation.test.cjs` (4). Het gaat om oude byte-hashes en
verwachtingen van vóór de v9-unlocks/XP. Deze snapshots zijn niet blind vernieuwd.

Aanvullend geslaagd: `multiplayer-duo-browser.cjs` (Rechten/Wortelbouw),
`multiplayer-browser.cjs` (Vectoren/Rechten/Wortelbouw),
`multiplayer-database.cjs`, `gravity-navigation-browser.cjs` en de gerichte
selectie van 23 unit-tests. De sociale browsertest slaagt voor uitnodigen,
weigeren, gezamenlijk openen, Zeeslag-beurten en herladen, maar stopt op een
bestaande bereikbaarheidsfout van de Zeeslag-eindknop op **844×390**. Dezelfde
fout is afzonderlijk gereproduceerd op de ongewijzigde aangeleverde v9; deze
extra Zeeslag-schermreparatie valt buiten de huidige multiplayerfocus.
