# Formulewerf — didactische herordening

**Vervolg:** de vier A-haltes zijn inmiddels speelbaar. Zie
[Formulewerf A](../formulewerf-a/README.md) voor de actuele werking en tests.
Dit document beschrijft de eerdere kaartindeling.

Uitgevoerd in de bestaande `games/rechten/trainer-v2` in de werkmap
`LeraarBob-rechten-shell`. Alleen de Formulewerf-presentatie is aangepast.
Dezelfde twee fullscreen 3:2-stages en dezelfde illustratie blijven in gebruik.

## Nieuwe route

| Werkplaats | Nr. | Halte | Bestaande skill-ID |
| --- | --- | --- | --- |
| A — Voorschrift en grafiek | 1 | Voorschrift uit a en b | `equation_from_ab` |
| A | 2 | Rechte uit voorschrift | `graph_from_equation` |
| A | 3 | Voorschrift uit grafiek | `equation_from_graph` |
| A | 4 | Schrijf de vergelijking in de vorm y = ax + b | `rewrite_linear_equation` |
| B — Zelf een voorschrift bepalen | 5 | b uit helling en punt | `intercept_from_point` |
| B | 6 | Voorschrift uit helling en punt | `equation_from_point_slope` |
| B | 7 | Voorschrift uit twee punten | `equation_from_two_points` |
| B | 8 | Voorschrift uit tabel | `equation_from_table` |
| B | 9 | Voorschrift uit context | `equation_from_context` |

Halte 4 heeft een gewone marker en een breder tekstlabel voor de volledige
opdracht. Het is een tussenvaardigheid, geen boss of eindhalte van Formulewerf.
Alleen halte 9 heeft de subtiele afsluiting **Alles komt samen**.

A introduceert het gebruiken en herkennen van de basisvorm; B benoemt expliciet
de stap van die basisvorm naar zelf afleiden. De bestaande werkplaatsknoppen
verbinden beide kaarten. Als de beschikbare volgende halte op de andere kaart
ligt, wijst de primaire knop naar die werkplaats.

## Status en behoud van navigatie

Binnen Formulewerf is de aanbeveling de eerste beschikbare, nog niet afgeronde
halte in de nieuwe 1–9-volgorde. Als alle beschikbare haltes zijn afgerond, wordt een
beschikbare halte voor herhaling aangeboden. Als niets beschikbaar is, is er
geen aanbeveling en toont de niet-actieve CTA **Geen halte beschikbaar**.
Een vergrendelde halte wordt nooit aanbevolen, ook niet als lokale fallback
op een werkplaats zonder beschikbare haltes.

Beschikbaarheid en afgerond-status blijven afkomstig uit de bestaande
`unlock`-/`ready`-functies op een kopie van de oude statusdata. Er worden geen
mastery, toegangsvlaggen, events of leerlingantwoorden bijgeschreven. De
bestaande scheduler blijft ongewijzigd; uitsluitend de volgorde van de
Formulewerf-kaartaanbeveling is aangepast. `equation_from_context` blijft,
zoals in de oorspronkelijke catalogus, gepauzeerd voor echte oefeningen.

De technische zone-ID’s `bouwen` en `omzetten` zijn behouden om links en
opgeslagen navigatie te bewaren. Oude links en opgeslagen halte-selecties
worden op skill-ID naar de nieuwe juiste werkplaats geleid. Dit vereist geen
nieuw opslagformaat, migratie of navigatiesysteem. Terug naar kaart blijft
`#wereld`; terug uit een halte herstelt de juiste werkplaats en focus.

## Instapvoorwaarde voor de grafiekhalte

Formulewerf-haltes zijn in deze v2 nog previews. Er is daarom geen werkende
vroege grafiekoefening gewijzigd of toegevoegd in deze structuurronde.

Bij `equation_from_graph` is een bevroren `entryPolicy` vastgelegd voor
moeilijkheidslagen 0 en 1: a is rechtstreeks afleesbaar, b ligt zichtbaar op
de y-as, geen afleiding van b uit een willekeurig punt en geen uitgebreide
twee-puntenberekening als verborgen vereiste. De inhoudsmigratie moet dit
contract gebruiken en met echte opgaven valideren; de kaartmetadata verandert
op zichzelf geen generator, validator of bestaande unlockvereisten.

## Gewijzigde bestanden in deze ronde

Productie:

- `games/rechten/trainer-v2/content/area-maps.js` — Formulewerf-volgorde,
  titels, ankers, instapcontract, aanbevelingen en compatibiliteit van oude halte-links.
- `games/rechten/trainer-v2/components/shell-view.js` — Formulewerf-titels,
  werkplaatsletters, correcte CTA en de subtiele afsluiting bij context.
- `games/rechten/trainer-v2/styles/area-maps.css` — uitsluitend toegevoegde
  regels met `[data-area-id=formulewerf]` voor de bestaande twee kaarten.

Toegevoegd: `tests/rechten-v2-formulewerf.test.cjs`,
`tests/rechten-v2-formulewerf-browser.cjs` en deze documentatiemap met screenshots,
ankers en testbewijzen. Alle overige wijzigingen die al in de werkmap stonden
komen uit de vorige ronde.

## Verificatie

- 63 v2-unit-/regressietests geslaagd: [uitvoer](unit-tests.txt).
- 61 browser-layoutcontroles geslaagd: [rapport](formulewerf-report.json).
- Beide werkplaatsen op 1920×1080, 1366×768, 1024×768, 780×360 en 640×360;
  aanvullend echte Chromium-browserzoom op 80%, 100% en 125%.
- Geen scroll, afsnijding, node-overlap of drift; primaire CTA en topbar vrij.
- Routepaden hebben exact dezelfde eindpunten als de vaste markerankers en
  volgen de DOM-volgorde 1–4 / 5–9.
- Verschillende voortgangstoestanden, geen beschikbare halte, herhalen,
  gepauzeerde context, refresh, browsergeschiedenis, beide terugroutes en
  oude bookmarks getest.
- Skill-ID’s, validators, runtime, scheduler, storage, appcontroller, topbarbron,
  andere gebieden en art zijn behouden. De beschermde bestanden worden met
  SHA-256 vergeleken met de start van deze ronde: [behoudsmanifest](PRESERVED.json).
  Ook de gerenderde andere gebieden, topbar en initiële wereldkaart worden
  met de eerdere uitvoer vergeleken.

## Screenshots

[Open alle vier screenshots in de galerij](index.html).

| Werkplaats | Desktop 1366×768 | 780×360 |
| --- | --- | --- |
| A — Voorschrift en grafiek | [Desktop](screenshots/werkplaats-a-1366x768.png) | [780×360](screenshots/werkplaats-a-780x360.png) |
| B — Zelf een voorschrift bepalen | [Desktop](screenshots/werkplaats-b-1366x768.png) | [780×360](screenshots/werkplaats-b-780x360.png) |

De screenshots tonen een nieuwe gast zonder bestaande voortgang. Er is geen
fysieke Samsung A20 gebruikt; 780×360 is de gevraagde viewportreferentie.
