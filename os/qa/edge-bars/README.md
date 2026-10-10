# Beide OS-balken echt inklappen

De oude focusstand verborg twee balken maar voegde een vaste onderstrook toe. Die strook, de Focusknop en ‘Apart openen’ zijn verwijderd. Elke balk klapt nu onafhankelijk in. Alleen een klein herstelhandvat blijft aan de betreffende schermrand staan. De vensteracties worden pas zichtbaar na het openen van de onderbalk.

De handvatten hebben een aanraakdoel van 64 × 44 px en een toegankelijke naam/status. Ze zoeken vrije ruimte naast zichtbare spelbediening, ook nadat een spel zijn layout opnieuw berekent. Bij een volledig bezette rand houdt het OS 44 px ongestylede veiligheidsruimte vrij. Er wordt geen permanente bedieningsstrook aangemaakt. De onderste voorkeur wordt per account opgeslagen; de bovenste behoudt de bestaande gedeelde voorkeur. De oude focusvoorkeur migreert naar de onderste voorkeur. Invoer, voortgang en spelproviders veranderen niet.

## Uitgevoerd

Chromium bij 100% zoom, oorspronkelijke appcontrollers, lokale fictieve accounts. Browserexceptions en ontbrekende lokale bronnen: nul in de definitieve runs.

| Controle | Resultaat / bewijs |
|---|---|
| Rechtenwereld | Vier maten (1366 × 768, 390 × 844, 640 × 360, 320 × 568) × vier onafhankelijke balkstanden; beide balken 0 px hoog indien ingeklapt; grotere spelruimte; antwoord en DOM behouden; toetsenbord, touch, herladen, terugkeer en sluiten. [Rapport](chrome-results.json) |
| Zeeslag | Zes interactiegroepen, 21 layouts op vijf schermmaten; alle 63 coëfficiëntcombinaties, echt schot, computerbeurt, annuleren/sluiten en andere app hervatten; geen overlap tussen herstelhandvat en antwoordknoppen. [Rapport](zeeslag-report.json) |
| Brandweer | Zeven interactiegroepen, twaalf layouts op vier liggende schermmaten; alle acht straten, native invoer, echte redding en hervatten; geen overlap met antwoordknoppen. [Rapport](brandweer-report.json) |
| Catalogus | 24 beschikbare solo-ingangen, 144 layouts op drie maten, 412 doelmetingen en acht interactiegroepen; native menu's en lokale duo-werkborden behouden. De 25ste catalogusentry is een groepering zonder solo-ingang. [Rapport](catalog-report.json) |
| Logicawereld | Zeven interactiegroepen; alle achttien haltes, tien antwoordtypen, lokale duo/battle, oefenbladen en accountwisseling. Beide balken herstellen zonder verlies van het gekozen antwoord. [Rapport](logicawereld-report.json) |
| Units | 37 geslaagde tests: onafhankelijke voorkeuren, migratie/accountisolatie, inert verborgen taakbalk, oorspronkelijke DOM/handlers, gedeelde topbar en adapters. [Resultaten](unit-results.txt) |
| Pakket | Catalogus/offlinekopie gelijk; 73 bedieningselementen en 21 lokale frontendafhankelijkheden gecontroleerd; syntaxis en git diff-controle geslaagd. |

## Screenshots

- Rechtenwereld: [balken open](rights-bars-1366-open.png) / [beide ingeklapt](rights-bars-1366-hidden.png).
- [Zeeslag, beide ingeklapt](zeeslag-both-hidden.png).
- [Brandweer, beide ingeklapt](brandweer-both-hidden.png).
- [Telefoon, beide ingeklapt](rights-bars-390-hidden.png): de oorspronkelijke Rechtenwereld vraagt bij deze oefening nog om een liggend scherm. Beide herstelhandvatten blijven bereikbaar.

Dit is een ontwikkelpreview. Niet elk intern level is visueel doorlopen; echte externe multiplayerverbindingen en productieaccounts zijn met deze wijziging niet opnieuw getest. De bronbestanden en voorkeuren worden gewijzigd; dit verslag claimt geen publieke uitrol.
