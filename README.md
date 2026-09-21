# leraarBob site starter

De zichtbare platformnaam is **leraarBob**. Technische `Axioma*`-API's,
`axioma-*`-bestandsnamen, opslagsleutels, leerling-loginadressen en databasetabellen
blijven compatibel met bestaande accounts, integraties en opgeslagen voortgang.

De catalogus gebruikt `kind` voor de werkvorm op de startpagina: `learn` = Verkennen,
`train` = Oefenen, `game` / `arcade` = Spelen. Onderwerpfilters gebruiken `theme`.
`gameType` en `progressType` beschrijven de bestaande registratie en voortgang.
Werk zowel `games.json` als de offlinekopie `js/catalog.js` bij als de catalogus wijzigt.

## Structuur
- `index.html` = frontpage
- `games.json` = tegels op de frontpage
- `games/.../index.html` = zelfstandige spellen
- `assets/covers/` = later echte coverbeelden
- `js/supabase-config.js` = gereserveerd voor gedeelde Supabase-config

## Nieuw spel toevoegen
1. Maak bijvoorbeeld `games/pythagoras/`.
2. Zet je spel daarin als `index.html`.
3. Voeg één item toe aan `games.json`.
4. Push naar GitHub.

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

Die pagina toont voorlopig de bestaande Rechtentrainer-resultaten. Nieuwe spellen
kunnen later als extra databronnen aan hetzelfde leraarBob-dashboard worden toegevoegd.

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
- De bestaande multiplayer-RPC's bewaren leerlingresultaten en klasrankings.
  Partijen met een leerkracht zijn oefenpartijen zonder ranking. De speluitkomst
  is zoals in het aangeleverde spel door de twee browsers bepaald, niet door
  een server die alle zetten en vloten controleert.

Zie `tests/README.md` voor de browser- en databasetests.
