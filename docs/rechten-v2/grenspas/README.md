# Grenspas — nulwaarden en tekens

[Open Grenspas](../../../games/rechten/trainer-v2/#grenspas).

Alle vijf bestaande haltes zijn speelbaar, elk met zes opgaven:

- **Nulwaarde aflezen**: lees de x-waarde van het snijpunt met de x-as; vier unieke antwoorden.
- **Nulwaarde berekenen**: gebruik het voorschrift en f(x) = 0; vier unieke antwoorden.
- **Tekenschema**: afwisselend grafiek en formule; vul links, op en rechts van de nulwaarde in met −, 0 en +.
- **f(x) > 0** en **f(x) < 0**: bepaal eerst de nulwaarde en kies daarna het strikte x-gebied. Beide haltes bewaren afzonderlijke voortgang.

De reeksen bevatten stijgende en dalende rechten, positieve en negatieve
nulwaarden, nul en breuken. Herhalen verschuift de nulwaarden. Grafiek, formule,
antwoordkeuzes en beoordeling gebruiken hetzelfde exacte rationale model.
De oorspronkelijke nulwaarde- en intervalvalidators blijven behouden.

De schermen volgen de meegeleverde voorbeelden: herinneringskaart links,
grafiek of formule in het midden en antwoordbediening rechts. Op compacte
landscapeschermen staan werkvlak en antwoorden naast elkaar; hints blijven
beschikbaar. Grafieken zijn native SVG; er zijn geen nieuwe rasterassets of dependencies.

Bij tekenschema’s **zonder grafiek** verwijzen herinnering, hints en foutfeedback
naar **a, de coëfficiënt van x**: a > 0 geeft −, 0, +; a < 0 geeft +, 0, −.
Dit geldt ook voor hervatte opgaven. De tweede hint licht toe dat bij x de
coëfficiënt 1 is en bij −x de coëfficiënt −1.

Juiste tekens blijven vergrendeld tijdens herstel. De gecontroleerde nulwaarde
blijft staan bij een fout x-gebied. Selectie geeft geen voorafgaande goed/foutmelding.
Undo, hints, pauze, herladen, browsergeschiedenis en hervatten gebruiken de
bestaande runtime en opslag. Voltooide reeksen blijven op de kaart zichtbaar
bij herhalen; gedeeltelijke stappen voltooien geen andere halte. Bestaande
leerlinggegevens, mastery, XP en de oorspronkelijke ontwikkelroutes blijven behouden.

## Controle

157 reken-, runtime-, opslag-, catalogus- en regressietests geslaagd.
De nieuwe browserproef doorloopt alle vijf reeksen en 102 layoutcontroles
op 1920×1080, 1366×768, 1024×768, 780×360 en 640×360. Daarbij worden muis,
touch, toetsenbord, herstel, undo, herladen, gescheiden voortgang en
terugkeer uit portret gecontroleerd. De browser gebruikt een fictieve gast
en onderschept externe verzoeken.

[Testverslag](grens-report.json). Ook de bestaande wereldnavigatie (63 controles/groepen),
opslagkoppeling (5 groepen met fictieve accounts) en Hellingrug
(80 layoutcontroles, inclusief samenvallende punten) slagen.

## Schermen

- [Nulwaarde aflezen](screenshots/zeroRead-1366x768.png)
- [Nulwaarde berekenen](screenshots/zero-1366x768.png)
- [Tekenschema met grafiek](screenshots/signchart-1366x768.png)
- [Tekenschema met formule en uitleg over a](screenshots/chart-formula-1366x768.png)
- [f(x) > 0](screenshots/positive-inequality-1366x768.png)
- [f(x) < 0](screenshots/negative-inequality-1366x768.png)
- [Tekenschema op mobiel](screenshots/chart-formula-780x360.png)
- [f(x) < 0 op mobiel](screenshots/negative-inequality-780x360.png)
