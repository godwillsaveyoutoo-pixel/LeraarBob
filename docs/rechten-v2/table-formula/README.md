# Voorschrift uit tabel

Formulewerf B, level 8 (`equation_from_table`), is beschikbaar via de bestaande wereldkaart. Zes opgaven: stijgend, dalend, breuken, constante functie en ongelijke afstanden tussen x-waarden. Herhalen verschuift de tabelwaarden zonder het bestaande werk van andere levels te wijzigen.

De leerling kiest twee verschillende tabelkolommen; tikken op x of f(x) selecteert dezelfde kolom. De eerste keuze is punt A (blauw), de tweede punt B (groen). Letters, haakjes en kolomkoppen maken de relatie ook zonder kleur herkenbaar. Opnieuw tikken deselecteert; een derde kolom vervangt de oudste keuze. Elke wijziging wist de berekening die van die puntkeuze afhangt. Ongedaan maken herstelt beide samen.

Daarna volgt het bestaande traject: verschillen invullen, a berekenen, een gekozen punt invullen, het product berekenen, b bepalen en het voorschrift bouwen. Getallen en breuken worden via antwoordkeuzes ingevoerd. De tabel blijft zichtbaar; oplossingen verschijnen pas na hun eigen controle. De automatische doorstroom en pauzemogelijkheid blijven werken.

De opgave blijft onveranderlijk. Alleen kolomindices worden opgeslagen; `workTask` leidt daar de werkpunten uit af. Daardoor gebruiken de exacte bestaande validators steeds de gekozen punten, ook bij hervatten en terugzetten. De voortgang gebruikt de bestaande skill-ID en tabelrepresentatie, zonder nieuw opslagformaat.

Validatie:

- Alle zes geordende puntparen, beide substitutiepunten, zes opgaven en drie herhalingen.
- Ontbrekende selectie, verkeerde richting, herstel, vergrendeling, ongedaan maken en serialisatie.
- Browsercontrole met muis, toetsenbord en aanraking via de gedeelde Formulewerf B-suite.
- Alle 211 vraagtoestanden op 22 schermformaten: 4.642 lay-outcontroles.
