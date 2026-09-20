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
