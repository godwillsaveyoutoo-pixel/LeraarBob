# Wortelbouw Pro — asset replacement guide

De huidige afbeeldingen zijn placeholders. Ze zijn bewust losgekoppeld van de geometrie, zodat ze later één-op-één vervangen kunnen worden.

## Velden

### `assets/wortelbouw/fields/grass.png`
- vierkant, liefst 512×512 of 768×768;
- tileable of minstens zonder opvallende rand;
- geen houten border;
- geen konijn;
- geen tekst of cijfers;
- frontaal materiaal, geen ingebouwd perspectief;
- zachte potlood/watercolor look.

### `soil.png`
Zelfde technische voorwaarden. Dit is de kale toestand vóór de reveal.

### `helper.png` — legacy
Niet meer gebruikt vanaf v0.4.3. Alle afgewerkte vierkanten gebruiken dezelfde vruchtbare `grass.png`; de mathematische rol van een vierkant wordt niet meer met een andere grondsoort gecodeerd.

## Rand

### `wood-edge.png`
- transparante PNG/WebP;
- horizontale balk;
- linker- en rechterrand moeten visueel goed kunnen stretchen/tilen;
- geen hoekpalen ingebakken.

### `wood-corner.png`
- transparant;
- symmetrisch of roteerbaar;
- wordt op elk geometrisch hoekpunt apart getekend.

## Konijnen

### `rabbit-idle.png`
- transparant;
- gecentreerde losse figuur;
- geen schaduw buiten het eigen spritevlak tenzij bewust;
- huidige renderer schaalt en spiegelt dit beeld automatisch.

### `rabbit-guide.png`
Grotere guide-rabbit voor de tekstballon. Dit is DOM-art en staat los van de canvasgeometrie.

## Papier / affiche

`paper/paper.png` en `signs/poster.png` zijn alleen textures. Alle echte tekst blijft HTML, zodat dynamische of gegenereerde tekst, vertaling en responsive wrapping mogelijk blijven.

## Belangrijk

Geen enkele artasset mag wiskundige labels, zijden, oppervlaktes of wortels bevatten. Die blijven runtime-rendering, zodat dezelfde illustraties veilig voor alle levels kunnen worden hergebruikt.


## v0.4.3 semantic land rule

All completed square fields now use the same fertile `grass.png` material, regardless of their internal geometry role. `helper.png` is retained in the package only for backward asset compatibility and is no longer used by the renderer. Temporary/unplaced previews still begin as soil.
