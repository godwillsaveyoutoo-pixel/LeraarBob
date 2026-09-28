# Wortelbouw Pro v0.3.1 — rustige succesfocus + levende konijnen

Deze iteratie bouwt verder op v0.3 zonder de wiskundige geometry/progress-engine te wijzigen.

## Camera bij een correcte constructie

- De camera maakt **geen nieuwe volledige fit** meer zodra het antwoord juist is.
- Vlak vóór de `reveal -> won/routeDone` overgang wordt het actuele camerakader vastgelegd.
- De succesfase behoudt hetzelfde wereldcentrum en maakt alleen een zachte zoom-out van ongeveer **4,5%** over ~560 ms.
- De wortel-as en succes-UI veranderen de world-camera dus niet.
- De knop `⛶` blijft een expliciete uitzondering: wie bewust het volledige mozaïek wil zien kan daarmee de succes-lock verlaten.
- Bij `prefers-reduced-motion` vervalt de camera-animatie.

## Signaal op de gevonden lengte

De laatst gemeten/resultaatszijde krijgt bij succes ongeveer 1,9 s een warme gouden lichtpuls. Een klein lichtpunt loopt één keer over de zijde. Daardoor ligt de feedback eerst op de wiskundige lengte zelf in plaats van op een camerabeweging.

## Konijnen wonen nu in het veld

- Konijnen staan niet langer vast in het midden achter `A = ...`.
- Ieder bewoonbaar groen veld heeft een set lokale roam-ankers buiten de centrale labelzone.
- Een nieuw konijn komt vanaf de gedeelde rand het veld binnen nadat voldoende gras gegroeid is.
- Daarna zit het een tijdje stil en hupt het af en toe naar een ander ankerpunt.
- De beweging gebeurt in lokale vierkantcoördinaten en werkt dus ook voor geroteerde velden.
- Alleen start-/resultaatvelden zijn bewoonbaar; hulpvelden niet.
- Tijdens stilstand wordt niet continu gerenderd: een kleine timer activeert alleen rond een volgende hop opnieuw een korte canvas-animatie. Dit houdt de A20-belasting laag.

## Niet gewijzigd

- `geometry.js`
- `progress.js`
- som-/verschilregels
- overlapcontrole
- save/replay-formaat
- tap- en handmatige constructielogica
