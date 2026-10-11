var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// games/logicawereld/logic.js
var require_logic = __commonJS({
  "games/logicawereld/logic.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object" && module.exports) module.exports = factory();
      else root.Logic = factory();
    })(typeof globalThis === "object" ? globalThis : exports, () => {
      "use strict";
      const glyph = { not: "\xAC", and: "\u2227", or: "\u2228", imp: "\u21D2", iff: "\u21D4" };
      function parse(input) {
        const tokens = String(input).replace(/\s/g, "").match(/[pqrst01()¬∧∨⇒⇔]/g) || [];
        if (tokens.join("") !== String(input).replace(/\s/g, "")) throw Error("Onbekend symbool");
        let i = 0;
        const atom = () => {
          const t = tokens[i++];
          if (t === "\xAC") return ["not", atom()];
          if (t === "(") {
            const a = iff();
            if (tokens[i++] !== ")") throw Error("Haakje ontbreekt");
            return a;
          }
          if (/[pqrst01]/.test(t || "") && t?.length === 1) return t;
          throw Error("Uitspraak ontbreekt");
        };
        const binary = (next, token, op) => () => {
          let a = next();
          while (tokens[i] === token) {
            i++;
            a = [op, a, next()];
          }
          return a;
        };
        const and = binary(atom, "\u2227", "and"), or = binary(and, "\u2228", "or");
        const imp = () => {
          const a = or();
          if (tokens[i] === "\u21D2") {
            i++;
            return ["imp", a, imp()];
          }
          return a;
        };
        const iff = binary(imp, "\u21D4", "iff");
        const tree = iff();
        if (i !== tokens.length) throw Error("Extra symbolen");
        return tree;
      }
      function evaluate(tree, env) {
        if (typeof tree === "string") {
          if (tree === "0") return false;
          if (tree === "1") return true;
          if (typeof env[tree] !== "boolean") throw Error("Waarheidswaarde ontbreekt: " + tree);
          return env[tree];
        }
        const [op, a, b] = tree, x = evaluate(a, env);
        if (op === "not") return !x;
        const y = evaluate(b, env);
        return op === "and" ? x && y : op === "or" ? x || y : op === "imp" ? !x || y : x === y;
      }
      const value = (expression, env) => evaluate(typeof expression === "string" ? parse(expression) : expression, env);
      const variables = (expression) => [...new Set(String(expression).match(/[pqrst]/g) || [])].sort();
      function cases(vars = ["p", "q"]) {
        return Array.from({ length: 2 ** vars.length }, (_, i) => Object.fromEntries(vars.map((v, j) => [v, !(i & 1 << vars.length - 1 - j)])));
      }
      function equivalent(a, b) {
        return cases([.../* @__PURE__ */ new Set([...variables(a), ...variables(b)])].sort()).every((e) => value(a, e) === value(b, e));
      }
      function classify(expr) {
        const v = cases(variables(expr)).map((e) => value(expr, e));
        return v.every(Boolean) ? "altijd" : v.every((x) => !x) ? "nooit" : "soms";
      }
      function formatBuild(answer) {
        const a = (answer.leftNot ? "\xAC" : "") + (answer.left || "p"), b = (answer.rightNot ? "\xAC" : "") + (answer.right || "q");
        const expr = "(" + a + (answer.op || "\u2227") + b + ")";
        return answer.outerNot ? "\xAC" + expr : expr;
      }
      function gateExpression(gates) {
        const a = gates[0] === "NOT" ? "\xACp" : "p", b = gates[1] === "NOT" ? "\xACq" : "q";
        const op = gates[2] || "AND";
        let x = "(" + a + (op === "OR" || op === "NOR" ? "\u2228" : "\u2227") + b + ")";
        if (op === "NAND" || op === "NOR") x = "\xAC" + x;
        return x;
      }
      function validate(task, answer) {
        const bad = (message, category = "structure", detail = {}) => ({ correct: false, message, category, ...detail });
        const ok = () => ({ correct: true, message: task.explanation });
        if (task.type === "choice" || task.type === "multi") {
          const selected = task.type === "multi" ? answer : Array.isArray(answer) ? answer[0] : answer;
          if (task.type === "multi") {
            if (!Array.isArray(selected)) return bad("Kies alle passende antwoorden.");
            const got = [...new Set(selected)].sort().join("|"), want = [...task.correct].sort().join("|");
            return got === want ? ok() : bad(task.feedback || "Controleer elk gekozen antwoord afzonderlijk.", task.category || "meaning");
          }
          return selected === task.correct ? ok() : bad(task.feedback || "Bekijk opnieuw wat de uitspraak precies zegt.", task.category || "meaning");
        }
        if (task.type === "predict") {
          const expected = value(task.expr, task.env);
          return answer === expected ? ok() : bad(task.feedback || "Bereken eerst het deel binnen de haakjes.", task.category || "operator");
        }
        if (task.type === "build" || task.type === "circuit") {
          if (task.requireInnerNegation && answer.outerNot) return bad("Gebruik voor dit herstel NIET bij de delen, zonder NIET rond het geheel.", "negation-scope");
          if (task.requiredForm === "contraposition" && !(answer.left === "q" && answer.right === "p" && answer.leftNot && answer.rightNot && answer.op === "\u21D2" && !answer.outerNot)) return bad("Voor de contrapositie verwissel je de delen en ontken je ze allebei.", "contraposition");
          const expr = task.type === "build" ? formatBuild(answer) : gateExpression(answer);
          const all = cases([.../* @__PURE__ */ new Set([...variables(task.expr), ...variables(expr)])].sort()), e = all.find((env) => value(expr, env) !== value(task.expr, env));
          return e ? bad("Bij " + Object.entries(e).map(([v, b]) => v + " = " + (b ? "W" : "V")).join(", ") + " werkt jouw regel anders dan gevraagd.", "rule-structure", { env: e, actual: expr }) : ok();
        }
        if (task.type === "table") {
          const envs = cases(task.vars || variables(task.columns.map((c) => c.expr).join("")));
          for (let r = 0; r < envs.length; r++) for (let c = 0; c < task.columns.length; c++) {
            if (answer?.[r]?.[c] !== value(task.columns[c].expr, envs[r])) return bad("Controleer rij " + (r + 1) + ", kolom " + task.columns[c].label + ". Begin bij de kleinste deeluitspraak.", "table-step", { row: r, column: c });
          }
          return ok();
        }
        if (task.type === "difference") {
          return value(task.expr, answer) !== value(task.other, answer) ? ok() : bad("In dit geval geven beide regels hetzelfde resultaat. Zoek een ander geval.", "single-case");
        }
        if (task.type === "counter") {
          if (!task.domain.includes(answer)) return bad("Kies een getal uit het opgegeven domein.", "domain");
          if (!value(task.condition, task.environments[answer])) return bad("Dit getal voldoet niet aan de voorwaarde. Een tegenvoorbeeld moet die wel respecteren.", "premise");
          if (value(task.conclusion, task.environments[answer])) return bad("Bij dit getal klopt het gevolg nog. Zoek een geval waarin het gevolg faalt.", "conclusion");
          return ok();
        }
        if (task.type === "classify") {
          return answer === classify(task.expr) ? ok() : bad(task.feedback || "Altijd en nooit gelden voor \xE1lle waarheidstoekenningen.", "classification");
        }
        if (task.type === "puzzle") {
          const selected = task.candidates.find((c) => c.id === answer);
          if (!selected) return bad("Kies \xE9\xE9n kandidaat.");
          const truths = task.rules.map((rule) => value(rule, selected.env));
          return truths.filter(Boolean).length === task.trueCount ? ok() : bad("Deze kandidaat geeft " + truths.filter(Boolean).length + " ware uitspraken; er moeten er " + task.trueCount + " zijn.", "constraint", { truths });
        }
        throw Error("Onbekend vraagtype " + task.type);
      }
      function newRecord(task, player = "solo") {
        return { taskId: task.id, skill: task.skill, player, attempts: 0, wrongAttempts: 0, hints: 0, firstAnswer: null, firstCorrect: false, eventuallyCorrect: false, categories: [], transfer: !!task.transfer };
      }
      function attempt(record, answer, result) {
        if (record.eventuallyCorrect) return record;
        const r = JSON.parse(JSON.stringify(record));
        r.attempts++;
        if (r.attempts === 1) {
          r.firstAnswer = JSON.parse(JSON.stringify(answer));
          r.firstCorrect = result.correct && r.hints === 0;
        }
        if (result.correct) r.eventuallyCorrect = true;
        else {
          r.wrongAttempts++;
          if (result.category) r.categories.push(result.category);
        }
        return r;
      }
      function stats(records) {
        return { total: records.length, firstCorrect: records.filter((r) => r.firstCorrect).length, eventuallyCorrect: records.filter((r) => r.eventuallyCorrect).length, wrongAttempts: records.reduce((n, r) => n + r.wrongAttempts, 0), hints: records.reduce((n, r) => n + r.hints, 0) };
      }
      function mastered(records) {
        const good = records.filter((r) => r.firstCorrect && r.hints === 0);
        return new Set(good.map((r) => r.taskId)).size >= 3 && good.some((r) => r.transfer);
      }
      function sanitizeProgress(raw, taskIds = []) {
        const allowed = new Set(taskIds), records = Array.isArray(raw?.records) ? raw.records.filter((r) => allowed.has(r?.taskId) && r.player === "solo" && Number.isInteger(r.attempts) && r.attempts >= 0 && typeof r.eventuallyCorrect === "boolean").slice(-1500) : [];
        return { version: 1, records, lastStop: Number.isInteger(raw?.lastStop) && raw.lastStop >= 0 && raw.lastStop < 18 ? raw.lastStop : 0, reducedMotion: raw?.reducedMotion === true };
      }
      return { parse, evaluate, value, variables, cases, equivalent, classify, formatBuild, gateExpression, validate, newRecord, attempt, stats, mastered, sanitizeProgress, glyph };
    });
  }
});

