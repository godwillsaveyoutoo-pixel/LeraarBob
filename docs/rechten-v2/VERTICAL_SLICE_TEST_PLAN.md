# Vertical-slice testplan en evaluatiegrenzen

Scope: deze ronde bouwt drie geïsoleerde authored mechanics, een shell en afzonderlijk klikbaar prototype. Tests moeten zowel de nieuwe contracten als het onaangetaste v1-gedrag toetsen. Deze specificatie is een plan; uitgevoerde resultaten worden apart gerapporteerd.

## Fasegates

| Fase | Artefact | Gate vóór de volgende fase |
| --- | --- | --- |
| 1 Audit | CURRENT_STATE_AUDIT, REDESIGN_AUDIT | 27 ID's, entrypoints, opslag en bronconflicten vastgelegd |
| 2 Contract | mechanicsmatrix, misconceptions, componenten, content/evidence/migratie | Semantische antwoorden, exacte validators, no-clue-leakage en supportstatus gespecificeerd |
| 3 Low fidelity | `/games/rechten/trainer-v2/prototype.html` | Grensconstructie en delta/breuk los van wereld bruikbaar; tap/keyboard doorloop |
| 4 Mechanics | Unit/propertytests, eenvoudig controleprotocol | Wiskunde, transfer en bewaren correct vóór artproductie |
| 5 Drie slices/shell | `/games/rechten/trainer-v2/` | Playable en herlaadbaar zonder v1 te schrijven |
| 6 Beoordeling | Browser-/regressieresultaten, screenshots, risicolog | Geen productie-uitbreiding vóór echte usability/transferbeoordeling |

Automatische checks bewijzen softwaregedrag. Een agentdoorloop vervangt geen think-aloud met leerlingen. Geen gefingeerde gebruikersresultaten of effectmaten.

## Slice A — Grenspas

Route: `?slice=grenspas`. Gevraagde claim: nulwaarde als x-input en de oplossing van `f(x)>0` / `f(x)<0` als x-verzameling.

| Test | Verwachting |
| --- | --- |
| Start stijgende functie | Grafiek neutraal; geen rootlabel, plus/min, antwoordkleur of probes vóór commit |
| Nulwaarde | Grenspin op x-as is een input; `f(x)=0` is de uitvoervoorwaarde, niet antwoord x=0 |
| Intervalconstructie | Links/rechts met open grens bij strikt >/<; notatie correspondeert semantisch |
| Verkeerde zijde | Postcommit probes links/rechts koppelen y-positie aan gekozen x-regio; correct gekozen root blijft |
| Grens ten onrechte inbegrepen | Eigen code/feedback; geen verwarring met ontbrekend punt op grafiek |
| Contrasterend geval | Dalende lijn keert positieve zijde om; negatieve vraag verandert doel; geen antwoordherkenning uit standaardlayout |
| Horizontaal randgeval | Exacte kern onderscheidt geheel ℝ, leeg en identiek nul; zo nodig expliciet buiten de eerste authored UIvariant maar wel als wiskundetest |
| Ondersteuning en hervatten | Hints blijven in dezelfde taak; bewaarde grens, zijde, notatie, feedback en hintniveau na reload gelijk |
| Bewijs | Contrast/hidden-resultaat afzonderlijk; geen productie-masterystatus door slicecompletion |

## Slice B — Hellingrug

Route: `?slice=hellingrug`. Claim: consistent gerichte verschillen vormen één rate, niet twee losse telgetallen.

| Test | Verwachting |
| --- | --- |
| A→B en B→A | Beide routes geven dezelfde exacte helling wanneer Δx en Δy dezelfde richting volgen |
| Gemengde aftrekvolgorde | Eigen diagnose; correct deel blijft bewaard; repair verandert alleen foutieve component |
| Breukconstructie | Δy boven Δx; verticale weergave met toegankelijke naam; equivalente breuken geaccepteerd |
| Negatieve/gehele/fractionele case | Exacte rationele kern; geen IEEE-afronding voor correctheid |
| Δx=0 en gelijke punten | Niet delen door nul; verticaal/identiek onderscheiden waar ondersteund; generator deelt gevallen expliciet in |
| Lijnreactie | Pas na commit uitgevoerd; gecommitte verhouding blijft zichtbaar naast resultaat |
| Derde punt | Verborgen nieuw x buiten zichtbare invoervoorbeelden, geen bestaande y kopiëren |
| Repair/hulp/reload | Gekozen richting en goede Δ blijven; score/evidence eenmaal; hulpstatus kleurt claim correct |
| Inputequivalentie | Tap/stepper en keyboard leveren identieke semantische payload; drag is optioneel |

## Slice C — Signaalstad

Route: `?slice=signaalstad`. Claim: onderscheid tussen helling en y-afsnede, inconsistente representatie lokaliseren en gericht herstellen.

