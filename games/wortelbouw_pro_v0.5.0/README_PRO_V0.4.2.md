# Wortelbouw Pro v0.4.2 — Stable Drag Camera

Hotfix op de v0.4 Interaction Rebuild, met v0.4.1 bouwzijdeverbeteringen inbegrepen.

## Belangrijkste correctie
Tijdens een pointer-drag beweegt of zoomt de wereldcamera **niet meer**. De volledige gesture gebruikt een snapshot van dezelfde camera voor screen↔world-coördinaten. Daardoor kan een driehoek niet meer onder de muis/vinger verspringen wanneer zijn preview groter wordt.

Na het loslaten mag de camera opnieuw ruimte maken voor de volledige volgende constructiestap. Daarbij blijft het aangeraakte hoekpunt als visueel anker behouden, zodat de overgang veel minder desoriënterend is.

## Ook inbegrepen uit v0.4.1
- brede gouden hitzones op alle werkelijk vrije buitenzijden;
- grotere touch/muis-hitbox;
- elk bestaand vierkant kan geselecteerd worden om van daar verder te bouwen;
- automatische test van de gespiegeld liggende driehoek wanneer de eerste richting botst;
- duidelijkere overlapfeedback;
- correcte pointercursor en `touch-action:none`.

## Niet gewijzigd
`geometry.js` en `progress.js` zijn inhoudelijk ongewijzigd. De patch verandert enkel interactie/camera/presentatie.
