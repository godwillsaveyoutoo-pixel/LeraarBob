# Gedeelde leraarBob-bovenbalk

De startpagina, alle actieve spelpagina’s uit `games.json` en de drie Vectormissie-subpagina’s gebruiken dezelfde component: `shared/leraarbob-topbar.js` en `shared/leraarbob-topbar.css`.

De navigatierij bevat leraarBob (startpagina), spel/wereld/onderdeel, het centrale account, instellingen, menu en inklappen. Het spel behoudt zijn eigen kleuren. Statusinformatie en bestaande spelbediening blijven in een aparte rij onder de platformnavigatie. Battle-navigatie zoals de ranglijst staat in het gedeelde menu. Dat menu opent als zijpaneel met gekleurde lijniconen en afzonderlijke titels en beschrijvingen. De platformbestemmingen staan bovenaan, de spelacties bij elkaar en inklappen onderaan. Op smalle schermen past het paneel binnen het scherm en kan de inhoud scrollen.

De component bewaart bestaande knoppen en hun handlers en hergebruikt deze voor menuacties. Hij sluit opnieuw aan wanneer Rechtenwereld een scherm opnieuw opbouwt. De persoonlijke oefening of score wordt niet opnieuw aangemaakt. De globale inklapvoorkeur gebruikt de bestaande lokale sleutel `leraarbob-topbar-collapsed`. Een herstelknop van 44 × 44 px blijft bereikbaar. Iframes en de geïsoleerde battle-renderer krijgen geen extra platformbalk.

De accountknop hergebruikt `js/account-ui.js` en de bestaande centrale accountdienst; in spellen opent het formulier op dezelfde pagina. Bestaande controles op accountwisseling en opslag blijven actief. Er zijn geen databasewijzigingen voor deze bovenbalk.

## Aansluiten

Voeg in de head een deferred script toe met het juiste relatieve pad:

```html
<script src="../../shared/leraarbob-topbar.js" data-title="Mijn spel" defer></script>
```

Opties: `data-header` voor de hoofdheaderselector (standaard `header`), `data-game-href` voor de spelbestemming relatief aan de websiteroot, `data-context="none"` voor een pagina zonder aanvullende spelbalk, en `data-page="home"` voor de platformstartpagina. De Vectormissie-build neemt dit over uit `vector-shell.html` en verwijdert de component uit `battle-player.html`.

## Controles

`node tests/platform-topbar-browser.cjs` controleert alle actieve pagina’s op 1366 × 768 en 390 × 844, aanraakdoelen, klikbaarheid, instellingen, inklappen, herstellen en onthouden na herladen. De test controleert ook de dynamische wereldnavigatie van Rechtenwereld en het starten van spellen met afwijkende beginschermen. Browser CDP op 9245 en de lokale server op 8775 zijn instelbaar via `VECTOR_BROWSER_PORT` en `VECTOR_BASE_URL`. `LB_PAGES` kan een door komma’s gescheiden selectie geven.

Aanvullend gecontroleerd: `vector-flight-browser.cjs`, `vector-battle-browser.cjs`, `vector-canvas-browser.cjs` en `vector-class-browser.cjs` (met de bestaande lokale PostgreSQL-fixture). De netwerkafhandeling van accounts is in deze browsertests gesimuleerd; er zijn geen echte leerlingaccounts gebruikt. De gewijzigde websitebestanden zijn nog niet gepubliceerd.
