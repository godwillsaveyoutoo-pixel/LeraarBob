# Interaction components — low-fidelity contract

Datum: 25 september 2026. Scope: de drie geïsoleerde slices, plus expliciete componentcontracten voor toekomstige skills. Geen bestaande UI-component wordt stilzwijgend als v2-geschikt beschouwd. Exacte rekenkern en punt-/lijnvalidatie worden hergebruikt; huidige renderers zijn referentie, geen gedeelde v2-shell.

Alle controls hebben `idle → selected → committed → testing → correct | repair`, plus `disabled`. Selectie geeft nooit correctness; alleen de primaire `Test` commit doet dat. De gecommitte semantische respons is een immutable snapshot. Een wijziging na feedback maakt een nieuwe commit, behoudt eerdere poging en kan zelfstandig bewijs niet retroactief herstellen. Een submit door pointerrelease is verboden.

| Component | Respons / wireframe | Toestand, causaliteit en behoud | Toegankelijk contract | Huidig → v2 |
|---|---|---|---|---|
| AxisAnchorPicker | `x [−] [exacte waarde] [+]` + grote x-as-hitzones | Neutrale grenspin; projection/probe na commit; grens behouden bij verkeerde regio | Gelabelde native invoer; stepper/keyboard; geen hover | Nieuwe v2 root-control; legacy root MC vervalt alleen in v2 |
| GridPointPlacer | `A (x,y)` + gesnapt rooster | Exact punt, apart van pixels; goed punt blijft bij tweede fout | Tikrooster plus x/y-stepper; drag optioneel | `construction-ui` concept; niet nodig voor eerste pilotrespons, later |
| DirectedDeltaBuilder | `[A→B] [B→A]  Δx [ ]  Δy [ ]` | Route geldt voor beide componenten; na commit ghost langs gekozen stappen | Native routebuttons en exacte velden; undo | `coordinate-builder` + `W.expected` adapter; slice B |
| RateFractionBuilder | `Δy/teller` boven horizontale breukstreep boven `Δx/noemer` | Exact rationale, geen floattolerantie; gelijkwaardige breuken geldig; richting en goede delta blijven | Labels “teller”/“noemer”; breuk als spreektekst; teken toegestaan in beide | `W.q/parse/div/eq`; slice B |
| ParameterCards | `a: rate [ ]   b: bij x=0 [ ]` | Onafhankelijke semantische rollen; ghost oud/nieuw uitsluitend na commit | Labels en patronen naast kleur; exacte invoer | W model; slice C atomische koppelingrepair |
| FunctionProbe | `[x=0] [verschil 0→1]` → `voorspel [ ]` → Test | Expected en actual uit exacte modellen pas na voorspelling; geen onbeperkt groen tunen | Native knoppen; tekstuitkomst naast grafiek | Nieuwe adapter op W; slices A/C |
| TableRowEditor | Tabel context + één actieve cel `[ ]` | Eén beslissing, rij↔punt na commit; juiste rijen behouden | Column/row headers en actieve-celnaam; geen spreadsheet | Toekomstig; signal table read-only |
| FormulaComposer | `y = [a] x + [b]` / typed AST | Equivalent rationale en tekenconstanten geldig; geen willekeurige stringparser beloven | Verticale breuken, semantic slots; gewone toetsen | W constructionCheck hergebruiken bij later migratie |
| IntervalSelector | `[links] [rechts] [alle x] [geen x]`, grens `[ ]`, `[open/dicht]` | Alleen x-regio selecteerbaar; boundary en side apart; probes + patroon na commit | Min 44×44; radio/pressed-state; symbool en woorden, geen kleur-only | Nieuwe slice A; horizontaal all/none |
| SignStrip | `[−/0/+] [grens] [−/0/+]` | Geen elk-teken-once verplichting; horizontale gevallen bestaan | Drie benoemde zones, geen drag | Later; vervangt huidige bijectieve chips |
| RewriteTray | Vergelijking + maximaal vier geldige moves + Undo | Zelfde bewerking aan beide leden; AST history blijft | Native chunks/moves; schermlezer formuletekst | `W.operate/equivalent/isolated`; later |
| RepresentationPins | `[grafiek] [tabel] [formule]` maximaal 2 actief | Wisselen voegt geen derde zichtbaar paneel toe; pinstate hervat exact | Pressed/select state, “maximaal twee” status; geen swipe nodig | Nieuwe slice C |
| FaultLocator | `feature [rate / x=0 / verwisselde rollen]` + voorspelling + repair | Selectie moet relatie benoemen; één atomische repair voor a↔b; hidden x10 | Tekstlabels naast visuele koppeling; keyboard alternatief | Nieuw, hergebruikt exacte a/b-validator |

