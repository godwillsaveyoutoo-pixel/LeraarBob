# Wortelbouw Pro v0.4.8 — Compact Navigation

Deze pass verfijnt twee kleine maar belangrijke navigatiepunten.

## Gesloten bovenbalk

- Wanneer de mobiele bovenbalk is ingeklapt, blijft een compacte navigatiepil rechtsboven zichtbaar.
- De pil bevat **vorige** en **volgende** puzzel.
- Fullscreen en de knop om de bovenbalk terug te openen blijven daarnaast staan.
- De knoppen gebruiken exact dezelfde levelhandlers als de gewone navigatie in de bovenbalk; er ontstaat dus geen tweede navigatielogica.
- Openen/sluiten van de balk verandert de canvas- of camerageometrie niet.

## Afgeronde opgaven in het menu

- Voltooide levels hebben nu een duidelijk vruchtbare, grasgroene achtergrond.
- De kleur is bewust sterker dan in v0.4.7 zodat voltooid en nieuw onmiddellijk visueel te onderscheiden zijn.
- Een afgerond level dat ook het huidige level is, behoudt een duidelijke donkere focusrand.
- Het patroon gebruikt alleen CSS-gradients; er is geen extra asset of renderkost.

## Ongewijzigd

- Geometry en progress-regels zijn niet aangepast.
- De camera blijft tijdens slepen volledig vast.
- De Wortel-as en overlay-chrome blijven camera-onafhankelijk.
