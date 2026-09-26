# Migratieplan — geïsoleerde Rechtentrainer v2

## Doel en harde grens

V2 is een opt-in route naast v1. In deze ronde worden uitsluitend Grenspas, Hellingrug en Signaalstad speelbaar gemaakt. Er wijzigt geen productie-entrypoint, planner, validator, leerlingmastery of databaseobject. Rollback is teruggaan naar `/games/rechten/trainer/`; v1 hoeft nooit een v2-record te kunnen lezen.

## State-eigenaarschap

| Gegevens | Eigenaar | V2-bevoegdheid |
|---|---|---|
| skills, strength, recent, coverage, independent, review, refreshDue, XP, streak, scoredAttempts, waveDraft, journey | Bestaande `axioma_progress`/v1 | Alleen momentopname lezen; nooit opslaan of aanpassen. |
| `active`, `missions`, `events`, `settings`, `screen` | V2 presentatie/proefevidence, schema 1 | Eigen schema valideren, hervatten, lokaal bewaren en via generieke protocoladapter syncen. |
| account/session/role | `AxiomaAuth` | Bestaande API gebruiken; geen login of wachtwoordopslag bouwen. |
| revision/conflict/account ownership | Bestaande `AxiomaProgress` + v2 envelope | Verwachte revision/owner meesturen; stoppen bij conflict of accountwissel. |

## Adapterroute

Gebruik `AxiomaProgress.load('rechten-trainer', accountId)` en `save('rechten-trainer', envelope, revision, accountId)`. Deze **generieke** game-row is onderscheiden van de gespecialiseerde `axioma_progress`-row van v1. De bestaande game-ID blijft gelijk. V2 wijzigt slechts `envelope.rechtenV2`, behoudt alle overige remote velden exact en voegt geen `completed`, XP, skills of totale beheersingsscore toe.

De generieke backendimplementatie is niet volledig geversioneerd in deze repository. Als serverconfiguratie deze route afwijst, blijft de v2-cache bewaard met offline-status. Niet automatisch een spel registreren, SQL uitvoeren of op de gespecialiseerde state terugvallen. Dat is een expliciete uitrolbeperking, geen reden om de productievoortgang te riskeren.

## Veilige lifecycle

1. Wacht op centrale auth; leid owner af als `guest`, `teacher:<id>` of `student:<id>` en scope ook op project-URL.
2. Lees uitsluitend eigen v2-cache; weiger onbekend schema, verkeerde owner, corrupte state/revision. Bewaar afwijkende invoer als reservekopie vóór vervangen.
3. Lees legacy state voor dezelfde owner. Gast mag alleen het bestaande gastslot lezen; leerling nooit een gedeeld gastslot. Cloud read gebruikt `axioma_progress` met expliciet user_id en accountcheck vóór/na.
4. Sla de exacte gelezen snapshot met timestamp en bronvermelding eenmaal als aparte lokale backup op. Importeer alleen verwijzing/read-only aanbevelingscontext; geen kopie naar v2-mastery en geen wijziging aan de oorspronkelijke sleutel. Herladen schrijft geen tweede identieke migratie.
5. Laad generieke remote envelope. Dirty cache plus afwijkende revision geeft conflict. Een pending lokale edit met gelijke revision blijft behouden.
6. Elke presentatie-edit wordt eerst lokaal opgeslagen; sync gebruikt een gekloonde snapshot en edit-counter. Wijzigingen tijdens de aanvraag blijven dirty. Bij fout: offline-status, herprobeerbare save, geen dataverlies claimen als browseropslag zelf faalt.
7. Bij late authwissel: epoch check, de oude request mag de nieuwe accountstate niet vullen. Sessieverandering blokkeert schrijven totdat herladen met de juiste account.
8. Bij revisionconflict nooit last-write-wins toepassen. Bied remote laden of expliciete lokale versie behouden. Maak eerst een timestamped backup van lokaal en remote; lokaal behouden gebruikt de aangetroffen nieuwe revision. Een tweede conflict blijft conflict.
9. Browser-tabs controleren de actuele cache-edit voordat ze overschrijven; afwijking blokkeert of herlaadt. Offline conflicten zijn ook conflicten.

## Interfaces

`RechtenV2Storage.create({storage,auth,progress,onChange,now,project,initial})` levert async `start()`, `snapshot()`, `commit(state)`, `sync()`, `resolveConflict('remote'|'local')`, `exportBackup()` en `status`. `commit` bewaart lokaal vóór de netwerkawait. Auth/progress zijn injecteerbaar voor tests en verwijzen in de app naar de bestaande modules. Geen DOM- of Supabase-clients in de pure evidence/scheduler-adapters.

## Migratiegolven en gates

