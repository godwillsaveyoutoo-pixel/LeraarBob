# Samengestelde opdrachten

Start → Mijn taken → Opdrachten en toetsen → Nieuwe toets. De leerkracht voegt 1–12 onderdelen toe, kiest onderwerpen en aantallen, ordent ze en deelt de opdracht uit aan geselecteerde leerlingen. Er zijn negen aansluitingen: Glasraam, Kleiduifschieten, Rechtenwereld, Getallenwereld, Vergelijkingen, Stelsels, Vectormissie, Logicawereld en Wortelbouw. Losse levelspellen zijn nog niet toegevoegd.

Elke geldige verschillende Glasraam-rechte, tijdig juist geraakt doel of juist antwoord is één punt. Niet gemaakte vragen zijn nul punten; leerlingen mogen toch definitief indienen. De punten-PDF wordt uit de bevroren serverinzending gemaakt. Opdrachtresultaten zijn geen fictieve XP en vervangen geen bestaande solovoortgang.

## Aansluiting

`catalog.js` wordt met `scripts/build-task-catalog.cjs` uit de oorspronkelijke configuraties gegenereerd. Onderwerpen, benamingen en werkborden staan centraal. `tasks.js` regelt samenstelling, toewijzing, hervatten, bewaren, indienen en feedback. Oorspronkelijke werkborden blijven eigenaar van oefeningen en antwoordbediening. De gedeelde OS-navigatie staat eenmaal boven de taak; de geïsoleerde werkborden hebben geen tweede platformbalk.

Voor vraagonderdelen geeft de server een vaste specificatie met provider, vaardigheid, seed, vraagindex en instellingen. Het werkbord stuurt native antwoorden en tussenwerk terug. Berichten worden op origin, actieve frame, opdracht en vraagindex gecontroleerd. Concepten worden met `activity_draft` bewaard; pas `task-activity` beoordeelt het antwoord met `policy.cjs`. Clientvelden `correct` of `score` leveren geen punten op. Herhaalde inzendingen zijn idempotent; een definitief ingediende opdracht is onveranderlijk.

Stelsels gebruikt **games/stelsels.html**, niet het oude Stelsels-deel van Algebrawereld. `build-stelsels-task.cjs` maakt uit dezelfde bron een geïsoleerd werkbord. De veertien oorspronkelijke oefeningen, toetsenborden, stappen en substitutiedoelen blijven behouden. Servercontrole rekent de echte oplossing na. Bewaarde HTML in historische native snapshots wordt vóór herstel beperkt tot inerte wiskundemarkering.

Stelsels blijft een begeleid werkbord: bestaande feedback tijdens het oplossen is beschikbaar. Ook overige browserengines bevatten oefeninhoud. Dit is een uitgedeelde opdracht met serverberekende punten, geen beveiligde examenbrowser. Voor een toets zonder hints is een expliciete didactische toetsmodus een volgende stap.

## Bouwen en controleren

```sh
node scripts/build-task-catalog.cjs
node scripts/build-stelsels-task.cjs
NODE_PATH=/pad/naar/esbuild/node_modules node scripts/build-task-worker.cjs
NODE_PATH=/pad/naar/test/node_modules node --test --test-isolation=none tests/os-tasks.test.cjs tests/task-worlds.test.cjs
NODE_PATH=/pad/naar/test/node_modules node tests/os-tasks-browser.cjs
NODE_PATH=/pad/naar/test/node_modules node tests/task-worlds-browser.cjs
```

Build: esbuild 0.28.2. Tests: Playwright 1.64.0, PGlite 0.5.8, jsdom 26.1.0 en fake-indexeddb 6.2.4. De GitHub-workflow controleert reproduceerbaarheid en regressies. Zie [uitgevoerde proef](../os/qa/task-worlds-20261011/README.md).

## Uitrollen

1. Pas de additieve migratie `20261011202342_os_tasks_worlds.sql` toe.
2. Publiceer `task-activity` met `index.ts`, `handler.js` en de gegenereerde `policy.js`; behoud JWT-verificatie en de bestaande verificatie van de aangemelde gebruiker in de handler.
3. Publiceer pas daarna de frontend. Historische Rechtenwereld-specificaties zonder provider blijven ondersteund.
4. Controleer de service-only workerrechten, Edge-authenticatie, publieke bestanden en databaseadviezen.

Een verdere wereld vereist catalogusconfiguratie, een origineel werkbord met snapshot/restore/read-only ondersteuning, eigen servervalidator, SQL-allowlist en een echte browserproef van invoer → hervatten → indienen → resultaat/PDF. Een kaart toevoegen alleen volstaat niet.
