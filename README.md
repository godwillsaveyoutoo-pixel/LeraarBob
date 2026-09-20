# Axioma site starter

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
De huidige Rechtentrainer behoudt zijn bestaande Supabase-koppeling.
De frontpage en de andere spellen hoeven Supabase voorlopig niet te gebruiken.


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


## v0.5 — Centrale Axioma-auth

De Supabase-login hoort nu bij **Axioma zelf**, niet meer bij één specifiek spel.

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
kunnen later als extra databronnen aan hetzelfde Axioma-dashboard worden toegevoegd.

### Nieuw spel met Axioma-login

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

`axioma_games` registreert welke spellen bij Axioma horen en hoe ze in de leraarsconsole behandeld worden.

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
