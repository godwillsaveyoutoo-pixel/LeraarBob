# Wortelbouw Pro v0.4.3 — Chain First

Deze build voert bewust **geen nieuwe oefentypes** in. De kern blijft één bouwtaal:

> veld → vrije zijde → rechthoekige driehoek → veld → eventueel verderbouwen

## Wat gewijzigd is

### 1. Eén soort afgewerkt land
Alle correct gebouwde vierkanten worden nu dezelfde vruchtbare groene konijnengrond.

- startveld: gras;
- tweede vierkant van een stap: gras;
- resultaatvierkant: gras;
- de interne geometry-role `helper` blijft bestaan voor de berekening, maar heeft **geen aparte grondkleur** meer;
- tijdelijke previews blijven aarde zodat “in aanleg” nog leesbaar is.

Daardoor toont de grond **toestand**, niet algebraïsche rol.

### 2. Konijnen wonen op alle afgewerkte velden
Niet alleen start- en resultaatvelden krijgen bewoners. Ook het tweede vierkant van een constructiestap kan na het dichtgroeien een konijn krijgen.

De bestaande regels blijven gelden:

- konijnen vermijden de centrale oppervlakte-labelzone;
- ze bewegen tussen lokale ankerpunten;
- ze blijven binnen hun eigen gedraaide vierkant;
- hulp-/resultaatrol verandert hun gedrag niet meer.

### 3. Ketens zijn expliciet de kern
Na een niet-eindigende bouwstap:

- het nieuw gebouwde veld krijgt kort een subtiele gouden handoff-gloed;
- daarna zijn **alle vrije buitenzijden van alle groene velden** opnieuw bruikbaar;
- de leerling hoeft niet op het laatst gemaakte veld verder te gaan;
- ook een eerder gebouwd tweede veld kan opnieuw vertrekpunt worden.

Er is dus geen aparte “ketenmodus”: ketenbouw ontstaat uit dezelfde normale bediening.

### 4. Vrij begin blijft behouden
Een leeg level heeft nog steeds geen vast startpunt.

In vrije bediening:

- druk waar je wilt;
- sleep diagonaal;
- de maat snapt op de liniaal;
- de camera kadert pas na loslaten rond de werkelijk gekozen werkplek.

### 5. Stabiele camera uit v0.4.2 blijft behouden
Tijdens een drag:

- geen zoom;
- geen pan;
- één vast camera-snapshot voor screen→world mapping.

Pas na loslaten mag de camera opnieuw ruimte maken.

### 6. Legpuzzel-proef verwijderd
De experimentele `△ + 3 velden`-modus is uit het menu en uit de runtime verwijderd. Dat was een aparte interactietaal en past niet bij de gekozen richting.

Het menu bevat nu alleen acties die bij het echte spel horen.

### 7. Terminologie opgeschoond
De speler ziet niet langer `hulpveld`, `hulpvierkant` of de koraalkleur als betekenisdragende categorie.

Zichtbare taal gebruikt nu onder meer:

- **vruchtbare grond**;
- **in aanleg**;
- **bouwzijde**;
- **tweede veld**;
- **volgende veld**.

## Bewust nog niet gewijzigd

De bestaande 14 opdrachten zijn in deze build inhoudelijk niet herschikt. Eerst moet de ene bouwmechaniek goed genoeg voelen — vooral vrije plaatsing, verderbouwen en ketens — daarna kan de levelreeks opnieuw beoordeeld worden.

Ook audio is nog niet toegevoegd; dat is beter als aparte feedbacklaag nadat deze interaction pass stabiel is.

## Technische checks

- alle JavaScript-bestanden slagen voor `node --check`;
- alle `$('<id>')`-referenties in `wortelbouw.js` hebben een element in `index.html`;
- `tests/chain_smoke.js` verifieert:
  - vrije startpositie blijft exact behouden;
  - een eerste constructie kan een tussenveld maken;
  - ook het tweede veld van die stap is opnieuw bruikbaar;
  - een resultaatveld kan meteen de basis van de volgende stap worden;
  - een echte tweestapsketen naar `√14` bereikt `won`.
