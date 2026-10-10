# Centrale oefenbladen · 10 oktober 2026

Vervolg op `1e38d4f`, branch `codex/os-personal-pilot-20261010`, PR #13. Stelsels verwees voor een oefenblad naar het spelmenu. Alle negen bestaande onderwerpingangen verwijzen nu naar één zelfstandige papierwerkruimte; een spel openen is niet meer nodig.

## Gedrag en bronbestanden

| Bestanden | Verandering |
| --- | --- |
| `oefenbladen/maken.html`, `.js`, `.css` | Centrale onderwerpkeuze, leerstof/instellingen, Genereer & bewaar, voorbeeld, sleutel, print, vijf recente reeksen en link naar de volledige onderwerpmap |
| `oefenbladen/providers.js` | Papieradapters voor vier Rechten-onderwerpen, Vergelijkingen, Stelsels en drie Getallen-onderwerpen; laden bestaande reken-/uitwerkingsmodules, geen gamecontroller of voortgangsprovider |
| `oefenbladen/paper.css` | Getallen krijgt vier opgaven of drie uitwerkingen per pagina, met schrijfruimte en leesbare A4-opmaak |
| `games.json`, `js/catalog.js` | Alle papieringangen wijzen naar de centrale werkruimte, met behoud van bestaande bron- en onderwerp-ID’s |
| `shared/worksheet-entry.js`, Algebra- en Bewerkingen-trainers, oude Rechten-papierpagina | Oude adressen omleiden; papierkaarten en interne papierknoppen uit de spelbediening; oude gamevelden/DOM blijven beschikbaar voor compatibiliteit met opgeslagen werk |
| `os/desktop.js`, `os/index.html`, `os/worksheet.html` | Centraal papier in eigen behouden venster, correcte onderwerpmap bij terugkeer, één bovenbalk, oorspronkelijke oefening blijft leven, actuele catalogus-/opslagversie |
| `shared/worksheet-library.js` | Bestaande accountopslag behouden; beperkte toelating voor centrale afdruk-CSS en veilige gehele `ol start`-waarden, zodat genummerde opgaven en sleutels doorlopen |
| Previewserver en tests | Publieke map aanbieden, echte centrale interacties, aangepaste regressies en CI |

## Werkelijk uitgevoerd

Chromium/Brave, 100% zoom (`deviceScaleFactor: 1`), gescheiden fictieve accounts. Extern verkeer wordt in de tests geblokkeerd.

| Rapport | Controle |
| --- | --- |
| [Centrale werkruimte](maker.json) | 8 groepen / 39 doelmetingen: 1366 × 768, 390 × 844, 640 × 360, beide balkstanden/herstel; alle 13 Algebra-onderdelen; native Stelsels-oplossingssoort nagerekend; oorspronkelijke Vergelijkingen-uitwerkingen; geen gewijzigde voortgangsopslag; onderwerpwissel, map, hervatten, oude adressen en accountwisseling midden in generatie |
| [Archief en afdrukken](worksheets.json) | 22 groepen / 47 metingen / 9 echte reeksen: exacte opgaven en sleutel, automatisch bewaren, herladen, terugkeer, accountisolatie, export/import, zichtbare opslagfout; Getallen-nummering na archiveren; negen daadwerkelijke A4-PDF’s |
| [Algebrawereld](regressions/algebra.json) | 18 groepen / 234 metingen: echte tussenstappen, hulp/historie, zes antwoorden met 30 native XP, onafgemaakte Stelsels-invoer blijft intact bij centrale papiergeneratie; rollen, klasroutes, beide balkstanden en herladen |
| [Rechten-ingangen](regressions/rechten.json) | 7 groepen / 33 doelen: werkvormen, oorspronkelijke iframe/focus, Hellingrug naar centrale generator en bewaarde onderwerpmap |
| [Wetenschappelijke notatie](regressions/scientific.json) | 67 groepen / 190 metingen: oorspronkelijke oefeningen, drie niveaus, centrale papierroute, echte code/selectie/start met lokaal sessietransport, historische generatie intact |
| [Volledige Getallenwereld](regressions/getallen.json) | 146 groepen / 1076 metingen: machten, wortels, wetenschappelijke notatie, werkelijke antwoorden en voortgang, beide balkstanden, centrale papieringang, duo-/klaslobby’s en rollen |
| [Desktop en opslag](regressions/desktop-storage-units.txt) | 48 unitcontroles |
| [Getallen-integratie](regressions/getallen-dom-units.txt) | 64 controles, inclusief alle negentien zesvragenroutes en specifieke oefening-/papierlinks |
| [Algebra-rekenkernen en opslag](regressions/algebra-engine-units.txt) | 37 controles |
| [Nummering en opslag](regressions/storage-numbering-units.txt) | 16 controles, inclusief behouden paginanummering en geweigerde ongeldige `start`-waarden |

