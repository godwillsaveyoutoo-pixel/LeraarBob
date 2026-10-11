# Balken inklappen zonder overblijvende strook · 11 oktober 2026

Aanvullend bewijs voor sleepbediening, centrale fullscreen en de gemelde overlap met Brandweers lege a-regelaar staat in [drag-bars-20261011](../drag-bars-20261011/README.md). De rapporten hieronder horen bij de eerdere versie vóór die aanvulling.

De gebruiker meldde terecht dat inklappen nog een brede onderstrook liet staan. De vorige plaatsingscode reserveerde 44 px over de volle breedte zodra de schermrand bezet was. Die reservering bleef soms ook na verder scrollen bestaan. De eerdere test controleerde alleen dat de balk zelf 0 px hoog was en het spel groter werd; daarmee werd deze reststrook gemist.

De fout is opnieuw gereproduceerd met de vorige JavaScript/CSS uit commit `7414776`, op een gevuld bureaublad van 1024 × 600: `padding-bottom: 44px`. [Voor](before-1024.png) en [na](after-1024.png) tonen dezelfde schermmaat. Online-aanwezigheid in deze lokale fixtures kan tussen screenshots veranderen.

## Gedrag

- De boven- en onderbalk behouden hun eigen inklapkeuze. Ingeklapt nemen ze geen rij, padding of vervangstrook in. Het bureaublad en de app-iframe gebruiken alle vrijgekomen pixels.
- Een klein streepje van 26 × 5 px blijft zichtbaar per ingeklapte balk. Het transparante aanraakgebied is 44 × 44 px, met toegankelijke naam, status en zichtbare toetsenbordfocus. Hover geeft geen groot gevuld knopvlak meer.
- De herstelknop zoekt ruimte naast tekst en bediening. Bij een bezette rand zoekt hij ook een plek iets verder naar binnen, zonder de inhoud te verkleinen. Beide herstelknoppen houden rekening met elkaar.
- Scrollen, schermrotatie, balkherstel en herladen houden de bediening bereikbaar. Inklappen vervangt geen iframe, antwoord, oefening of sessie.

## Werkelijk gecontroleerd

Alle proeven gebruiken Chromium bij 100% zoom en lokale fictieve accounts. Dit is geen nieuwe productie- of multiplayerproef.

| Controle | Resultaat |
| --- | --- |
| [Gevuld bureaublad](desktop-and-rights.json) | 1366 × 768, 1024 × 600, 390 × 844, 640 × 360 en 320 × 568; vier onafhankelijke balkstanden, vóór/na scrollen. Exacte inhoudsranden en nul padding gecontroleerd. |
| [Rechtenwereld](desktop-and-rights.json) | Echte antwoordselectie; vier schermmaten × vier balkstanden; alle vrijgekomen ruimte gebruikt. Aanraakdoelen ≥44 px, geen overlap met antwoordacties; toetsenbord/touch, Start, herstellen, herladen, minimaliseren/hervatten en sluiten. |
| [Catalogus](catalog.json) | 24 apps, 8 interactiegroepen en 395 doelmetingen. Eerste scherm/eerste oefening, oorspronkelijke DOM en invoer, heropenen van beide balken. Dit dekt niet ieder intern level. |
| [Zeeslag](zeeslag.json) | 6 groepen, 21 layouts; alle 63 coëfficiëntcombinaties, echt schot en computerbeurt; herstelknoppen bedekken geen antwoordbediening. |
| [Brandweer](brandweer.json) | 7 groepen, 12 layouts; oorspronkelijke formulebediening, acht gevels en echte redding; herstelknoppen vrij van antwoordbediening. |
| [Oorspronkelijke Stelsels](stelsels.json) | 11 controles; juiste OS-ingang, groen expert-substitutiedoel, slepen/tikken/toetsenbord, volledige oplossing, beide balkstanden en hervatten. |
| [Mappen en ranglijsten](places.json) | 4 groepen; 1366/390/640 px, minimaliseren/hervatten, echte bewaarde reeks, geen dubbele vensters, accountisolatie. |
| [DOM- en platformtests](units.txt) | 34 geslaagd. |

Screenshots: [bureaublad 1366](desktop-1366.png), [telefoon](desktop-390.png), [Rechten-oefening met beide balken ingeklapt](rights-1366.png). [Bronhashes](source-hashes.json) leggen de geteste implementatie vast.

Herhalen: `NODE_PATH=/tmp/leraarbob-os-deps/node_modules LB_SCREENSHOT_DIR=/tmp/lb-full-space node tests/personal-chrome-browser.cjs`. De overige browsercommando’s zijn de gelijknamige bestaande tests in `tests/`; zij blijven deel van de catalogusworkflow.
