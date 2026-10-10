# OS als standaard startpagina · 10 oktober 2026

`tests/home-entry-browser.cjs` is uitgevoerd in Chromium 156 met echte browsernavigatie en een lokale gastauthfixture, onder het GitHub Pages-pad `/LeraarBob/`. Resultaat: exit 0, 16 controles, 5 screenshots, geen JavaScriptfouten of ontbrekende frontendbestanden.

Gewone `/` en `/index.html` openen `/os/`; de oude catalogus blijft bereikbaar via `index.html?view=catalog` en Instellingen. Home/Back zonder redirectlus, oude sectiebladwijzers, native app-Home, beide balkstanden op 1366×768 en 390×844, herladen/herstellen en de JavaScriptloze fallback zijn bediend. Bestaande account-ingangen en callbackparameters blijven ongewijzigd op de oorspronkelijke root; dit is geen productieauthenticatieproef.

Daarnaast slagen 27 gerichte bestaande DOM/catalogus/routecontroles, catalogusgeneratie, desktop-package-check en syntax/diffcontrole. De gedeelde accountopslag, authcode, providers en spelvoortgang zijn niet gewijzigd.