De [bronhashes](source-hashes.json) leggen deze versie vast. Catalogusgeneratie, pakketcontrole en `git diff --check` slagen. De rekenkernen en uitwerkingsmodules zijn niet gewijzigd. De oorspronkelijke gebruikerswerkmap blijft ongemoeid. De negen PDF’s zijn op alle **65 pagina’s** gerenderd en via contactvellen visueel gecontroleerd; de Getallen-nummering loopt door op volgende pagina’s en in de sleutel.

## Bekijken en herhalen

- [Stelsels samenstellen, laptop](systems-setup-1366-false.png), [ingeklapt](systems-setup-1366-true.png), [telefoon](systems-setup-390-false.png), [compact liggend](systems-setup-640-false.png)
- [Stelsels met gemaakte reeks](systems-generated-1366.png)
- [PDF-paginaoverzicht](pdf-pages.json) en contactvellen in `pdf-review/`
- [Daadwerkelijk gemaakt Stelsels-PDF](pdf/algebra-trainer-systems.pdf), [Vergelijkingen-PDF](pdf/algebra-trainer-equations.pdf); de andere zeven staan in dezelfde PDF-map.

Nieuwe preview: `http://127.0.0.1:8794/os/?previewUser=alex&place=worksheets&worksheetTheme=algebra&worksheetTopic=systems`. Kies **Oefenblad maken**. Met `previewUser=teacher` kun je de leraarweergave openen. De eerdere server blijft draaien zodat bestaande demosessies behouden blijven.

```sh
NODE_PATH=/tmp/leraarbob-os-deps/node_modules PERSONAL_PREVIEW_PORT=8794 node scripts/serve-personal-os-preview.cjs
node tests/central-worksheet-browser.cjs
node tests/desktop-worksheets-browser.cjs
node tests/algebra-os-browser.cjs
```

De tests verwachten `playwright`, `jsdom`, `fake-indexeddb` en `@electric-sql/pglite` via `NODE_PATH`; `LB_CHROMIUM` kan de browser kiezen. `CENTRAL_PAPER_SCREENSHOTS`, `WORKSHEETS_SCREENSHOTS` en `ALGEBRA_OS_SCREENSHOTS` bepalen de uitvoermappen.

## Grenzen

Dit is een ontwikkelpreview, geen productie-uitrol. Productieauthenticatie en externe realtime zijn niet getest. Reeksen blijven per account op dit toestel; cloudsync is niet toegevoegd. Eerder bewaarde reeksen blijven exact beschikbaar. Er is geen omzetting van oefeningen naar nieuwe voortgangsidentiteiten of XP.

Nieuwe centrale reeksen zijn zelfstandige documenten. Ze nemen niet ongemerkt de willekeurige vragen van een lopend spel over. De bestaande oefening, invoer en sessie blijven afzonderlijk behouden. Afdrukken / PDF gebruikt de browserafdrukfunctie; bij opslagproblemen blijft het voorbeeld afdrukbaar.
