# Art- en placeholdermanifest

Status: functionele SVG/CSS-placeholders voor de low-fidelityproef. Dit document is een vervangcontract, geen claim dat illustraties al geproduceerd zijn. Geen image-generationronde vóór mechanicvalidatie. Alle labels, grafieken en bedieningen blijven native HTML/SVG en staan los van rasterart.

## Gedeelde regels

- Achtergronden zijn decoratief (`aria-hidden=true` of lege alt); een inhoudelijke wereldverandering heeft daarnaast een zichtbare tekststatus en veldboekregistratie.
- Geen tekst, getallen, aslabels, formule, oplossing of touchzone in een illustratie bakken.
- Wiskundige SVG's worden semantisch uit hetzelfde taakmodel gerenderd; grafiekpixels worden nooit gebruikt voor correctheid.
- Papier is eerst een effen CSS-kleur; geen grote rastertextuur nodig. Geen continu bewegende golven, zware blur, externe fontdependency of WebGL.
- Aspectratio en safe zones zijn authoringrichtlijnen; CSS mag decor croppen of verwijderen. Controls worden nooit met de illustratie meegeschaald.
- Budgetten hieronder zijn streefgrenzen voor **latere** productieassets. Meet echte transfergrootte bij vervanging; placeholders blijven bij voorkeur inline en onder 8 KiB per scene.

| Assetslot / voorgestelde bestandsnaam | Ratio en safe zones | Laag | Alt / fallback | Budget | Artbrief voor latere vervanging |
| --- | --- | --- | --- | --- | --- |
| `world-atlas.svg` | 16:9 desktop; centrale 60% vrij, 10% rand vrij van noodzakelijke details | Achtergrond | Decoratief; CSS-papier met HTML-locaties blijft volledig speelbaar | ≤80 KiB SVG of ≤160 KiB WebP | Getekende wetenschapsatlas met drie functionele plaatsen; geen fantasykastelen als quizbuttons |
| `boundary-pass.svg` | 4:3; midden 75% en onderstrook leeg voor rooster/interval | Achtergrond | Decoratief; ongekleurde lijn op neutraal vlak | ≤40 KiB | Sobere bergpas/lichtgrens; licht reageert pas op gecommitte x-zone |
| `boundary-light-mask.svg` | Schaalbare strook; geen tekstzone | Voorgrond onder aslabels | Status 'Lichtgrens vastgelegd' en patroon op geselecteerde x-regio | ≤12 KiB | Eenvoudige arcering/lichte invulling; geen kleur als enige signcue |
| `slope-ridge.svg` | 16:10; roostergebied volledig vrij | Achtergrond | Decoratief; punten A/B en rail blijven SVG-data | ≤40 KiB | Brugwerken met subtiele steunpunten buiten de meetzone |
| `slope-rail.svg` | Dynamisch uit semantische lijn, geen vaste rasterratio | Voorgrond | Tekstuele Δx, Δy en verhouding; rail ligt volgens exacte committed slope | ≤8 KiB | Geen vooraf getekend correct brugsegment; feedback toont werkelijke leerlingconstructie |
| `signal-city.svg` | 16:9; twee even grote viewzones vrij | Achtergrond | Decoratief; native grafiek/tabel/formule blijven staan | ≤40 KiB | Rustige schakelkamer met leidingen die twee views verbinden |
| `signal-link.svg` | Aanpasbare horizontale/verticale connector | Voorgrond | 'Signaalverbinding hersteld' of benoemde afwijking | ≤8 KiB | Eén causale verbinding; beweging kort en bij reduced motion direct |
| `fieldbook-stamp-boundary.svg` | 1:1; 15% randmarge | Voorgrond | 'Grenspas voltooid — zelfstandig/met steun' als HTML-tekst | ≤6 KiB | Abstracte open grens en x-regio; geen masterypercentage |
| `fieldbook-stamp-slope.svg` | 1:1; 15% randmarge | Voorgrond | 'Hellingrug voltooid — zelfstandig/met steun' | ≤6 KiB | Gebouwde rail en verhouding; geen snelheid/trofee |
| `fieldbook-stamp-signal.svg` | 1:1; 15% randmarge | Voorgrond | 'Signaalstad voltooid — zelfstandig/met steun' | ≤6 KiB | Twee consistente signalen, als blijvend proefresultaat |
| `shell-icons.svg` | 24×24 viewBox binnen ≥44×44 controls | Voorgrond | Nederlandse `aria-label` op elk native button | ≤8 KiB totaal | Consistente lijniconen voor menu, profiel, pauze, hulp; geen icon-only betekenis zonder naam |

## Asset-onafhankelijke acceptatie

Zonder decorassets blijven de opdracht, gegeven informatie, selectiestatus, feedback en navigatie compleet. Art mag geen root markeren vóór commit, a en b kleurcoderen alsof hun juiste plaats bekend is, of een stijgende lijn standaard positief rechts laten lijken. Een artvervanging vereist dezelfde no-clue-leakage-, contrast-, mobile-, target- en reduced-motiontests. Niet-speelbare werelden krijgen geen clickable slot totdat hun taakcontract en validator bestaan.

Werkelijke implementatiebestanden en screenshots worden in het eindrapport geregistreerd. De namen in deze tabel zijn gereserveerde slots; ze zijn geen bestandsinventaris.

## Werkelijk gerealiseerde slots

`games/rechten/trainer-v2/content/assets.json` is het machineleesbare register van
zeven gerealiseerde slots: drie semantische werkvlakken, drie inline wereldschetsen
en de shelliconen. `source` verwijst naar de renderer die werkelijk bestaat; er
worden geen ontbrekende SVG-bestanden opgehaald. De overige namen in de tabel
blijven gereserveerd voor artproductie na de gebruikerstest. De authoringregressie
controleert dat elke taak zijn slots kan oplossen en een fallback/vervangbrief heeft.
