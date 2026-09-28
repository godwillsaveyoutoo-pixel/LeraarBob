# Wortelbouw Pro v0.4.1 — Interaction Rebuild

Deze versie bouwt verder op v0.3.2 en verandert bewust vooral **bediening, startvrijheid en menu**, niet de wiskundige kern.

## Kernwijzigingen

### 1. Geen `START HIER` meer
Een leeg level heeft geen onderste stippellijn, vaste oorsprong of voorgestelde starttegel meer.

In **vrij tekenen**:
- druk eender waar op de speelvloer;
- sleep diagonaal;
- de eerste zijde snapt naar een gehele maat;
- laat los om het eerste konijnenveld daar te plaatsen.

In **tikbediening**:
- kies een maat;
- tik eender waar om het eerste veld daar te plaatsen.

De positie is presentatief. De geldigheid blijft bepaald door lengtes, rechte-hoekrelaties, oppervlakten, adjacency en overlap.

### 2. Camera volgt de gemaakte keuze
Tijdens het tekenen van het allereerste veld blijft de camera rustig staan. Na loslaten:
- wordt de **werkelijk geplaatste geometrie** gefit;
- blijft het gekozen gebied waar mogelijk onder ongeveer dezelfde schermpositie;
- wordt alleen geklemd als een deel anders buiten de veilige speelzone zou vallen.

Daarna gebruikt de bestaande camera opnieuw de actuele geometrie + de actieve bouwstap. Er wordt geen toekomstige leveloplossing gebruikt om zoom te voorspellen.

### 3. Compacte bouwdoos
De footer toont nu een eenvoudige context:
- `□ Veld`
- `△ Driehoek`

De relevante bouwsteen licht op volgens de huidige fase. De bestaande som-/verschilkeuze blijft beschikbaar wanneer een driehoek wordt gebouwd.

### 4. Handiger menu
De knop rechtsboven is nu `☰ Menu` met:
- Verder spelen
- **△ + 3 velden · proef**
- Alles in beeld
- Bediening wisselen: vrij tekenen / tikken
- Herstart level
- Levelselectie + voortgang

De oude voortgangsinformatie is dus niet verdwenen; ze zit in hetzelfde centrale menu.

## Legpuzzel-proef

Via `☰ Menu → △ + 3 velden · proef` is een **niet-meetellend interactieprototype** beschikbaar.

De leerling krijgt:
- één rechthoekige 3–4–5-driehoek;
- drie losse, visueel even grote grondkaarten `A = 9`, `A = 16`, `A = 25`;
- drie zijzones.

De kaarten moeten naar de correcte zijde worden gesleept. De losse kaarten zijn bewust even groot: de UI verraadt dus niet door kaartgrootte welke oppervlakte op de hypotenusa hoort. Na de drie correcte plaatsingen verschijnt `9 + 16 = 25`.

Deze proef verandert **geen** van de huidige 14 levels of progressie. Hij is toegevoegd om eerst te beoordelen of dit type `leggen → begrijpen → construeren` goed genoeg aanvoelt om echte levels van te maken.

## Compatibiliteit

`geometry.js` is alleen uitgebreid zodat `start` nu ook een vrije `y`-coördinaat kan bewaren.

- nieuwe acties: `{type:'start', k, x, y}`
- oude saves: `{type:'start', k, x}` blijven identiek replayen met de historische baseline
- som, verschil, overlapcontrole, Pythagorasrelaties, routevergelijking en bestaande levels zijn inhoudelijk niet gewijzigd

## Tests uitgevoerd

- syntaxcheck `wortelbouw.js`
- syntaxcheck `geometry.js`
- syntaxcheck `progress.js`
- vrije start op arbitraire `(x,y)` → level 1 volledig tot `won`
- save/replay van vrije `(x,y)`-start
- replay van oude startactie zonder `y`
- controle op dubbele HTML-id's
- controle dat alle `$('id')`-referenties in `wortelbouw.js` werkelijk in `index.html` bestaan

Een geautomatiseerde Chromium-render kon in deze container niet worden uitgevoerd door de lokale-browserbeveiliging; de code- en state-tests hierboven zijn wel uitgevoerd.

## Bewust nog niet in v0.4.1

- reeds geplaatste geometrie nadien vrij verslepen;
- vrije rotatie van het eerste vierkant;
- de legpuzzel al in de officiële 14-levelcampagne opnemen;
- meerdere losse figuren combineren buiten de proef;
- camera edge-pan tijdens zeer lange vrije slepen.

Dat zijn logische volgende experimenten nadat de nieuwe basisbediening op desktop en A20 is gevoeld.
