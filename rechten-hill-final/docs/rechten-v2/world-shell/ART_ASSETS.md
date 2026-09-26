# Illustraties, typografie en prompts

## Gebruikte methode en definitieve bestanden

De twee illustraties zijn gemaakt met de ingebouwde **image_gen**-tool, met de
meegestuurde mockups als stijl- en structuurrichting. Er is geen API/CLI-fallback
gebruikt. Alleen formaatcompressie naar WebP (ImageMagick, kwaliteit 88) is nadien
toegepast; alpha blijft behouden. Alle benodigde assets staan in de branch.

| Definitief bestand, relatief aan `games/rechten/trainer-v2/` | Gebruik |
| --- | --- |
| `assets/island-atlas.webp` | Transparante 1536×1024 atlas: vijf eilanden in een raster van 3×2; zesde cel leeg |
| `assets/grenspas-island.webp` | Transparant 1536×1024 Grenspas-eiland voor het gebiedsscherm |
| `assets/paper-grain.svg` | Native zachte papiertextuur |
| `assets/sea-waves.svg` | Native herhalende waterstrepen |
| `assets/fonts/PatrickHand-Regular.ttf` | Lokaal handschrift voor titels en grote labels |
| `assets/fonts/OFL-PatrickHand.txt` | Meegeleverde SIL Open Font License |

De originele generaties staan op deze pc onder:

- `/home/johan/.codex/generated_images/01a0d9c4-68c4-7f30-a09c-cb9362ff368c/exec-f14dc6bf-659a-41b1-8e98-857cc03ceddf.png`
- `/home/johan/.codex/generated_images/01a0d9c4-68c4-7f30-a09c-cb9362ff368c/exec-c458bb1d-2205-4a76-ae89-ed4c2968570e.png`

De runtime gebruikt uitsluitend de kopieën in de repository. Grafiek, assen,
getallen, vraag, antwoordkeuzes, labels, statusiconen en klikvlakken zijn native
HTML/SVG. Er staat geen wiskundig antwoord of interactieve tekst in de bitmap.

## Promptset

Onderstaande specificaties leggen de gebruikte prompts in genormaliseerde vorm
vast; het zijn geen beloftes dat een nieuwe generatie pixelidentiek zal zijn.

### 1. Eilandenatlas

```text
Use case: illustration-story
Asset type: transparent game island sprite atlas for an educational mathematics world.
Create five separate watercolor and ink islands on one transparent 1536×1024 sheet,
in a precise three-column, two-row grid. Each island stays inside its own square cell.
Top left: grassy rocky island with a small friendly schoolhouse and orange roof.
Top middle: mountainous ridge with pines, a winding path and a small flag.
Top right: small stone town and castle on a rocky island.
Bottom left: broad green mountain pass with a wooden bridge, paths and a waterfall.
Bottom middle: workshop/harbor island with a small crane and buildings.
Bottom right: completely empty transparent cell.
Hand-painted watercolor, visible paper-like pigment, fine dark ink contours,
muted natural greens, warm limestone and gentle blue water accents.
Elevated three-quarter view, consistent scale and lighting, inviting but restrained.
No text, letters, numbers, UI, badges, labels, frames or background rectangle.
Keep transparent space around every island. Actual alpha transparency.
```

### 2. Uitgewerkt Grenspas-eiland

```text
Use case: illustration-story
Asset type: large transparent area-map island for the same educational world.
Use the mountain-pass island from the previous atlas as the visual reference.
Create one broad grassy rocky island, isolated on genuine transparent background.
Keep the same watercolor-and-ink style, palette, perspective and natural materials.
A winding path links five open clearings where native interface labels will be placed.
Pines, quiet mountain rocks, a wooden bridge across a chasm toward the lower right,
and a waterfall on the right. Leave the clearings calm and readable.
The island should fill most of a landscape 1536×1024 canvas with transparent margins.
No text, numbers, labels, sign lettering, icons, buttons, UI or surrounding rectangle.
```

## Typografie en vervanging

Patrick Hand is afkomstig uit de [officiële Google Fonts-map](https://github.com/google/fonts/tree/main/ofl/patrickhand).
Het font en de OFL-licentie zijn lokaal opgenomen. Er zijn geen runtimeverzoeken
naar Google Fonts. Compacte metadata en kleine hulpteksten gebruiken system-ui.

De renderer plaatst slotjes, vinkjes, vraagteksten en labels boven de illustraties.
Een illustratie kan daardoor vervangen worden zonder skill-ID, antwoordmodel,
validator of event te veranderen. Bij ontbrekende afbeeldingen blijven alle
native knoppen en namen beschikbaar. De assetcontracten en maximale bestandsgrootten
staan in `content/assets.json`; de regressietest controleert echte raster-/fontbytes.
