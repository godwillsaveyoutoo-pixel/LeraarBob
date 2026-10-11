# Sleepbare balken en vrijgehouden antwoordbediening · 11 oktober 2026

De herstelknop overlapte bij Brandweer de nog lege hellingregelaar. Tijdens de nieuwe sleepaansluiting onderbrak een lokale variabele met dezelfde naam als de toestandsfunctie de plaatsingscontrole. Die fout is hersteld. De plaatsing beschermt bovendien complete invoergroepen, `output`, `fieldset` en de leesbare formule; alleen losse knoppen ontwijken was onvoldoende.

De [screenshot van de oorspronkelijke lege a/b-bediening](brandweer-empty-no-overlap.png) toont beide balken ingeklapt. Het onderste handvat staat naast het doelpunt en buiten de formule, de regelaars en Uitvoeren. Het spel gebruikt de volledige hoogte, zonder vervangstrook. Deze screenshot en de [Rechten-oefening in volledig scherm](rights-fullscreen.png) zijn visueel gecontroleerd.

## Bediening

- Trek het bovenste lijntje omhoog om in te klappen en omlaag om te herstellen. Onderaan zijn de richtingen omgekeerd. Klikken, tikken, Enter/Spatie en de pijltjestoetsen blijven beschikbaar. Aanraakdoelen zijn minstens 44 × 44 px.
- Een sleepbeweging verandert de toestand één keer; de daaropvolgende browserklik wordt onderschept. Een nieuwe bewuste tik werkt onmiddellijk. Horizontaal bewegen, de verkeerde richting en afbreken met Escape of touchcancel klappen niets om.
- De bestaande centrale volledig-schermknop verbergt beide OS-balken. De lijntjes brengen de bediening terug. Verlaten van volledig scherm herstelt de vorige balkstanden. Deze tijdelijke presentatie overschrijft geen bewaarde inklapvoorkeur.
- Gewoon inklappen bewaart de keuze voor herladen. Geen iframe, oefening, antwoord of voortgang wordt vervangen. De dubbele inklapactie in het OS-menu is verwijderd; zelfstandig geopende apps houden hun bestaande menubediening.
- Nieuwe apps kunnen aanvullende belangrijke gebieden met `data-os-protect` markeren. `role="group"` beschermt een volledige bedieningsgroep, inclusief lege waarden en ruimte tussen knoppen.

## Werkelijk uitgevoerd

Lokale Chromium/Brave-proeven, 100% zoom, `deviceScaleFactor: 1`, geïsoleerde fictieve accounts. Alle onderstaande eindrapporten bevatten nul browserexceptions; rapporten die ontbrekende bronnen registreren bevatten nul ontbrekende bronnen.

| Controle | Resultaat |
| --- | --- |
| [Slepen en volledig scherm](gestures.json) | 6 groepen: echte muis- en CDP-aanraakgebeurtenissen op 1366 × 768, 390 × 844, 640 × 360 en 320 × 568; afbreken, klikonderdrukking, toetsenbord, herladen, oorspronkelijke antwoordselectie en echte Fullscreen API. Zowel knop- als API-exit getest; browser-Escape niet fysiek bediend. Ook geweigerde fullscreenaanvraag getest. |
| [Brandweer](brandweer.json) | 8 groepen. Nieuw: lege a/b-regelaars, volledige formule en Uitvoeren blijven vrij van beide handvatten op 1366 × 768, 1680 × 900, 1198 × 700 en 640 × 360. Verder acht gevels, oorspronkelijke invoer en een echte redding. |
| [Bureaublad en Rechtenwereld](desktop-and-rights.json) | 5 groepen. Gevuld bureaublad op vijf schermmaten; nul gereserveerde padding, exacte inhoudsranden en vier onafhankelijke balkstanden; echte antwoordselectie, herstellen, herladen, minimaliseren/hervatten en sluiten. |
| [Catalogus](catalog.json) | 24 vermeldingen: 23 solo-ingangen werkelijk geopend; Rechtenarcade overgeslagen als groepering zonder solo-route. 8 aanvullende interactiegroepen en 395 doelmetingen. Eerste scherm/oefening, oorspronkelijke DOM en invoer blijven behouden. Dit bewijst niet ieder intern level. |
| [Zeeslag](zeeslag.json) | 6 groepen: alle 63 coëfficiëntcombinaties, oorspronkelijk schot/computerbeurt, beide balkstanden, toetsenbord en hervatten. |
| [Oorspronkelijke Stelsels](stelsels.json) | 11 controles in `games/stelsels.html`: OS-route, expert-substitutie, groen doel, volledige oplossing en oorspronkelijke voortgang, slepen/tikken/toetsenbord en hervatten. |
| [Vergelijkingen](equations.json) | 13 interactiegroepen; native bewerkingen, navigatie, opslaan en volledig scherm, met behoud van invoer. |
| [DOM en platform](units.txt) | 34 geslaagd, 0 mislukt. |

Daarnaast slagen `node --check` voor de gewijzigde JavaScriptbestanden, `git diff --check`, `tests/desktop-package-check.cjs` en `scripts/build-catalog.cjs --check`. De definitieve browsersuites zijn na time-outs bij parallelle uitvoering afzonderlijk/achtereenvolgens voltooid. [Bronhashes](source-hashes.json) leggen de geteste code vast.

De preview op `http://127.0.0.1:8795/os/?previewUser=alex` serveert deze werkboom. Een reeds geopende pagina moet eenmaal worden herladen om de gewijzigde scripts te laden. Dit is lokaal bewijs, geen publieke uitrol, productieaccountproef of nieuwe multiplayercontrole.

Herhalen: `NODE_PATH=/tmp/leraarbob-os-deps/node_modules BAR_GESTURES_PROOF=/tmp/os-bar-gestures node tests/os-bar-gestures-browser.cjs`. De nieuwe test staat ook in de catalogusworkflow. De overige tests zijn de gelijknamige bestanden onder `tests/`.
