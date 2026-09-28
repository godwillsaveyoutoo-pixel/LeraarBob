# Wortelbouw Pro v0.4.4 — Canvas First Mobile

Deze iteratie corrigeert twee structurele UX-problemen uit v0.4.3.

## 1. Geen tikmodus meer

Wortelbouw heeft vanaf v0.4.4 nog maar één bedieningstaal:

- eerste veld: vrij tekenen door te slepen;
- driehoek: slepen vanaf een gouden buitenzijde;
- volgende vierkanten: de gouden zijde naar buiten trekken;
- undo blijft beschikbaar.

De handmatig/tik-schakelaar is verwijderd uit de spelbalk en uit het menu. Ook de tap-only `+`-targets en click-to-place runtime zijn verwijderd. Oude saves waarin `manual:false` stond worden bij laden automatisch naar direct tekenen gemigreerd.

## 2. Smartphone is canvas-first

De oude mobiele layout reserveerde 72 px hoogte voor een volledige footer. Op 780×360 was dat een groot deel van de beschikbare spelruimte.

Nieuwe aanpak:

- header: 40 px;
- daaronder gebruikt de spelvloer alle resterende hoogte;
- geen permanente footer-rij;
- tijdens bouwen staan alleen de werkelijk nuttige controls in een smalle zwevende rail rechts;
- `Veld`/`Driehoek`-statusknoppen verdwijnen op smartphone;
- `Alles in beeld` en `Herstart` blijven in het hoofdmenu en nemen geen permanente schermruimte in;
- tijdens een lege start is er zelfs geen bouwrail: de leerling kan meteen tekenen;
- het mobiele camerakader reserveert breedte voor de rechter rail, niet kostbare verticale hoogte.

### Fases

**Start**  
Volle spelvloer. Alleen compacte instructie bovenaan.

**Driehoek kiezen/tekenen**  
Rechts verschijnt een smalle verticale rail met som/verschil en undo.

**Vierkant afwerken**  
Alleen undo blijft als klein zwevend control beschikbaar.

**Succes**  
De bouwcontrols verdwijnen. De Wortel-as verschijnt als een 52 px hoge transparante ribbon over de onderrand. `Volgende` is een compacte pijlknop rechts van de as, niet langer een apart groot paneel.

## 3. Camera safe frame

Op een korte landscape gebruikt `viewFrame()` nu:

- ongeveer 10 px zijmarge;
- ongeveer 38 px bovenruimte voor de compacte instructie;
- circa 58 px **rechter** marge wanneer de bouwrail zichtbaar is;
- geen permanente 72 px ondermarge;
- pas wanneer de Wortel-as zichtbaar is wordt onderaan ruimte gereserveerd bij een expliciete reframe.

Tijdens tekenen blijft de camera zoals sinds v0.4.2 volledig vergrendeld.

## Niet gewijzigd

- `geometry.js`;
- Pythagoras-validatie;
- ketenmechaniek;
- veldgroei en konijnen;
- progressie en bestaande 14 levels.

## Tests

- `node --check wortelbouw/wortelbouw.js`
- `node tests/chain_smoke.js`
- statische audit: geen tikmodusknop of menu-optie meer aanwezig.


> Opgevolgd door v0.4.5: overlay chrome, inklapbare header, fullscreen en compacte Wortel-as.
