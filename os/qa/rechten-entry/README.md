# Rechtenwereld interfacecontrole

De ontwikkelversie is getest met echte browserinteracties op 1366 × 768 en 390 × 844 bij 100% zoom. De bovenbalk is in beide standen gecontroleerd. Antwoord- en startacties blijven bereikbaar; de herstelknop is minimaal 44 × 44 pixels.

## Resultaten

- [Nieuwe browsertest](results.json): Learn-uitnodiging blijft in het OS, terugkeer naar de eigen map en hervatten, een gezamenlijk nagekeken antwoord via native keuzes, bewaren en focusherstel, klas aanmaken en aansluiten, zelfstandige pagina’s en voorkeur na herladen. De test meet 64 start- en wachtkamerbedieningsdoelen, plus de herstel- en antwoordknoppen.
- [Bestaande klasflowregressie](class-flow-regression.json): 32 controles en 78 bedieningsmetingen voor Getallenwereld en Rechtenwereld, inclusief simulaties, echte lokale sessies, herladen en XP.
- [Bestaande tests](unit-tests.txt): zeven testbestanden geslaagd.
- Beide browsertests: nul JavaScriptfouten en nul ontbrekende bestanden.

## Schermen

| Scherm | Desktop | Telefoon |
| --- | --- | --- |
| Samen leren instellen | [Uitgeklapt](learn-setup-1366-expanded.png) · [Ingeklapt](learn-setup-1366-collapsed.png) · [Donker](learn-setup-1366-dark.png) | [Uitgeklapt](learn-setup-390-expanded.png) · [Ingeklapt](learn-setup-390-collapsed.png) |
| Learn wachtkamer | [Uitgeklapt](learn-lobby-1366-expanded.png) · [Ingeklapt](learn-lobby-1366-collapsed.png) | [Uitgeklapt](learn-lobby-390-expanded.png) · [Ingeklapt](learn-lobby-390-collapsed.png) |
| Native Learn-opgave | [Uitgeklapt](learn-question-1366-expanded.png) · [Ingeklapt](learn-question-1366-collapsed.png) | [Uitgeklapt](learn-question-390-expanded.png) · [Ingeklapt](learn-question-390-collapsed.png) |
| Klasbattle instellen | [Uitgeklapt](class-setup-1366-expanded.png) · [Ingeklapt](class-setup-1366-collapsed.png) | [Uitgeklapt](class-setup-390-expanded.png) · [Ingeklapt](class-setup-390-collapsed.png) |
| Klas wachtkamer leerkracht | [Uitgeklapt](class-lobby-1366-expanded.png) · [Ingeklapt](class-lobby-1366-collapsed.png) | [Uitgeklapt](class-lobby-390-expanded.png) · [Ingeklapt](class-lobby-390-collapsed.png) |
| Klas wachtkamer leerling | [Uitgeklapt](class-pupil-lobby-1366-expanded.png) · [Ingeklapt](class-pupil-lobby-1366-collapsed.png) | [Uitgeklapt](class-pupil-lobby-390-expanded.png) · [Ingeklapt](class-pupil-lobby-390-collapsed.png) |
| Zelfstandig openen na herladen | | [Learn](standalone-learn-390-collapsed.png) · [Klas](standalone-classroom-390-collapsed.png) |

## Reikwijdte

Fictieve leerling- en leerkrachtaccounts; productieauthenticatie en profiel-/voortgangsoverzichten zijn fixtures. Learn- en klasacties lopen door de bestaande Edge-handlers en SQL-migraties in lokale PGlite-databases. Externe netwerkverzoeken zijn geblokkeerd in de browsertests. Driepersoonsgroepen, een volledige Learn-reeks en het einde van de nieuwe klasbattle zijn in de nieuwe browsertest niet doorlopen. Er zijn geen productiegegevens veranderd.

[Gedrag, gewijzigde onderdelen en opnieuw testen](../../../docs/os-uniformiteit/RECHTEN-STARTSCHERMEN.md).
