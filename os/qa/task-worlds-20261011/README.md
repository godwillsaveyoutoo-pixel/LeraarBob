# Zes extra werelden in taken — uitgevoerde controle

De centrale taakmaker ondersteunt nu negen soorten onderdelen. Toegevoegd: Getallenwereld, Vergelijkingen, oorspronkelijk Stelsels, Vectormissie, Logicawereld en Wortelbouw. Bestaande Glasraam-, Kleiduifschieten- en Rechtenwereldtaken blijven ondersteund. De leerkracht kiest onderwerpen, volgorde, aantallen en beschikbare instellingen, inclusief Stelsels-methode en beginner/expert.

## Werkelijk uitgevoerd

- Zeven SQL-/server-/wiskundetests geslaagd: autorisatie, vaste inhoud, oorspronkelijke validators, retries, concurrerende antwoorden, per-leerlingconcepten, gedeeltelijke inzendingen en veilige historische Stelsels-markering. [Uitvoer](unit-results.txt).
- Acht browsercontrolegroepen voor de zes extra werelden geslaagd. [Rapport](report.json). Docent maakt de taak via de interface; elke leerling beantwoordt met de echte native bediening, bewaart tussenwerk, opent het op een tweede browser en dient in.
- Elf vragen gepland, zes correct ingediend, de rest niet gemaakt: definitief resultaat **6/11**. Lege inzending **0/11**. Beide blijven onveranderlijk na indienen. De docent kan de native antwoorden terugzien en feedback toevoegen.
- Werkelijke [resultaten-PDF](six-worlds-scores.pdf) gedownload, met Poppler gerenderd en visueel gecontroleerd: één leesbare A4, alle zes onderdelen en de totaalscore.
- Acht bestaande taakcontrolegroepen voor Glasraam, Kleiduifschieten en Rechtenwereld geslaagd. [Regressierapport](existing-tasks-report.json).
- Oorspronkelijk Stelsels in OS: echte expert-substitutie van oefening 7, juiste en onjuiste drops, klik/klik, toetsenbord, touch, undo, hervatten en native voortgang. [Rapport](original-stelsels-report.json).
- Chromium/Brave, 100% zoom: 1366 × 768, 390 × 844 en 640 × 360. OS-balken open en dicht; 44px antwoordacties bereikbaar, geen horizontale overflow. Getallenwereld en Vergelijkingen nemen de donkere OS-weergave correct over.
- Cataloguscontrole, pakketcontrole en reproduceerbare taakcatalogus, Stelsels-werkbord en serverbundle geslaagd. GitHub CI voert daarnaast de volledige bestaande regressies uit.

## Beeldmateriaal

[Taakmaker](teacher-worlds.png) · [Stelsels expert](systems-draft.png) · [Stelsels mobiel](systems-390.png) · [Getallenwereld donker](numbers-dark.png) · [Vergelijkingen donker](algebra-dark.png) · [Wortelbouw](rootsbuild-1366.png) · [Gedeeltelijk resultaat](partial-result.png).

## Afbakening

De volledige browserproef gebruikt synthetische leerkracht- en leerlingaccounts, lokale PostgreSQL/PGlite en de werkelijke Edge-handler. Hier was geen gekoppelde ingelogde productie-browser beschikbaar. De proef is dus geen bewijs van aanmelden en volledig uitwerken met echte productieaccounts. Er worden geen fictieve testscores aan bestaande leerlingen toegevoegd.

Wortelbouw omvat de zeven oorspronkelijke bouwopgaven uit de vraagprovider. Stelsels omvat de veertien oorspronkelijke oefeningen en is een begeleid werkbord met de bestaande feedback tijdens oplossen. Een afgesloten toetsmodus zonder die ondersteuning is niet toegevoegd. Taartenwereld en losse levelspellen zoals Kubusbouw, Brandweer en Data Check blijven buiten deze uitbreiding, zoals afgesproken.

[Technische aansluiting en uitrolvolgorde](../../../tasks/README.md).
