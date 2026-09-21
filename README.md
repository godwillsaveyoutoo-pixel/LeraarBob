# leraarBob site starter

De zichtbare platformnaam is **leraarBob**. Technische `Axioma*`-API's,
`axioma-*`-bestandsnamen, opslagsleutels, leerling-loginadressen en databasetabellen
blijven compatibel met bestaande accounts, integraties en opgeslagen voortgang.

De catalogus gebruikt `kind` voor de werkvorm op de startpagina: `learn` = Verkennen,
`train` = Oefenen, `game` / `arcade` = Spelen. Onderwerpfilters gebruiken `theme`.
`gameType` en `progressType` beschrijven de bestaande registratie en voortgang.
`games.json` is de enige bewerkbare catalogusbron. Genereer de offlinekopie met
`node scripts/build-catalog.cjs` en neem `js/catalog.js` mee in dezelfde commit.
Wijzig dat gegenereerde bestand niet met de hand. Controleer met
`node scripts/build-catalog.cjs --check`; GitHub voert die controle bij elke push
en pull request uit, zodra de workflow is gepusht.

## Actuele account- en spelkoppeling

Nieuwe spellen sluiten aan op de levenscyclus in
[PLATFORM_FRAMEWORK.md](PLATFORM_FRAMEWORK.md). Deze regelt accountgebonden
opslag, laden vóór het spelen, offline herstel en revisieconflicten. Kopieer
geen losse synchronisatielussen uit oudere versiebeschrijvingen hieronder.
Vectoren is gekoppeld aan leerlingaccounts. Zeeslag ondersteunt zowel online
tegenstanders als solo tegen de computer.

## Structuur
- `index.html` = frontpage
- `games.json` = tegels op de frontpage
- `games/.../index.html` = zelfstandige spellen
- `assets/covers/` = coverillustraties voor de spelkaarten
- `js/supabase-config.js` = gereserveerd voor gedeelde Supabase-config

## Nieuw spel toevoegen
1. Maak `games/<game-id>/` met een vaste, unieke spel-id.
2. Zet je spel daarin als `index.html`.
3. Voeg één item toe aan `games.json`.
4. Voer `node scripts/build-catalog.cjs` uit en controleer met `node scripts/build-catalog.cjs --check`.
5. Neem bron en gegenereerde kopie samen mee in je commit en push naar GitHub.

Nieuwe spellen gebruiken `games/<game-id>/index.html`, met hun eigen modules en
assets in die map. Verplaats oudere spellen wanneer er toch inhoudelijk aan wordt
gewerkt; behoud dan oude links en bestaande opslagkeys.

Voorbeeld:
```json
{
  "title": "Pythagoras",
  "subtitle": "Ontdek en gebruik de stelling",
  "href": "games/pythagoras/",
  "category": "Meetkunde",
  "kind": "learn",
  "accent": "gold"
}
```

## Supabase
Het platform en de spellen delen de Supabase-login via `shared/axioma-auth.js`.
`shared/axioma-social.js` verzorgt de platformbrede onlinelijst en speluitnodigingen.


## Tegelillustraties
De frontpage ondersteunt nu twee visuele modi per tegel:

1. `previewType: "live"` + `preview`
   - toont een mini-livepreview van de HTML zelf in een iframe
   - handig als snelle eerste stap

2. `cover: "assets/covers/..."` 
   - toont een echte screenshot / coverafbeelding
   - dit is uiteindelijk de mooiere en performantere oplossing

Voorbeeld in `games.json`:
```json
{
  "title": "Kleiduifschieten",
  "subtitle": "Train de richtingscoëfficiënt",
  "href": "games/rechten/kleiduiven/",
  "theme": "Functies",
  "kind": "arcade",
  "accent": "gold",
  "previewType": "live",
  "preview": "games/rechten/kleiduiven/",
  "cover": ""
}
```


## v0.5 — Centrale leraarBob-auth

De Supabase-login hoort nu bij **leraarBob zelf**, niet meer bij één specifiek spel.

Centrale bestanden:

```text
shared/
  supabase-config.js   # enige plek met URL + publishable key
  vendor/supabase.js   # lokale browserbuild
  axioma-auth.js       # login, registratie, sessie, rolcontrole
```

De frontpage bevat nu leerlingregistratie, leerlinglogin en leerkrachtlogin.
De Rechtentrainer gebruikt dezelfde centrale sessie en bewaart zijn bestaande
gespecialiseerde voortgang nog steeds in `axioma_progress`.

De centrale leraarpagina staat op:

```text
teacher/
```

Die pagina toont Rechtentrainer-resultaten en gedeelde voortgang van de andere
geregistreerde, zichtbare onderdelen. De Rechtentrainer heeft vaardigheidsmeters;
de andere onderdelen hebben een algemeen overzicht en tonen in het leerlingdetail
nog de opgeslagen gegevens. Leesbare vaardigheidsdetails voor de andere trainers
zijn een volgende uitbreiding.

### Nieuw spel met leraarBob-login

Laad vanaf het spel de gedeelde bestanden (pas het relatieve pad aan):

