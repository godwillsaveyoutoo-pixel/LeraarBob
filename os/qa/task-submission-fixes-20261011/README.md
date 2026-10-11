# Raam afronden, unitpunten en leerling-PDF · 11 oktober 2026

Deze herstelronde volgt op het gebruikersverslag van een getekend Zonneroos-raam dat bleef hangen op **Bewaren…**. Het ontwerp was wel opgeslagen: de oude servercontrole accepteerde bij **Raam klaar** alleen `mode=design`, terwijl de leerling een patroon had getekend (`mode=restore`). De status bleef daardoor onterecht onafgerond. De eerdere browserproef testte uitsluitend een vrij ontwerp en ontdekte dit niet.

## Huidig gedrag

- Een vrij ontwerp én een getekend patroon kunnen worden bewaard en afgerond. Een onvolledig ontwerp toont het aantal bewaarde lijnen. Opslagfouten tonen **Niet bewaard · probeer opnieuw**, met een bereikbare retry. Bewaarverzoeken zijn geordend; revisies worden vóór het volgende verzoek bijgewerkt. Een verloren bevestiging kan met dezelfde gebeurteniscode opnieuw worden opgevraagd, zonder dubbele registratie. Na twintig seconden wordt een vastgelopen verzoek afgebroken.
- Kleiduifschieten toont na de laatste doelregistratie **Kleiduifreeks klaar**, bevestigt de bewaring en biedt **Verder naar mijn opdracht**. Het verlaten van een nog lopend doel geeft geen extra tijd.
- **Definitief indienen** kan ook met gedeeltelijk of volledig ontbrekend werk. De server legt op dat moment één onveranderlijk puntenoverzicht vast. Een herhaald indienverzoek geeft dezelfde inzending terug; daarna is het werk voor de leerling vergrendeld.
- Iedere verschillende geldige lijn levert één punt op. Bij een patroon controleert de server de werkelijk geplaatste punten tegen de oorspronkelijke rechten; een opgegeven `count` of `done` is geen score. Geaccepteerde punten blijven apart bewaard wanneer de undo-geschiedenis wordt ingekort. Oude tekenhistoriek wordt waar aanwezig gebruikt. Een vrij ontwerp telt geldige, verschillende lijnen die het glas doorsnijden, maximaal de oorspronkelijke twaalf lijnen. Het maximum van een patroon is het aantal rechten van dat patroon.
- Ieder juist geraakt Kleiduifdoel binnen de tijd levert één punt op. Verkeerd, te laat en onbeantwoord leveren nul op. Rechtenwereld gebruikt zijn oorspronkelijke servervalidator: één punt per juist ingediend antwoord, nul voor fout of nog niet bevestigd werk. De eerdere gewichten (bijvoorbeeld vijf punten voor tien doelen) worden bij nieuwe inzendingen niet meer toegepast.
- De leerling ziet onmiddellijk zijn score en krijgt een PDF-download. **PDF met scores downloaden** blijft beschikbaar bij de inzending. Het PDF vermeldt leerling, klas, inzendtijd, deel-/totaalscores en ieder item; lange overzichten krijgen vervolgpagina's. De leerkracht ziet dezelfde punten en kan feedback toevoegen en CSV downloaden. De nieuwe puntentelling is niet handmatig te overschrijven. Eerder definitief beoordeelde oude resultaten blijven behouden; reeds ingediende maar nog niet beoordeelde resultaten krijgen bij migratie de unitpunten.

## Uitgevoerde controles

- **12 SQL/engine/geometry-tests:** alle acht raamvoorbeelden, zes Zonneroos-rechten, duplicaten/ongeldige lijnen, gefingeerde scores, correct/te laat/verkeerd schot, gedeeltelijke vragenreeksen, nulinzending, rechten, revisies, herhalen en native vraagvalidatie. [Log](unit-tests.log).
- **8 echte browsergroepen:** maken/uitdelen; afronden terwijl autosave loopt; herladen en hervatten; native Kleiduif-eindmelding; tien native coördinatenvragen; docent nakijken/feedback/CSV; zes werkelijk aangeklikte Zonneroos-rechten; verloren opslagbevestiging en retry; gedeeltelijk indienen; automatische en herhaalde identieke PDF-download; lange PDF-opmaak. 1366 × 768 bij 100% zoom, 390 × 844 en 640 × 360, beide OS-balkstanden en bereikbare 44px-acties. Geen browserfouten of ontbrekende bronnen. [Rapport](report.json).
- **Bestaande Glasraam-browserproef:** 174 layoutcontroles op 1366 × 768, 390 × 844, 780 × 360, 640 × 360 en 320 × 568. Acht ramen, tekenen, touch/muisdrag, herstellen, undo, toetsenbord, kleur, export, inklappen, herladen en draaien blijven werken. [Log](glass-browser.log).
- **PDF:** volledige en gedeeltelijke inzending (elk één A4), plus een synthetische stresstest van vier A4-pagina's met lange titel/feedback, diakritische tekens en wiskundesymbolen. Alle zes pagina's via Poppler gerenderd en visueel gecontroleerd: geen afgesneden tekst of overlap; woorden worden netjes afgebroken op spaties. Dit gebruikt de bestaande lokale raster-PDF-schrijver; scores blijven ook als gewone toegankelijke HTML zichtbaar. [PDF-controle](pdf-review.json).
- Catalogus-/offlinecontrole, pakketcontrole (74 controls / 21 dependencies), JavaScript-syntax en `git diff --check` slagen. De volledige GitHub-workflow van deze herstelcommit moet apart worden afgelezen in PR #15; de groene controles op `cef2622` bewijzen uitsluitend de eerdere versie.

## Bekijken en grenzen

Lokale preview: <http://127.0.0.1:8796/os/?previewUser=alex>, via **Start → Mijn taken → Opdrachten en toetsen**. Leerkracht: `previewUser=teacher`. Het eerder opgeslagen raam met zes rechten en de twintig overige antwoorden zijn overgenomen. Via de echte knop **Raam klaar** is dit raam nu succesvol afgerond; de toets is niet definitief ingediend. [Continuïteitscontrole](preview-continuity.json); de oorspronkelijke preview op poort 8795 is behouden. De lokale preview gebruikt fictieve accounts en bewaart periodiek een herstelkopie in `/tmp`.

Dit is geen productie-uitrol. Voor echte accounts zijn de nog niet uitgerolde taak-/Kleiduifmigraties, de nieuwe herstelmigratie en Edge-functie `task-activity` nodig. Externe toestellen en productieaanmelding blijven open. De native browserdoorloop test de coördinatenvragen; niet elk van de vijftien vraagtypes is in deze samengestelde toets opnieuw visueel doorlopen. Offline afname zonder opslagverbinding is niet toegevoegd.

## Bestanden

- `tasks/tasks.js`, `.css`, `index.html`, `clay-bridge.js`, nieuw `result-pdf.js`: bewaren, eindmelding, gedeeltelijk indienen, puntenoverzicht, PDF en nakijken.
- `glasatelier/app.js`, `core.js`: duurzame puntenbewijzen, compatibel herstel en undo.
- `20261011135715_os_task_unit_scores_and_partial_submission.sql`: gevalideerde lijnpunten, onvolledig indienen, onveranderlijk resultaat, retry en rolbescherming. Eerdere migraties zijn ongewijzigd.
- Taaktests, fixturehelper, CI-syntaxcontrole en `os/PILOT.md`: bijgewerkte afwerkcontrole. Bronhashes staan in [source-hashes.json](source-hashes.json).
