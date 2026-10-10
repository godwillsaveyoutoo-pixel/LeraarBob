# Algebrawereld in het OS · uitgevoerde controle

Deze map bevat de definitieve, geslaagde browserrun voor `codex/algebra-os-navigation-20261010`, vanaf main `a365d15413c1352f4057c97066889a337383e71b`. [report.json](report.json) legt **18 interactiegroepen, 252 doelmetingen, 39 screenshots en zestien bronhashes** vast. Er zijn nul browserexceptions en nul ontbrekende bronnen. Alleen screenshots uit deze geslaagde run zijn opgenomen.

De daadwerkelijke interface is bediend op 1366 × 768 bij 100% zoom, 390 × 844 en 640 × 360, uitgeklapt en ingeklapt. De proef controleert OS en standalone, twee werelden en alle 7 + 6 levelkeuzes, echte Vergelijkingen-bewerkingen en een zesvragenronde met 30 native XP, Stelsels-voorstel/uitvoeren/hulp/historie en onafgemaakte invoer. Oefenbladgeneratie, archivering, Start/Escape/focus, Bewaren, minimaliseren, hervatten, eigen terugkeerplek, fullscreen, weergave, herladen en accountisolatie zijn uitgevoerd. Klasbattle gebruikt het werkelijk geselecteerde level; terugkeer behoudt de oorspronkelijke moduleframe en het werk.

Voorbeelden: [desktopwereldkaart](os-werelden-1366-expanded.png), [mobiel werkbord ingeklapt](os-vergelijkingen-werkbord-390-collapsed.png), [compact landschap](os-vergelijkingen-werkbord-640-expanded.png) en [Stelsels-voorstel](os-stelsels-voorstel-1366-expanded.png). Zeer korte schermen gebruiken interne scroll in de native formule-/bewerkingspanelen. De 252 metingen zijn concrete interactieve doelen, geen 252 afzonderlijke scenario’s.

Authenticatie en voortgangstransport gebruiken gescheiden lokale fixtures; extern netwerk is geblokkeerd. De klasroutes zijn met gast, leerling en leraar bediend, maar deze nieuwe OS-run maakt geen productieklas. De afzonderlijke bestaande Algebra-klasbrowser controleert de oorspronkelijke lokale serverlogica. Volledig OS-herladen herstelt de map; heropenen via de modulekaart hervat het bestaande native opgeslagen werk. Er is geen claim dat het OS zijn geheugenframes na browserherladen reconstrueert.

| Bewijs | Uitgevoerd |
| --- | --- |
| [desktop-platform-tests.log](regressions/desktop-platform-tests.log) | 123 DOM-/platformcontroles |
| [algebra-catalog-units.log](regressions/algebra-catalog-units.log) | 76 relevante native-/catalogusunits |
| [algebra-native-flow.log](regressions/algebra-native-flow.log) | Vijf schermmaten, twee echte rondes, 60 XP en één voltooid level |
| [algebra-class-browser.log](regressions/algebra-class-browser.log) | Bestaande Algebra-klasbrowser met lokale server en fictieve accounts |
| [stelsels-browser-report.json](regressions/stelsels-browser-report.json) | 795 geslaagde Stelsels-controles |
| [pilot-browser-report.json](regressions/pilot-browser-report.json) | Vier oorspronkelijke OS-pilots: 32 groepen / 23 layouts, geen fouten of ontbrekende bronnen |
| [native-workforms-report.json](regressions/native-workforms-report.json), [native-lesson.log](regressions/native-lesson.log) | Eigen Werkvormen op drie schermmaten, echte native hulplessen |
| [protected-sources.json](protected-sources.json) | Dertien ongewijzigde auth-/voortgangs-/vraag-/leerbronbestanden |
| [verification.json](verification.json) | Samenvatting, aanvullende bronhashes en afzonderlijke rootcontrole: oorspronkelijke werkmap 1517 hashes gelijk, nul wijzigingen |

De vier-pilotrun behoudt de oorspronkelijke Rechtenwereld-draaihulp op 390 px; de desktopopgaven zijn daadwerkelijk voltooid. Echte productieaanmelding met twee accounts, cloudhervatting en externe multiplayer blijven buiten dit bewijs.

Herhalen vanuit de repository, met de gebruikelijke tijdelijke Playwright-afhankelijkheden:

```sh
NODE_PATH=/tmp/leraarbob-os-tests/node_modules ALGEBRA_OS_SCREENSHOTS=/tmp/leraarbob-algebra-qa node tests/algebra-os-browser.cjs
```

Een geïnstalleerde Brave wordt automatisch gebruikt; `LB_CHROMIUM` kan een andere browserbinary kiezen. De catalogusworkflow voert deze proef uit en bewaart zijn verse QA-artifacts.
