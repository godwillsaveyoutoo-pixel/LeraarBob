# Algebra-leerroute — oplevering

Uitgewerkt op `codex/algebra-leerroute-20261002`. De bestaande lokale
wijzigingen zijn als uitgangspunt behouden. Het resultaat is vóór committen
getoond en daarna op verzoek gecommit. Er is niet gepusht of gepubliceerd.
Rechtenwereld is uitsluitend gelezen als referentie en valt buiten deze commit.

## Definitieve route

| Gebied | Haltes |
| --- | --- |
| Inverse bewerkingen | Optelling wegwerken → aftrekking wegwerken → factor wegwerken → deling wegwerken |
| Twee stappen plannen | Eerst de losse term → een aftrekking ongedaan maken |
| Tekens begrijpen | Een negatieve x-term |
| Haakjes en groepen | Volledige groep delen → uitwerken met minteken → factor binnen de groep → binnen en buiten de groep |
| Breuken en delingsstructuur | Alleen x in de breuk → breuk en aftrekking → volledige teller delen |
| x aan beide leden | Losse term rechts → losse term links → routes vergelijken |
| Stelsels | Grafisch → substitutie → combinatie; daarnaast één → geen → oneindig veel oplossingen |

Alle 17 vergelijkinghaltes zijn speelbaar, met vijf opdrachten en echte
opslag en afronding. De drie bestaande bewerkingenwerelden blijven
bereikbaar. Details per vaardigheid en opslagveld staan in de
[trainerdocumentatie](../../games/algebra-trainer/README.md).

## Gameplay en ontwerp

De referentiehalte B1 combineert oplossen, routes kiezen, de regel na −6
produceren, zelfstandig oplossen en een vergelijking bouwen. De andere
haltes gebruiken hetzelfde ritme met passende herstel-, distributie- en
invulopdrachten. Gehele getallen komen eerst; tekens, breuken en een
kommagetal volgen op inhoudelijk gekozen plekken.

De oorspronkelijke vergelijking en de huidige regel staan centraal. Een
vaste werkruimte groeit niet mee met de uitwerking. **Stappen** opent een
apart scherm met paginering. Waardenlijsten hebben paginering en hulp neemt
toe op verzoek. Tijdens zelfstandig oplossen wordt de volgende bewerking
niet gerangschikt of ingevuld.

Wiskundige geldigheid en strategie blijven gescheiden. Delen als eerste stap
kan geldig zijn en breuken opleveren. Alleen een routevraag met het expliciete
doel breuken te vermijden beoordeelt die keuze als minder passend.
Equivalentiecontrole gebruikt exacte rationaal-lineaire coëfficiënten,
geen numerieke steekproef. Foutfeedback benoemt de oorzaak en blijft
herstelbaar; undo bewaart de rest van het werk.

Het eindscherm toont zelfstandig en ondersteund werk. Alle vijf opdrachten
moeten zijn afgerond voor een nieuwe missieregistratie. Een oude registratie
van geoefend wordt niet als beheersing aangeduid. Bestaande XP worden behouden;
een herhaalde halte geeft geen dubbele XP.

Stelsels behouden het volledige oorspronkelijke systeem en beide actuele
vergelijkingen. De geselecteerde regel is zichtbaar gemarkeerd. Bediening
verschijnt per bewerkingsfase. De combinatie-tussenberekening blijft in het
stapoverzicht en in het oefenblad beschikbaar. Grafieken hebben gelijke
x/y-schaal, expliciete I/II-labels, bereikbare exacte coördinateninvoer en
stap terug voor geplaatste punten. Een methodehalte vraagt ook een uitgevoerde
stap van die methode; een correct eindpaar zonder die stap blijft wiskundig
correct, maar rondt de methodeopdracht nog niet af.

## Aangepaste bestanden ten opzichte van de lokale beginsituatie

- `games/algebra-trainer/index.html`, `trainer.js`, `README.md`: leerlingenflow,
  missies, eindscherm, gepagineerde uitwerking en behoud van vrije reeksen.
- `games/algebra-trainer/world-core.js`, `world-view.js`: zes leergebieden,
  stelselroutes, leerdoelen, status, hervatten en bewijsregistraties.
- Nieuw: `games/algebra-trainer/learning-core.js`, `learning.css`: missieinhoud,
  exacte antwoordcontrole, feedback en vaste schermzones.
- `games/algebra-trainer/stelsels.html`, `stelsels/app.js` en nieuw
  `stelsels/workspace.css`: fasebediening, werkbord, grafiekpunten,
  stelselmissies, eindscherm en volledige uitwerking.
- `js/catalog-progress.js`, `games.json`, `js/catalog.js`: de catalogus en
  voortgangslezer tonen de huidige route en tellen alleen volledige nieuwe
  missies als afgeronde haltes. Bestaande XP blijven behouden.
- Tests: nieuwe `algebra-learning.test.cjs`, `algebra-learning-browser.cjs`,
  `stelsels-layout-browser.cjs`; aangepaste `algebra-world-browser.cjs`,
  `stelsels-workshop-browser.cjs`, `catalog-progress.test.cjs`.
- Dit verslag, beide JSON-browserrapporten en gegenereerde screenshots.

