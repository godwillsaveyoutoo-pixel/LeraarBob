# Uitvoeringsvolgorde

Basis: commit 1d9d3da op feat/rechten-world-prototype. Uitvoering in aparte git-worktree,
branch feat/rechten-radical-redesign-v2. Niet-gecommitte eerdere UI-experimenten in de
originele werkboom worden niet meegenomen, gewijzigd of weggegooid. De v2.1-bijlage
voegt uitsluitend de reeds gegeven uitvoeringsopdracht toe aan de v2-brontekst.

1. Code-, state- en researchaudit; ontwerpdocumenten en alle 27 skillcontracten.
2. Documentatiecheckpoint vóór runtimecode.
3. Low-fidelity shell/prototype van grensselectie en gerichte verschillen; exacte
   validators los testen vóór wereldreacties.
4. Geïsoleerde Grenspas, Hellingrug en Signaalstad met dezelfde componenten;
   auth/progress-adapters, afzonderlijke presentatiestate, proefevidence.
5. Regressie-, wiskunde-, opslag-, input-, device- en accessibilitychecks;
   screenshots, commitcheckpoint en implementatierapport.

## Beslissingen

- Nieuwe route games/rechten/trainer-v2; geen v1 HTML/JS/CSS/SQL wijzigen.
- Exacte rationale API van RechtenWave; bestaande generator en slopevalidator via adapters.
- De 27 IDs blijven bestaan; equation_from_context blijft gepauzeerd (26 actief).
- Geen productie-masteryscores uit de proef. Evidence bewaart observaties, steun,
  revisies en transfer; voltooiing is geen bewezen beheersing.
- Bestaande AxiomaAuth en AxiomaProgress, geen nieuwe accounts of opslag-RPC.
  V1 axioma_progress blijft readonly. V2 gebruikt een aparte namespace in het
  generieke rechten-trainer progressrecord, met behoud van onbekende velden.
- Alleen synthetische testaccounts; geen tests op live leerlingdata.
- Operationele minimummaat: 640×360 landscape; 780×360 A20-referentie.
  Wereld en veldboek werken in portret; actieve gameplay krijgt de bestaande gate.
- Think-aloud/klasproef en echte A20-hardwaremeting worden niet gesimuleerd of
  als afgerond gerapporteerd. Uitbreiding/productiemigratie wacht op die beoordeling.
