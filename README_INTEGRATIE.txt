leraarBob — geïntegreerde spellen

Deze website bevat nu de bestaande onderdelen én 9 geïntegreerde spellen:
- Pythagoras
- Stelsels (nieuwe versie)
- Algebra Smederij
- Taartenwinkel
- Kubusbouw
- Verfwinkel
- Data Check
- Signal Lab
- Gravity Maze

Wat is geïntegreerd:
1. De spellen staan rechtstreeks in games.json en js/catalog.js en verschijnen dus op de startpagina.
2. De oude Stelsels-link naar games/stelsels/ is vervangen door games/stelsels.html.
3. Elk nieuw spel heeft een leraarBob-link terug naar de platformstartpagina.
4. Spelopslag is per account gescheiden via shared/axioma-game.js.
5. Online voortgang wordt vóór het starten geladen; de eigen spelgegevens en voltooiingen worden met revisiecontrole bewaard. Oude gastgegevens worden nooit automatisch naar een leerlingaccount overgenomen.
6. Het leraarscherm kan deze spellen daardoor als gewone 'levels'-voortgang tonen.
7. De nieuwe cataloguslinks bevatten een versieparameter om oude HTML-cache te omzeilen.

De Supabase-tabel axioma_games is op 20-09-2026 live bijgewerkt met de 9 game-ID's. Het bestand supabase_game_registry.sql zit ook in deze ZIP als reproduceerbare registratie.

Zie PLATFORM_FRAMEWORK.md voor het actuele contract. Vectoren bewaart ook zijn leermodel, fouten/herhalingen en lopende oefening bij het account.