```html
<script src="../../shared/vendor/supabase.js"></script>
<script src="../../shared/supabase-config.js"></script>
<script src="../../shared/axioma-auth.js"></script>
```

Daarna:

```js
const { account } = await AxiomaAuth.ready();
```

`account` is `null`, een leerling (`role: "student"`) of een leerkracht
(`role: "teacher"`).

Voor toekomstige games hoeft de Supabase URL/key dus niet opnieuw gekopieerd te worden.


## v0.6 — Spelregister + generieke voortgang

Supabase bevat nu twee extra centrale onderdelen:

```text
axioma_games
axioma_game_progress
```

`axioma_games` registreert welke spellen bij leraarBob horen en hoe ze in de leraarsconsole behandeld worden.

`axioma_game_progress` bewaart generieke voortgang per leerling + spel.

De bestaande Rechtentrainer blijft bewust zijn gespecialiseerde `axioma_progress` gebruiken.

Een nieuw spel gebruikt:

```html
<script src="../../shared/vendor/supabase.js"></script>
<script src="../../shared/supabase-config.js"></script>
<script src="../../shared/axioma-auth.js"></script>
<script src="../../shared/axioma-progress.js"></script>
```

Voorbeeld:

```js
const GAME_ID = "pythagoras";

const current = await AxiomaProgress.load(GAME_ID);

const result = await AxiomaProgress.save(
  GAME_ID,
  {
    completed: [1,2,3],
    totalLevels: 10,
    correct: 18,
    total: 22
  },
  current.revision
);
```

De leraarsconsole haalt het spelregister uit Supabase en toont geregistreerde spellen automatisch als kolommen/kaarten.
Een spel krijgt pas leerlingdata zodra het zelf `AxiomaProgress.save(...)` aanroept.


## v0.6b — Teacher login race fix

Opgelost: bij een leerkrachtlogin kon `SIGNED_IN` tegelijk met de expliciete logincontrole
een tweede account-resolutie starten. Daardoor kon de eerste controle tijdelijk `null`
terugkrijgen en ten onrechte melden dat het account geen leerkrachtrechten had.

De accountresolver accepteert nu gelijktijdige controles voor dezelfde sessie en verwerpt
alleen echt verouderde resultaten (bijvoorbeeld na uitloggen). De teacherlogin leest
daarnaast de actieve sessie opnieuw uit vóór de rolcontrole.


## v0.6c — Teacher role via één account-RPC

De centrale auth gebruikt nu niet langer twee losse requests (`axioma_is_teacher` + `axioma_profiles`)
om een accountrol te bepalen. In plaats daarvan wordt één RPC gebruikt:

```text
axioma_account()
```

Die bepaalt server-side, binnen dezelfde JWT-context, of de huidige gebruiker:
- `teacher`
- `student`
- of `unknown`

is. Dit vermijdt timing/rolproblemen tussen afzonderlijke browserrequests.


## v0.7 — Basisvoortgang in gewone spellen

Drie spellen schrijven nu bewust slechts minimale voortgang weg:

- **Brandweer**: welke reddingslevels minstens één keer voltooid zijn.
- **Kleiduifschieten**: of de volledige reeks van zeven richtingen minstens één keer is afgewerkt.
- **Stelsels**: welke oefeningen opgelost zijn, ongeacht methode (grafisch/substitutie/combinatie) of beginner/expert.
- **Rechtentrainer**: behoudt zijn bestaande rijke leerdata.
- **Functies & rechten**: voorlopig geen cloudopslag en dus niet in de leraarsconsole.

De frontpage vermeldt per tegel subtiel of voortgang wordt bewaard.
Games blijven zonder account volledig speelbaar; `AxiomaProgress.completeUnit()` doet dan niets.


## v0.7b — leraarBob is altijd Home

In elk opgenomen spel is het zichtbare **leraarBob**-merk linksboven nu een vaste home-link.

- spellen in `games/rechten/...` gaan via `../../../` terug naar de leraarBob-startpagina;
- `games/stelsels/` gaat via `../../` terug naar de leraarBob-startpagina.

Regel voor toekomstige spellen: **klik op leraarBob = altijd terug naar leraarBob Home**.


## v0.7c — Login fix

De centrale accountresolver gebruikt opnieuw de bestaande, bewezen combinatie:

- `axioma_is_teacher()`
- `axioma_profiles`

De nieuwere `axioma_account()` wrapper wordt niet meer gebruikt door de frontend.
Die wrapper kon in bepaalde deployments een permissieprobleem geven nadat de wachtwoordlogin al geslaagd was.

Ook toont de login nu een specifiekere foutmelding wanneer de credentials zelf fout zijn
of wanneer de rolcontrole faalt.

## Rechten Zeeslag en platformbrede uitnodigingen

`games/rechten/zeeslag/` integreert het aangeleverde Rechten Zeeslag v0.5.
De startpagina bevat een eigen tegel onder Spelen / Functies. Zonder account is
een demopartij mogelijk; online spelen gebruikt de bestaande leraarBob-sessie.

