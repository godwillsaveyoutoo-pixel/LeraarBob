AXIOMA — extra spellen met eenvoudige tracking

Deze map bevat 9 spellen:
- Pythagoras
- Stelsels
- Algebra Smederij
- Taartenwinkel
- Kubusbouw
- Verfwinkel
- Data Check
- Signal Lab
- Gravity Maze

Per spel toegevoegd:
1. AXIOMA-link naar de startpagina.
2. Eenvoudige voortgang: completed / total + volledig afgerond.
3. Opslag onder:
   axioma:game:<game-id>:progress
   axioma:game:<game-id>:complete
4. Een 'axioma:game-progress' bericht voor de platform-shell.

Plaats de map games/ naast de Axioma index.html.
Laad games-registry-additions.js NA de bestaande game-registry als het platform window.GAMES gebruikt.
Laad axioma-platform-game-bridge.js eenmaal in de platform-shell om voortgangsberichten en Home-verzoeken op te vangen.

De tracking blijft bewust simpel: geen foutenlog, timing, streaks of gedetailleerd leerlingprofiel.
