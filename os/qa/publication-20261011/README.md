# Publieke uitrol · 11 oktober 2026

De pilot staat op **[de publieke leraarBob-site](https://godwillsaveyoutoo-pixel.github.io/LeraarBob/os/)**. Gewone bezoeken aan de startpagina openen het OS; de eerdere catalogus blijft bereikbaar via `index.html?view=catalog`.

## Gepubliceerd

[PR #15](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/pull/15) is samengevoegd als `de5febcf6af05482261e9924dd71e5d998008a33`. De bestandstree was exact gelijk aan de geteste broncommit `d5caed0acf249b31a3e880e8d256161ae9cce82c`. Beide volledige controles daarop slaagden: [branch, 17m58s](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/actions/runs/38154242167) en [PR, 16m36s](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/actions/runs/38154245016). [Pages-uitrol geslaagd](https://github.com/godwillsaveyoutoo-pixel/LeraarBob/actions/runs/38161078305).

Voor de frontend zijn zeven database-updates toegepast: het oefenbladarchief, samengestelde taken, Kleiduif-modi, deelscores/gedeeltelijk indienen, Logicawereld-klasbattle, Logicawereld-duel en persoonlijke battleverslagen. De drie nieuwe Edge Functions `task-activity`, `logica-class` en `logica-duo` zijn ACTIVE versie 1. Versies, hashes en uitgevoerde checks staan in [deployment.json](deployment.json).

## Werkelijk op productie gecontroleerd

- Elf publieke kernbestanden waren byte voor byte gelijk aan de geteste bestanden; alle gaven HTTP 200.
- Een geïsoleerde gastbrowser op 1366 × 768 bij 100% zoom opende Rechtenwereld, Getallenwereld, Vergelijkingen, oorspronkelijke Stelsels, Rechten Zeeslag, Glasraam, Pythagoras, Logicawereld, Brandweer en Kleiduifschieten. Eén platformbalk, beide balken inklappen/herstellen en minimaliseren/hervatten met dezelfde iframe en invoer slaagden voor alle tien.
- Een Stelsels-reeks is werkelijk gegenereerd, lokaal bewaard in de juiste onderwerpmap en na herladen teruggevonden. De beeldopgaven en grafieken zijn volledig geladen en visueel gecontroleerd: [screenshot](stelsels-worksheet.png), [aanvullende renderproef](paper-render.json). Dit is gastopslag; geen bewijs voor cloudsync.
- Brandweers herstelhandvatten bleven op 390 × 844 bereikbaar en minstens 44 × 44 px. In die portretstand vraagt het bestaande spel om het toestel te draaien; deze controle betreft de OS-bediening.
- Geen JavaScriptfouten of ontbrekende bestanden in de publieke browserproef. [Resultaten](public-browser.json), [herhaalscript](public-browser.cjs), [bureaublad](public-desktop.png) en [Brandweer met ingeklapte balken](brandweer-collapsed.png).
- Alle drie nieuwe serverfuncties weigeren ontbrekende en ongeldige authenticatie met HTTP 401. Workers zijn niet rechtstreeks uitvoerbaar door gasten of leerlingen; de zes nieuwe opslagtabellen hebben RLS en geen directe gast-/leerlingtoegang.
- Geen nieuwe WARN/ERROR bij de security-advisor. De zes nieuwe INFO-meldingen betreffen bewust via gecontroleerde RPC's toegankelijke tabellen met gesloten RLS. De vijf eerdere [SECURITY DEFINER-waarschuwingen](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) en de eerdere [wachtwoordbeveiligingswaarschuwing](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) zijn ongewijzigd.

## Vervolgcontrole van de test zelf

De automatische herhaling op de mergecommit vond een race in `tests/os-workforms-browser.cjs`: na deelnemen met een klascode kon de wachtvoorwaarde `NumbersSpace` aanspreken voordat het script geladen was. De wachtvoorwaarde controleert nu eerst of `window.NumbersSpace` bestaat en blijft daarna wachten op dezelfde echte lobbytoestand. Alle 20 werkvormgroepen slagen lokaal na de correctie; [resultaten](workforms-after-race-fix.json). De eis dat de leerling werkelijk in de juiste lobby zit, de controle op dezelfde klascode en de controles op leerlingbediening blijven behouden. Deze aanpassing raakt uitsluitend de test, niet de gepubliceerde app of providers.

## Nog niet bewezen met echte productieaccounts

De gebruiker opende de site als Leerkracht, maar de browserconnector gaf geen gekoppelde browsers of tabs terug. De daadwerkelijke sessie kon niet worden bediend. Een proef met twee ingelogde productieaccounts blijft open: uitnodigen, deelnemen, reconnect, cloudhervatten en eigen resultaat-PDF downloaden. Lokale testaccounts en bovenstaande gastproef gelden niet als dat bewijs.

De eerdere functionele bewijzen voor de volledige battle-/toetsflows staan in [battleverslagen](../class-battle-reports-20261011/README.md), [toetsinzendingen](../task-submission-fixes-20261011/README.md), [Logicawereld](../logica-battles-20261011/README.md) en [releasecontrole](../release-readiness-20261011/verification.json). Hun oude uitrolnotities zijn historisch; dit verslag actualiseert de publicatiestatus. Overige open punten blijven in [PILOT.md](../../PILOT.md).