Alle platformpagina's laden `shared/axioma-social.js` na de gedeelde auth.
De knop **Online** in de bovenbalk toont ingelogde spelers op het hele platform.
Een uitnodiging verschijnt als **Uitnodiging!**; de ontvanger kiest expliciet
Accepteren of Weigeren. Acceptatie opent dezelfde partij in de tabbladen waarin
de uitnodiging verstuurd en geaccepteerd werd. Andere tabbladen blijven staan.
Catalogus-iframes en `?demo=1` nemen niet deel aan de onlinelijst.

De backenddefinities staan in `supabase_platform_social.sql`. Deze zijn toegepast
op het gekoppelde project via de migratie `platform_online_players_and_naval_invitations`
en de aanvullende expliciete RLS-afscherming `platform_social_rpc_only_policies`.
Dit bestand beschrijft de volledige eerste installatie; voer het niet opnieuw
uit op een project waar deze tabellen al bestaan.

- Privétabellen bewaren aanwezigheid per tabblad en uitnodigingen. De publieke
  `axioma_social`-RPC controleert de ingelogde identiteit, deelnemers, vervaldatum
  en toegestane statusovergangen; tabellen zijn niet rechtstreeks toegankelijk.
- Aanwezigheid en uitnodigingen verversen elke 4 seconden (15 seconden in een
  achtergrondtabblad). Afmelden/navigeren verwijdert de aanwezigheid van dat tabblad;
  bij een weggevallen verbinding verdwijnt een speler uiterlijk na 75 seconden.
- Uitnodigingen vervallen na 90 seconden. Eén lopende uitnodiging of partij per
  speler voorkomt dubbele/gekruiste afspraken. Er worden alleen aliassen en
  klassen getoond, geen e-mailadressen.
- De twee deelnemers spelen via een privé-Realtime-kanaal met toegangscontrole.
  Vloten blijven lokaal. Vernieuwen herstelt de partij uit de sessieopslag van
  hetzelfde tabblad; herhaalde schotpakketten gebruiken hetzelfde resultaat.
- De bestaande multiplayer-RPC's bewaren leerlingresultaten. De Zeeslag-ranglijst
  gebruikt `axioma_naval_ranking` en telt vanaf de eerste voltooide partij.
  Partijen met een leerkracht zijn oefenpartijen zonder ranking. De speluitkomst
  is zoals in het aangeleverde spel door de twee browsers bepaald, niet door
  een server die alle zetten en vloten controleert.

Zie `tests/README.md` voor de browser- en databasetests.

## Kleiduifschieten in groep

Via **Groep** in Kleiduifschieten of **Online → Groepssessie starten** op het
platform kan een ingelogde speler een wachtkamer openen. Andere spelers zien
die onder Online en kiezen Meedoen. De organisator start met 2–30 deelnemers;
iedereen krijgt dezelfde starttijd en hetzelfde tempo (3, 5 of 8 seconden).

De eerste deelnemer die de zeven richtingen achter elkaar juist beantwoordt,
wint. Een fout of verlopen timer zet de reeks volledig terug op nul. De server
controleert de verwachte richting, de tijd, de antwoordvolgorde en de deelnemer.
Herhaalde aanvragen tellen niet dubbel. Een vergrendeling op de sessie zorgt
ervoor dat twee gelijktijdige finishes maar één winnaar opleveren.

De groepsranglijst is platformbreed en apart per tempo: eerst het aantal
overwinningen, dan de beste winnende tijd. De eerste overwinning verschijnt
meteen. De bestaande duomodus en lokale duotijden blijven beschikbaar.

`shared/axioma-groups.js` wordt door de gedeelde social-module geladen.
`games/rechten/kleiduiven/kleiduiven.js` bevat het spel en de groepsbediening.
De geïnstalleerde backend staat in `supabase_clay_groups.sql` (migratie
`clay_group_races_and_first_match_naval_ranking`); voer deze eerste-installatie-SQL
niet opnieuw uit op een project waar de groepsfuncties al bestaan.

Sessies en deelnemers blijven in het privéschema, achter gecontroleerde RPC's.
Zeeslag en groepsdeelname sluiten elkaar uit. Een lopende groepswedstrijd is
aan het deelnemende tabblad gebonden, herstelt bij vernieuwen en sluit na
twee uur automatisch. De timer wordt server-side gecontroleerd; de aankomsttijd
van het laatste antwoord bepaalt de winnaar, dus netwerkvertraging kan verschil maken.


### Reële getallen — eerste trainerversie

Open `games/reele-getallen/` of kies de tegel **Reële getallen** op de startpagina.
Acht werkvormen verbinden breuken, decimalen, procenten, getallijnen, wortelgrenzen,
intervallen, getalsoorten en periodes. De trainer start meteen, met uitleg tussen
de oefeningen en een eigen uitlegcollectie. XP en voortgang gebruiken de gedeelde
accountlaag. De registratie staat in `supabase_real_numbers.sql` en is op het
gekoppelde project toegepast. De bouwopdracht is `node scripts/build-real-trainer.cjs`.
Zie `PLATFORM_FRAMEWORK.md` voor de precieze scope en tests.
