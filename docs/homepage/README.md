# Vernieuwde startpagina

Open `index.html` via de lokale website. De startpagina gebruikt brede, onomlijste spelbanen met rechte hoeken op desktop en gestapelde spelpresentaties op smartphone, met de gekozen rustige rechthoekige knopstijl. Voortgang, Reserve, knoppen, invoervelden en account- en navigatiemenu’s hebben eveneens rechte hoeken. De startpagina stelt hiervoor eigen radiusvariabelen in op de gedeelde bovenbalk; de spelthema’s behouden hun eigen vormgeving. Navigatie, account, instellingen en inklappen blijven onderdeel van de gedeelde leraarBob-bovenbalk.

## Collectie

De vier aanbevolen spellen zijn Rechtenwereld (Rechten), Wortelbouw Pro v0.5.0 (Pythagoras & wortels), Vectormissie v0.4 (Vectoren) en Gravity Maze (Logica & zwaartekracht). De overige veertien catalogusspellen blijven bereikbaar in de standaard ingeklapte Reserve. Onderwerpfilters en zoeken gelden voor de reserve. Vanuit het account kan de volledige collectie worden geopend.

De bestaande spel-ID’s en accountvoortgang blijven behouden. Rechtenwereld leest de bestaande `rechtenV2`-leerroute uit de centrale rij `rechten-trainer`, via `progressGameId`. De oudere trainer-XP komt apart uit `axioma_progress` en wordt niet nogmaals geteld via Rechtenwereld. Er zijn geen wijzigingen aan accountdiensten of databases.

## Centrale voortgang

`Mijn voortgang` toont aan leerlingen de som van opgeslagen XP, afgeronde onderdelen en een uitklapbare verdeling per spel. Vectormissie leest het cumulatieve `progress.xp` uit zijn bestaande opslag; sessiepunten worden niet opnieuw opgeteld. Spellen zonder XP leveren alleen hun afgeronde onderdelen. De som is geen algemeen beheersingspercentage. Bij ontbrekende servergegevens verschijnt geen onvolledige totaalscore. Gast- en leerkrachtaccounts krijgen geen leerlingtotalen. Bestaande accountwissel- en laadbeveiligingen worden hergebruikt; geen nieuwe database of schrijftoegang.

Gravity Maze gebruikt `assets/covers/modern/gravity-maze.webp` en de mobiele `gravity-maze-small.webp`: een nieuwe cover gebaseerd op de actuele robot, gewichten en portalen in de blauwgroene machinekamer.

## Later een spel vernieuwen

Bewerk `games.json`, niet `js/catalog.js`. Laat het bestaande `id` staan voor voortgangscontinuïteit. Zet `featured: true`, vul `featureOrder`, `subject`, `presentation`, `cover` en `coverSmall` in en laat `href` naar de vernieuwde versie wijzen. Voer `node scripts/build-catalog.cjs` uit. Nieuwe spellen zonder `featured: true` verschijnen automatisch in Reserve.

De huidige presentaties zijn `islands`, `garden`, `space` en `gravity`. Nieuwe presentaties kunnen met een eigen `data-world`-regel in `css/homepage.css` hun onderwerpaccent en kleuren krijgen. Zet titels en categorieën in de catalogus; bak ze niet in de illustratie. Gebruik brede beelden met een centrale herkenbare hoofdpersoon of omgeving voor goede mobiele uitsnedes. Een homepagekaart belooft geen specifieke speloriëntatie: toekomstige staande spelmodi kunnen onafhankelijk worden toegevoegd.

De gedeelde bovenbalk biedt CSS-parts voor merk, navigatie en knoppen. De startpagina gebruikt die om dezelfde component in de gekozen stijl te tonen. De extra home-secties roepen bestaande native knoppen aan.

## Controle

- `node --test tests/catalog.test.cjs tests/catalog-progress.test.cjs`
- `node scripts/build-catalog.cjs --check`
- `node tests/catalog-progress-browser.cjs` — geïsoleerde browsercontext met gesimuleerde accounts; voortgang, filters, reserve, accountwissel, late antwoorden, donkere modus, beeldladen, 44px-knoppen, toetsenbord en vijf schermformaten.
- `LB_PAGES=Startpagina node tests/platform-topbar-browser.cjs` — gedeelde navigatie, inklappen, opnieuw openen en voorkeur na herladen.

Browser CDP op 9245 en lokale server op 8775; instelbaar met `VECTOR_BROWSER_PORT` en `VECTOR_BASE_URL`. Screenshots staan in `screenshots/`. Zie `COVER-PROMPTS.md` voor de beeldprompts. De hoofdsite wordt via GitHub Pages vanuit de root van `main` gepubliceerd.
