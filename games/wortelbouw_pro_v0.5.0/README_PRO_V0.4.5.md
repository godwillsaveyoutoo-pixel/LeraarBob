# Wortelbouw Pro v0.4.5 — Overlay Chrome

Deze iteratie focust uitsluitend op landscape-schermgebruik en verandert de wiskundige engine niet.

## Wijzigingen

- De bovenbalk is op korte/landscape-schermen een **overlay** en neemt geen canvasrij meer in.
- De balk klapt automatisch in zodra de leerling begint te bouwen en kan met `⌄/⌃` terug geopend worden.
- Een kleine permanente **fullscreenknop `⛶`** staat rechtsboven.
- De camera gebruikt op smartphone één **stabiel bijna edge-to-edge frame**; openen/sluiten van UI veroorzaakt geen reframe.
- De Wortel-as blijft behouden, maar is standaard een **26 px dunne ontdekstrook**.
- Tik op `⌃` om de Wortel-as uit te klappen tot 56 px.
- Bij een nieuwe doelwortel klapt de as automatisch kort open en daarna weer dicht, tenzij de leerling hem zelf vast openzet.
- Reeds ontdekte tussenwortels blijven ook tijdens ketenbouw zichtbaar op de dunne as.
- De knop **Volgende puzzel** is een zwevende ronde pijl en krijgt geen eigen breed paneel meer.
- Mobiele camera-padding is verkleind en de constructie mag bijna de volledige breedte en hoogte benutten.
- Tikmodus blijft verwijderd; de interactietaal blijft volledig direct slepen/bouwen.

## Camera-contract

Op smartphone veranderen de camera-bounds **niet** wanneer:

- de bovenbalk in- of uitklapt;
- fullscreen wordt geactiveerd;
- de Wortel-as wordt geopend of gesloten;
- de succesknop verschijnt.

De camera mag alleen wijzigen wegens de geometrische constructie zelf of een expliciete `Alles in beeld`-actie.
