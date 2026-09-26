# Toegankelijkheid en apparaten — testplan v2

Scope: `/games/rechten/trainer-v2/` en de drie slice-queryroutes. Deze lijst is het acceptatieplan, geen claim dat iedere handmatige controle al uitgevoerd is. Werkelijke resultaten en screenshots horen in het eindrapport.

## Bronnen en productgrenzen

Het aangeleverde Mobile Layout Contract v0.4 vereist landscape 640 × 360, referentie 780 × 360 en geen actieve gameplayscroll. WCAG schrijft bij [dragging](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements) een single-pointeralternatief voor; toetsenbord alleen is daarvoor onvoldoende. [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) is 24 CSS px met uitzonderingen/afstandregels. Axioma kiest het strengere productdoel 44–48 CSS px. [Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) vereist aanvullende betekenisdragers. [Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) onderbouwt controle over tijdslimieten; deze proef heeft geen timer.

## Verplichte viewportmatrix

| Viewport | Schermen/fasen | Passcriterium |
| --- | --- | --- |
| 1920 × 1080 | Wereld, alle slices, feedback, veldboek | Begrensde leesbreedte, scherpe grafiek, geen overmatige afstand tussen werk/antwoord |
| 1366 × 768 | Dezelfde | Eén hoofdactie zichtbaar; geen bodyoverflow |
| 1024 × 768 | Dezelfde | Controls en labels botsen niet |
| 780 × 360 | Elke slice vóór commit, fout, herstel, hulp, hidden en voltooid | Alle actieve controls binnen viewport, geen verticale/horizontale gameplayscroll |
| 640 × 360 | Dezelfde; hard minimum | Decor vermindert; werk, primaire actie en 44px targets blijven bruikbaar |
| 390 × 844 en 360 × 640 | Wereld, veldboek, menu, oriëntatiegate | Leesbare portretweergave, scroll alleen buiten actieve gameplay; geen stateverlies bij draaien |
| <640 breed of <360 hoog landscape | Gate | Geen half speelbaar geknipt scherm; terug/hervatbereikbaarheid |

Screenshot per slice minimaal op 1366 × 768 en 640 × 360; één portretwereld en één portrait gameplaygate. Sla ook foutfeedback en persistent resultaat op waar die layout afwijkt.

## Geautomatiseerde controles

| Gebied | Assertions | Waarom |
| --- | --- | --- |
| Namen en semantiek | `lang=nl-BE`, page title, één hoofdlandmark, labels voor elk control, SVG title/desc of gelijkwaardig transcript | Wiskundige betekenis moet buiten het beeld bestaan |
| Keyboard | Tab bereikt alle acties; Enter/Spatie committet; Escape sluit menu/hulp waar toepasselijk; focus keert terug; geen keyboardtrap | Volledige bediening zonder pointer |
| Focus | `:focus-visible` heeft voldoende zichtbare rand, geen door sticky zones bedekte focus | Selectie is niet hetzelfde als actuele keyboardfocus |
| Tap | Pointerevents via testtouch bedienen interval, richting, breuk, probe, repair | Geen hover-afhankelijkheid of verplichte drag |
| Targetmeting | Bounding boxes van primaire actie, pauze, hulp, input- en selectiedoelen ≥44 × 44 | Productnorm boven WCAG-minimum |
| Kleur | Status heeft tekst/icoon/patroon; intervalgrens open/gesloten is ook verbaal benoemd | Geen groen/rood als enige feedback |
| Reduced motion | Emuleer `prefers-reduced-motion: reduce`; transitions/animations weg of niet essentieel; hetzelfde resultaat zichtbaar | Animatie mag geen informatievoorwaarde zijn |
| Lezen | `role=status`/`aria-live=polite` meldt feedback eenmaal; geen volledige DOM-heropbouw die focus wist | Feedback vindbaar zonder herhaald schermlezen |
| Zoom/tekst | 200% zoom of equivalente viewport; tekstinstelling waar browser ondersteunt | Geen claim dat een 2D-werkvlak alle reflowcriteria vanzelf dekt |
| Layout | `scrollWidth ≤ clientWidth`; gameplay `scrollHeight ≤ clientHeight`; controls niet clipped/overlapt | Scherm is enige buitencontainer |
| Fouten | Invalid input noemt het betreffende deel; goed werk blijft; knopstatus verwijst niet alleen naar kleur | Herstel moet haalbaar zijn |

Een geautomatiseerde audit van DOM en contrast is geen WCAG-certificering. Toetsenbord- en eventtests beoordelen werking, niet de volledige screenreaderervaring.

## Wiskundige toegankelijkheid

- Grafiek heeft benoemde assen, expliciete schaal en tekstueel beschikbare gegeven punten/waarden. Het alternatief mag **gegeven** gegevens beschrijven, maar het gezochte antwoord vóór commit niet toevoegen.
- Grenspas benoemt `x groter dan r` of `x kleiner dan r` en of de grens inbegrepen is. De open cirkel staat op de antwoordstrook; de lijn zelf heeft geen kunstmatig gat.
- Hellingrug maakt A→B en B→A expliciet; Δx en Δy hebben afzonderlijke labels. De verticale breuk heeft tevens een uitgesproken naam, bijvoorbeeld 'min drie gedeeld door twee'.
- Signaalstad biedt maximaal twee views tegelijk; pinnen en wisselen werkt via gewone knoppen. Tabel heeft echte headers; een foutlabel is geen verplicht sleepspel.
- Decimale komma is leesnotatie; exacte rationale opslag/validatie gebruikt canonical waarden. Leeg, ongeldig en nul blijven onderscheidbaar.

## Handmatige checks die nog met mensen/apparaten nodig zijn

1. NVDA met Firefox/Chrome: opdracht, gegeven waarden, invoer, feedback, menu en hervatten zonder zicht uitvoeren.
2. Android TalkBack op echte Samsung A20: oriëntatiewissel, soft keyboard, safe areas, focusvolgorde en dubbel-tikbediening. Desktop-emulatie bewijst dit niet.
3. Kleurenblindheids-/grijswaardetest en hoogcontrast: assen, selectie, foutdeel en oplossing blijven onderscheidbaar.
4. Reële lage-end performance: koude start, testreactie en inputlatency; geen continue animatie, WebGL of filterketens. Richtwaarde 30 fps voor niet-timingkritische oorzaakreactie, geen onbewezen benchmarkclaim.
5. 200% tekst en browserzoom: afwijkingen documenteren; een lokale 2D-uitzondering op reflow rechtvaardigt geen onbereikbaar menu.
6. Leerling met motorische beperking: tap/stepper bruikbaarder dan alleen drag; accidental actions en vermoeidheid observeren.

Blokkerend voor uitbreiding: verlies van werk door draaien, een noodzakelijke actie buiten beeld, onvoldoende benoemde wiskunde, uitsluitend kleur/drag, focusverlies na render of een opgeslagen fout die als zelfstandig bewijs wordt hervat.
