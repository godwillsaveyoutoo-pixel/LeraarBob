# Afwerkronde · 11 oktober 2026

De volledige lijst staat in [PILOT.md](../../PILOT.md). Deze ronde maakt geen aanspraak op een volledig afgewerkt OS. Onderstaande controles zijn uitgevoerd op een ontwikkelbranch met fictieve lokale accounts. Productieauthenticatie, externe toestellen en publieke uitrol zijn afzonderlijke open controles.

## Juiste Stelsels-app

`games/stelsels.html` is de gekozen oorspronkelijke trainer: veertien oefeningen, grafisch/substitutie/combinatie en beginner/expert. De eerder meegeteste module `games/algebra-trainer/stelsels.html` was niet deze trainer. Oude OS-snelkoppelingen naar die module gaan nu naar de oorspronkelijke Stelsels. De catalogus én OS-klasstart bieden onder Vergelijkingen geen tweede Stelsels-wereld of Stelsels-klasprovider aan. Bestaande voortgangsidentiteiten worden niet samengevoegd of gewist.

De centrale Stelsels-papiermaker staat bij Stelsels en blijft de bestaande losse generator gebruiken. Dat opent geen van de speltrainers. Reeds gemaakte reeksen behouden hun bron-ID en exacte inhoud.

[Elf browsercontroles](original-stelsels.json): Apps toevoegen → Stelsels → Solo, juiste URL en opslag-ID, het gemelde expertvoorbeeld `x − 3y = −5; 2x + y = 4`, verkeerde/juiste drop, muis, toetsenbord, aanraking, undo, breukcoëfficiënt, hervatten en werkelijke oplossing `(1, 2)`. Een eerste beloning geeft 10 XP; dezelfde oefening opnieuw belonen geeft 0. Layoutcontrole op 1366 × 768 en 640 × 360, 100% zoom, beide balkstanden. [Screenshot van de juiste trainer](original-stelsels.png), [rechtstreekse preview-ingang](original-stelsels-entry.png).

## Overige afgewerkte onderdelen in deze ronde

- Oude Rechtentrainer uit de OS-appkiezer en zoekresultaten; bestaande pins naar Rechtenwereld. De voortgangsidentiteit `rechten-trainer` blijft bestaan.
- Vergelijkingen start met zeven levels. Beginner/expert blijven bij dezelfde wiskundige engine, vragen en accountopslag. Expert gebruikt vrije bewerkingen/regel-invoer waar dat bij het vraagtype past; onder andere de breuken- en verificatieborden behouden hun eigen antwoordbediening. De keuze, onafgemaakte invoer en voltooide vraag overleven hervatten en herladen. [Vijf interactiegroepen](equations-expert.json), [desktop](equations-expert.png), [telefoon](equations-phone.png).
- Vergelijkingen heeft een grotere opgave en een begrensde antwoordkolom. [Navigatieproef](equations-navigation.json): dertien groepen, drie schermmaten, beide balkstanden, zes echte antwoorden, native 30 XP, Start/focus, bewaren, accountwissel en klasstartrollen.
- [Brandweer-bediening](brandweer.json) en de oorspronkelijke Stelsels geven 10 oefen-XP per voor het eerst beloonde voltooide eenheid. Historische levels worden niet automatisch omgerekend; herhaling geeft geen dubbele beloning. De beloning gebruikt de bestaande opslag met account- en revisiecontrole. Leraren oefenen zonder leerling-XP; Brandweer krijgt geen ranglijst. Dit is oefenvoortgang, geen beveiligd toetscijfer.
- [Vier oorspronkelijke pilots](pilots.json): 32 geslaagde interactiegroepen. De verborgen native Pythagoras-levelkiezer is via het centrale menu bereikbaar met de oorspronkelijke handler.
- Oude tests voor appaantallen, de laatste taakbalkknop en de voormalige Algebra-wereldkeuze zijn aangepast aan de werkelijke bediening.

[74 gerichte catalogus-, opslag-, account- en DOM-controles](units.txt) slagen. Deze set is gericht bewijs; de volledige CI wordt apart vastgelegd.

## Online oefenbladarchief: lokaal getest, nog niet uitgerold

De nieuwe migratie `20261011070545_os_worksheet_cloud_archive.sql` en de browserbibliotheek bewaren de exacte vragen, sleutel, seed en data. Alleen het eigen ingelogde account kan via de RPC lezen of schrijven; anonieme en rechtstreekse tabeltoegang zijn geweigerd. Een expliciete accountbinding voorkomt schrijven onder een volgend account tijdens wisselen. Bestaande reeksen zijn onveranderlijk; verwijderen laat een markering achter zodat een offline toestel ze niet terugzet.

Op het toestel blijft een IndexedDB-kopie. Zonder verbinding blijft een lokale bewaring zichtbaar als lokaal. Openen van de map of ‘Online bijwerken’ probeert opnieuw. Een tweede toestel haalt de index op en downloadt een document bij openen. Eenmaal gedownloade documenten zijn offline leesbaar. De server begrenst het aantal actieve reeksen tot 200, de documentgrootte tot 16 MiB en de totale actieve documenten tot 64 MiB per account.

[Browserproef](worksheet-cloud.json): oorspronkelijke Vergelijkingen-generator → automatisch bewaren → exact heropenen in een leeg tweede browserprofiel, offline lezen/verwijderen, opnieuw verbinden, verwijdering op beide toestellen en accountisolatie. [Document op tweede browser](worksheet-second-device.png). [Papierregressie](central-paper.json): alle zes Stelsels- en zeven Vergelijkingen-onderdelen, juiste onderwerpmap en accountwisseling tijdens generatie.

Deze proef gebruikt echte lokale SQL met fictieve accounts, geen productieaccounts. De databasewijziging is **niet op productie toegepast**. Zonder die migratie blijft de nieuwe frontend lokaal bewaren en meldt ze dat online bijwerken niet lukt. Uitrol vereist de gebruikelijke migratie- en deploymentcontrole; cross-device productieaanmelding blijft open.

## Open vervolgwerk

De checklist blijft open voor Getallen- en Signal Lab-vormgeving, de uniforme uitnodigingscoördinator, bescherming tegen meerdere actieve partijen, Kleiduif-groepsresultaten/XP/ranglijst, leraarklasuitnodigingen en de samengestelde toets Glasraam + Kleiduifschieten + tien Rechtenvragen. De [werkvormeninventaris](../../APP-MODES.md) noemt bestaande ingangen én hiaten. Deze onderdelen zijn niet afgevinkt op grond van alleen een startscherm.
