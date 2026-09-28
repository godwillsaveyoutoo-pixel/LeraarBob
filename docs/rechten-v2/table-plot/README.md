# Rechte tekenen uit een tabel

Signaalstad level 7 (`graph_from_table`, bestaande vaardigheid F5) is speelbaar. De zes opgaven bevatten stijgende, dalende en horizontale rechten, waaronder halve richtingscoëfficiënten. Alle drie de tabelpunten passen in het rooster, ook bij herhalen.

De tabel staat in een apart gegevensvlak. De leerling plaatst twee verschillende punten met de bestaande tik-, sleep- of toetsenbordbediening. Een stippellijn toont de eigen rechte vóór controle. De tabelkolommen kleuren mee bij een overeenkomstig geplaatst punt; dit levert geen voortgang op. De controle accepteert iedere juiste rechte, ook via andere correcte roosterpunten. Bij herstel blijft een correct punt behouden.

De bestaande oefenflow bewaart werk, fouten, hints en volledige rondes. Pas de zesde juiste tekening voltooit het level. Een nieuwe ronde behoudt het eerder behaalde vinkje. Er worden geen nieuwe beheersingsregels of opslagformaten geïntroduceerd.

Validatie:

- `node --test tests/rechten-v2-table-plot.test.cjs`
- `node tests/rechten-v2-table-plot-browser.cjs`
- `V2_QUESTION_SKILL=graph_from_table node tests/rechten-v2-question-layout.cjs`
- `node tests/rechten-v2-formula-a-browser.cjs` controleert de andere gebruikers van de gedeelde tekenbediening.

De browserchecks gebruiken de bestaande lokale CDP-helper, een geïsoleerde gast en geblokkeerde externe requests.