| Test | Verwachting |
| --- | --- |
| Start | Correcte formule y=2x+8 en tabel; grafiek representeert y=8x+2; maximaal twee gepinde views |
| Informatie kiezen | x=0-probe en verschilprobe zijn inhoudelijk verschillende routes; voorspelling vóór uitkomst |
| Diagnose | Leerling lokaliseert verwisselde parameters bij grafiek; foute keuze geeft specifieke vergelijking |
| Repair | Eén **semantische parameterwissel** herstelt a én b. Eén losse coëfficiëntcorrectie is onvoldoende en mag hidden test niet halen |
| Hidden cross-check | x=10 geeft 28; foutieve lijn geeft 82. Alleen b herstellen geeft 88 en faalt |
| Behouden deelwerk | Formule/tabel blijven correct; repair herschrijft ze niet |
| Geen blind tuning | Geen live groen tijdens aanpassen; commits/revisies worden onderscheiden |
| Hulp/veldboek | Voltooiing met steun zichtbaar als met steun; geen zelfstandige production mastery |

## Regressie, opslag en accountveiligheid

V1 blijft eigenaar van bestaande skillsterkte, planner, review, XP, journey en gespecialiseerde `axioma_progress`. De proef gebruikt de bestaande gedeelde `AxiomaAuth` en `AxiomaProgress`, met een apart `rechtenV2`-presentatieveld via het generieke game-progresspad van `rechten-trainer`. Geen nieuwe SQL, tweede authstack of export van echte leerlingen.

Test uitsluitend synthetische fixtures:

- Lees v1-state inclusief onbekende velden en verifieer dat openen, spelen, reload en terugkeer geen byte wijzigen.
- Migration schema/version check, timestampbackup, opnieuw migreren idempotent, corrupte/nieuwere schema's niet stil overschrijven.
- Bewaar missie, task-ID/seed, phase, views, prediction, constructie, hints, feedback, scored/evidence flags bij betekenisvolle handeling.
- Reload midden in een fout, na hulp en na completion geeft exact dezelfde toestand; herhaald commit of dubbele tab verdubbelt geen evidence.
- Account A→B verwijdert A's state direct; vertraagd load/save van A mag B niet beïnvloeden. Gast en leerling delen geen cachekey.
- Offline lezen met eigen cache blijft mogelijk; ontbreken daarvan leidt niet tot leeg cloudoverschrijven.
- Revisieconflict bewaart beide versies, blokkeert blind overschrijven en vereist expliciete keuze via bestaande infrastructuur. Geen last-write-wins invoeren.
- v1 blijft openen met oorspronkelijke leerlingvoortgang, repair/refresh en actieve sessie.

Bestaande testfiles niet afzwakken of aanpassen om een redesign te laten slagen. Voor bestaande failures: baseline vastleggen met exact commando en oorzaak; nieuwe failures onderscheiden.

## Automatisering en toetsorakels

Unit/property: duizenden deterministische gevallen voor rationale helling, nullen en tekens; onafhankelijke algebraïsche berekening als oracle. Geen test die alleen dezelfde implementatiefunctie met zichzelf vergelijkt. Controleer equivalente vormen, tegenvoorbeelden, beide deltaoriëntaties, boundaries, NaN/overflow, schema, misconceptioncodes, state-idempotentie en hidden cases. Kleine authored bank heeft een expliciete dekkingslijst; noem dat geen volledige generatorcoverage voor 27 nieuwe mechanics.

Browser: echte inputacties plus semantische snapshot; keyboard en touch; alle viewports uit [ACCESSIBILITY_AND_DEVICE_TEST_PLAN.md](ACCESSIBILITY_AND_DEVICE_TEST_PLAN.md); primaire targets, één hoofdactie, menu/Escape, reduced motion, gameplaygate, feedback, reload en screenshots. Opslagtests mogen transport mocken maar moeten owner/revision/conflictcontracten werkelijk testen.

## Eenvoudige controle en eerste klasproef

Controleconditie: dezelfde grafiek of tabel, dezelfde wiskundige gegevens en hulp, sobere antwoordinvoer/knoppen; geen wereld, probeverhaal of simulatie. Bij Grenspas vergelijkt de oude meerkeuze ook herkenning met constructie; rapporteer dit als gecombineerd mechanicverschil, niet als zuiver arteffect. Bij Hellingrug dezelfde breuk- en delta-opgave zonder railverhaal; bij Signaalstad tabel/formule/grafiek met eenvoudige diagnose-/repairinvoer. Gebruik vergelijkbare tijd, afwisselende volgorde en equivalent maar niet identiek transfermateriaal.

Voorgestelde eerste ronde: 6–8 leerlingen voor usability, verdeeld over voorkennis en inputvoorkeur; daarna pas een grotere, vooraf gespecificeerde onderwijsvergelijking. Vrijwillig pseudoniem log, geen echte accountdata in repo. Think-aloud vraagt 'wat verwacht je?' en 'waarom past dit?' in plaats van 'vind je het mooi?'. Registreer first-action success, accidental taps, facilitatorhulp, semantisch relevante revisies, blind runs, hintniveau, hidden-resultaat, nieuwe representatietransfer en herhaalwil. Tijd is context, geen kennismaat.

Producthypothesen voor de eerste proef: ≥85% kernhandeling zonder facilitator, <10% onbedoelde acties en een meerderheid die de relevante relatie kan aanwijzen. Kleine steekproeven geven brede onzekerheid; rapporteer aantallen en intervallen, geen schijnprecisie. Geen productiemigratie wanneer eenvoudigere controle vergelijkbare transfer/evidence met aanzienlijk minder complexiteit levert. Herontwerp wanneer >30% succesvolle spelers blind probeert, vier panelen nodig worden, art het antwoord verklapt, of opslagbetrouwbaarheid afneemt.
