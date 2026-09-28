# Vrij kanvas

Open **Menu → Vrij kanvas** in de trainer, of [canvas.html](../../games/vectoren/canvas.html).

Kies Vector, Punt of Stippellijn, klik een kleur aan en teken op het rooster. Vectoren en stippellijnen ondersteunen slepen of twee tikken; een punt plaats je met één tik. Vectoren krijgen automatisch namen u, v, w… en punten A, B, C… Een eigen naam kan in het naamveld; het pijltje boven de vectornaam wordt automatisch toegevoegd. Er zijn zes kleuren.

Ongedaan herstelt de laatste wijziging of annuleert een gekozen beginpunt. Ook Alles wissen kan met Ongedaan worden teruggedraaid. Pijltjestoetsen en Enter ondersteunen tekenen via het toetsenbord; Escape annuleert een onafgewerkte lijn. Tijdens tekenen blijft het rooster stabiel. Bij een ander schermformaat blijft de bestaande tekening binnen beeld.

De tekening wordt op dit toestel opgeslagen onder een afzonderlijke opslagkey. Het kanvas wijzigt geen persoonlijke oefenvoortgang of XP en laadt geen accountdiensten. Terug naar Vectormissie hervat de lopende oefening.

Bronnen: `games/vectoren/canvas.html`, `vector-canvas.js` en `styles/vector-canvas.css`. De schermkadrering en plaatsing van namen gebruiken de bestaande helpers uit `vector-mission.js`.

[Browsercontroles](canvas-report.json): muisdrag, touch, verschillende namen en kleuren, punten, stippellijnen, herstelbaar wissen, herladen, toetsenbord, annuleerbare beginpunten en behoud van de oefening bij terugkeer. Indeling gecontroleerd op 1366×768, 780×360, 640×360 en 390×844. Geen JavaScript-excepties. Touch is geëmuleerd in Chromium.

- [Desktop](screenshots/canvas/drawing-1366.png)
- [Klein liggend scherm](screenshots/canvas/drawing-640.png)
- [Portret](screenshots/canvas/drawing-390.png)

Herhalen: `node tests/vector-canvas-browser.cjs` met de lokale server op 8775 en test-Chromium op 9245.
