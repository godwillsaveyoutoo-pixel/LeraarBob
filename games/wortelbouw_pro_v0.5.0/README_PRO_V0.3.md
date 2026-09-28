# Wortelbouw Pro v0.3 — Pro Shell / Living Fields

Eerste werkende herbouw van **Wortelbouw · Konijnengrond** richting de goedgekeurde Pro-mockup.

## Wat in deze build zit

- De bestaande wiskundige engine (`geometry.js`) is inhoudelijk **ongewijzigd**.
- De bestaande progressie-/save-engine (`progress.js`) is inhoudelijk **ongewijzigd**.
- Nieuwe Pro-shell met:
  - opdrachtblad links;
  - centrale Konijnengrond als echte spelvloer;
  - verwisselbare affiche rechts;
  - apart tekstballon-slot met variabele tekst;
  - gereedschapsdock onderaan;
  - aparte Wortel-as onderaan.
- Responsive layout:
  - volledige drie-zone Pro-layout op desktop/smartboard;
  - compacte overlay-opdracht op korte landscape-schermen;
  - poster/verhaalrail verdwijnt tijdens A20-gameplay zodat de geometrie maximale ruimte houdt.
- Nieuwe assetlaag (`pro/assets.js`) met vervangbare placeholderbeelden.
- Placeholderassets voor:
  - gras;
  - aarde;
  - hulpgrond;
  - houten rand;
  - hoekpinnen;
  - papier;
  - affiche;
  - tuinbodem;
  - konijnen.
- Vierkanten blijven echte geometrische canvasobjecten; afbeeldingen zijn alleen materiaal.
- Beeldtextures draaien en schalen mee met elk vierkant.
- Grond/gras verschijnt gradueel via een texture-mask.
- De reveal groeit vanaf de gedeelde constructiezijde naar binnen.
- Houten omranding wordt per zijde gerenderd en werkt dus ook voor gedraaide velden.
- Posterinhoud en tekstballonnen worden dynamisch vanuit spelstate ingevuld.
- Wortel-as is uit de hoofdcanvas gehaald zodat ze geen cameraruimte meer wegneemt.
- De wortel-as blijft numeriek exact: een wortel verschijnt op haar echte positie.

## Bestanden

- `wortelbouw/index.html` — nieuwe Pro-layout
- `wortelbouw/wortelbouw.css` — desktop + A20 responsive shell
- `wortelbouw/wortelbouw.js` — bestaande gamecontroller + nieuwe presentatie-rendering
- `wortelbouw/pro/assets.js` — assetmanifest en preload/fallback
- `wortelbouw/pro/presentation-data.js` — affiche- en ballontekst per fase
- `wortelbouw/assets/wortelbouw/*` — placeholders; later één-op-één vervangbaar door definitieve art

## Geteste flows

Geautomatiseerd met de browser tegen de echte UI:

- 1684×945: start, tap-mode, volledige √2-route tot `won`.
- 780×360: layout zonder scroll en direct-draw start + driehoek.
- 640×360: alle 14 levelstarts zonder scroll.
- Verschilroute: level √12 met 4² − 2² = 12 tot `won`.
- Alle 14 levels openen zonder JavaScript-fouten.
- Mid-animation gecontroleerd: afbeelding blijft zichtbaar als aarde terwijl gras vanuit de bouwzijde ingroeit.

## Bewust nog niet definitief

Dit is de **v0.3 Pro Shell**, niet de finale art pass.

Nog voor volgende iteraties:

1. definitieve grass/aarde/hout/rabbit assets;
2. rijkere borderdetails en grotere guide-rabbit;
3. subtiele camera-easing i.p.v. alleen directe reframing;
4. sterkere fase-overgangen voor triangle → helper → result;
5. uitgebreider dynamisch affiche-/ballonrepertoire;
6. definitieve Wortel-as art en wortelgroei;
7. visuele polish van labels, rechtehoekmarkering en meetkoord.

## Belangrijk architectuurbesluit

De artlaag bepaalt nooit de wiskunde. De objectpunten, oppervlaktes, overlaptests en Pythagoraslogica blijven afkomstig uit `geometry.js`. Daardoor kunnen alle placeholders later vervangen worden zonder de oefeningen opnieuw te programmeren.

## v0.3.1 follow-up

De succesfase behoudt voortaan de actuele camera en zoomt alleen ongeveer 4,5% zacht uit. De gevonden zijde krijgt eerst een gouden lichtsignaal. Konijnen gebruiken lokale roam-ankers buiten de centrale labelzone en huppen periodiek rond in bewoonbare velden in plaats van achter het oppervlaktegetal te blijven staan.