// games/logicawereld/content.js
var require_content = __commonJS({
  "games/logicawereld/content.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object" && module.exports) module.exports = factory();
      else root.LogicContent = factory();
    })(typeof globalThis === "object" ? globalThis : exports, () => {
      "use strict";
      const districts = [
        { id: "signaalplein", name: "Uitspraken en negatie", verb: "Herken & ontken", color: "#bc6647", symbol: "\xAC", description: "Eerst precies zeggen wat je bedoelt.", stops: [0, 1, 2] },
        { id: "schakelwerkplaats", name: "Logische connectieven", verb: "Lees & bouw", color: "#4d8276", symbol: "\u2227", description: "Regels die een systeem laten werken.", stops: [3, 4, 5] },
        { id: "testlab", name: "Waarheidstabellen", verb: "Onderzoek alle gevallen", color: "#507f96", symbol: "01", description: "Geen geval overslaan. Geen gokwerk.", stops: [6, 7] },
        { id: "spiegelkamer", name: "Logische wetten en equivalenties", verb: "Vergelijk & herstel", color: "#8b7394", symbol: "\u2261", description: "Anders geschreven. Dezelfde werking?", stops: [8, 9, 10] },
        { id: "afsprakenbrug", name: "Implicatie en voorwaarden", verb: "Test & weerleg", color: "#ab8540", symbol: "\u21D2", description: "Een afspraak heeft een richting.", stops: [11, 12, 13, 14] },
        { id: "controlecentrum", name: "Geldige redeneringen", verb: "Verbind & redeneer", color: "#658455", symbol: "\u21D4", description: "Regels samenbrengen tot een conclusie.", stops: [15, 16, 17] }
      ];
      const choice = (prompt, stem, options, correct, explanation, extra = {}) => ({ type: "choice", prompt, stem, options, correct, explanation, ...extra });
      const predict = (prompt, expr, env, explanation, extra = {}) => ({ type: "predict", prompt, expr, env, explanation, ...extra });
      const build = (prompt, expr, explanation, extra = {}) => ({ type: "build", prompt, expr, explanation, ...extra });
      const table = (prompt, columns, explanation, extra = {}) => ({ type: "table", prompt, columns, explanation, ...extra });
      const difference = (prompt, expr, other, explanation, extra = {}) => ({ type: "difference", prompt, expr, other, explanation, ...extra });
      const counter = (prompt, condition, conclusion, domain, environments, explanation, extra = {}) => ({ type: "counter", prompt, condition, conclusion, domain, environments, explanation, ...extra });
      const classify = (expr, explanation, extra = {}) => ({ type: "classify", prompt: "Geldt deze formule altijd, soms of nooit?", expr, explanation, ...extra });
      const opts = (...labels) => labels.map((label, i) => ({ id: String(i), label }));
      const col = (expr, label = expr) => ({ expr, label });
      const stops = [
        { name: "Uitspraken herkennen", goal: "Herken een propositie, ook als je de waarheid nog niet kent.", example: "\u201C9 is even.\u201D", lesson: [["Een uitspraak zegt iets.", "Je kunt haar als waar of vals beoordelen. Ook een onware zin is een uitspraak."], ["Een vraag vraagt iets.", "\u201CIs 9 even?\u201D is een vraag; ze heeft zelf geen waarheidswaarde."], ["Niet weten is iets anders.", "Een feit kan vastliggen terwijl jij nog niet weet of het waar is."]], tasks: [
          choice("Welke zin is een uitspraak?", "Een propositie is waar of vals.", opts("Doe het raam dicht.", "12 is deelbaar door 3.", "Is het raam open?"), "1", "\u201C12 is deelbaar door 3\u201D beweert een controleerbaar feit."),
          choice("Is een onware zin ook een uitspraak?", "\u201C9 is even.\u201D", opts("Ja, en de uitspraak is vals.", "Nee, want de zin is onwaar.", "Alleen als iemand ermee akkoord gaat."), "0", "Een propositie mag vals zijn. Onwaar betekent niet: geen uitspraak.", { category: "false-vs-statement" }),
          choice("Wat voor zin is dit?", "\u201CWelke bus neem je?\u201D", opts("Een ware uitspraak.", "Een valse uitspraak.", "Een vraag."), "2", "Deze zin vraagt informatie; hij beweert geen feit."),
          choice("Wat weet je zeker over deze zin?", "\u201CIn dit gesloten doosje zit een rode fiche.\u201D", opts("Geen uitspraak, want ik kan het niet zien.", "Wel een uitspraak; ik ken de waarheid nog niet.", "Een vraag."), "1", "Het doosje heeft een vaste inhoud. Je kennis van die inhoud kan ontbreken.", { transfer: true, category: "truth-vs-knowledge" }),
          choice("Welke reden klopt?", "\u201CZet de lamp aan.\u201D is geen propositie.", opts("Een opdracht heeft zelf geen waarheidswaarde.", "De lamp staat nu uit.", "Een korte zin is nooit een propositie."), "0", "Een opdracht vraagt een handeling in plaats van een waar of vals feit.")
        ] },
        { name: "Negatie", goal: "Negatie keert een waarheidswaarde om.", example: "\xACp \xB7 \xAC\xACp", lesson: [["W wordt V.", "Als p waar is, is \xACp vals."], ["V wordt W.", "Als p vals is, is \xACp waar."], ["Twee keer omkeren.", "\xAC\xACp heeft dezelfde waarheidswaarde als p."]], tasks: [
          predict("Voorspel de negatie.", "\xACp", { p: true }, "p is waar; \xACp is dus vals."),
          predict("Voorspel de negatie.", "\xACp", { p: false }, "p is vals; \xACp is dus waar."),
          predict("Wat doet twee keer NIET?", "\xAC\xACp", { p: true }, "Twee negaties heffen elkaar op: \xAC\xACp is waar."),
          choice("Welke zin is de negatie?", "p: De deur is gesloten.", opts("De deur is niet gesloten.", "De deur is zeker open \xE9n gesloten.", "Misschien is de deur gesloten."), "0", "\u201CNiet gesloten\u201D ontkent precies het gegeven feit.", { transfer: true }),
          predict("Ook zonder een plaatje.", "\xAC\xACp", { p: false }, "Na twee omkeringen krijg je opnieuw de oorspronkelijke waarde: vals.")
        ] },
        { name: "Negaties formuleren", goal: "Ontken de hele uitspraak, met de juiste grens.", example: "\xAC(T \u2265 20) \u21D4 T < 20", lesson: [["Ontken de volledige zin.", "De negatie is waar in precies de gevallen waarin de oorspronkelijke zin vals is."], ["Test het grensgeval.", "De negatie van \u201Cminstens 20\u201D is \u201Cminder dan 20\u201D. Bij 20 is de oorspronkelijke zin waar."], ["Een voorbeeld volstaat niet.", "\u201CHet is 18\u201D is geen volledige negatie van \u201Chet is minstens 20\u201D. Er zijn meer mogelijke temperaturen."]], tasks: [
          choice("Ontken de uitspraak.", "De temperatuur is minstens 20 \xB0C.", opts("De temperatuur is minder dan 20 \xB0C.", "De temperatuur is hoogstens 20 \xB0C.", "De temperatuur is 18 \xB0C."), "0", "Bij precies 20 \xB0C is \u201Cminstens 20\u201D waar; de negatie moet daar vals zijn.", { category: "negation-boundary" }),
          choice("Ontken de uitspraak.", "x > 5, met x een re\xEBel getal.", opts("x < 5", "x \u2264 5", "x = 5"), "1", "Alle gevallen x \u2264 5 vallen buiten x > 5. Ook x = 5 hoort bij de negatie."),
          choice("Test het grensgeval.", "p: T \u2265 20 \xB0C. Nu is T = 20 \xB0C.", opts("p is W en \xACp is V.", "p is V en \xACp is W.", "Beide zijn waar."), "0", "20 voldoet aan \u201Cminstens 20\u201D; de negatie is daar vals."),
          choice("Ontken deze wiskundige uitspraak.", "x = 0, met x een re\xEBel getal.", opts("x > 0", "x < 0", "x \u2260 0"), "2", "De volledige negatie omvat zowel negatieve als positieve waarden.", { transfer: true }),
          choice("Welke ontkenning is volledig?", "Alle drie de lampen branden.", opts("Geen enkele lamp brandt.", "Minstens \xE9\xE9n lamp brandt niet.", "Precies \xE9\xE9n lamp brandt."), "1", "Niet alle betekent minstens \xE9\xE9n niet. Het hoeft niet over alle lampen te gaan.", { category: "negation-scope" })
        ] },
        { name: "Conjunctie (EN)", goal: "EN is alleen waar als beide delen waar zijn.", example: "p \u2227 q", lesson: [["Twee voorwaarden.", "De poort opent alleen als je een pas hebt \xE9n de code klopt."], ["E\xE9n ontbreekt.", "Bij p = W en q = V is p \u2227 q vals. E\xE9n waar deel volstaat niet."], ["Van woorden naar symbolen.", "\u201Cp en q\u201D schrijven we als p \u2227 q. In een schakeling heet dit AND."]], tasks: [
          predict("Opent de EN-poort?", "p\u2227q", { p: true, q: true }, "Beide delen zijn waar; p \u2227 q is waar.", { defs: { p: "pas aanwezig", q: "code juist" }, visual: "gate" }),
          predict("Voorspel v\xF3\xF3r je test.", "p\u2227q", { p: true, q: false }, "De code is niet juist. EN vereist beide voorwaarden.", { defs: { p: "pas aanwezig", q: "code juist" }, visual: "gate" }),
          predict("Wat als beide signalen ontbreken?", "p\u2227q", { p: false, q: false }, "Geen van beide delen is waar; EN is vals.", { visual: "gate" }),
          build("Bouw: de sensor werkt en de accu is niet leeg.", "p\u2227\xACq", "De regel is p \u2227 \xACq: de sensor werkt \xE9n de accu is niet leeg.", { defs: { p: "sensor werkt", q: "accu leeg" }, transfer: true }),
          choice("Wat maakt een AND-uitgang zeker 0?", "E\xE9n invoer is 0. De andere invoer is onbekend.", opts("Niets; je moet beide kennen.", "De ene 0 volstaat.", "De andere moet 1 zijn."), "1", "Bij AND maakt \xE9\xE9n 0 het hele resultaat 0.", { category: "and" })
        ] },
        { name: "Disjunctie (OF)", goal: "Logische OF laat ook beide ware delen toe.", example: "p \u2228 q", lesson: [["E\xE9n is genoeg.", "p \u2228 q is waar zodra minstens \xE9\xE9n deel waar is."], ["Beide mag ook.", "Bij W,W is logische OF eveneens waar. Deze OF is inclusief."], ["Alleen V,V faalt.", "Wanneer beide delen vals zijn, is ook de OF-uitspraak vals."]], tasks: [
          predict("Voorspel de OF-uitgang.", "p\u2228q", { p: true, q: false }, "E\xE9n waar deel is voldoende voor OF.", { visual: "gate" }),
          predict("En als beide waar zijn?", "p\u2228q", { p: true, q: true }, "Logische OF betekent minstens \xE9\xE9n: beide waar is toegestaan.", { visual: "gate", category: "inclusive-or", feedback: "Bij logische OF mag ook W,W. \u201CPrecies \xE9\xE9n\u201D is een andere regel." }),
          predict("Wat als er geen signaal is?", "p\u2228q", { p: false, q: false }, "Beide delen zijn vals; OF is vals.", { visual: "gate" }),
          choice("Vertaal \u201Cminstens \xE9\xE9n back-up werkt\u201D.", "p: back-up A werkt. q: back-up B werkt.", opts("p \u2227 q", "p \u2228 q", "\xAC(p \u2228 q)"), "1", "p \u2228 q laat A, B \xE9n beide samen toe.", { transfer: true }),
          { type: "multi", prompt: "Welke situaties maken logische OF waar? Kies alle mogelijkheden.", stem: "p \u2228 q betekent: minstens \xE9\xE9n deel is waar.", options: opts("W,W", "W,V", "V,W", "V,V"), correct: ["0", "1", "2"], explanation: "W,W, W,V en V,W maken OF waar. Alleen V,V maakt OF vals.", feedback: "\u201CMinstens \xE9\xE9n\u201D omvat ook beide waar.", category: "inclusive-or" }
        ] },
        { name: "Formules en schakelingen", goal: "Koppel woorden, formule en schakeling.", example: "\xACp \u2227 q", lesson: [["Kleine bouwstenen.", "Kies links en rechts een uitspraak en plaats EN of OF ertussen."], ["Waar hoort NIET?", "\xACp \u2227 q ontkent alleen p. \xAC(p \u2227 q) ontkent de hele EN-uitspraak."], ["Test ieder geval.", "E\xE9n goede test betekent nog niet dat de regel overal werkt."]], tasks: [
          build("Bouw: p en niet q.", "p\u2227\xACq", "NIET hoort alleen bij q. De volledige regel is p \u2227 \xACq."),
          build("Bouw: niet p of q.", "\xACp\u2228q", "\xACp \u2228 q is waar wanneer p vals is of q waar is."),
          { type: "circuit", prompt: "Laat de lamp branden als p waar is en q vals.", expr: "p\u2227\xACq", explanation: "p gaat rechtstreeks naar AND; q gaat eerst door NOT.", defs: { p: "sensor actief", q: "storing" } },
          build("Bouw: het is niet zo dat beide lampen branden.", "\xAC(p\u2227q)", "De negatie gaat over beide samen. \xACp \u2228 \xACq is ook een juiste vorm.", { defs: { p: "lamp A brandt", q: "lamp B brandt" }, transfer: true }),
          { type: "circuit", prompt: "Bouw: p is vals en q is vals.", expr: "\xACp\u2227\xACq", explanation: "Beide invoeren gaan door NOT en komen daarna samen in AND." }
        ] },
        { name: "Waarheidstabellen invullen", goal: "Vul een volledige waarheidstabel zonder een geval over te slaan.", example: "WW \xB7 WV \xB7 VW \xB7 VV", lesson: [["Twee invoeren.", "Met twee onafhankelijke proposities zijn er vier waarheidstoekenningen."], ["Werk systematisch.", "Houd p eerst waar en wissel q. Houd p daarna vals en wissel q opnieuw."], ["Ieder geval telt.", "Een volledige tabel toont de formule voor alle booleaanse invoeren."]], tasks: [
          table("Vul alle vier EN-uitkomsten in.", [col("p\u2227q")], "Alleen W,W geeft W; de andere drie geven V."),
          table("Vul alle vier OF-uitkomsten in.", [col("p\u2228q")], "OF geeft W,W,W,V in deze rijvolgorde."),
          table("Vul de negatiekolom in.", [col("\xACp")], "Bij p = W is \xACp = V; bij p = V is \xACp = W.", { vars: ["p", "q"] }),
          table("Van poort naar tabel: p en niet q.", [col("\xACq"), col("p\u2227\xACq")], "De einduitkomst is alleen W bij p = W en q = V.", { transfer: true }),
          choice("Welk geval ontbreekt?", "Er zijn al WW, WV en VV.", opts("WW", "VW", "WV"), "1", "VW is het vierde onafhankelijke geval. Herhalen vervangt geen ontbrekende rij.")
        ] },
        { name: "Samengestelde formules", goal: "Bereken samengestelde formules stap voor stap.", example: "(p \u2228 q) \u2227 \xACr", lesson: [["Eerst het deel.", "Bereken wat tussen haakjes staat en wat door NIET wordt ontkend."], ["Daarna verbinden.", "Gebruik die deelwaarden als invoer voor de laatste bewerking."], ["Drie invoeren.", "Drie onafhankelijke proposities geven acht gevallen. Je ziet telkens vier volledige rijen."]], tasks: [
          predict("Bereken eerst de haakjes.", "\xAC(p\u2228q)", { p: false, q: true }, "p \u2228 q is W. De negatie daarvan is V."),
          table("Vul eerst het deel, dan de eindkolom.", [col("p\u2228q"), col("\xAC(p\u2228q)")], "De negatie keert de hele OF-kolom om."),
          predict("Bereken de samengestelde regel.", "(p\u2228q)\u2227\xACr", { p: false, q: true, r: false }, "p \u2228 q is W en \xACr is W; de EN-uitkomst is W."),
          table("Onderzoek alle acht gevallen.", [col("p\u2228q"), col("(p\u2228q)\u2227\xACr")], "De laatste kolom is W als minstens \xE9\xE9n van p en q waar is \xE9n r vals is.", { vars: ["p", "q", "r"], transfer: true }),
          choice("Waar zit de eerste fout?", "p = V, q = W. Een leerling rekent: p \u2228 q = V; daarna \xAC(p \u2228 q) = W.", opts("De OF-stap.", "Alleen de NIET-stap.", "Er is geen fout."), "0", "V \u2228 W is W. De negatie van die juiste deelwaarde is V.", { category: "intermediate" })
        ] },
        { name: "Logische gelijkwaardigheid", goal: "Vergelijk formules over alle gevallen.", example: "p \u2261 (p \u2227 q) \u2228 p", lesson: [["Een ander uiterlijk.", "Twee formules kunnen dezelfde uitkomst geven bij elke invoer."], ["E\xE9n verschil volstaat.", "Vind je \xE9\xE9n waarheidstoekenning met andere uitkomsten, dan zijn ze niet gelijkwaardig."], ["Overeenkomst vraagt alles.", "E\xE9n gelijke uitkomst bewijst geen logische gelijkwaardigheid."]], tasks: [
          difference("Vind een verschil tussen EN en OF.", "p\u2227q", "p\u2228q", "W,V en V,W maken EN vals en OF waar."),
          table("Vergelijk beide regels in alle vier gevallen.", [col("p"), col("(p\u2227q)\u2228p")], "Beide eindkolommen zijn gelijk: (p \u2227 q) \u2228 p is logisch gelijkwaardig met p.", { vars: ["p", "q"] }),
          difference("Zijn deze negaties hetzelfde? Zoek een verschil.", "\xAC(p\u2228q)", "\xACp\u2228q", "Bij p = V en q = W geeft links V en rechts W. Er zijn ook andere onderscheidende gevallen."),
          choice("Is dit bewijs voldoende?", "Twee regels geven bij p = W, q = W dezelfde uitkomst.", opts("Ja, ze zijn gelijkwaardig.", "Nee, de andere gevallen moeten nog gecontroleerd worden.", "Ze zijn dus verschillend."), "1", "E\xE9n overeenkomst zegt niets over de nog niet onderzochte gevallen.", { transfer: true, category: "single-case" }),
          choice("Vergelijk de regels.", "(p \u2228 q) \u2227 p en p.", opts("Logisch gelijkwaardig.", "Alleen gelijk als q waar is.", "Nooit gelijk."), "0", "Bij p = V zijn beide V. Bij p = W is p \u2228 q zeker W en zijn beide W.")
        ] },
        { name: "Wetten van De Morgan", goal: "Verdeel de negatie over de hele EN- of OF-uitspraak.", example: "\xAC(p \u2228 q) \u2261 \xACp \u2227 \xACq", lesson: [["Niet \xE9\xE9n van beide.", "\xAC(p \u2228 q) betekent: p vals \xE9n q vals."], ["Niet beide samen.", "\xAC(p \u2227 q) betekent: p vals \xF3f q vals; beide vals mag ook."], ["De regel.", "Negeren van een geheel keert EN en OF om en negeert elk deel."]], tasks: [
          build("Schrijf zonder NIET rond de hele formule: \xAC(p \u2228 q).", "\xACp\u2227\xACq", "NIET OF wordt EN van twee negaties.", { requireInnerNegation: true }),
          build("Schrijf zonder NIET rond de hele formule: \xAC(p \u2227 q).", "\xACp\u2228\xACq", "NIET EN wordt OF van twee negaties.", { requireInnerNegation: true }),
          difference("Vind een geval dat dit foute herstel ontmaskert.", "\xAC(p\u2227q)", "\xACp\u2227\xACq", "Bij precies \xE9\xE9n waar deel is links W en rechts V."),
          choice("Ontken de hele afspraakzin.", "\u201CDe fiets staat buiten en het slot is dicht.\u201D", opts("De fiets staat niet buiten of het slot is niet dicht.", "De fiets staat niet buiten en het slot is niet dicht.", "De fiets staat buiten of het slot is dicht."), "0", "Niet beide betekent minstens \xE9\xE9n deel niet. Dat is De Morgan voor EN.", { transfer: true }),
          table("Controleer De Morgan over alle gevallen.", [col("\xAC(p\u2228q)"), col("\xACp\u2227\xACq")], "Alle vier rijen zijn gelijk; beide formules zijn alleen W bij V,V.")
        ] },
        { name: "Tautologie en contradictie", goal: "Onderscheid tautologie, contradictie en contingent resultaat.", example: "p \u2228 \xACp \xB7 p \u2227 \xACp", lesson: [["Altijd waar.", "Een tautologie is waar bij elke waarheidstoekenning."], ["Nooit waar.", "Een contradictie is vals bij elke waarheidstoekenning."], ["Soms waar.", "Een contingente formule heeft zowel ware als valse gevallen."]], tasks: [
          classify("p\u2228\xACp", "Dit is een tautologie: p of zijn negatie is altijd waar."),
          classify("p\u2227\xACp", "Dit is een contradictie: p en zijn negatie kunnen niet tegelijk waar zijn."),
          classify("p\u2227q", "EN is soms waar: alleen bij W,W."),
          classify("(p\u2227q)\u2227(\xACp\u2228\xACq)", "Als p en q allebei waar zijn, is \xACp \u2228 \xACq vals. De hele formule is dus altijd vals.", { transfer: true }),
          classify("(p\u2228q)\u2228\xACp", "Bij p = W is p \u2228 q waar. Bij p = V is \xACp waar. De hele formule is dus altijd waar.")
        ] },
        { name: "Implicatie", goal: "Implicatie is alleen vals bij W \u21D2 V.", example: "p \u21D2 q", lesson: [["Twee feiten.", "Als een pakket dringend is, wordt het vandaag bezorgd. p: dringend; q: vandaag bezorgd."], ["De overtreding.", "Alleen een dringend pakket dat vandaag niet wordt bezorgd breekt de afspraak: W \u21D2 V."], ["Niet dringend.", "Dan zegt deze afspraak niets over bezorgen vandaag. De formule is W omdat deze situatie de afspraak niet overtreedt."]], tasks: [
          predict("Is de afspraak in dit geval overtreden? Kies de waarde van de implicatie.", "p\u21D2q", { p: true, q: false }, "Dringend en niet vandaag bezorgd: de afspraak wordt overtreden, dus de implicatie is V.", { defs: { p: "dringend", q: "vandaag bezorgd" }, visual: "monitor" }),
          predict("Beoordeel de afspraak.", "p\u21D2q", { p: false, q: true }, "Niet dringend en toch bezorgd overtreedt de afspraak niet. p \u21D2 q is W.", { defs: { p: "dringend", q: "vandaag bezorgd" }, visual: "monitor", category: "implication-false-premise" }),
          predict("Ook wanneer beide feiten vals zijn.", "p\u21D2q", { p: false, q: false }, "De voorwaarde geldt niet. Deze situatie overtreedt de afspraak niet; de formule is W.", { visual: "monitor" }),
          table("Vul de volledige implicatietabel in.", [col("p\u21D2q")], "De uitkomsten zijn W,V,W,W. Alleen W \u21D2 V is vals.", { transfer: true }),
          choice("Welke uitspraak klopt?", "De formule p \u21D2 q is waar.", opts("q is dus altijd waar.", "p kan niet vals zijn.", "q kan vals zijn, als p ook vals is."), "2", "De waarde van een implicatie is niet hetzelfde als de waarde van haar gevolg.", { category: "formula-vs-conclusion" })
        ] },
        { name: "Tegenvoorbeelden", goal: "Maak de voorwaarde waar en het gevolg vals.", example: "p = W \xB7 q = V", lesson: [["Een algemene claim.", "\u201CElk veelvoud van 4 is een veelvoud van 8.\u201D Zoek \xE9\xE9n geval waarin dit niet klopt."], ["Twee controles.", "Je getal moet wel een veelvoud van 4 zijn, maar geen veelvoud van 8. Bijvoorbeeld 12."], ["Tests en bewijs.", "E\xE9n geldig tegenvoorbeeld weerlegt een algemene claim. Een paar geslaagde tests bewijzen haar niet."]], tasks: [
          counter("Weerleg: elk veelvoud van 4 is een veelvoud van 8.", "p", "q", [2, 4, 8, 12], { 2: { p: false, q: false }, 4: { p: true, q: false }, 8: { p: true, q: true }, 12: { p: true, q: false } }, "4 en 12 zijn geldige tegenvoorbeelden: de voorwaarde is W en het gevolg V.", { defs: { p: "veelvoud van 4", q: "veelvoud van 8" } }),
          counter("Weerleg: elk oneven positief geheel getal is priem.", "p", "q", [2, 3, 9, 15], { 2: { p: false, q: true }, 3: { p: true, q: true }, 9: { p: true, q: false }, 15: { p: true, q: false } }, "9 en 15 zijn oneven maar niet priem. Beide weerleggen de claim.", { defs: { p: "oneven", q: "priem" } }),
          choice("Waarom is 6 geen tegenvoorbeeld?", "Claim: elk veelvoud van 4 is een veelvoud van 8.", opts("6 voldoet niet aan de voorwaarde.", "6 voldoet aan het gevolg.", "Een tegenvoorbeeld moet groter dan 8 zijn."), "0", "6 is geen veelvoud van 4. Het kan de claim over veelvouden van 4 niet weerleggen."),
          counter("Weerleg: x\xB2 > 4 \u21D2 x > 2, voor gehele x.", "p", "q", [-3, -2, 0, 3], { "-3": { p: true, q: false }, "-2": { p: false, q: false }, 0: { p: false, q: false }, 3: { p: true, q: true } }, "Bij x = \u22123 is x\xB2 = 9 > 4, maar x > 2 is vals.", { defs: { p: "x\xB2 > 4", q: "x > 2" }, transfer: true }),
          choice("Wat volgt uit deze tests?", "Voor x = 8, 16 en 24 klopt \u201Cveelvoud van 4 \u21D2 veelvoud van 8\u201D.", opts("De claim is bewezen voor alle getallen.", "Alleen deze drie gevallen zijn gecontroleerd.", "Er bestaat geen tegenvoorbeeld."), "1", "Drie geslaagde tests bewijzen geen algemene getallenclaim.", { category: "example-vs-proof" })
        ] },
        { name: "Omgekeerde en contrapositie", goal: "Gebruik contrapositie zonder de regel zomaar om te keren.", example: "p \u21D2 q \u2261 \xACq \u21D2 \xACp", lesson: [["Een geldige regel.", "Als p \u21D2 q gegeven en geldig is, volgt uit p dat q waar is."], ["Contrapositie.", "Als q vals is, moet p ook vals zijn. Anders krijg je de verboden combinatie W,V."], ["Niet zomaar omkeren.", "q \u21D2 p volgt niet uit p \u21D2 q. Het gevolg kan ook zonder deze voorwaarde voorkomen."]], tasks: [
          build("Bouw de contrapositie van p \u21D2 q.", "\xACq\u21D2\xACp", "Wissel de delen van plaats en ontken beide: \xACq \u21D2 \xACp.", { requiredForm: "contraposition" }),
          choice("Wat kun je uit q = W afleiden?", "Gegeven: de regel p \u21D2 q is geldig.", opts("p is zeker W.", "p is zeker V.", "p is niet bepaald door deze gegevens."), "2", "Zowel p = W als p = V is verenigbaar met een geldige regel en q = W.", { category: "converse", feedback: "Het gevolg kan voorkomen met of zonder de voorwaarde. Bekijk W,W \xE9n V,W." }),
          choice("Wat volgt uit q = V?", "Gegeven: de regel p \u21D2 q is geldig.", opts("p = V", "p = W", "Niets over p"), "0", "p kan niet W zijn, want W \u21D2 V zou de geldige regel overtreden."),
          build("Bouw de contrapositie: deelbaar door 6 \u21D2 deelbaar door 3.", "\xACq\u21D2\xACp", "Niet deelbaar door 3 \u21D2 niet deelbaar door 6.", { defs: { p: "deelbaar door 6", q: "deelbaar door 3" }, transfer: true, requiredForm: "contraposition" }),
          difference("Vind waarom de omgekeerde regel niet volgt.", "p\u21D2q", "q\u21D2p", "W,V en V,W onderscheiden de richtingen. Bij V,W is de oorspronkelijke regel W en de omgekeerde V.")
        ] },
        { name: "Nodige en voldoende voorwaarden", goal: "Benoem steeds waarvoor een voorwaarde nodig of voldoende is.", example: "p \u21D2 q: p volstaat voor q", lesson: [["Voldoende.", "p is voldoende voor q: als p geldt, krijg je gegarandeerd q."], ["Nodig.", "q is nodig voor p: zonder q kan p niet gelden."], ["Twee richtingen.", "Bij een equivalentie is elke kant zowel nodig als voldoende voor de andere."]], tasks: [
          choice("p is welke voorwaarde voor q?", "Gegeven: p \u21D2 q is een geldige regel. Alleen deze richting is gegeven.", opts("Voldoende.", "Nodig.", "Zeker beide."), "0", "p volstaat voor q. De omgekeerde richting is niet gegeven."),
          choice("q is welke voorwaarde voor p?", "Gegeven: p \u21D2 q is een geldige regel. Alleen deze richting is gegeven.", opts("Voldoende.", "Nodig.", "Geen van beide."), "1", "Zonder q kan p niet gelden. Dus q is nodig voor p."),
          choice("Deelbaar door 12 is \u2026 voor deelbaar door 6.", "Domein: positieve gehele getallen.", opts("Nodig maar niet voldoende.", "Voldoende maar niet nodig.", "Nodig en voldoende."), "1", "Een veelvoud van 12 is een veelvoud van 6. Maar 6 is deelbaar door 6 en niet door 12."),
          choice("Even zijn is \u2026 voor deelbaar door 2.", "Domein: gehele getallen.", opts("Alleen nodig.", "Alleen voldoende.", "Nodig en voldoende."), "2", "Voor gehele getallen betekenen \u201Ceven\u201D en \u201Cdeelbaar door 2\u201D hetzelfde.", { transfer: true }),
          choice("\u201CVierhoek\u201D is \u2026 voor \u201Cvierkant\u201D.", "Domein: vlakke figuren.", opts("Nodig maar niet voldoende.", "Voldoende maar niet nodig.", "Nodig en voldoende."), "0", "Elk vierkant is een vierhoek. Een vierhoek hoeft geen vierkant te zijn.")
        ] },
        { name: "Equivalentie", goal: "Equivalentie vraagt twee gelijke waarheidswaarden.", example: "p \u21D4 q", lesson: [["Heen en terug.", "p \u21D4 q betekent (p \u21D2 q) \u2227 (q \u21D2 p). Beide richtingen moeten kloppen."], ["Gelijke waarden.", "W,W \xE9n V,V maken de equivalentie waar. Verschillende waarden maken haar vals."], ["Twee begrippen.", "p \u21D4 q heeft een waarde per situatie. Logische gelijkwaardigheid van formules gaat over \xE1lle situaties."]], tasks: [
          predict("Bereken de equivalentie.", "p\u21D4q", { p: true, q: true }, "Beide waar: de equivalentie is W."),
          predict("En als beide vals zijn?", "p\u21D4q", { p: false, q: false }, "Ook twee valse delen geven een ware equivalentie.", { category: "equivalence-00" }),
          table("Vul de equivalentietabel in.", [col("p\u21D4q")], "De uitkomsten zijn W,V,V,W: gelijke waarden geven W."),
          choice("Welke formule past bij \u201Cals en slechts als\u201D?", "De locker opent als en slechts als de pas geldig is.", opts("p \u21D2 q", "q \u21D2 p", "p \u21D4 q"), "2", "\u201CAls en slechts als\u201D geeft beide richtingen.", { defs: { p: "locker opent", q: "pas geldig" }, transfer: true }),
          table("Vergelijk de twee schrijfwijzen.", [col("p\u21D4q"), col("(p\u21D2q)\u2227(q\u21D2p)", "heen \xE9n terug")], "Voor alle vier rijen zijn de kolommen gelijk.")
        ] },
        { name: "Wiskundige redeneringen", goal: "Pas logica toe met een expliciet wiskundig domein.", example: "even \u21D4 deelbaar door 2", lesson: [["Noem het domein.", "Een claim gaat bijvoorbeeld over gehele getallen of vlakke driehoeken."], ["Een gevolg testen.", "\u201CDeelbaar door 10 \u21D2 deelbaar door 5\u201D klopt omdat 10k = 5 \xB7 (2k)."], ["Bewijzen met contrapositie.", "Voor geheel n: als n even is, dan is n\xB2 even. Daaruit volgt: n\xB2 oneven \u21D2 n oneven."]], tasks: [
          choice("Welke algemene redenering bewijst de regel?", "Voor geheel n: deelbaar door 10 \u21D2 deelbaar door 5.", opts("10, 20 en 30 zijn deelbaar door 5.", "n = 10k = 5 \xB7 (2k), met k geheel.", "Alle getallen zijn deelbaar door 5."), "1", "De vorm 5 \xB7 (2k) geldt voor elk geheel veelvoud van 10; dit is een algemene redenering."),
          counter("Weerleg: elk priemgetal is oneven.", "p", "q", [2, 3, 4, 9], { 2: { p: true, q: false }, 3: { p: true, q: true }, 4: { p: false, q: false }, 9: { p: false, q: true } }, "2 is priem maar niet oneven.", { defs: { p: "priem", q: "oneven" } }),
          choice("Beoordeel de redenering.", "In een vlakke driehoek zijn twee hoeken 80\xB0. Dus de derde is 20\xB0 en de driehoek is gelijkbenig.", opts("Geldig: gelijke hoeken geven gelijke overstaande zijden.", "Ongeldig: alle hoeken moeten gelijk zijn.", "Alleen geldig in een rechthoekige driehoek."), "0", "De twee gelijke hoeken leveren twee gelijke overstaande zijden."),
          choice("Welke contrapositie hoort bij de claim?", "Voor geheel n: n\xB2 oneven \u21D2 n oneven.", opts("n even \u21D2 n\xB2 even", "n oneven \u21D2 n\xB2 oneven", "n\xB2 even \u21D2 n even"), "0", "De contrapositie verwisselt beide delen en ontkent ze. Bij gehele getallen is niet oneven hetzelfde als even.", { transfer: true }),
          choice("Vervolledig het bewijs met contrapositie.", "Geheel n = 2k. Dan is n\xB2 = \u2026", opts("2k\xB2, dus oneven.", "4k\xB2 = 2 \xB7 (2k\xB2), dus even.", "4k, dus altijd priem."), "1", "n\xB2 is tweemaal een geheel getal, dus even. Daarmee is de contrapositie bewezen.")
        ] },
        { name: "Redeneringen toetsen", goal: "Beoordeel regels samen en verantwoorde conclusies.", example: "p, p \u21D2 q \u27F9 q", lesson: [["Alle regels tegelijk.", "Een kandidaat moet aan elke gegeven regel voldoen."], ["Zeker of mogelijk?", "Een conclusie is zeker als zij geldt in alle toegelaten situaties. Soms blijft meer dan \xE9\xE9n situatie over."], ["Een compact dossier.", "Test de mogelijkheden systematisch en gebruik \xE9\xE9n geldig geval om een onterechte conclusie te weerleggen."]], tasks: [
          choice("Welke conclusie is zeker?", "Gegeven: p \u21D2 q en q \u21D2 r zijn geldig. p is waar.", opts("r is waar.", "r is vals.", "r is niet bepaald."), "0", "Uit p volgt q. Uit q volgt r. Dit is een geldige keten."),
          choice("Welke conclusie is verantwoord?", "Gegeven: p \u21D2 q is geldig. q is waar.", opts("p is zeker waar.", "p is zeker vals.", "p kan waar of vals zijn."), "2", "W,W en V,W zijn beide toegelaten. Je kunt p dus niet bepalen."),
          classify("(p\u2227(p\u21D2q))\u21D2q", "Dit is modus ponens. Als p en p \u21D2 q waar zijn, is q waar. In andere gevallen is de buitenste voorwaarde vals; de formule blijft W."),
          { type: "puzzle", prompt: "Wie heeft de reservemodule? Precies \xE9\xE9n robot heeft haar; precies twee uitspraken zijn waar.", stem: "Noor: \u201CIlias of Mei heeft haar.\u201D Ilias: \u201CNoor heeft haar niet.\u201D Mei: \u201CIlias heeft haar niet.\u201D", defs: { p: "Noor heeft de module", q: "Ilias heeft de module", r: "Mei heeft de module" }, rules: ["q\u2228r", "\xACp", "\xACq"], ruleNames: ["Noor", "Ilias", "Mei"], trueCount: 2, candidates: [{ id: "noor", label: "Noor", env: { p: true, q: false, r: false } }, { id: "ilias", label: "Ilias", env: { p: false, q: true, r: false } }, { id: "mei", label: "Mei", env: { p: false, q: false, r: true } }], explanation: "Bij Ilias zijn Noors en Ilias\u2019 uitspraken waar en Mei\u2019s uitspraak vals. Bij Noor is er \xE9\xE9n ware uitspraak; bij Mei drie.", transfer: true },
          choice("Klopt deze conclusie?", "Geldig: p \u21D2 \xACq en q \u21D2 r. Iemand besluit: \xACr \u21D2 p.", opts("Ja, de regels bewijzen het.", "Nee. p = V, q = V, r = V is een tegenvoorbeeld.", "Nee. p = W, q = V, r = V is een tegenvoorbeeld."), "1", "Bij V,V,V zijn beide gegeven regels W, maar \xACr \u21D2 p is V. Dus de conclusie volgt niet.", { category: "invalid-inference" })
        ] }
      ];
      stops.forEach((s, i) => {
        s.id = i;
        s.district = districts.findIndex((d) => d.stops.includes(i));
        s.tasks.forEach((t, j) => {
          t.id = "L" + String(i + 1).padStart(2, "0") + "-" + (j + 1);
          t.skill = i;
          t.hint = t.hint || s.lesson[1][1];
          t.role = j === 0 ? "instap" : j === 3 ? "transfer" : j === 4 ? "gemengd" : "zelfstandig";
        });
      });
      const bonus = [
        predict("Voorspel NAND: AND gevolgd door NOT.", "\xAC(p\u2227q)", { p: true, q: true }, "AND geeft 1; NOT keert dat om naar 0. De NAND-uitgang is V."),
        table("Vul de NAND-tabel in.", [col("p\u2227q", "AND"), col("\xAC(p\u2227q)", "NAND")], "NAND keert de AND-kolom om: V,W,W,W.", { transfer: true }),
        { type: "circuit", prompt: "Bouw een NOR-regel: OR gevolgd door NOT.", expr: "\xAC(p\u2228q)", explanation: "NOR is OR gevolgd door NOT; de uitgang is alleen 1 bij 0,0.", allowDerived: true, transfer: true },
        { type: "multi", prompt: "Welke poorten passen bij deze ene rij? Kies alle mogelijkheden.", stem: "Invoer 0,0 geeft uitgang 0.", options: opts("AND", "OR", "NAND", "NOR"), correct: ["0", "1"], explanation: "Zowel AND als OR geeft 0 bij 0,0. Deze ene rij onderscheidt ze nog niet.", feedback: "NAND is NIET AND; NOR is NIET OR. Bereken iedere uitgang bij 0,0." }
      ];
      bonus.forEach((t, i) => {
        t.id = "B-POORT-" + (i + 1);
        t.skill = 5;
        t.role = "verdieping";
        t.bonus = true;
        t.hint = "NAND is AND gevolgd door NOT. NOR is OR gevolgd door NOT. Bereken eerst AND of OR en keer de uitkomst dan om.";
      });
      return { districts, stops, bonus, tasks: [...stops.flatMap((s) => s.tasks), ...bonus], version: "0.2.0" };
    });
  }
});