## Twee contrasterende wireframes vóór visuele productie

Grenspas: compacte missieheader, ongekleurde grafiek als hoofdwerkvlak, x-intervalstrook als tray, één primaire testknop. Na rootcommit toont ontdekking één probe. Bewijs start direct met interval en symbolische grens, zonder roothelp. Na intervalcommit tonen twee verticale probes het gevolg; “Schrijf je interval” vormt de symbolische brug. Dalende/constante contrastvariant gebruikt dezelfde controls met andere wiskundige beslissing.

Hellingrug: twee punten zonder voorgetekende driehoek; routeknoppen en Δx/Δy onderaan; na delta-commit één verticale ratebreuk. Correcte componentvelden blijven zichtbaar. Ghost-rail volgt ingevoerde rate na commit; een nog niet gegeven derde x moet worden voorspeld. Geen globale kaart-/accountnavigatie tijdens de missie.

Signaalstad: twee gepinde views in één werkvlak. Tabel/formule zijn correct; grafiek heeft een verwisselde a/b-koppeling. Kies x=0 of verschilprobe, voorspel de verwachte uitvoer/verandering, commit en vergelijk actual. Lokaliseer de koppeling, herstel exact a en b in één commit. Hidden x10 vraagt een nieuw antwoord; geen automatisch succes op basis van een juiste knopselectie.

## Accessibility, mobiel en feedback

Gameplay past zonder scroll op 640×360 landscape; 780×360 is referentie. Portrait toont de gameplaygate met behoud van draft; wereld en veldboek werken wel portrait. Eén werkzone, één tray, maximaal twee representaties, één primaire actie. Target 44–48 CSS px ook wanneer een glyph kleiner is. Native focus, Escape sluit hulp/menu en keert naar trigger terug. Enter in een invoer mag alleen expliciete commit doen waar die zichtbaar is; nooit dubbele score. Geen drag vereist in eerste slices: keyboard en single-pointer zijn gelijkwaardige hoofdroutes. Bij toekomstige drag blijft tap/stepper beschikbaar.

Graph `role=img` krijgt assen, schaal, gegeven punten of tabelalternatief in betekenisvolle taal; geen verborgen solution in aria-label. Selection heeft outline, vorm en tekst. `aria-live=polite` meldt korte feedback zonder de hele grafiek opnieuw voor te lezen. Reduced motion schakelt verplaatsingsanimaties uit; probes blijven als statische oorzaak zichtbaar. Geen geluid of timer nodig om te slagen. Correctheidsfeedback bij concept/repair/transfer blijft tot `Verder`.

## Kill checks

Prototypecontrole vergelijkt elk mechaniek met grafiek/tabel plus eenvoudig invoerveld. Als extra bediening geen onderscheidende voorspelling/diagnose/transfer oplevert, vereenvoudigen. Test blind tunen, accidental taps, focusverlies, ontbrekende juiste-deelwerkbehoud, cumulatieve hints en echte touch. Automatische browserchecks bewijzen bediening en layout; ze vervangen geen think-aloud met leerlingen.