- **Deze branch:** contractaudit/documenten → geïsoleerde slices → shell → regressie/mobile/a11y/opslagtests → screenshots en reviewpakket. Geen productie-uitrol.
- **Volgende golf, na beoordeling:** gebruikerscheck met contrasterende taken en simpele controle. Alleen mechanics die beter begrip/transfer of minder fouten aantonen doorgaan. Authenticiteit van hidden-transfercases controleren.
- **Latere integratie:** evidenceadapter op bestaande scorefunctie aansluiten met expliciete compatibiliteitstests, alle 27 skills gefaseerd. `equation_from_context` afzonderlijk inhoudelijk beoordelen; niet reactiveren door migratie.
- **Productiegate:** live schema-/RLScheck op testomgeving, migratie/reversibiliteit bewijzen met synthetische records, fysieke Android A20, leerlingobservatie. Pas daarna productie-entrypoint vervangen.

## Verplichte regressies

Legacy keys en gespecialiseerde RPC krijgen nul writes uit v2; exact 27 catalogusidentifiers; gestopte contextskill blijft gestopt; read-only planner op deep clone; ondersteunde evidence nooit zelfstandig; idempotente poging/migratie; schemafout en onbekend veldbehoud; gast/leerling/leerkracht gescheiden; accountwissel tijdens load/save; offline reload/retry; edits tijdens save; revisionconflict; twee tabs; backupfout blokkeert destructieve conflictkeuze; geen netwerk naar echte testaccounts.

## Implementatiestatus van deze ronde

De adapter staat in `games/rechten/trainer-v2/storage.js`; de pure evidence- en plannerpresentatie staan in `evidence-adapter.js` en `scheduler-adapter.js`. `start` retourneert een kopie van de presentatiestate, met afzonderlijke `status`, `writable`, `account` en `legacy` getters. `destroy` verbreekt de callback en maakt lopende antwoorden ongeldig.

Lokale wijzigingen en de eenmalige legacy-import worden onder Web Locks geserialiseerd wanneer de browser deze API aanbiedt. Ook zonder Web Locks wordt de laatst gelezen cache-stamp gecontroleerd; verouderde tabs overschrijven geen geobserveerde nieuwere versie. Een exact gelijktijdige schrijf-race tussen aparte processen in een browser zonder Web Locks kan met localStorage alleen niet volledig atomair worden uitgesloten. De desktop/mobile browsertests gebruiken Chromium met Web Locks op localhost. Deze beperking is een productiegate voor eventueel te ondersteunen oudere browsers.

`tests/rechten-v2-storage.test.cjs`: **25 tests geslaagd** op 2026-09-25. Deze tests gebruiken uitsluitend synthetische accounts en in-memory storage; één integratiecheck laadt bovendien de ongewijzigde `shared/axioma-progress.js` tegen een nagebootste client. Ze controleren reads/writes en simuleren accountwissels, offline toestand en vertraagde aanvragen. Dit bewijst de adapterlogica; de compatibiliteit van het bestaande generieke backendcontract op een echte deployment is niet getest.

## Herstel na een lokaal tabconflict

Een stale tab schrijft zijn nog niet bewaarde intentie direct naar een timestamped `:backup:local-pending:`-record voordat de interface blokkeert. Een afzonderlijke, accountgebonden `:pending-conflicts`-index maakt die kopie vindbaar na herladen. Bij de volgende start wordt de keuze opnieuw getoond; er wordt vóór die keuze niets naar de cloud geschreven en er vindt geen merge plaats. De leerling kiest expliciet zijn bewaarde lokale intentie of de andere versie. De afgewezen versie blijft als backup bestaan.

`Bewaar een kopie` bevat `recoveryBackups` met uitsluitend backups van dezelfde project-/accountnamespace, inclusief timestamp en volledig record. Ook na een afgeronde conflictkeuze blijven deze backups exporteerbaar. De pilot biedt geen algemene JSON-importeditor; een onopgelost lokaal conflict heeft wel een directe heropen-/keuzeroute in de interface.

Bij quota- of browseropslagfouten meldt de adapter `storage-error`, houdt de huidige intentie in het geheugen en laat de bestaande canonical state ongemoeid. Er wordt dan niet beweerd dat een nieuwe backup duurzaam is bewaard. Een corrupte of onbekende herstelindex meldt `schema-error`; die wordt niet stilzwijgend vervangen.

De echte shell is aanvullend getest met `tests/rechten-v2-shell-integration.cjs`: vijf geslaagde groepen voor accountwisseling, de bestaande loginroute, conflictkeuze, offline hervatten/synchroniseren en horizontale Grenspasbediening. De suite gebruikt de ongewijzigde `AxiomaProgress` met synthetische accounts/RPC en blokkeert alle externe requests.
