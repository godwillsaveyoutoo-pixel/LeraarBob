# Logicawereld OS controle

Logicawereld v0.2 is aangesloten op de actuele OS-pilot op branch `codex/logicawereld-os-20261010`, bovenop de persoonlijke OS-branch van PR 13. De preview staat op <http://127.0.0.1:8795/os/?previewUser=alex&theme=logica>. De publieke site is hiermee niet uitgerold.

## Resultaten

| Controle | Werkelijk uitgevoerd |
| --- | --- |
| Oorspronkelijk ZIP-pakket | Alle 21 meegeleverde controles geslaagd, inclusief installatie in een tijdelijke fixture. De sandbox blokkeerde aanvankelijk subprocessen; de herhaling met toegestane subprocessen slaagde. |
| Geïntegreerde logica en bestaande regressies | 87 controles geslaagd: alle 94 opdrachtvalidaties, native flowhandlers, hints, lokale duo-beoordeling, parallelle rondeopslag, catalogus, OS-DOM, accountgrenzen en oefenbladarchief. |
| Echte Logicawereld-interface | 7 browsergroepen, 166 metingen. Alle 18 haltes doorlopen; tien antwoordvormen, achtregelige tabellen, hint/fout/verbeteren, lokale duo-beoordeling en beide battles. |
| Vensters en bediening | Eén platformbalk, Start/ESC en focus, bewaren, minimaliseren/hervatten, beide balken verbergen, sluiten, herladen, accountwissel en aparte lokale resultaten. |
| Schermmaten | 1366 × 768 op 100% zoom en schaal 1; kaart tevens 780 × 360, 640 × 360 en 390 × 844. Antwoordbediening op laptop, lage liggende stand en telefoon; bovenbalk uitgeklapt en ingeklapt. Gemeten acties minstens 44 × 44 px en bereikbaar. |
| Oefenbladen Logicawereld | Alle zes gebieden maken hun volledige bank; specifieke halte vanuit de app opent rechtstreeks de centrale maker. Exacte vragen en sleutel worden bewaard en heropend in de juiste OS-map. |
| Afdruk | A4-PDF met vijftien opdrachten en aparte sleutel gegenereerd; alle zeven pagina's visueel nagekeken op leesbaarheid, tabellen en afbreking. Geen fysieke printercontrole. |
| Bestaande centrale maker | 8 browsergroepen en 39 metingen geslaagd, inclusief alle dertien Algebra-levels, opslag zonder spelvoortgang, oude routes en accountwissel tijdens generatie. |
| Bestaand persoonlijk OS | 9 browsergroepen geslaagd: appkiezer, rechterklik, uitnodigingen, lokale Learn, klasstart/deelname, ranglijsten en accountscheiding. |
| Laatste visuele controle | Donkere werkvorm-/papierknoppen leesbaar; zes mobiele gebiedslabels binnen hun knop; frame-opruiming bij accountwisseling. |
| Statisch | Catalogus gelijk aan gegenereerde kopie; 150 routes gecontroleerd; 75 OS-controls en 19 frontenddependencies; JavaScript-syntax en `git diff --check`. |

De browserrapporten bevatten geen browserfouten of ontbrekende bestanden. Accounts, uitnodigingen en sessietransports in de bestaande OS-regressies zijn lokale fixtures. Geen echte leerlingen zijn uitgenodigd. Productieauthenticatie, externe realtimeverbindingen en cloudvoortgang voor Logicawereld zijn niet getest of toegevoegd.

## Herstelde problemen

- Het pakket opende een tweede intern werkvormmenu en een eigen oefenbladscherm. OS-ingangen en oude papierlinks gebruiken nu de centrale bediening en maker.
- Eén gezamenlijke run-opslag kon verschillende werkvormen overschrijven. Account, werkvorm en halte hebben nu afzonderlijke drafts; solo-bewijs wordt samengevoegd.
- De handmatige inklapkeuze werd bij kaart/start overschreven. De gedeelde OS-voorkeur blijft leidend en herstelt na herladen.
- Lange waarheidstabellen werden verticaal gecentreerd boven hun scrollbegin. De eerste rij blijft nu bereikbaar in een laag venster.
- Het verplichte draaivenster blokkeerde telefoongebruik. De interface gebruikt nu scrollbare inhoud met behoud van de native antwoordknoppen.
- Tegenvoorbeeldvragen kregen soms de concrete hint van een andere vraag uit dezelfde halte. De hint verwijst nu naar de voorwaarde en conclusie van de actieve opgave.
- Donkere footerknoppen en lange mobiele gebiedsnamen zijn visueel gecorrigeerd.

## Bewijs en grenzen

- [Logicawereld browserrapport](report.json)
- [Bestaande oefenbladregressie](worksheet-regression.json)
- [Bestaande OS-regressie](personal-regression.json)
- [Unitresultaten](units.txt)
- [Stadskaart laptop](world-1366-false.png), [telefoon](world-390-false.png), [donker](world-dark.png)
- [Waarheidstabel in laag venster](table-L08-4-640-true.png), [Duo Learn](duo-peer.png), [centrale oefenbladen](worksheet.png), [zelfstandige bovenbalk](standalone.png)
- [Gecontroleerd afdrukvoorbeeld](worksheet-print.pdf)
- [Bronherkomst en hashes](sources.json)

Online duo, klasproviders, centrale toetsinzendingen en cloudsynchronisatie blijven vervolgwerk. De huidige lokale voortgang is een oefenstatus, geen beveiligd toetscijfer. Oefenbladen blijven in het bestaande accountgebonden archief op dit toestel.
