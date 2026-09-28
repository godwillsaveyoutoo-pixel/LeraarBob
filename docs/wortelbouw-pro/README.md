# Wortelbouw Pro v0.5.0 — navigatie en bouwmaatje

Open `games/wortelbouw_pro_v0.5.0/wortelbouw/index.html`. De vernieuwde startpagina verwijst nu vanuit Wortelbouw naar deze Pro-versie; het bestaande voortgangs-ID is behouden.

Solo en battle gebruiken de gedeelde leraarBob-bovenbalk: platform, spel, onderdeel, centraal account, instellingen, menu en inklappen. Het menu verwijst naar de bestaande opgavenkeuze en battle. De warme tuinkleuren blijven behouden. De navigatie gebruikt een leraarBob-woordmerk met TRAINER-label, een groen spelbordje met wortelsymbool, een wereldknop met spruiticoon voor Konijnengrond. Konijnengrond opent de opgavenkeuze. Het oefendoel staat eenmaal tussen de pijlknoppen in de oefenbalk. De inklapvoorkeur blijft tussen opgaven en pagina’s bewaard via de gedeelde voorkeur. De bouwvelden houden rekening met de werkelijke hoogte van de balk.

Solo heeft twee zichtbare bedieningslagen: de inklapbare platformnavigatie en één 64px-oefenbalk met vorige/doel/volgende, korte instructie en onomlijste getallenas. De pijlen hebben aanraakvlakken van 44 × 44px. De dubbele doelrij en losse compacte instructiekaart zijn verwijderd. De teller met afgeronde opgaven staat bij Opgaven in het menu en in het bestaande opgavenoverzicht. De originele handlers en opslag blijven behouden.

De foutieve relatieve paden naar `shared/` zijn hersteld voor deze dieper geneste Pro-map. Solo gebruikt de bestaande accountgebonden Wortelbouw-opslag (`wortelbouw`, `axioma.wortelbouw.progress.v1`). Aanmelden opent op dezelfde pagina; een accountwisseling laat de bestaande opslagbeveiliging actief. Battle blijft een lokale wedstrijd met twee spelers; de centrale accountknop maakt daarvan geen online leerlingenbattle.

De begeleider heeft een nieuw SVG-portret met een rustige groene sjaal. De feedback staat in een afgeronde kaart met eigen kop, voldoende regelafstand en ruimte voor wortelnotatie. Het portret overlapt de tekst niet. De konijnen in het bouwveld blijven behouden.

## Controle

- `node tests/wortelbouw-pro-browser.cjs`: echte solo- en battlepagina’s, gesimuleerde accounts en opslagservice, herstel van een opgeslagen √104-constructie, bewaren onder het juiste account, inklappen zonder spelreset, opgavenmenu, centrale login op dezelfde pagina, desktop en compacte schermen.
- De bestaande `battle_geometry_smoke.js` en `chain_smoke.js` slagen.
- Afbeeldingen van de gecontroleerde schermen staan in `screenshots/`.

Geen echte leerlingaccounts gebruikt, geen databasewijzigingen en niet gepubliceerd.
