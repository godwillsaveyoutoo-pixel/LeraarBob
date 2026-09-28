# Wortelbouw Pro v0.4.1 — interaction hotfix

Deze patch herstelt het verderbouwen na een bestaande constructie.

- Alle werkelijk vrije buitenzijden krijgen een brede, duidelijke gouden bouwzone plus een middenhandvat.
- De hitzone voor slepen is vergroot tot circa 46 CSS-px zodat muis en touch niet pixelprecies hoeven te starten.
- Je kunt op eender welk bestaand vierkant verderbouwen; tikken in een veld selecteert het eerst als je niet op een rand zit.
- Tijdens handmatig tekenen probeert de game automatisch de gespiegeld liggende driehoek wanneer de gekozen richting door een bestaand veld geblokkeerd wordt.
- De foutmelding legt nu uit wat je kunt veranderen in plaats van alleen te melden dat het hulpvierkant overlapt.
- De pointercursor reageert op bouwbare zijden en het canvas gebruikt `touch-action:none` voor betrouwbaarder slepen.

De geometry- en progressie-engine zijn niet gewijzigd.
