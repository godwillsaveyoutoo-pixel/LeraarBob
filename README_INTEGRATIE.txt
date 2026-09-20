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
4. Elk spel bewaart eenvoudige lokale voortgang (completed / total).
5. Wanneer een leerling met een leraarBob-account is aangemeld, worden voltooide units via AxiomaProgress.completeUnit naar axioma_game_progress in Supabase gesynchroniseerd.
6. Het leraarscherm kan deze spellen daardoor als gewone 'levels'-voortgang tonen.
7. De nieuwe cataloguslinks bevatten een versieparameter om oude HTML-cache te omzeilen.

De Supabase-tabel axioma_games is op 20-09-2026 live bijgewerkt met de 9 game-ID's. Het bestand supabase_game_registry.sql zit ook in deze ZIP als reproduceerbare registratie.

Tracking blijft bewust eenvoudig: geen foutlog, timing, streaks of gedetailleerd leerlingprofiel.