De commit bevat ook de reeds lokaal aanwezige werkbordbestanden
(`workbench-core.js`, `workbench.css`, `world.css`), de daarbij horende
algebra-regressietests en de routekoppeling in `games/bewerkingen-trainer/`
(`app.js`, `index.html`, `style.css`). Deze vormen de basis waarop de
herwerking voortbouwt; de bewerkingen-rekenkern is ongewijzigd.

## Gebruikte referenties

Alle drie documenten zijn gevonden en gebruikt, in versies zonder de
nummersuffixen uit de opdracht:

- `/home/johan/Downloads/MOBILE_LAYOUT_CONTRACT.md` — Canvas First v0.4.
- `/home/johan/Documenten/Math/Axioma/Axioma_Minigame_Research_Preproduction_Report.docx`.
- `/home/johan/Documenten/Math/Axioma/AXIOMA_GAME_DESIGN_EXPLORATION_REPORT_v1.docx`.

Het mobiele contract bepaalt de viewport en directe zones. De rapporten
onderbouwen productie vóór feedback, keuze tussen geldige routes en het
onderscheid tussen afronding en bewijs van begrip. De concrete opdracht
gaat voor eventuele afwijkende portfoliokeuzes in die rapporten.

## Tests en screenshots

De hoofdformaten zijn 640×360, 780×360 en 1366×768 CSS-pixels, in beide
standen van de gedeelde balk. De vrije trainer en wereld-/opslagtest
controleren daarnaast compacte staande schermen.

De browsercontrole controleert per actieve toestand de buitenste viewport én
alle scrollbare deelvakken, wiskundevakken, interactieve doelen, bedekking en
onderlinge overlap. Tussenstappen, paginering, hints, fouten, afronding,
hervatten en herladen worden echt aangeklikt. De assencontrole verifieert
dezelfde grafische schaal op x en y. Exacte antwoorden, alternatieve routes,
alle stelselmethodes, geen/oneindig veel oplossingen en een volledige
stelselmissie zijn inbegrepen. De opslagtest gebruikt twee fictieve accounts,
offline writes en terugkeer naar een geparkeerde vrije reeks.

Alle eindcontroles zijn geslaagd:

- **507** layout- en flowcontroles voor vergelijkingen; alle 17 haltes
  volledig uitgespeeld. Zie [browserrapport](browser-report.json).
- **753** stelselcontroles, inclusief alle drie methodes, volledige missies,
  bijzondere oplossingen, tussenberekeningen en PDF-download. Zie
  [stelselrapport](stelsels-browser-report.json).
- De afsluitende aanraakcontrole slaagt voor punten plaatsen, undo,
  de donkere grafiek en het bewaren van de weergave bij herladen.
- Alle **8 testbestanden** van de gerichte unitregressie slagen. De aparte
  browserregressies voor de vrije trainer en wereld/opslag slagen ook.
- `node scripts/build-catalog.cjs --check` en `git diff --check` slagen.

Testuitvoer: [unitregressie](unit-testresultaat.txt),
[vergelijkingen](vergelijkingen-testresultaat.txt),
[stelsels](stelsels-testresultaat.txt),
[wereld en opslag](wereld-opslag.txt),
[vrij werkbord](vrij-werkbord.txt) en [aanraakcontrole](aanraak-testresultaat.txt).

| Scherm | 640×360 | 780×360 |
| --- | --- | --- |
| Referentiehalte | [open](screenshots/reference-start-640-false.png) · [ingeklapt](screenshots/reference-start-640-true.png) | [open](screenshots/reference-start-780-false.png) · [ingeklapt](screenshots/reference-start-780-true.png) |
| Fout herstellen | [voorspelling](screenshots/prediction-error-640-false.png) | [voorspelling](screenshots/prediction-error-780-false.png) |
| Missie-einde | [zelfstandig / hulp](screenshots/summary-640-false.png) | [zelfstandig / hulp](screenshots/summary-780-false.png) |
| Substitutie | [werkbord](screenshots/substitution-640-false.png) | [werkbord](screenshots/substitution-780-false.png) |
| Grafisch | [rechten](screenshots/graphic-640-false.png) | [rechten](screenshots/graphic-780-false.png) |
| Combinatie | [tussenberekening](screenshots/combination-640.png) | [tussenberekening](screenshots/combination-780.png) |

Aanvullend: [donkere grafiek op 640×360](screenshots/dark-graph-640.png) en
[gegenereerd stelseloefenblad](screenshots/stelsels-voorbeeld.pdf).

De gegenereerde screenshots staan lokaal in de bestaande uitgesloten
screenshots-map. Ze zijn beschikbaar voor beoordeling en worden door de
browsertests opnieuw opgebouwd.

## Resterende grenzen

- Schermformaten en aanraking zijn in Chromium gecontroleerd; er is geen
  fysieke Samsung A20 of echte mobiele schermkeyboard getest.
- Cloudtransport is nagebootst met fictieve accounts. Er zijn geen echte
  leerlingrecords of productie-instellingen gewijzigd.
- Het afrondingsbewijs toont taakuitkomsten en hulp. Duurzame beheersing wordt
  niet geclaimd; daarvoor zijn herhaling en toetsing met leerlingen nodig.
- De leerroute, vrije bouwer en papierweergave mogen als pagina scrollen.
  Tijdens actief oefenen, hulp, foutfeedback en uitwerkingsnavigatie is
  scrollen niet nodig.