// games/logicawereld/battle-config.js
var require_battle_config = __commonJS({
  "games/logicawereld/battle-config.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object" && module.exports) module.exports = factory(require_logic(), require_content());
      else root.BattleGame = factory(root.Logic, root.LogicContent);
    })(typeof globalThis === "object" ? globalThis : exports, (L, C) => {
      "use strict";
      const skills = C.stops.map((s) => ({ id: "L" + String(s.id + 1).padStart(2, "0"), label: s.name }));
      const worlds = C.districts.map((d) => ({ id: d.id, name: d.name, skills: d.stops.map((i) => skills[i].id) }));
      function generate(spec) {
        const index = skills.findIndex((s) => s.id === spec?.skill);
        if (index < 0 || !Number.isInteger(spec.seed) || spec.seed < 0 || spec.seed > 4294967295 || !Number.isInteger(spec.variant) || spec.variant < 0 || spec.variant > 3) throw Error("Ongeldige logica-opgave.");
        return C.stops[index].tasks[(spec.seed + spec.variant) % C.stops[index].tasks.length];
      }
      function validate(task, answer) {
        try {
          return { ok: L.validate(task, answer?.value).correct === true };
        } catch {
          return { ok: false };
        }
      }
      return { id: "logicawereld", appId: "logicawereld", title: "Logicawereld", rpc: "axioma_game_class", classFunction: "logica-class", coverEverySkill: true, playerURL: "battle-player.html", skills, worlds, mixedSkills: skills.map((s) => s.id), generate, validate };
    });
  }
});

// shared/multiplayer/logica-battle-policy.cjs
var require_logica_battle_policy = __commonJS({
  "shared/multiplayer/logica-battle-policy.cjs"(exports, module) {
    var Game = require_battle_config();
    function pool(_a, _b, world) {
      return world === "mixed" ? Game.mixedSkills : Game.worlds.find((w) => w.id === world)?.skills || [];
    }
    function grade(spec, answer) {
      try {
        return Game.validate(Game.generate(spec), answer).ok;
      } catch {
        return false;
      }
    }
    module.exports = { pool, grade };
  }
});
export default require_logica_battle_policy();
