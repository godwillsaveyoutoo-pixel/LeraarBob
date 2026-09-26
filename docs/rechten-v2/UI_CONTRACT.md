# Runtime- en testcontract voor deze uitvoeringsronde

Routes: `games/rechten/trainer-v2/`, `?slice=grenspas`, `?slice=hellingrug`,
`?slice=signaalstad`; losse mechaniekproef `prototype.html`.

Shell: Wereld, Veldboek, profiel/menu. Tijdens een missie uitsluitend pauze,
missienaam/voortgang, hulp, werkvlak, één antwoordtray en één primaire commitactie.
Geen XP, timer, badgepopups of brede navigatie. Onder 640×360 of in portret wordt
alleen actieve gameplay afgeschermd; Wereld en Veldboek blijven beschikbaar.

## Testbare DOM

- `#app[data-ready=true][data-screen]` — world / mission / book / profile.
- `[data-start=grenspas|hellingrug|signaalstad]` — start/hervat een geïsoleerde missie.
- `#menu`, `[data-screen=book]`, `[data-screen=profile]` — shellbestemmingen.
- `#pause`, `#hint`, `#undo`, `#commit`, `#continue` — missiehandelingen.
- `#mission[data-world][data-phase]`, `#feedback[role=status]`, `#rotateGate`.
- Formuliervelden met name `root`, `boundary`, `side`, `closed`, `symbol`,
  `symbolBoundary`, `direction`, `dx`, `dy`, `numerator`, `denominator`,
  `expected`, `feature`, `a`, `b`, `hidden` waar de fase ze nodig heeft.
- Maximaal twee `[data-representation]` tegelijk.
- `RechtenV2App.snapshot()` levert uitsluitend een kopie voor inspectie; tests
  geven antwoorden met echte muis/touch/toetsenbord-events, niet via een solve-API.

## Voortgang

Per wereld blijven task/seed, fase, deelantwoord, hints, feedback en proefevidence
bewaard. Een andere wereld openen vernietigt geen lopende missie. Commit legt de
voorspelling vast vóór de simulatie en feedback; tijdens feedback zijn inputs
vergrendeld. Herstel opent alleen de relevante velden. Verder is altijd expliciet.

Grenspas: ongekleurde grafiek → grenspin → interval → symbolische brug → dalende
contrastgrafiek zonder nulwaarde-deelvraag → horizontaal grensgeval.
Hellingrug: richting en verschillen → verticale breuk → derde punt voorspellen →
nieuwe breukhelling/andere representatie. A→B en B→A zijn gelijkwaardig.
Signaalstad: twee gepinde weergaven → probevoorspelling → afwijking → één atomisch
herstel van de verwisselde parameterkoppeling → nieuwe invoer (x=10).

## Evidencebeperking

De proef telt geen nieuwe productiemastery of XP. Completion, ondersteunde
constructie, zelfstandig nieuwe case en transfer blijven onderscheiden.
Bewijszegels beschrijven wat in deze proef daadwerkelijk is waargenomen.

## Gerealiseerde contrasten en hulp

Grenspas heeft vier cases: stijgend positief, dalend positief, dalend negatief en
horizontaal positief. De samengestelde bewijsversie toont grenspin en notatie op
één rij zodat de controls op 640×360 boven de footer blijven. Horizontaal heeft
geen irrelevante open/grens-inbegrepen-control.

De zichtbare hint wordt met de missie bewaard; Escape sluit de hint. Tijdens
resultaatfeedback is de hintknop uitgeschakeld. Na het volledige voorbeeld start
'Nieuw geval' een structureel contrasterende variant, nooit het uitgewerkte model.
De exacte gegeven punten en de eigen bevestigde helling blijven tijdens de
Hellingrug-transfer beschikbaar. De tweede taak gebruikt werkelijk een tabel.
