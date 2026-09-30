var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// games/rechten/core/transfer-workbench-core.js
var require_transfer_workbench_core = __commonJS({
  "games/rechten/core/transfer-workbench-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory;
      else root.RechtenTransferWorkbenchInstall = factory;
    })(globalThis, function(C) {
      "use strict";
      const old = { generate: C.generate, stages: C.stages, expected: C.expected, check: C.check, submit: C.submit }, legacy = C.transfer;
      const active = ["graph_from_table", "equation_from_graph", "equation_from_table"];
      C.activeTransferSkills = active;
      C.disabledSkills = ["equation_from_context"];
      C.order.splice(C.order.indexOf("equation_from_context"), 1);
      delete C.requirements.equation_from_context;
      C.required.graph_from_table = ["positive", "negative", "horizontal", "fraction"];
      C.required.equation_from_table = ["positive", "negative", "horizontal", "fraction"];
      const modern = (t) => active.includes(t.skill) && t.params.transferVersion === 2;
      const zeroColumn = (t) => t.params.rows.findIndex((p) => C.eq(p.x, 0));
      function generate(skill, opt = {}) {
        const p = old.generate(skill, opt);
        if (!active.includes(skill)) return p;
        if (skill !== "equation_from_graph") {
          const candidates = [];
          for (let x = -5; x <= 5; x++) {
            const X = C.mul(x, p.scaleX), y = C.add(C.mul(p.model.a, X), p.model.b), tick = C.div(y, p.scaleY);
            if (tick.d === 1 && Math.abs(tick.n) <= 5) candidates.push({ x: X, y });
          }
          const others = candidates.filter((P) => P.x.n), zero = candidates.find((P) => !P.x.n);
          p.rows = (opt.variant || 0) % 2 === 0 && zero ? [others[0], zero, others.at(-1)] : [others[0], others[1], others.at(-1)];
          if (skill === "graph_from_table" && !opt.difficulty) p.rows = p.rows.slice(0, 2);
          p.variant = !p.model.a.n ? "horizontal" : p.model.a.d > 1 ? "fraction" : p.model.a.n < 0 ? "negative" : "positive";
        }
        return { ...p, transferVersion: 2 };
      }
      function stages(t) {
        if (t.skill === "graph_from_table") return ["drawTable"];
        if (t.skill === "equation_from_graph") return ["matchGraph"];
        return [...zeroColumn(t) >= 0 ? ["tableB"] : [], "slopeFraction", "tableA", "installA", ...zeroColumn(t) < 0 ? ["pointX", "pointY", "pointProduct", ...t.params.model.a.n ? ["solveB"] : [], "installB"] : []];
      }
      function selectedPoint(t, w) {
        return t.params.rows[w.values.pointX?.column ?? 0];
      }
      function equation(t, w) {
        const P = selectedPoint(t, w);
        return w.bEquation || { left: C.expr(0, 1, C.mul(t.params.model.a, P.x)), right: C.expr(0, 0, P.y) };
      }
      function expected(t, w, stage = stages(t)[w.index]) {
        const m = t.params.model;
        switch (stage) {
          case "tableB":
            return { column: zeroColumn(t), axis: "y" };
          case "slopeFraction":
            return { ys: [{ column: 1, axis: "y" }, { column: 0, axis: "y" }], xs: [{ column: 1, axis: "x" }, { column: 0, axis: "x" }] };
          case "tableA":
            return m.a;
          case "installA":
            return "a";
          case "installB":
            return "b";
          case "pointX":
            return { column: 0, axis: "x" };
          case "pointY":
            return { column: w.values.pointX.column, axis: "y" };
          case "pointProduct":
            return C.mul(m.a, selectedPoint(t, w).x);
          case "solveB": {
            const e = equation(t, w);
            if (e.right.y.n) return { kind: "subtract", term: "y", value: e.right.y };
            if (e.left.c.n) return { kind: "subtract", term: "c", value: e.left.c };
            return { kind: "divide", value: e.left.y };
          }
          case "matchGraph":
            return { a: m.a, b: m.b };
          case "drawTable":
            return t.params.rows.slice(0, 2);
        }
      }
      function check(t, w, value) {
        const stage = stages(t)[w.index], p = t.params, fail = (code, message) => ({ ok: false, code: "wave.transfer." + code, message }), ok = { ok: true, message: "Dit klopt." };
        const cell = (v, axis) => v?.axis === axis && Number.isInteger(v.column) && !!p.rows[v.column];
        try {
          if (stage === "tableB") return cell(value, "y") && C.eq(p.rows[value.column].x, 0) ? ok : fail("tableB", "Neem f(x) uit de kolom waar x = 0. Die functiewaarde is b.");
          if (stage === "slopeFraction") {
            const ys = value?.ys, xs = value?.xs;
            if (!Array.isArray(ys) || !Array.isArray(xs) || ys.length !== 2 || xs.length !== 2 || !ys.every((v) => cell(v, "y")) || !xs.every((v) => cell(v, "x"))) return fail("fractionAxes", "Boven staan twee f(x)-waarden; onder staan de bijbehorende x-waarden.");
            if (ys[0].column === ys[1].column || C.eq(p.rows[ys[0].column].x, p.rows[ys[1].column].x)) return fail("fractionPoints", "Gebruik twee verschillende punten.");
            if (ys.some((v, i) => v.column !== xs[i].column)) return fail("fractionOrder", "Gebruik boven en onder dezelfde kolommen, in dezelfde volgorde.");
            return ok;
          }
          if (stage === "pointX") return cell(value, "x") ? ok : fail("pointX", "Sleep een x-waarde uit de tabel naar x.");
          if (stage === "pointY") return cell(value, "y") && value.column === w.values.pointX.column ? ok : fail("pointY", "Neem f(x) uit dezelfde kolom als de gekozen x.");
          if (stage === "solveB") {
            const e = equation(t, w), next = C.operate(e, value);
            if (!C.equivalent(e, next)) return fail("equivalence", "Dezelfde bewerking moet op beide leden gebeuren.");
            return { ...ok, nextB: next };
          }
          if (stage === "drawTable") {
            if (!Array.isArray(value) || value.length !== 2 || value.some((P) => !P || !["x", "y"].every((k) => {
              const v = C.div(P[k], p[k === "x" ? "scaleX" : "scaleY"]);
              return v.d === 1 && Math.abs(v.n) <= 5;
            }))) return fail("drawPoints", "Plaats twee punten op het rooster.");
            const m = C.model(...value);
            if (m.kind === "identical") return fail("drawSame", "Plaats twee verschillende punten.");
            if (m.kind !== "affine" || !p.rows.every((P) => C.onLine(P, m))) return fail("drawLine", "Je rechte past nog niet bij alle tabelpunten. Verplaats een punt en kijk opnieuw.");
            return ok;
          }
          if (stage === "matchGraph") {
            if (!value?.a || !value?.b) return fail("coefficients", "Stel a en b in door te scrollen of te vegen.");
            if (!C.eq(value.a, p.model.a)) return fail("graphA", "De helling klopt nog niet. Kijk hoeveel f(x) verandert als x toeneemt.");
            return C.eq(value.b, p.model.b) ? ok : fail("graphB", "Het snijpunt met de y-as klopt nog niet. Pas b aan.");
          }
          const want = expected(t, w);
          return typeof want === "string" ? value === want ? ok : fail("install", "Sleep de gevonden waarde naar de juiste letter.") : C.eq(value, want) ? ok : fail(stage, stage === "tableA" ? "Bereken het verschil van de functiewaarden gedeeld door het verschil van de x-waarden." : "Vermenigvuldig a met de gekozen x-waarde.");
        } catch {
          return fail("value", "Controleer je invoer. De noemer of deler mag niet nul zijn.");
        }
      }
      function submit(t, w, value) {
        if (w.done) return { ok: false, code: "done" };
        const stage = stages(t)[w.index], r = check(t, w, value);
        w.steps.push({ stage, value: structuredClone(value), ok: r.ok, code: r.ok ? null : r.code });
        w.steps = w.steps.slice(-32);
        if (!r.ok) {
          if (!w.errors.includes(r.code)) w.errors.push(r.code);
          return r;
        }
        w.history.push({ index: w.index, values: structuredClone(w.values), bEquation: structuredClone(w.bEquation || null) });
        w.history = w.history.slice(-32);
        if (r.nextB) {
          w.bEquation = r.nextB;
          if (C.isolated(r.nextB, "y")) {
            w.values.b = r.nextB.right.c;
            w.values.solveB = true;
            w.index++;
          }
        } else {
          w.values[stage] = structuredClone(value);
          if (stage === "tableB") w.values.b = pValue(t, value);
          if (stage === "tableA") w.values.a = C.q(value);
          if (stage === "pointProduct" && !t.params.model.a.n) w.values.b = selectedPoint(t, w).y;
          w.index++;
        }
        w.entry = ["", "1"];
        w.part = 0;
        w.replace = false;
        w.fraction = false;
        delete w.selectedTerm;
        w.done = w.index === stages(t).length;
        return r;
      }
      const pValue = (t, cell) => t.params.rows[cell.column][cell.axis];
      const coefficientValues = (axis) => axis === "a" ? [-4, -3, -2, -1.5, -1, -0.75, -2 / 3, -0.5, -1 / 3, -0.25, 0, 0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.5, 2, 3, 4].map(C.fromNumber) : Array.from({ length: 33 }, (_, i) => C.q(i - 16, 2));
      C.transferWorkbench = { modern, generate, stages, zeroColumn, selectedPoint, equation, expected, check, submit, coefficientValues };
      C.generate = generate;
      C.stages = (t) => modern(t) ? stages(t) : old.stages(t);
      C.expected = (t, w, s) => modern(t) ? expected(t, w, s) : old.expected(t, w, s);
      C.check = (t, w, v) => modern(t) ? check(t, w, v) : old.check(t, w, v);
      C.submit = (t, w, v) => modern(t) ? submit(t, w, v) : old.submit(t, w, v);
      C.transfer = { ...legacy, legacyGenerate: legacy.generate, generate: (skill, opt) => generate(skill, opt), stages: (t, w) => modern(t) ? stages(t) : legacy.stages(t, w), expected: (t, w, s) => modern(t) ? expected(t, w, s) : legacy.expected(t, w, s) };
    });
  }
});

// games/rechten/core/transfer-core.js
var require_transfer_core = __commonJS({
  "games/rechten/core/transfer-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory;
      else root.RechtenTransferInstall = factory;
    })(globalThis, function(C) {
      "use strict";
      const { q, add, sub, mul, div, eq, num, model } = C;
      const skills = ["graph_from_table", "equation_from_graph", "equation_from_table", "equation_from_context"];
      Object.assign(C.catalog, {
        graph_from_table: { label: "rechte uit tabel tekenen", requires: ["point_plot", "table"] },
        equation_from_graph: { label: "voorschrift uit grafiek", requires: ["ab", "slope_from_two_points", "equation_from_point_slope"] },
        equation_from_table: { label: "voorschrift uit tabel", requires: ["table", "equation_from_two_points"] },
        equation_from_context: { label: "voorschrift uit context", requires: ["equation_from_ab", "fx"] }
      });
      for (const k of skills) C.requirements[k] = C.catalog[k].requires;
      C.order.splice(C.order.indexOf("zeroRead"), 0, "graph_from_table");
      C.order.push(...skills.filter((k) => k !== "graph_from_table"));
      Object.assign(C.required, {
        graph_from_table: ["positive", "negative", "horizontal", "fraction", "inconsistent"],
        equation_from_graph: ["positive", "negative", "horizontal", "fraction", "offscreen"],
        equation_from_table: ["positive", "negative", "horizontal", "fraction", "inconsistent"],
        equation_from_context: ["increase", "decrease", "constant", "two-situations"]
      });
      const base = { generate: C.generate, stages: C.stages, check: C.check, expected: C.expected, submit: C.submit, signature: C.signature, evidence: C.evidence };
      const is = (t) => skills.includes(t.skill), point = (x, y) => ({ x: q(x), y: q(y) }), at = (m, x) => add(mul(m.a, x), m.b);
      function generate(skill, { difficulty = 0, variant = 0, seed = 1 } = {}) {
        const v = (variant % 12 + 12) % 12;
        if (skill === "equation_from_context") {
          const kind = difficulty === 0 ? "taxi" : ["taxi", "tank", "parking"][v % 3];
          const a = kind === "parking" ? q(0) : kind === "tank" ? difficulty === 2 ? q(-1, 2) : q(-2) : difficulty === 2 ? q(3, 2) : q(2 + seed % 2), b = q(kind === "tank" ? 12 + seed % 3 : 3 + seed % 3);
          const m2 = { kind: "affine", a, b }, max = kind === "tank" ? div(b, mul(-1, a)) : q(kind === "taxi" ? 10 : 8), xs = difficulty === 2 ? [q(2), q(4)] : [q(0), q(2)], rows2 = xs.map((x) => ({ x, y: at(m2, x) }));
          return { model: m2, rows: rows2, context: { kind, xUnit: kind === "taxi" ? "km" : kind === "tank" ? "min" : "uur", yUnit: kind === "tank" ? "liter" : "\u20AC", domain: { min: q(0), max }, testX: q(3) }, variant: difficulty === 2 ? "two-situations" : kind === "taxi" ? "increase" : kind === "tank" ? "decrease" : "constant", representation: "context", support: difficulty === 0 ? "guided" : "independent" };
        }
        const tickSlope = difficulty === 0 ? q(v % 2 ? 1 : -1) : [q(1), q(-1), q(1, 2), q(-1, 2), q(0), q(1), q(-1), q(1, 2), q(-1, 2), q(0), q(1), q(-1)][v];
        const scaleX = difficulty === 2 ? q(v % 2 ? 2 : 1) : q(1), scaleY = q(1), tickB = q(seed % 3 - 1);
        if (skill === "equation_from_graph" && difficulty === 2 && v >= 10) tickB.n = 6 * (seed % 2 ? 1 : -1);
        const m = { kind: "affine", a: div(mul(tickSlope, scaleY), scaleX), b: mul(tickB, scaleY) };
        const candidates = [];
        for (let x = -5; x <= 5; x++) {
          const y = add(mul(tickSlope, x), tickB);
          if (y.d === 1 && Math.abs(y.n) <= 5) candidates.push(point(mul(x, scaleX), mul(y, scaleY)));
        }
        let rows;
        if (skill === "equation_from_graph") rows = [candidates[1], candidates.at(-2)];
        else {
          const indices = difficulty === 0 ? [0, 2, 4] : [0, 1, 3];
          rows = indices.map((i) => structuredClone(candidates[i]));
          if (skill === "graph_from_table" && difficulty === 0) rows = rows.slice(0, 2);
          if (difficulty === 2 && v >= 10) rows[2].y = add(rows[2].y, rows[2].y.n >= 4 ? -1 : 1);
        }
        const inconsistent = skill !== "equation_from_graph" && difficulty === 2 && v >= 10;
        return { model: m, rows, scaleX, scaleY, variant: inconsistent ? "inconsistent" : Math.abs(num(tickB)) > 5 ? "offscreen" : !m.a.n ? "horizontal" : m.a.d > 1 ? "fraction" : m.a.n < 0 ? "negative" : "positive", representation: skill === "equation_from_graph" ? "graph" : "table", support: difficulty === 0 ? "guided" : "independent" };
      }
      function points(t, w) {
        const v = w.values;
        return t.skill === "equation_from_graph" ? [v.pickA, v.pickB] : [t.params.rows[v.colA ?? 0], t.params.rows[v.colB ?? 1]];
      }
      function candidate(t, w) {
        const [A, B] = points(t, w);
        return A && B ? model(A, B) : t.params.model;
      }
      function rest(t, w) {
        return t.params.rows?.find((_, i) => i !== w.values.colA && i !== w.values.colB);
      }
      function stages(t, w = t.work || C.fresh(t)) {
        const slope = ["ys", "xs", "dy", "dx", "a"], b = ["point", "subY", "subX", "ax", "b"], finish = ["formulaA", "formulaB", "verifyA", "verifyB"];
        if (t.skill === "graph_from_table") return ["colA", "plotA", "colB", "plotB", "draw", ...t.params.rows.length === 3 ? ["plotRest", "tableVerdict"] : []];
        if (t.skill === "equation_from_graph") return ["pickA", "pickB", ...slope, "bRoute", ...w.values.bRoute === "read" ? ["readB"] : b, ...finish];
        if (t.skill === "equation_from_table") return ["colA", "colB", ...slope, ...b, ...finish, "verifyRest", "tableVerdict"];
        return [...t.difficulty === 2 ? ["colA", "colB", ...slope, ...b, ...finish] : ["roleA", "contextA", "roleB", "contextB", "formulaA", "formulaB"], "contextZero", "contextTest", "contextDomain"];
      }
      function proxy(t, w, stage) {
        const [A, B] = points(t, w), m = t.skill === "equation_from_context" ? t.params.model : candidate(t, w), task = { ...t, legacyTransfer: true, skill: "equation_from_two_points", params: { A, B, model: m } }, work = { ...w, index: base.stages(task).indexOf(stage) };
        return { task, work };
      }
      function expected(t, w, stage = stages(t, w)[w.index]) {
        const p = t.params, m = candidate(t, w);
        if (stage === "plotA") return p.rows[w.values.colA];
        if (stage === "plotB") return p.rows[w.values.colB];
        if (stage === "plotRest") return rest(t, w);
        if (stage === "verifyRest") return at(m, rest(t, w).x);
        if (stage === "tableVerdict") return C.onLine(rest(t, w), m) ? "fits" : "none";
        if (stage === "readB" || stage === "contextB") return p.model.b;
        if (stage === "contextA") return p.model.a;
        if (stage === "roleA") return "rate";
        if (stage === "roleB") return "start";
        if (stage === "draw") return "draw";
        if (stage === "contextZero") return p.model.b;
        if (stage === "contextTest") return at(p.model, p.context.testX);
        if (stage === "contextDomain") return "inside";
        if (["colA", "colB", "pickA", "pickB", "bRoute"].includes(stage)) return null;
        const z = proxy(t, w, stage);
        return base.expected(z.task, z.work, stage);
      }
      function check(t, w, value) {
        const stage = stages(t, w)[w.index], p = t.params, fail = (code, message, extra = {}) => ({ ok: false, code: "wave.transfer." + code, message, ...extra }), ok = { ok: true, message: "Stap klopt." };
        if (stage === "colA" || stage === "colB") return Number.isInteger(value) && p.rows[value] && !(stage === "colB" && value === w.values.colA) ? ok : fail("columns", "Kies twee verschillende tabelkolommen.");
        if (stage === "pickA" || stage === "pickB") {
          try {
            if (!value || !["x", "y"].every((k) => {
              const tick = div(value[k], p[k === "x" ? "scaleX" : "scaleY"]);
              return tick.d === 1 && Math.abs(tick.n) <= 5;
            })) return fail("grid", "Kies een zichtbaar roosterpunt.");
            if (stage === "pickB" && eq(value.x, w.values.pickA.x) && eq(value.y, w.values.pickA.y)) return fail("identical", "Kies een ander punt: twee identieke punten bepalen geen rechte.");
            if (!C.onLine(value, p.model)) return fail("point", "Dit punt ligt naast de getekende rechte. Je andere punt blijft behouden.");
            return ok;
          } catch {
            return fail("grid", "Kies een geldig roosterpunt.");
          }
        }
        if (stage.startsWith("plot")) {
          const target = expected(t, w, stage);
          try {
            const x = eq(value.x, target.x), y = eq(value.y, target.y);
            return x && y ? ok : fail(x ? "plotY" : y ? "plotX" : "plotBoth", x ? "x klopt. Verbeter alleen y volgens de gekozen kolom." : y ? "y klopt. Verbeter alleen x volgens de gekozen kolom." : "Neem x en y uit dezelfde gekozen tabelkolom.", { correctAxes: { x, y } });
          } catch {
            return fail("plotBoth", "Plaats het punt uit de gekozen kolom.");
          }
        }
        if (stage === "bRoute") return value === "point" || value === "read" && Math.abs(num(div(p.model.b, p.scaleY))) <= 5 ? ok : fail("interceptView", "Het y-snijpunt ligt buiten het venster. Bereken b met \xE9\xE9n van je punten.");
        if (["ys", "xs", "dy", "dx", "a", "point", "subY", "subX", "ax", "b", "formulaA", "formulaB", "verifyA", "verifyB"].includes(stage)) {
          const z = proxy(t, w, stage);
          return base.check(z.task, z.work, value, stage);
        }
        const want = expected(t, w, stage);
        let valid = false;
        try {
          valid = want && typeof want === "object" ? eq(value, want) : value === want;
        } catch {
        }
        const messages = { readB: "Lees b af op de y-as. De assenschaal telt mee.", roleA: "De verandering per eenheid bepaalt a, inclusief het teken bij afname.", roleB: "De waarde bij x = 0 bepaalt b.", contextA: "Gebruik de verandering per eenheid. Bij afname is a negatief.", contextB: "Neem de startwaarde: de uitvoer bij x = 0.", contextZero: "Vul x = 0 in je voorschrift in; de uitvoer heeft dezelfde eenheid als y.", contextTest: "Vul de gevraagde invoer in je formule in en behoud de eenheden.", contextDomain: "Gebruik een niet-negatieve invoer binnen het gegeven bereik.", verifyRest: "Bereken de uitvoer van je formule bij de x uit de overblijvende kolom.", tableVerdict: "Vergelijk de derde y met je rechte of berekende uitvoer. E\xE9n afwijkend punt betekent dat geen affine formule door alle tabelpunten gaat.", draw: "Trek de rechte door de twee geplaatste punten." };
        return valid ? ok : fail(stage, messages[stage] || "Controleer deze stap.");
      }
      function submit(t, w, value) {
        if (w.done) return { ok: false, code: "done" };
        const stage = stages(t, w)[w.index], r = check(t, w, value);
        w.steps.push({ stage, value, ok: r.ok, code: r.ok ? null : r.code });
        w.steps = w.steps.slice(-32);
        if (!r.ok) {
          if (!w.errors.includes(r.code)) w.errors.push(r.code);
          return r;
        }
        w.history.push({ index: w.index, values: structuredClone(w.values), cursor: structuredClone(w.cursor || { x: 0, y: 0 }) });
        w.history = w.history.slice(-32);
        w.values[stage] = structuredClone(value);
        w.index++;
        w.tokens = [];
        w.entry = ["", "1"];
        w.part = 0;
        w.replace = false;
        w.gridEdits = [];
        w.done = w.index === stages(t, w).length;
        return r;
      }
      C.transferSkills = skills;
      C.transfer = { generate, stages, points, candidate, rest, proxy, expected, check, submit };
      C.generate = (skill, opt) => skills.includes(skill) ? generate(skill, opt) : base.generate(skill, opt);
      C.stages = (t) => is(t) ? stages(t) : base.stages(t);
      C.expected = (t, w, stage) => is(t) ? expected(t, w, stage) : base.expected(t, w, stage);
      C.check = (t, w, v) => is(t) ? check(t, w, v) : base.check(t, w, v);
      C.submit = (t, w, v) => is(t) ? submit(t, w, v) : base.submit(t, w, v);
      const selectedTask = (t) => is(t) ? { ...t, params: { ...t.params, selected: t.work ? points(t, t.work) : null } } : t;
      C.signature = (t) => base.signature(selectedTask(t));
      C.evidence = (st, t, total, clean) => base.evidence(st, selectedTask(t), total, clean);
      if (typeof module === "object") require_transfer_workbench_core()(C);
      else globalThis.RechtenTransferWorkbenchInstall(C);
    });
  }
});

// games/rechten/core/wave-core.js
var require_wave_core = __commonJS({
  "games/rechten/core/wave-core.js"(exports, module) {
    (function(root, factory) {
      const api = factory();
      if (typeof module === "object") {
        require_transfer_core()(api);
        module.exports = api;
      } else {
        root.RechtenTransferInstall(api);
        root.RechtenWave = api;
      }
    })(globalThis, () => {
      "use strict";
      function q(n, d = 1) {
        if (n && typeof n === "object") return q(n.n, n.d);
        if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || !d) throw Error("Ongeldige breuk");
        if (d < 0) {
          n = -n;
          d = -d;
        }
        let a = Math.abs(n), b = d;
        while (b) [a, b] = [b, a % b];
        return { n: n / (a || 1) || 0, d: d / (a || 1) };
      }
      const add = (a, b) => {
        a = q(a);
        b = q(b);
        return q(a.n * b.d + b.n * a.d, a.d * b.d);
      }, neg = (a) => {
        a = q(a);
        return q(-a.n, a.d);
      }, sub = (a, b) => add(a, neg(b)), mul = (a, b) => {
        a = q(a);
        b = q(b);
        return q(a.n * b.n, a.d * b.d);
      }, div = (a, b) => {
        a = q(a);
        b = q(b);
        return q(a.n * b.d, a.d * b.n);
      }, eq = (a, b) => {
        a = q(a);
        b = q(b);
        return a.n === b.n && a.d === b.d;
      }, num = (a) => {
        a = q(a);
        return a.n / a.d;
      };
      function fromNumber(n) {
        if (!Number.isFinite(n)) throw Error("Geen eindig getal");
        for (let d = 1; d <= 1e3; d++) if (Math.abs(n * d - Math.round(n * d)) < 1e-9) return q(Math.round(n * d), d);
        throw Error("Geen gecontroleerde rationale waarde");
      }
      function parse(s) {
        s = String(s).replaceAll("\u2212", "-");
        if (!/^-?\d+(?:[.,]\d+|\/-?\d+)?$/.test(s)) return null;
        try {
          if (s.includes("/")) return q(...s.split("/").map(Number));
          const p = s.replace(",", ".").split(".");
          return q(Number(p.join("")), 10 ** (p[1]?.length || 0));
        } catch {
          return null;
        }
      }
      const text = (a) => {
        a = q(a);
        return String(a.n).replace("-", "\u2212") + (a.d === 1 ? "" : "/" + a.d);
      }, html = (a) => {
        a = q(a);
        return a.d === 1 ? text(a) : `${a.n < 0 ? "\u2212" : ""}<span class="frac"><span>${Math.abs(a.n)}</span><span>${a.d}</span></span>`;
      };
      function formula(a, b) {
        a = q(a);
        b = q(b);
        if (!a.n) return "y = " + html(b);
        return "y = " + (eq(a, 1) ? "" : eq(a, -1) ? "\u2212" : html(a)) + "x" + (b.n ? " " + (b.n < 0 ? "\u2212" : "+") + " " + html(q(Math.abs(b.n), b.d)) : "");
      }
      const catalog = {
        rewrite_linear_equation: { label: "vergelijking herleiden", requires: ["ab"] },
        input_from_output: { label: "x uit een functiewaarde", requires: ["fx", "rewrite_linear_equation"] },
        point_on_line: { label: "punt op de rechte controleren", requires: ["fx", "point"] },
        point_plot: { label: "punt op het rooster plaatsen", requires: ["point"] },
        equation_from_ab: { label: "voorschrift uit a en b", requires: ["ab", "signchart"] },
        graph_from_equation: { label: "rechte uit voorschrift tekenen", requires: ["point_plot", "slope", "intercept", "ab"] },
        slope_from_two_points: { label: "a uit twee punten", requires: ["point", "delta", "slope"] },
        line_behavior: { label: "stijgend, dalend of constant", requires: ["slope_from_two_points"] },
        special_lines: { label: "bijzondere rechten", requires: ["line_behavior"] },
        intercept_from_point: { label: "b uit a en een punt", requires: ["equation_from_ab"] },
        equation_from_point_slope: { label: "voorschrift uit a en punt", requires: ["intercept_from_point"] },
        equation_from_two_points: { label: "voorschrift uit twee punten", requires: ["slope_from_two_points", "equation_from_point_slope"] }
      };
      const order = ["point", "point_plot", "delta", "slope", "slope_from_two_points", "line_behavior", "special_lines", "intercept", "ab", "fx", "table", "graph_from_equation", "rewrite_linear_equation", "input_from_output", "point_on_line", "zeroRead", "zero", "sign", "signchart", "equation_from_ab", "intercept_from_point", "equation_from_point_slope", "equation_from_two_points"];
      const requirements = { point: [], delta: ["point_plot"], slope: ["delta"], intercept: ["special_lines"], ab: ["intercept", "slope"], ...Object.fromEntries(Object.entries(catalog).map(([k, v]) => [k, v.requires])) };
      function legacyAccess(skills) {
        const s = new Proxy(skills || {}, { get: (s2, k) => s2[k] || { seen: 0, strength: 0 } }), a = ["delta"];
        if (s.delta.seen >= 2 && s.delta.strength >= 0.22) a.push("slope");
        if (s.slope.seen >= 3 && s.slope.strength >= 0.3) a.push("point");
        if (s.point.seen >= 2 && s.slope.strength >= 0.4) a.push("intercept");
        if (s.intercept.seen >= 2 && s.slope.strength >= 0.44) a.push("ab");
        if (s.ab.seen >= 3 && s.ab.strength >= 0.38) a.push("fx");
        if (s.fx.seen >= 3 && s.fx.strength >= 0.36) a.push("table");
        if (s.table.seen >= 3 && s.fx.strength >= 0.46) a.push("zeroRead");
        if (s.zeroRead.seen >= 3 && s.zeroRead.strength >= 0.34) a.push("zero");
        if (s.zero.seen >= 3 && s.zero.strength >= 0.38) a.push("sign");
        if (s.sign.seen >= 3 && s.sign.strength >= 0.4) a.push("signchart");
        return a;
      }
      function migrate(saved) {
        const s = structuredClone(saved || {});
        s.access = [.../* @__PURE__ */ new Set([...s.access || [], ...s.version < 701 ? legacyAccess(s.skills) : [], ...Object.keys(s.skills || {}).filter((k) => s.skills[k]?.seen || s.skills[k]?.intro)])];
        if (s.version === 701) {
          const oldRequirements = { point: [], delta: ["point"], slope: ["delta"], slope_from_two_points: ["point", "delta", "slope"], line_behavior: ["slope_from_two_points"], special_lines: ["line_behavior"], intercept: ["special_lines"], ab: ["intercept", "slope"], intercept_from_point: ["ab"], equation_from_point_slope: ["intercept_from_point"], equation_from_two_points: ["slope_from_two_points", "equation_from_point_slope"] };
          for (const [k, rs] of Object.entries(oldRequirements)) if (rs.every((r) => ready({ ...s, skills: s.skills || {}, review: s.review || [] }, r))) s.access.push(k);
          s.access = [.../* @__PURE__ */ new Set([...s.access, ...legacyAccess(s.skills).filter((k) => ["fx", "table", "zeroRead", "zero", "sign", "signchart"].includes(k))])];
        }
        for (const [k, v] of Object.entries(s.skills || {})) if (catalog[k] && Array.isArray(v.independent)) v.independent = v.independent.map((e) => typeof e.signature === "string" ? { ...e, signature: compactSignature(e.signature) } : e);
        s.version = 704;
        s.catalogVersion = 4;
        return s;
      }
      function ready(s, k) {
        const v = s.skills[k];
        return v?.intro && v.seen >= 4 && v.strength >= 0.42 && v.recent?.slice(-4).length === 4 && v.recent.slice(-4).filter(Boolean).length >= 3 && !s.review.some((r) => r.skill === k && r.kind === "repair");
      }
      function unlock(s) {
        const access = new Set(s.access || []);
        for (const [k, rs] of Object.entries(requirements)) if (rs.every((r) => ready(s, r))) access.add(k);
        for (const k of legacyAccess(s.skills)) if (["fx", "table", "zeroRead", "zero", "sign", "signchart"].includes(k)) access.add(k);
        s.access = [...access];
        return order.filter((k) => access.has(k));
      }
      function model(A, B) {
        if (eq(A.x, B.x)) return eq(A.y, B.y) ? { kind: "identical" } : { kind: "vertical", c: q(A.x) };
        const a = div(sub(B.y, A.y), sub(B.x, A.x));
        return { kind: "affine", a, b: sub(A.y, mul(a, A.x)) };
      }
      const constructionSkills = ["point_plot", "equation_from_ab", "graph_from_equation"];
      function constructionGenerate(skill, { difficulty = 0, variant = 0, seed = 1 } = {}) {
        const v = (variant % 12 + 12) % 12;
        if (skill === "point_plot") {
          const scales = difficulty === 2 ? [q(1), q(2), q(1, 2)] : [q(1)];
          const scaleX = scales[v % scales.length], scaleY = scales[(v + 1) % scales.length];
          const ticks = difficulty === 0 ? [[1, 2], [2, 4], [3, 1], [4, 3]] : [[-3, 2], [2, -3], [-2, -4], [4, 1], [0, 3], [-3, 0], [0, 0], [1, -4]];
          const [x, y] = ticks[(v + seed) % ticks.length], target = { x: mul(x, scaleX), y: mul(y, scaleY) };
          return { target, scaleX, scaleY, variant: difficulty === 2 ? "scale" : !x || !y ? "axis" : x < 0 || y < 0 ? "signed" : "positive", representation: "grid", support: difficulty === 0 ? "guided" : "independent" };
        }
        const slopes = difficulty === 0 ? [q(1), q(2), q(1), q(2)] : difficulty === 1 ? [q(1), q(-1), q(2), q(-2), q(0)] : [q(1, 2), q(-3, 2), q(1, 3), q(-2, 3), q(0), q(-1), q(1), q(2)];
        const a = slopes[v % slopes.length], b = q(difficulty === 0 ? seed % 3 : seed % 5 - 2);
        const m = { kind: "affine", a, b };
        const variantName = !a.n ? "horizontal" : a.d !== 1 ? a.n < 0 ? "negative-fraction" : "positive-fraction" : a.n < 0 ? "negative" : "positive";
        return { model: m, scaleX: q(1), scaleY: q(1), variant: variantName, representation: skill === "equation_from_ab" ? "coefficients" : "equation", support: difficulty === 0 ? "guided" : "independent" };
      }
      function gridPoint(t, tick) {
        return { x: mul(tick.x, t.params.scaleX), y: mul(tick.y, t.params.scaleY) };
      }
      function onLine(p, m) {
        return eq(p.y, add(mul(m.a, p.x), m.b));
      }
      function validPoint(p) {
        try {
          return p && Number.isFinite(num(p.x)) && Number.isFinite(num(p.y));
        } catch {
          return false;
        }
      }
      function constructionCheck(t, value) {
        const fail = (code, message, extra = {}) => ({ ok: false, code: "wave." + code, message, ...extra });
        const ok = { ok: true, code: null, message: "Goed gecontroleerd." };
        if (t.skill === "point_plot") {
          if (!validPoint(value)) return fail("point.missing", "Kies eerst een punt op het rooster.");
          const x = eq(value.x, t.params.target.x), y = eq(value.y, t.params.target.y);
          if (x && y) return ok;
          const swapped = eq(value.x, t.params.target.y) && eq(value.y, t.params.target.x);
          return fail(swapped ? "point.swapped" : x ? "point.y" : y ? "point.x" : "point.both", swapped ? "Je hebt x en y verwisseld. Eerst horizontaal x, dan verticaal y." : x ? "De x-co\xF6rdinaat klopt. Verplaats alleen y." : y ? "De y-co\xF6rdinaat klopt. Verplaats alleen x." : "Lees de assenschaal: eerst x, daarna y.", { correctAxes: { x, y } });
        }
        const m = t.params.model;
        if (t.skill === "equation_from_ab") {
          if (!value || !value.a || !value.b || !["+", "\u2212"].includes(value.sign) || value.variable !== "x") return fail("formula.incomplete", "Plaats een getal bij x, het x-token, een teken en de constante term.");
          try {
            if (!eq(value.a, m.a)) return fail("formula.slope", "Het getal v\xF3\xF3r x bepaalt de helling a. De constante term blijft staan.");
            if (!eq(mul(value.sign === "\u2212" ? -1 : 1, value.b), m.b)) return fail("formula.intercept", "Teken en constante term moeten samen b vormen. Je helling blijft staan.");
            return ok;
          } catch {
            return fail("formula.invalid", "Kies geldige getaltokens.");
          }
        }
        if (!Array.isArray(value) || value.length !== 2 || !value.every(validPoint)) return fail("graph.missing", "Plaats twee punten voordat je de rechte controleert.");
        if (eq(value[0].x, value[1].x) && eq(value[0].y, value[1].y)) return fail("graph.identical", "Twee identieke punten bepalen geen rechte. Verplaats \xE9\xE9n punt.");
        const good = value.map((p) => onLine(p, m));
        if (!good[0] || !good[1]) return fail(!good[0] ? "graph.first" : "graph.second", !good[0] ? "Punt A voldoet niet aan het voorschrift. Controleer zijn y bij deze x." : "Punt A klopt. Verplaats B zodat \u0394y / \u0394x gelijk is aan a.", { point: !good[0] ? 0 : 1 });
        return ok;
      }
      const algebraSkills = ["rewrite_linear_equation", "input_from_output", "point_on_line"];
      const expr = (x = 0, y = 0, c = 0) => ({ x: q(x), y: q(y), c: q(c) });
      function equationHTML(e) {
        const member = (m) => {
          let out = "";
          for (const k of ["x", "y", "c"]) {
            const v = m[k];
            if (!v.n) continue;
            const abs = q(Math.abs(v.n), v.d);
            out += (out ? v.n < 0 ? " \u2212 " : " + " : v.n < 0 ? "\u2212" : "") + (k !== "c" && eq(abs, 1) ? "" : html(abs)) + (k === "c" ? "" : k);
          }
          return out || "0";
        };
        return member(e.left) + " = " + member(e.right);
      }
      function equivalent(e, f) {
        const a = ["x", "y", "c"].map((k) => sub(e.left[k], e.right[k])), b = ["x", "y", "c"].map((k) => sub(f.left[k], f.right[k]));
        const i = a.findIndex((v) => v.n);
        if (i < 0) return b.every((v) => !v.n);
        if (!b[i].n) return false;
        return a.every((v, j) => eq(mul(v, b[i]), mul(b[j], a[i])));
      }
      function operate(e, op) {
        if (!op || !["add", "subtract", "divide"].includes(op.kind)) throw Error("Kies optellen, aftrekken of delen.");
        const value = q(op.value);
        if (!value.n) throw Error(op.kind === "divide" ? "Delen door nul mag niet." : "Nul toevoegen verandert de vergelijking niet.");
        if (op.kind !== "divide" && !["x", "y", "c"].includes(op.term)) throw Error("Kies x, y of een getal.");
        const next = structuredClone(e);
        for (const side of ["left", "right"]) {
          if (op.kind === "divide") for (const k of ["x", "y", "c"]) next[side][k] = div(next[side][k], value);
          else next[side][op.term] = add(next[side][op.term], op.kind === "subtract" ? mul(-1, value) : value);
        }
        if (Object.values(next).some((m) => Object.values(m).some((v) => Math.abs(v.n) > 9999 || v.d > 9999))) throw Error("Houd de getallen klein: maak de vorige bewerking ongedaan.");
        return next;
      }
      function isolated(e, axis) {
        const other = axis === "x" ? "y" : "x";
        return eq(e.left[axis], 1) && eq(e.left[other], 0) && eq(e.left.c, 0) && eq(e.right[axis], 0) && (axis !== "x" || eq(e.right.y, 0));
      }
      function algebraGenerate(skill, { difficulty = 0, variant = 0, seed = 1 } = {}) {
        const v = (variant % 12 + 12) % 12;
        let a = (difficulty === 0 ? [q(1), q(2), q(3)] : [q(2), q(-2), q(1, 2), q(-3, 2)])[v % (difficulty === 0 ? 3 : 4)], b = q(seed % 5 - 2);
        if (skill === "rewrite_linear_equation") {
          if (difficulty === 0) {
            b = q(1 + seed % 4);
            const e2 = { left: expr(-a.n, 1), right: expr(0, 0, b) };
            return { model: { kind: "affine", a, b }, equation: e2, variant: "one-step", representation: "equation", support: "guided" };
          }
          const vertical = difficulty === 2 && v >= 10;
          if (vertical) {
            const c = q(seed % 5 - 2), factor2 = q(v === 10 ? 2 : -3), e2 = { left: expr(factor2, 0, seed % 2), right: expr(0, 0, add(mul(factor2, c), seed % 2)) };
            return { model: { kind: "vertical", c }, equation: e2, variant: "vertical", representation: "equation", support: "independent" };
          }
          if (v === 8) a = q(0);
          const factor = q(v % 2 ? -4 : 3), e = { left: expr(mul(-1, mul(a, factor)), factor), right: expr(0, 0, mul(b, factor)) };
          if (difficulty === 2 && v % 3 === 0) {
            e.left.y = add(e.left.y, 2);
            e.right.y = q(2);
            e.left.c = q(1);
            e.right.c = add(e.right.c, 1);
          }
          return { model: { kind: "affine", a, b }, equation: e, variant: !a.n ? "horizontal" : a.d > 1 ? "fraction" : "multiple", representation: "equation", support: "independent" };
        }
        const x = difficulty === 0 ? q(1 + seed % 4) : difficulty === 1 ? q(seed % 7 - 3) : q(seed % 7 - 3, 2);
        if (difficulty === 2 && v >= 8) a = q(0);
        const model2 = { kind: "affine", a, b }, y = add(mul(a, x), b);
        if (skill === "input_from_output") {
          const target = !a.n && v % 2 ? add(b, 1) : y;
          return { model: model2, target, solution: a.n ? x : null, variant: a.n ? x.d > 1 ? "fraction" : x.n < 0 ? "negative" : "integer" : eq(target, b) ? "all" : "none", representation: difficulty === 2 && v % 2 ? "table" : "equation", support: difficulty === 0 ? "guided" : "independent" };
        }
        const on = difficulty === 0 || v % 2 === 0, P = { x, y: on ? y : add(y, v % 3 === 0 ? q(-1, 2) : q(1)) };
        return { model: model2, P, value: y, variant: !a.n ? on ? "constant-on" : "constant-off" : on ? "on" : "off", representation: difficulty === 2 ? ["equation", "table", "graph"][v % 3] : "equation", support: difficulty === 0 ? "guided" : "independent" };
      }
      function algebraStages(t) {
        if (t.skill === "rewrite_linear_equation") return ["algebra", "modelKind"];
        if (t.skill === "point_on_line") return ["subPoint", "pointValue", "pointVerdict"];
        return t.params.model.a.n ? ["subOutput", "algebra", "verifyInput"] : ["subOutput", "constantSolutions", "constantVerify"];
      }
      function algebraEquation(t, w) {
        return w.equation || t.params.equation || { left: expr(t.params.model.a, 0, t.params.model.b), right: expr(0, 0, t.params.target) };
      }
      function algebraExpected(t, w, stage = algebraStages(t)[w.index]) {
        const p = t.params;
        switch (stage) {
          case "subPoint":
            return "x";
          case "subOutput":
            return "output";
          case "pointValue":
            return p.value;
          case "pointVerdict":
            return eq(p.value, p.P.y) ? "on" : "off";
          case "verifyInput":
            return p.target;
          case "constantSolutions":
            return eq(p.target, p.model.b) ? "all" : "none";
          case "constantVerify":
            return p.model.b;
          case "modelKind":
            return p.model.kind === "vertical" ? "vertical" : "function";
        }
        return null;
      }
      function algebraCheck(t, w, value) {
        const stage = algebraStages(t)[w.index], p = t.params, fail = (code, message) => ({ ok: false, code: "wave." + code, message });
        if (stage === "algebra") {
          const e = algebraEquation(t, w), axis = t.skill === "input_from_output" || p.model.kind === "vertical" ? "x" : "y";
          if (value?.kind === "finish") return isolated(e, axis) ? { ok: true } : { ...fail("algebra.unfinished", `Maak eerst ${axis} vrij: links alleen ${axis}, rechts geen ${axis}.`) };
          try {
            const next = operate(e, value);
            if (!equivalent(e, next)) return fail("algebra.equivalence", "Pas dezelfde bewerking toe op beide volledige leden.");
            return { ok: true, next, message: (value.kind === "divide" ? "Delen door " : value.kind === "subtract" ? "Aftrekken: " : "Optellen: ") + text(value.value) + (value.kind !== "divide" && value.term !== "c" ? value.term : "") + " aan beide kanten." };
          } catch (err) {
            return fail("algebra.operation", err.message);
          }
        }
        const want = algebraExpected(t, w), ok = typeof want === "object" ? !!value && typeof value === "object" && (() => {
          try {
            return eq(want, value);
          } catch {
            return false;
          }
        })() : value === want;
        const messages = { subPoint: "Vervang x door de x-co\xF6rdinaat van P; y is de waarde waarmee je vergelijkt.", subOutput: "Vervang f(x) door de gegeven uitvoer; x blijft onbekend.", pointValue: "Bereken eerst a \xD7 x + b met de x-co\xF6rdinaat. De gegeven y is nog geen berekening.", pointVerdict: `Berekend: ${p.value ? text(p.value) : ""}; gegeven y: ${p.P ? text(p.P.y) : ""}. Alleen gelijke waarden betekenen dat P op de rechte ligt.`, verifyInput: "Vul je gevonden x terug in de oorspronkelijke formule in.", constantSolutions: "Een constante functie heeft altijd dezelfde uitvoer: de gevraagde waarde lukt voor alle x of voor geen enkele x.", constantVerify: "Bij a = 0 is de uitvoer altijd b, ook als x = 2.", modelKind: "y = ax + b heeft bij elke x \xE9\xE9n y. Een verticale rechte x = c is geen functie y = f(x)." };
        return ok ? { ok: true } : fail(stage, messages[stage]);
      }
      function algebraSubmit(t, w, value) {
        if (w.done) return { ok: false, code: "done" };
        const stage = algebraStages(t)[w.index], r = algebraCheck(t, w, value);
        w.steps.push({ stage, value, ok: r.ok, code: r.ok ? null : r.code });
        w.steps = w.steps.slice(-32);
        if (!r.ok) {
          if (!w.errors.includes(r.code)) w.errors.push(r.code);
          return r;
        }
        w.history.push({ index: w.index, values: structuredClone(w.values), equation: structuredClone(w.equation || null) });
        w.history = w.history.slice(-24);
        if (r.next) {
          w.equation = r.next;
          w.lastOperation = r.message;
        } else {
          w.values[stage] = value;
          w.index++;
        }
        w.entry = ["", "1"];
        w.part = 0;
        w.replace = false;
        w.operation = null;
        w.done = w.index === algebraStages(t).length;
        return r;
      }
      function generate(skill, { difficulty = 0, variant = 0, seed = 1 } = {}) {
        if (algebraSkills.includes(skill)) return algebraGenerate(skill, { difficulty, variant, seed });
        if (constructionSkills.includes(skill)) return constructionGenerate(skill, { difficulty, variant, seed });
        if (!catalog[skill]) throw Error("Onbekende skill");
        let v = (variant % 12 + 12) % 12;
        const slopes = difficulty === 0 ? [q(1), q(-1), q(2), q(-2), q(0), q(1), q(-1), q(2), q(-2), q(0), q(1), q(-1)] : [q(1), q(-1), q(1, 2), q(-3, 2), q(0), q(1, 3), q(-2, 3), q(2), q(-2), q(0), q(3, 2), q(-1, 2)];
        let a = slopes[v], b = q(seed % 5 - 2), A, B;
        const candidates = [];
        for (let x = -4; x <= 4; x++) for (const direction of [-1, 1]) {
          const x2 = x + direction * a.d;
          if (Math.abs(x2) > 4) continue;
          const y = add(mul(a, x), b), y2 = add(mul(a, x2), b);
          if (Math.abs(num(y)) <= 5 && Math.abs(num(y2)) <= 5) candidates.push([{ x: q(x), y }, { x: q(x2), y: y2 }]);
        }
        [A, B] = candidates[seed % candidates.length];
        if (skill === "special_lines") {
          const kind = v % 3;
          if (kind === 0) {
            A = { x: q(-2), y: b };
            B = { x: q(3), y: b };
          }
          if (kind === 1) {
            A = { x: b, y: q(-2) };
            B = { x: b, y: q(3) };
          }
          if (kind === 2) {
            A = { x: b, y: q(1) };
            B = structuredClone(A);
          }
        }
        if (["slope_from_two_points", "equation_from_two_points"].includes(skill) && difficulty === 2 && v >= 10) {
          B = v === 10 ? { x: A.x, y: add(A.y, num(A.y) > 0 ? -1 : 1) } : structuredClone(A);
        }
        const m = model(A, B);
        const variantName = m.kind === "affine" ? m.a.n === 0 ? "horizontal" : m.a.d !== 1 ? m.a.n < 0 ? "negative-fraction" : "positive-fraction" : m.a.n < 0 ? "negative" : "positive" : m.kind;
        return { A, B, model: m, variant: variantName, representation: skill === "line_behavior" ? ["graph", "slope", "points"][difficulty] : skill === "special_lines" && difficulty === 0 ? "graph" : "points", support: difficulty === 0 ? "guided" : "independent" };
      }
      function stages(t) {
        if (algebraSkills.includes(t.skill)) return algebraStages(t);
        if (constructionSkills.includes(t.skill)) return [t.skill];
        const m = t.params.model, s = t.skill;
        if (s === "line_behavior") return ["behavior"];
        if (s === "special_lines" || m.kind !== "affine") return m.kind === "identical" ? ["classify"] : ["classify", "property", "axis", "constant", "function"];
        const slope = ["ys", "xs", "a"];
        if (s === "slope_from_two_points") return slope;
        return [...s === "equation_from_two_points" ? [...slope, "point"] : ["subA", "subPoint"], "ax", "b", "formulaA", "formulaB", ...s === "equation_from_two_points" ? ["verifyA", "verifyB"] : []];
      }
      function fresh(t) {
        return { routeVersion: 4, index: 0, values: {}, tokens: [], entry: ["", "1"], part: 0, errors: [], steps: [], help: false, done: false, history: [] };
      }
      function resumeWork(t) {
        const w = t.work || (t.work = fresh(t));
        if (w.routeVersion === 4) return w;
        if (!algebraSkills.includes(t.skill) && !constructionSkills.includes(t.skill) && t.params.model.kind === "affine" && !["special_lines", "line_behavior"].includes(t.skill)) {
          const version = w.routeVersion || 1, two = t.skill === "equation_from_two_points", slope = version >= 2 ? ["ys", "xs", "a"] : ["ys", "xs", "dy", "dx", "a"];
          const b = version === 3 && !two ? ["subA", "subY", "subX", "b"] : version >= 2 ? ["subA", "subY", "subX", "ax", "b"] : ["subY", "subX", "ax", "b"];
          const old = t.skill === "slope_from_two_points" ? slope : [...two ? [...slope, "point"] : [], ...b, ...version === 1 && t.skill === "intercept_from_point" ? [] : ["formulaA", "formulaB"], ...two ? ["verifyA", "verifyB"] : version === 3 ? [] : ["verifyA"]];
          const next = stages(t), map = (i) => {
            let stage = old[i];
            if (["dy", "dx"].includes(stage)) stage = "a";
            if (["subY", "subX"].includes(stage) || two && stage === "subA") stage = two ? "point" : "subPoint";
            if (stage === "verifyA" && !next.includes(stage)) stage = "formulaB";
            return Math.max(0, next.indexOf(stage));
          };
          w.index = w.done ? next.length : map(w.index);
          w.history = w.history.map((h) => ({ ...h, index: map(h.index) }));
        }
        w.routeVersion = 4;
        return w;
      }
      function expected(t, w, stage = stages(t)[w.index]) {
        if (algebraSkills.includes(t.skill)) return algebraExpected(t, w, stage);
        if (constructionSkills.includes(t.skill)) return null;
        const p = t.params, m = p.model, A = p[w.values.point || "A"], rev = w.values.ys?.[0] === "A", dy = rev ? sub(p.A.y, p.B.y) : sub(p.B.y, p.A.y), dx = rev ? sub(p.A.x, p.B.x) : sub(p.B.x, p.A.x);
        switch (stage) {
          case "behavior":
            return m.a.n > 0 ? "stijgend" : m.a.n < 0 ? "dalend" : "constant";
          case "classify":
            return m.kind === "identical" ? "identiek" : m.kind === "vertical" ? "verticaal" : "horizontaal";
          case "property":
            return m.kind === "vertical" ? "dx0" : "a0";
          case "axis":
            return m.kind === "vertical" ? "x" : "y";
          case "constant":
            return m.kind === "vertical" ? m.c : m.b;
          case "function":
            return m.kind === "affine" ? "functie" : "geen functie";
          case "dy":
            return dy;
          case "dx":
            return dx;
          case "subA":
          case "a":
          case "formulaA":
            return m.a;
          case "subPoint":
          case "point":
            return "A";
          case "subY":
            return A.y;
          case "subX":
            return A.x;
          case "ax":
            return mul(m.a, A.x);
          case "b":
          case "formulaB":
            return m.b;
          case "verifyA":
            return p.A.y;
          case "verifyB":
            return p.B.y;
        }
      }
      function pointEquation(t, w) {
        const A = t.params[w.values.point || "A"];
        return w.bEquation || { left: expr(0, 1, mul(t.params.model.a, A.x)), right: expr(0, 0, A.y) };
      }
      function check(t, w, value, stageOverride) {
        if (algebraSkills.includes(t.skill)) return algebraCheck(t, w, value);
        if (constructionSkills.includes(t.skill)) return constructionCheck(t, value);
        const stage = stageOverride || stages(t)[w.index], want = expected(t, w, stage);
        let ok = false, code = stage, message = "";
        if (stage === "b" && ["moveConstant", "combineConstants"].includes(value?.kind)) {
          const moved = !!w.bArithmetic?.moved;
          if (value.kind === "moveConstant") return moved ? { ok: false, code: "wave.b", message: "Reken nu de getallen samen." } : { ok: true, nextArithmetic: { moved: true } };
          return moved ? { ok: true, completeArithmetic: true } : { ok: false, code: "wave.b", message: "Breng eerst de losse term naar het andere lid." };
        }
        if (stage === "b" && value?.kind) {
          try {
            return { ok: true, nextB: operate(pointEquation(t, w), value) };
          } catch (e) {
            return { ok: false, code: "wave.b", message: e.message };
          }
        }
        if (stage === "ys" || stage === "xs") {
          ok = Array.isArray(value) && value.length === 2 && new Set(value).size === 2 && value.every((k) => k === "A" || k === "B");
          if (stage === "xs" && ok) {
            ok = value.join() === w.values.ys.join();
            code = "direction";
            message = `\u0394y: ${w.values.ys[1]}\u2192${w.values.ys[0]}; \u0394x: ${value[1]}\u2192${value[0]}. Gebruik dezelfde richting.`;
          } else message = "Kies de twee verschillende punten voor de aftrekking.";
        } else if (stage === "point" || stage === "subPoint") ok = stage === "subPoint" ? value === "A" : value === "A" || value === "B";
        else if (stage === "subY" || stage === "subX") {
          ok = value === (stage === "subY" ? "y" : "x");
          message = "In y = ax + b staat y links en x bij a.";
        } else if (want && typeof want === "object") {
          ok = !!value && typeof value === "object" && eq(value, want);
          message = stage === "b" ? `b = y \u2212 ax. Met jouw b wordt y = ${text(add(mul(t.params.model.a, t.params[w.values.point || "A"].x), value || q(0)))}; vereist: ${text(t.params[w.values.point || "A"].y)}.` : stage === "dx" || stage === "dy" ? "Trek de gekozen co\xF6rdinaten in de getoonde richting af." : stage.startsWith("verify") ? "Vul de oorspronkelijke x in je formule in en vergelijk met de oorspronkelijke y." : stage === "a" ? "Deel \u0394y door \u0394x, met beide tekens." : stage === "ax" ? "Vermenigvuldig a met de x-co\xF6rdinaat." : "Gebruik de berekende co\xEBffici\xEBnt op de juiste plaats.";
        } else {
          ok = value === want;
          message = stage === "behavior" ? "Kijk wat y doet als x toeneemt." : stage === "classify" ? "Gelijke y: horizontaal. Gelijke x: verticaal, behalve als beide punten identiek zijn." : stage === "property" ? "Horizontaal heeft a = 0; verticaal heeft \u0394x = 0 en geen hellingsgetal." : stage === "function" ? "Een functie heeft bij elke x precies \xE9\xE9n y." : "Verticaal houdt x vast; horizontaal houdt y vast.";
        }
        return { ok, code: "wave." + code, message };
      }
      function submit(t, w, value) {
        if (algebraSkills.includes(t.skill)) return algebraSubmit(t, w, value);
        if (w.done) return { ok: false, code: "done" };
        const stage = stages(t)[w.index], r = check(t, w, value);
        w.steps.push({ stage, value, ok: r.ok, code: r.ok ? null : r.code });
        w.steps = w.steps.slice(-32);
        if (!r.ok) {
          if (!w.errors.includes(r.code)) w.errors.push(r.code);
          return r;
        }
        w.history.push({ index: w.index, values: structuredClone(w.values), bEquation: structuredClone(w.bEquation || null), bArithmetic: structuredClone(w.bArithmetic || null) });
        if (r.nextArithmetic) {
          w.bArithmetic = r.nextArithmetic;
        } else if (r.completeArithmetic) {
          w.values.b = t.params.model.b;
          w.index++;
        } else if (r.nextB) {
          w.bEquation = r.nextB;
          if (isolated(r.nextB, "y")) {
            w.values.b = r.nextB.right.c;
            w.index++;
          }
        } else {
          w.values[stage] = value;
          if (stage === "point" || stage === "subPoint") {
            w.values.point = value;
            w.values.subY = "y";
            w.values.subX = "x";
          }
          w.index++;
        }
        delete w.slopeEntry;
        w.tokens = [];
        w.entry = ["", "1"];
        w.part = 0;
        w.fraction = false;
        w.replace = false;
        w.done = w.index === stages(t).length;
        return r;
      }
      function undo(w) {
        const prev = w.history.pop();
        if (prev) {
          w.index = prev.index;
          w.values = prev.values;
          w.bEquation = prev.bEquation || null;
          w.bArithmetic = prev.bArithmetic || null;
          delete w.pointGesture;
          delete w.selectedTerm;
          delete w.coordinateSlot;
          delete w.formulaBuild;
          delete w.slopeEntry;
          w.fraction = false;
          w.replace = false;
          if (prev.cursor) {
            w.cursor = prev.cursor;
            w.gridEdits = [];
          }
          if (Object.hasOwn(prev, "equation")) {
            w.equation = prev.equation;
            w.lastOperation = "";
            w.operation = null;
          }
          w.done = false;
          w.tokens = [];
          w.entry = ["", "1"];
          w.part = 0;
        }
      }
      function signature(t) {
        return JSON.stringify([t.skill, t.difficulty, t.params]);
      }
      const required = { rewrite_linear_equation: ["one-step", "multiple", "fraction", "horizontal", "vertical"], input_from_output: ["integer", "negative", "fraction", "all", "none"], point_on_line: ["on", "off", "constant-on", "constant-off"], point_plot: ["positive", "signed", "axis", "scale"], equation_from_ab: ["positive", "negative", "positive-fraction", "negative-fraction", "horizontal"], graph_from_equation: ["positive", "negative", "positive-fraction", "negative-fraction", "horizontal"], slope_from_two_points: ["positive", "negative", "positive-fraction", "negative-fraction", "horizontal", "vertical", "identical"], line_behavior: ["positive", "negative", "horizontal"], special_lines: ["horizontal", "vertical", "identical"], intercept_from_point: ["positive", "negative", "negative-fraction", "horizontal"], equation_from_point_slope: ["positive", "negative", "negative-fraction", "horizontal"], equation_from_two_points: ["positive", "negative", "negative-fraction", "horizontal", "vertical", "identical"] };
      function compactSignature(source) {
        if (/^sig1:[0-9a-f]{16}:\d+$/.test(source)) return source;
        let a = 2166136261, b = 2654435769;
        for (let i = 0; i < source.length; i++) {
          const c = source.charCodeAt(i);
          a = Math.imul(a ^ c, 16777619);
          b = Math.imul(b ^ c, 2246822507);
        }
        return "sig1:" + (a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0") + ":" + source.length;
      }
      function evidence(st, t, total, clean) {
        if (!clean) return;
        st.coverage ||= {};
        st.coverage[t.params.variant] = true;
        st.independent ||= [];
        const key = compactSignature(signature(t));
        if (!st.independent.some((e) => compactSignature(e.signature) === key)) st.independent.push({ at: total, signature: key });
        st.independent = st.independent.slice(-16);
      }
      function mastered(st, skill) {
        const e = st.independent || [];
        return required[skill].every((v) => st.coverage?.[v]) && e.some((a, i) => e.slice(i + 1).some((b) => b.at - a.at >= 3));
      }
      return { resumeWork, pointEquation, compactSignature, required, algebraSkills, expr, equationHTML, equivalent, operate, isolated, algebraEquation, constructionSkills, gridPoint, onLine, constructionCheck, q, fromNumber, add, sub, mul, div, eq, num, parse, text, html, formula, catalog, order, requirements, legacyAccess, migrate, ready, unlock, model, generate, stages, fresh, expected, check, submit, undo, signature, evidence, mastered };
    });
  }
});

// games/rechten/rechtenwereld/semantic-math-core.js
var require_semantic_math_core = __commonJS({
  "games/rechten/rechtenwereld/semantic-math-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_wave_core());
      else root.RechtenV2Math = factory(root.RechtenWave);
    })(globalThis, function(W) {
      "use strict";
      if (!W) throw Error("RechtenWave is vereist.");
      const { q, add, sub, mul, div, eq, num, text } = W;
      const worlds = ["grenspas", "hellingrug", "signaalstad"];
      const modes = ["discover", "practice", "evidence", "fluency"];
      const at = (m, x) => add(mul(m.a, x), m.b);
      const integer = (value, fallback) => Number.isSafeInteger(value) ? value : fallback;
      const mod = (n, d) => (n % d + d) % d;
      function parse(value) {
        if (typeof value !== "string" || value.length > 64) return null;
        const parsed = W.parse(value.trim());
        return parsed && Math.abs(parsed.n) <= 1e6 && parsed.d <= 1e6 ? parsed : null;
      }
      function result(ok, code, message, extra = {}) {
        return { ok, kind: ok ? "correct" : "hypothesis", code: ok ? null : code, message, keep: {}, probes: [], ...extra };
      }
      function syntax(message = "Gebruik een getal of breuk met een noemer ongelijk aan nul.") {
        return result(false, "input.syntax", message, { kind: "interaction_error" });
      }
      const allValues = (fields) => fields.every(Boolean);
      function freeze(value) {
        if (value && typeof value === "object") {
          Object.values(value).forEach(freeze);
          Object.freeze(value);
        }
        return value;
      }
      const hintsets = {
        grenspas: ["Welke as bevat de gevraagde x-waarden?", "Kijk naar de x-as: daar is y gelijk aan nul.", "Test \xE9\xE9n x-waarde links en \xE9\xE9n rechts van je grens.", "Ander voorbeeld: y = \u2212x + 1. Bij x = 0 is y = 1. Welke zijde is daar positief?", "Voorbeeld: y = x \u2212 2. Nul bij x = 2; links ligt de lijn onder nul, rechts boven nul. Probeer daarna een nieuw geval."],
        hellingrug: ["Volgen beide verschillen dezelfde richting?", "Kijk naar begin- en eindpunt van je gekozen pijl.", "Bereken eind min begin voor beide co\xF6rdinaten; deel \u0394y door \u0394x.", "Ander voorbeeld: van (0, 1) naar (4, 3). \u0394x = 4. Vul \u0394y en de verhouding aan.", "Voorbeeld: van (0, 1) naar (4, 3): \u0394x = 4, \u0394y = 2, a = 2/4 = 1/2. Omgekeerd is a = \u22122/\u22124 = 1/2."],
        signaalstad: ["Welke waarde hoort bij x = 0?", "Vergelijk de y-as met de constante term van het voorschrift.", "Een x=0-proef meet b; een stap van \xE9\xE9n x meet a.", "Ander voorbeeld: y = 3x \u2212 1. De uitvoer bij x = 0 is \u22121. Wat verandert bij \xE9\xE9n stap?", "Voorbeeld: y = 3x \u2212 1 heeft b = \u22121 en a = 3. Een grafiek met a = \u22121 en b = 3 heeft die rollen verwisseld."]
      };
      function makeTask(world, options = {}) {
        if (!worlds.includes(world)) throw Error("Onbekende wereld.");
        const variant = integer(options.variant, 0), seed = integer(options.seed, 1), mode = modes.includes(options.mode) ? options.mode : "practice";
        const features = [], t = { id: `rechten-v2:1:${world}:${variant}:${seed}:${mode}`, world, world_id: world, skill_id: world === "grenspas" ? "sign" : world === "hellingrug" ? "slope_from_two_points" : "ab", family_id: world === "grenspas" ? "F6" : world === "hellingrug" ? "F2" : "F3", mode, variant, seed, features, hints: [...hintsets[world]], bounds: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 } };
        if (world === "grenspas") {
          const v = mod(variant, 6), shift = mod(seed - 1, 3), defs = [[q(1), q(3 - shift), "positive"], [q(-1), q(-2 + shift), "positive"], [q(-1, 2), q(1 - shift), "negative"], [q(0), q(2), "positive"], [q(0), q(-2), "positive"], [q(0), q(0), "negative"]];
          const [a, value, ask] = defs[v];
          t.model = { kind: "affine", a, b: a.n ? mul(-1, mul(a, value)) : value };
          t.root = a.n ? value : null;
          t.ask = ask;
          t.hidden = { x: q(a.n ? num(value) + 2 : 3), y: at(t.model, q(a.n ? num(value) + 2 : 3)) };
          features.push(a.n > 0 ? "rising" : a.n < 0 ? "falling" : "horizontal", ask, a.n ? "strict-boundary" : "all-or-none");
          t.contrast_case = { world, variant: mod(variant + 1, 6), feature: v === 0 ? "falling-negative-root" : v < 2 ? "sign-question-changed" : "horizontal-orientation" };
        } else if (world === "hellingrug") {
          const v = [2, 3, 4, 0, 1, 5][mod(variant, 6)], params = W.generate("slope_from_two_points", { difficulty: 2, variant: v, seed: mod(seed, 1e4) });
          t.model = params.model;
          t.points = { A: params.A, B: params.B };
          t.legacy = { skill: t.skill_id, difficulty: 2, params };
          let x = add(params.B.x, 3);
          if (eq(x, params.A.x)) x = add(x, 1);
          t.hidden = { x, y: at(t.model, x) };
          features.push(params.variant, "two-valid-orientations", mod(variant, 2) ? "point-to-table-transfer" : "point-pair-representation");
          t.contrast_case = { world, variant: mod(variant + 1, 6), feature: "rate-sign-and-point-to-table-representation" };
        } else {
          const values = [[q(2), q(8)], [q(-1), q(3)], [q(1, 2), q(-2)], [q(0), q(4)]][mod(variant, 4)];
          t.model = { kind: "affine", a: values[0], b: add(values[1], mod(seed - 1, 3)) };
          t.faultModel = { kind: "affine", a: t.model.b, b: t.model.a };
          t.rows = [0, 1, 2].map((x) => ({ x: q(x), y: at(t.model, q(x)) }));
          t.hidden = { x: q(10), y: at(t.model, q(10)) };
          t.bounds = { xMin: -2, xMax: 3, yMin: -12, yMax: 36 };
          features.push("parameter-role-swap", !t.model.a.n ? "horizontal" : t.model.a.d > 1 ? "fractional" : t.model.a.n < 0 ? "negative" : "positive", "probe-choice", "hidden-input");
          t.contrast_case = { world, variant: mod(variant + 1, 4), feature: "parameter-sign-or-constant-rate" };
        }
        const claims = { grenspas: "Koppel nulwaarde en teken van f(x) aan een strikt x-interval.", hellingrug: "Construeer een exacte gerichte rate uit twee punten en voorspel een derde punt.", signaalstad: "Diagnosticeer verwisselde helling en y-afsnede met een gekozen probe en herstel de koppeling." };
        Object.assign(t, { profile: { contentVersion: 1, stage: world === "signaalstad" ? "diagnose" : "predict" }, curriculum_claim: claims[world], primary_cognitive_action: world === "grenspas" ? "construeer x-interval" : world === "hellingrug" ? "bouw gerichte ratio" : "diagnosticeer en herstel parameterkoppeling", given_representations: world === "grenspas" ? ["graph"] : world === "hellingrug" ? mod(variant, 2) ? ["table"] : ["points", "graph"] : ["formula", "table", "graph"], target_representation: world === "grenspas" ? "interval-and-inequality" : world === "hellingrug" ? "rational-rate" : "corrected-parameter-coupling", task_features: [...features], visible_case: { model: t.model, ...t.points ? { points: t.points } : {}, ...t.rows ? { rows: t.rows, faultModel: t.faultModel } : {} }, hidden_cases: [{ kind: world === "hellingrug" ? "third-point" : "new-input", ...t.hidden }], primary_action: "Test", response_component: world === "grenspas" ? ["AxisAnchorPicker", "IntervalSelector"] : world === "hellingrug" ? ["DirectedDeltaBuilder", "RateFractionBuilder"] : ["RepresentationPins", "FunctionProbe", "FaultLocator"], allowed_alternatives: world === "hellingrug" ? ["AB", "BA", "equivalent-rationals"] : world === "signaalstad" ? ["zero-probe", "difference-probe"] : ["tap-region", "keyboard-region"], commit_policy: { reveal: "after-explicit-commit", liveCorrectness: false }, feedback_model: "exact-causal-probes-and-first-divergence", misconception_hypotheses: world === "grenspas" ? ["zero.output_zero", "zero.sign", "sign.side_reversed", "sign.boundary_included", "sign.horizontal_all_none"] : world === "hellingrug" ? ["delta.orientation_mixed", "delta.swap_axes", "slope.reciprocal", "slope.sign"] : ["param.slope_intercept_swap", "param.a_sign", "param.b_sign"], repair_policy: { preserveCorrect: true, unit: world === "signaalstad" ? "atomic-coupling" : "incorrect-component" }, worked_example_ref: `hints:${world}:4-5`, difficulty_features: [...features], units: { x: "x-eenheden", y: "y-eenheden", rate: "y-eenheden per x-eenheid" }, language_load: { locale: "nl-BE", level: "low", instructionLimit: "one-sentence" }, accessibility: { input: ["keyboard", "single-pointer"], targetMin: 44, colorOnly: false, reducedMotion: true, maxPinnedViews: 2 }, evidence_events: ["prediction", "commit", "result", "repair", "hint", "hidden-result"], asset_slots: [`${world}-semantic-workspace`], validator: "RechtenV2Math/v1 + unchanged RechtenWave" });
        return freeze(t);
      }
      function checkRoot(t, value) {
        if (!t.model.a.n) {
          const want = t.model.b.n ? "none" : "all";
          if (!["none", "all"].includes(value)) {
            if (!parse(value)) return syntax("Kies alle x, geen x, of voer een geldige grens in.");
            return result(false, "sign.horizontal_all_none", "Een horizontale lijn heeft hier geen losse nulwaarde. Bekijk of de hele lijn op y = 0 ligt.");
          }
          return result(value === want, "sign.horizontal_all_none", value === want ? "De nulwaarden passen bij de hele horizontale lijn." : "Vergelijk de constante uitvoer met nul.", { keep: { root: value === want }, probes: [{ x: q(0), y: t.model.b }] });
        }
        const r = parse(value);
        if (!r) return syntax();
        const y = at(t.model, r), ok = eq(y, 0);
        return result(ok, !r.n ? "zero.output_zero" : eq(r, mul(-1, t.root)) ? "zero.sign" : "zero.boundary", ok ? `Bij x = ${text(r)} is de uitvoer nul.` : `Bij jouw grens is f(x) = ${text(y)}. Zoek waar de lijn de x-as snijdt.`, { keep: { root: ok }, probes: [{ x: r, y }] });
      }
      function intervalExpected(t) {
        if (!t.model.a.n) {
          const yes = t.ask === "positive" ? t.model.b.n > 0 : t.model.b.n < 0;
          return { side: yes ? "all" : "none", symbol: yes ? "all" : "none", root: null };
        }
        const right = t.ask === "positive" === t.model.a.n > 0;
        return { side: right ? "right" : "left", symbol: right ? ">" : "<", root: t.root };
      }
      function checkInterval(t, r = {}) {
        const want = intervalExpected(t);
        if (!["left", "right", "all", "none", "point"].includes(r.side) || typeof r.closed !== "boolean") return syntax("Selecteer een x-gebied en kies een open of gesloten grens.");
        if (!t.model.a.n) {
          if (!["all", "none", "<", ">", "="].includes(r.symbol)) return syntax("Kies de symbolische vorm van je gebied.");
          const ok = r.side === want.side && r.symbol === want.symbol;
          return result(ok, "sign.horizontal_all_none", ok ? "De constante uitvoer geldt voor elke x; je gebied klopt." : "Test een andere x: de hoogte verandert niet. Kies alle x of geen x.", { keep: { side: r.side === want.side, symbol: r.symbol === want.symbol }, probes: [{ x: q(-2), y: t.model.b }, { x: q(2), y: t.model.b }] });
        }
        const root = parse(r.boundary), symbolRoot = parse(r.symbolBoundary ?? r.boundary);
        if (!root || !symbolRoot || !["<", ">", "="].includes(r.symbol)) return syntax();
        const rootOK = eq(root, t.root), sideOK = r.side === want.side, openOK = !r.closed, symbolOK = r.symbol === want.symbol, symbolRootOK = eq(symbolRoot, t.root), keep = { root: rootOK, side: sideOK, closed: openOK, symbol: symbolOK, symbolBoundary: symbolRootOK };
        const probes = [sub(root, 1), add(root, 1)].map((x) => ({ x, y: at(t.model, x) }));
        if (!rootOK) return result(false, "zero.boundary", "Je grens ligt nog niet waar de uitvoer nul is. Behoud je gekozen gebied en controleer de grens.", { keep, probes: [{ x: root, y: at(t.model, root) }, ...probes] });
        if (r.side === "point" || r.symbol === "=") return result(false, "zero.output_zero", "Op de grens is de uitvoer nul. Selecteer de x-waarden aan een zijde van die grens.", { keep, probes });
        if (!sideOK) return result(false, "sign.side_reversed", "De proefwaarden tonen de hoogte aan beide zijden. Kies de zijde met het gevraagde teken.", { keep, probes });
        if (!openOK) return result(false, "sign.boundary_included", "Op de grens is f(x) = 0. Bij een strikte ongelijkheid hoort de grens er niet bij.", { keep, probes });
        if (!symbolOK) return result(false, "sign.symbol_side", "Je geselecteerde gebied klopt. Laat het ongelijkheidsteken naar hetzelfde x-gebied verwijzen.", { keep, probes });
        if (!symbolRootOK) return result(false, "sign.symbol_boundary", "Je gebied klopt. Gebruik dezelfde grens in je ongelijkheid.", { keep, probes });
        return result(true, null, "De proefwaarden en je ongelijkheid beschrijven hetzelfde x-gebied.", { keep, probes });
      }
      function deltaData(t, r) {
        if (!["AB", "BA"].includes(r.direction)) return null;
        const dx = parse(r.dx), dy = parse(r.dy);
        if (!allValues([dx, dy])) return null;
        const order = r.direction === "AB" ? ["B", "A"] : ["A", "B"], w = W.fresh(t.legacy);
        W.submit(t.legacy, w, order);
        W.submit(t.legacy, w, order);
        return { dx, dy, w, wantDx: W.expected(t.legacy, w, "dx"), wantDy: W.expected(t.legacy, w, "dy"), start: t.points[r.direction === "AB" ? "A" : "B"] };
      }
      function checkDeltas(t, r = {}) {
        const d = deltaData(t, r);
        if (!d) return syntax("Kies een richting en vul beide gerichte verschillen in.");
        const x = eq(d.dx, d.wantDx), y = eq(d.dy, d.wantDy), keep = { direction: true, dx: x, dy: y };
        const probes = [{ x: add(d.start.x, d.dx), y: add(d.start.y, d.dy), label: "Jouw eindpunt" }];
        if (x && y) return result(true, null, "Beide stappen volgen dezelfde gekozen richting.", { keep, probes });
        const mixed = x && !y && eq(d.dy, mul(-1, d.wantDy)) || y && !x && eq(d.dx, mul(-1, d.wantDx)), swapped = eq(d.dx, d.wantDy) && eq(d.dy, d.wantDx);
        return result(false, mixed ? "delta.orientation_mixed" : swapped ? "delta.swap_axes" : "delta.component", mixed ? "Je verschillen volgen niet dezelfde richting. Behoud de juiste stap en herstel de andere." : swapped ? "\u0394x beschrijft de horizontale verandering, \u0394y de verticale." : "Jouw stappen bereiken het tweede punt nog niet. Behoud de juiste component.", { keep, probes });
      }
      function checkSlope(t, r = {}) {
        const deltas = checkDeltas(t, r);
        if (!deltas.ok) return deltas;
        const numerator = parse(r.numerator), denominator = parse(r.denominator);
        if (!allValues([numerator, denominator]) || !denominator.n) return { ...syntax(), keep: deltas.keep };
        const d = deltaData(t, r), a = div(numerator, denominator), legacy = W.check(t.legacy, d.w, a);
        const probes = [{ x: t.points.B.x, y: add(t.points.A.y, mul(a, sub(t.points.B.x, t.points.A.x))), label: "Jouw rate vanaf A" }];
        if (legacy.ok) return result(true, null, "Deze verhouding bereikt beide punten, in beide richtingen.", { keep: { ...deltas.keep, rate: true }, probes });
        const reciprocal = t.model.a.n && eq(a, div(1, t.model.a)), sign = eq(a, mul(-1, t.model.a));
        return result(false, reciprocal ? "slope.reciprocal" : sign ? "slope.sign" : "slope.rate", "De rate moet verticale verandering per horizontale eenheid geven. Je juiste verschillen blijven staan.", { keep: { ...deltas.keep, rate: false }, probes });
      }
      function signalProbe(t, kind, prediction = {}) {
        if (!["zero", "difference"].includes(kind)) return syntax("Kies x = 0 of de verschilproef.");
        const value = parse(prediction.expected);
        if (!value) return syntax();
        const expected = kind === "zero" ? t.model.b : t.model.a, actual = kind === "zero" ? t.faultModel.b : t.faultModel.a, ok = eq(value, expected);
        return result(ok, "param.probe_prediction", ok ? "Je voorspelling uit de gegevens klopt. De grafiek geeft een andere waarde: onderzoek de koppeling." : "Vergelijk je voorspelling met de formule of tabel. De grafiekproef toont ook de afwijking.", { keep: { prediction: ok }, expected, actual, probes: (kind === "difference" ? [q(0), q(1)] : [q(0)]).map((x) => ({ kind, x, y: at(t.faultModel, x), expected: at(t.model, x), actual: at(t.faultModel, x) })) });
      }
      function checkSignal(t, r = {}) {
        const a = parse(r.a), b = parse(r.b);
        if (!a || !b || typeof r.feature !== "string") return syntax("Benoem de defecte koppeling en vul beide parameters in.");
        const aOK = eq(a, t.model.a), bOK = eq(b, t.model.b), keep = { a: aOK, b: bOK, feature: r.feature === "swapped" }, probes = [q(0), q(1)].map((x) => ({ x, y: add(mul(a, x), b), expected: at(t.model, x) }));
        if (r.feature !== "swapped") return result(false, "param.fault_location", "Vergelijk de rol van de verandering en de uitvoer bij x = 0. Benoem de defecte koppeling.", { keep, probes });
        if (aOK && bOK) return result(true, null, "De koppeling is hersteld: rate en uitvoer bij nul hebben elk hun eigen rol.", { keep, probes });
        const mismatch = probes.find((p) => !eq(p.y, p.expected));
        return result(false, eq(a, t.model.b) && eq(b, t.model.a) ? "param.slope_intercept_swap" : !aOK ? "param.rate" : "param.intercept", `Bij x = ${text(mismatch.x)} geeft jouw koppeling y = ${text(mismatch.y)}; nodig is y = ${text(mismatch.expected)}. Behoud de juiste parameter en herstel de andere.`, { keep, probes });
      }
      function checkHidden(t, value) {
        const y = parse(value);
        if (!y) return syntax();
        const ok = eq(y, t.hidden.y);
        return result(ok, "transfer.output", ok ? `Ook bij x = ${text(t.hidden.x)} geeft je regel y = ${text(y)}.` : `Je voorspelde y = ${text(y)}. Bij x = ${text(t.hidden.x)} geeft de regel y = ${text(t.hidden.y)}. Controleer je berekening; je eerdere stappen blijven staan.`, { keep: { hidden: ok }, probes: [{ x: t.hidden.x, y, expected: t.hidden.y }] });
      }
      return { makeTask, checkRoot, checkInterval, checkDeltas, checkSlope, signalProbe, checkSignal, checkHidden, intervalExpected, parse, at };
    });
  }
});

// games/rechten/rechtenwereld/evidence-adapter.js
var require_evidence_adapter = __commonJS({
  "games/rechten/rechtenwereld/evidence-adapter.js"(exports, module) {
    (function(root, factory) {
      const api = factory();
      if (typeof module === "object") module.exports = api;
      else root.RechtenV2Evidence = api;
    })(globalThis, () => {
      "use strict";
      const clone = (v) => JSON.parse(JSON.stringify(v));
      const phases = /* @__PURE__ */ new Set(["predict", "execute", "diagnose", "transfer"]);
      function record(state, input) {
        if (!state || state.schema !== 1 || !Array.isArray(state.events)) throw Error("Ongeldige proefstate.");
        for (const k of ["taskId", "attemptId", "skill"]) if (typeof input?.[k] !== "string" || !input[k]) throw Error("Ontbrekend evidenceveld: " + k);
        if (!phases.has(input.phase)) throw Error("Ongeldige evidencefase.");
        const result = clone(state), existing = result.events.find((e) => e.taskId === input.taskId && e.attemptId === input.attemptId);
        if (existing) return { state: result, event: clone(existing), duplicate: true };
        const errorKind = ["interaction_error", "authoring_error"].includes(input.errorKind) ? input.errorKind : null;
        const helpLevel = Math.max(0, Math.min(5, Number(input.helpLevel) || 0));
        const prior = result.events.filter((e) => e.taskId === input.taskId);
        const inheritedSupport = prior.some((e) => e.supported || e.helpLevel > 0) || prior.some((e) => e.phase === input.phase && !e.correct && !e.errorKind);
        const supported = !!input.supported || helpLevel > 0 || !!input.feedbackSeen || input.mode === "discover" || inheritedSupport;
        const event = {
          taskId: input.taskId,
          attemptId: input.attemptId,
          skill: input.skill,
          phase: input.phase,
          mode: input.mode || "practice",
          variant: input.variant ?? null,
          representation: input.representation || null,
          correct: input.correct === true && !errorKind,
          supported,
          helpLevel,
          feedbackSeen: !!input.feedbackSeen,
          independent: input.correct === true && !errorKind && !supported,
          mastery: false,
          misconception: errorKind ? null : input.misconception || null,
          errorKind,
          revision: Math.max(0, Number(input.revision) || 0),
          at: input.at || (/* @__PURE__ */ new Date()).toISOString()
        };
        result.events.push(event);
        return { state: result, event: clone(event), duplicate: false };
      }
      return Object.freeze({ record });
    });
  }
});

// games/rechten/rechtenwereld/points-core.js
var require_points_core = __commonJS({
  "games/rechten/rechtenwereld/points-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_wave_core());
      else root.RechtenV2Points = factory(root.RechtenWave);
    })(globalThis, function(W) {
      "use strict";
      const skills = ["point", "point_plot"], count = 6;
      const pair = (p) => `(${W.text(p.x)}, ${W.text(p.y)})`;
      function options(target, seed) {
        const x = W.num(target.x), y = W.num(target.y), pairs = [[x, y], [y, x], [-x, y], [x, -y], [-x, -y], [x === 5 ? x - 1 : x + 1, y], [x, y === 5 ? y - 1 : y + 1], [1, 1], [-1, 1]];
        const unique = [];
        for (const [a, b] of pairs) if (!unique.some((p) => W.eq(p.x, a) && W.eq(p.y, b))) unique.push({ x: W.q(a), y: W.q(b) });
        const result = unique.slice(0, 4);
        for (let i = 3; i > 0; i--) {
          seed = seed * 1664525 + 1013904223 >>> 0;
          const j = seed % (i + 1);
          [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
      }
      function makeTask(skill, index = 0, run = 1) {
        if (!skills.includes(skill)) throw Error("Onbekende puntenvaardigheid");
        const seed = index === 0 ? (skill === "point" ? 0 : 1) + run - 1 : 0;
        const variant = index === 0 ? 0 : ([0, 1, 2, 4, 6][(index - 1) % 5] + (run - 1) * 3) % 8;
        const params = W.generate("point_plot", { difficulty: index === 0 ? 0 : 1, variant, seed });
        const t = { id: `rechten-v2:puntenbaai:${skill}:${run}:${index}`, world: "puntenbaai", skill_id: skill, family_id: "F1", mode: index === 0 ? "discover" : "practice", variant: params.variant, index, target: params.target, bounds: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }, legacy: { skill: "point_plot", params }, given_representations: skill === "point" ? ["graph"] : ["coordinates"], options: options(params.target, run * 17 + index * 11), hints: [
          "Lees eerst x op de horizontale as, daarna y op de verticale as.",
          "Positieve x ligt rechts van 0; negatieve x ligt links.",
          "Positieve y ligt boven 0; negatieve y ligt onder 0. Op een as is \xE9\xE9n co\xF6rdinaat 0.",
          "Ander voorbeeld: (\u22122, 3) ligt twee stappen links en drie stappen omhoog vanaf de oorsprong.",
          "Voorbeeld: bij (\u22122, 3) is x = \u22122 en y = 3. De volgorde is altijd (x, y). Probeer een nieuw punt."
        ] };
        return t;
      }
      function check(t, values) {
        const read = t.skill_id === "point";
        let response = read && /^\d$/.test(String(values.answer ?? "")) ? t.options[Number(values.answer)] : !read ? values.point : null;
        const valid = response && ["x", "y"].every((k) => {
          try {
            return Number.isInteger(W.num(response[k])) && Math.abs(W.num(response[k])) <= 5;
          } catch {
            return false;
          }
        });
        if (!valid) return { ok: false, kind: "interaction_error", code: "point.missing", message: read ? "Kies eerst een antwoord." : "Plaats eerst een punt op het rooster.", keep: {} };
        const result = W.constructionCheck(t.legacy, response);
        return { ...result, kind: result.ok ? "correct" : "hypothesis", keep: {}, message: result.ok ? `Juist! Eerst x, daarna y: ${pair(t.target)}.` : read ? result.message.replace("Verplaats alleen y.", "Lees y opnieuw.").replace("Verplaats alleen x.", "Lees x opnieuw.") : result.message };
      }
      return Object.freeze({ skills, count, makeTask, check, pair });
    });
  }
});

// games/rechten/rechtenwereld/lines-core.js
var require_lines_core = __commonJS({
  "games/rechten/rechtenwereld/lines-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_wave_core());
      else root.RechtenV2Lines = factory(root.RechtenWave);
    })(globalThis, function(W) {
      "use strict";
      const skills = ["line_behavior", "special_lines"], count = (skill) => skill === "line_behavior" ? 9 : 6;
      const firstPhase = (t) => t.skill_id === "special_lines" ? "line-special" : t.representation === "points" ? "line-plot" : "line-behavior";
      function makeTask(skill, index = 0, run = 1) {
        if (!skills.includes(skill)) throw Error("Onbekende rechtevaardigheid");
        const special = skill === "special_lines";
        const rows = special ? [[-2, 0, 3, 0], [2, -3, 2, 2], [-2, -1, 2, 3], [-3, -2, 1, -2], [0, -2, 0, 3], [1, 2, 1, 2]] : [[-1, 0, 0, -2], [0, 2, 2, -1], [1, 0.5, -1, 3.5], [-2, -2, 1, 1], [-1, -1, 1, 2], [-1, -1.5, 1, 1.5], [-2, 1, 2, 1], [-2, -2, 2, -2], [-2, -0.5, 2, -0.5]];
        const row = rows[index % rows.length], shift = [0, 0.5, -0.5][(run - 1) % 3], A = { x: W.fromNumber(row[0]), y: W.fromNumber(row[1] + shift) }, B = { x: W.fromNumber(row[2]), y: W.fromNumber(row[3] + shift) }, model = W.model(A, B), representation = special ? "points" : ["graph", "slope", "points"][index % 3];
        const variant = model.kind === "identical" ? "identical" : model.kind === "vertical" ? "vertical" : !model.a.n ? "horizontal" : model.a.n > 0 ? "positive" : "negative";
        return { id: `rechten-v2:hellingrug:${skill}:${run}:${index}`, world: "hellingrug", skill_id: skill, family_id: "F2", mode: index === 0 ? "discover" : "practice", index, count: count(skill), variant, points: { A, B }, model, representation, gridStep: [A.x, A.y, B.x, B.y].some((q) => q.d !== 1) ? 0.5 : 1, bounds: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }, given_representations: [representation], legacy: { skill, params: { A, B, model } }, hints: special ? [
          "Vergelijk eerst de x-co\xF6rdinaten en daarna de y-co\xF6rdinaten.",
          "Verschillende punten met dezelfde y bepalen een horizontale rechte. Dezelfde x geeft een verticale rechte.",
          "Bij een functie hoort bij elke x precies \xE9\xE9n y. Op een verticale rechte horen meerdere y-waarden bij dezelfde x.",
          "Als A en B samenvallen, heb je maar \xE9\xE9n punt. Daardoor is er geen unieke rechte bepaald.",
          "Ander voorbeeld: A(\u22123, 4) en B(1, 4) geven y = 4: horizontaal en een functie. A(2, \u22121) en B(2, 3) geven x = 2: verticaal en geen functie."
        ] : [
          "Lees de rechte steeds van links naar rechts: x neemt toe.",
          "Stijgend: y wordt groter. Dalend: y wordt kleiner. Constant: y blijft gelijk.",
          "Het teken van a beslist: positief is stijgend, negatief is dalend, nul is constant.",
          "Als A en B in omgekeerde volgorde gegeven zijn, kijk je toch van links naar rechts.",
          "Ander voorbeeld: A(\u22123, 4) en B(1, 4) hebben dezelfde y. De rechte is constant en a = 0. Probeer daarna een nieuw geval."
        ] };
      }
      const validPlot = (t, p) => !!p && ["x", "y"].every((k) => typeof p[k] === "number" && Number.isFinite(p[k]) && Math.abs(p[k]) <= 5 && Number.isInteger(p[k] / t.gridStep));
      const syntax = (message) => ({ ok: false, kind: "interaction_error", code: "input.missing", message, keep: {} });
      function pointResult(t, name, p) {
        if (!validPlot(t, p)) return { ok: false, code: "point.missing", message: `Plaats punt ${name} op het rooster.` };
        const r = W.constructionCheck({ skill: "point_plot", params: { target: t.points[name] } }, { x: W.fromNumber(p.x), y: W.fromNumber(p.y) });
        return { ...r, message: r.ok ? `Punt ${name} staat goed.` : `Punt ${name}: ${r.message}` };
      }
      const classification = (t) => t.model.kind === "identical" ? "neither" : t.model.kind === "vertical" ? "vertical" : t.model.a.n === 0 ? "horizontal" : "neither";
      const functionKind = (t) => t.model.kind === "identical" ? "unknown" : t.model.kind === "vertical" ? "no" : "yes";
      function check(t, v, phase) {
        if (phase === "line-plot") {
          if (!v.plotA || !v.plotB) return syntax("Plaats eerst A \xE9n B op het rooster.");
          const a = pointResult(t, "A", v.plotA), b = pointResult(t, "B", v.plotB), ok = a.ok && b.ok;
          return { ok, kind: ok ? "correct" : "hypothesis", code: ok ? null : !a.ok ? a.code : b.code, message: ok ? "Beide punten staan goed. Kijk nu van links naar rechts." : !a.ok ? a.message : b.message, keep: { plotA: a.ok, plotB: b.ok } };
        }
        if (phase === "line-behavior") {
          if (!["stijgend", "dalend", "constant"].includes(v.behavior)) return syntax("Kies stijgend, dalend of constant.");
          const r = W.check(t.legacy, { index: 0, values: {} }, v.behavior);
          return { ...r, kind: r.ok ? "correct" : "hypothesis", code: r.ok ? null : r.code, message: r.ok ? `Juist: de rechte is ${v.behavior}.` : t.representation === "slope" ? "Kijk naar het teken van a: positief, negatief of nul." : "Volg de rechte van links naar rechts. Wordt y groter, kleiner of blijft y gelijk?", keep: {} };
        }
        if (!["horizontal", "vertical", "neither"].includes(v.lineKind) || !["yes", "no", "unknown"].includes(v.isFunction)) return syntax("Beantwoord beide vragen: het soort rechte en of het een functie is.");
        const oblique = t.model.kind === "affine" && t.model.a.n !== 0, mapped = v.lineKind === "horizontal" ? "horizontaal" : v.lineKind === "vertical" ? "verticaal" : t.model.kind === "identical" ? "identiek" : "geen van beide";
        const lineOK = oblique ? v.lineKind === "neither" : W.check(t.legacy, { index: 0, values: {} }, mapped).ok;
        const fnOK = t.model.kind === "identical" ? v.isFunction === "unknown" : W.check(t.legacy, { index: 4, values: {} }, v.isFunction === "yes" ? "functie" : v.isFunction === "no" ? "geen functie" : "onbepaald").ok;
        const keep = { lineKind: lineOK, isFunction: fnOK };
        if (!lineOK || !fnOK) return { ok: false, kind: "hypothesis", code: !lineOK ? "line.classification" : "line.function", keep, message: !lineOK ? "Vergelijk de co\xF6rdinaten. Gelijke y: horizontaal; gelijke x: verticaal. Als beide punten hetzelfde zijn, is er geen unieke rechte." : t.model.kind === "identical" ? "A en B vallen samen. E\xE9n punt bepaalt geen unieke rechte, dus je kunt dit niet vaststellen." : "Een functie heeft bij elke x precies \xE9\xE9n y. Controleer of dat hier zo is." };
        for (const name of ["A", "B"]) if (v["plot" + name]) {
          const r = pointResult(t, name, v["plot" + name]);
          if (!r.ok) return { ok: false, kind: "hypothesis", code: r.code, keep, message: `Je antwoorden kloppen. ${r.message} Verplaats het punt of wis je plaatsing.` };
        }
        return { ok: true, kind: "correct", code: null, keep, message: t.model.kind === "identical" ? "Juist: de punten vallen samen. Er is geen unieke rechte; of die een functie is, kun je niet bepalen." : oblique ? "Juist: de rechte is schuin en stelt een functie voor." : t.model.kind === "vertical" ? "Juist: de rechte is verticaal en stelt geen functie voor." : "Juist: de rechte is horizontaal en stelt een functie voor." };
      }
      return Object.freeze({ skills, count, makeTask, firstPhase, validPlot, pointResult, classification, functionKind, check });
    });
  }
});

// games/rechten/rechtenwereld/hills-core.js
var require_hills_core = __commonJS({
  "games/rechten/rechtenwereld/hills-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_wave_core(), require_semantic_math_core(), require_lines_core());
      else root.RechtenV2Hills = factory(root.RechtenWave, root.RechtenV2Math, root.RechtenV2Lines);
    })(globalThis, function(W, M, L) {
      "use strict";
      const skills = ["delta", "slope", "slope_from_two_points", ...L.skills], count = 6, slots = ["y1", "y0", "x1", "x0"];
      const names = { delta: "\u0394x en \u0394y", slope: "Richtingsco\xEBffici\xEBnt", slope_from_two_points: "Helling uit twee punten", line_behavior: "Stijgend, dalend of constant", special_lines: "Bijzondere rechten" };
      const fraction = (top, bottom) => {
        const row = (value) => value.includes("<sub>") ? `<span class="hill-formula-expression">${value}</span>` : value;
        return `<span class="hill-fraction"><span>${row(top)}</span><span>${row(bottom)}</span></span>`;
      };
      function choices(want, other, seed, reciprocal = false) {
        const values = [want, W.mul(-1, want), other, W.mul(-1, other), W.q(0), W.add(want, 1), W.sub(want, 1), W.q(2), W.q(-2)];
        if (reciprocal && want.n) values.splice(2, 0, W.div(1, want));
        const unique = [];
        for (const q of values) if (!unique.some((p) => W.eq(p, q))) unique.push(q);
        const out = unique.slice(0, 4);
        for (let i = 3; i > 0; i--) {
          seed = seed * 1664525 + 1013904223 >>> 0;
          const j = seed % (i + 1);
          [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
      }
      function makeTask(skill, index = 0, run = 1) {
        if (L.skills.includes(skill)) return L.makeTask(skill, index, run);
        if (!skills.includes(skill)) throw Error("Onbekende hellingvaardigheid");
        const pool = [[0, 2, 2, 1], [-2, -1, 1, 2], [-1, 3, 1, -1], [-3, -2, 1, 0], [-2, 2, 2, 2], [1, -2, 3, 1]];
        let row = pool[index % count];
        if (skill === "slope_from_two_points" && index === 0) row = [1, 0, 2, -2];
        const shift = (run - 1) % 3;
        const yShift = shift === 2 ? -1 : shift;
        const [ax, ay, bx, by] = row, A = { x: W.q(ax), y: W.q(ay + yShift) }, B = { x: W.q(bx), y: W.q(by + yShift) }, model = W.model(A, B), dx = W.sub(B.x, A.x), dy = W.sub(B.y, A.y);
        const variant = !model.a.n ? "horizontal" : model.a.d > 1 ? model.a.n < 0 ? "negative-fraction" : "positive-fraction" : model.a.n < 0 ? "negative" : "positive";
        return { id: `rechten-v2:hellingrug:${skill}:${run}:${index}`, world: "hellingrug", skill_id: skill, family_id: "F2", index, mode: index === 0 ? "discover" : "practice", variant, points: { A, B }, model, dx, dy, bounds: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }, legacy: { skill: "slope_from_two_points", params: { A, B, model } }, given_representations: skill === "slope_from_two_points" ? ["coordinates"] : ["graph"], options: { dx: choices(dx, dy, run * 19 + index * 7), dy: choices(dy, dx, run * 23 + index * 13), a: choices(model.a, dx, run * 29 + index * 11, true) }, hints: [
          "Volg steeds dezelfde richting: van A naar B.",
          "\u0394x is horizontaal: xB \u2212 xA. \u0394y is verticaal: yB \u2212 yA.",
          "Omhoog en rechts zijn positief; omlaag en links zijn negatief. De helling is \u0394y gedeeld door \u0394x.",
          "Ander voorbeeld: A(\u22121, 1), B(2, 7). \u0394x = 2 \u2212 (\u22121) en \u0394y = 7 \u2212 1.",
          "Voorbeeld: A(\u22121, 1), B(2, 7): \u0394x = 3 en \u0394y = 6, dus a = 6/3 = 2. Probeer nu een nieuw geval."
        ] };
      }
      const firstPhase = (skill, task) => L.skills.includes(skill) ? L.firstPhase(task) : skill === "delta" ? "hill-dx" : skill === "slope" ? "hill-rate" : "hill-inspect";
      const nextPhase = (phase) => ({ "line-plot": "line-behavior", "line-behavior": "next-task", "line-special": "next-task", "hill-dx": "hill-dy", "hill-dy": "next-task", "hill-rate": "next-task", "hill-fill": "hill-calculate", "hill-calculate": "next-task" })[phase];
      const syntax = (message) => ({ ok: false, kind: "interaction_error", code: "input.missing", message, keep: {} });
      const result = (r, message, keep = {}) => ({ ...r, kind: r.ok ? "correct" : "hypothesis", code: r.ok ? null : r.code, message, keep });
      function coordinate(t, token) {
        return /^[AB]\.[xy]$/.test(token || "") ? t.points[token[0]][token[2]] : null;
      }
      function check(t, v, phase) {
        if (L.skills.includes(t.skill_id)) return L.check(t, v, phase);
        if (phase === "hill-fill") {
          if (!slots.every((k) => coordinate(t, v[k]))) return syntax("Vul eerst alle vier vakjes met een co\xF6rdinaat.");
          const ys = [v.y1[0], v.y0[0]], xs = [v.x1[0], v.x0[0]], work = { values: { ys } };
          const yOK = [v.y1, v.y0].every((s) => s.endsWith(".y")) && W.check(t.legacy, { ...work, index: 0 }, ys).ok;
          const xOK = [v.x1, v.x0].every((s) => s.endsWith(".x")) && W.check(t.legacy, { ...work, index: 1 }, xs).ok;
          const ok = yOK && xOK, keep = { y1: yOK, y0: yOK, x1: yOK && xOK, x0: yOK && xOK };
          return result({ ok, code: !yOK ? "delta.y_coordinates" : "delta.direction" }, ok ? "De co\xF6rdinaten staan goed: boven de y-waarden, onder de x-waarden, in dezelfde richting." : !yOK ? "Gebruik bovenaan de twee y-co\xF6rdinaten van verschillende punten." : "De teller klopt. Gebruik onderaan de x-co\xF6rdinaten in dezelfde volgorde.", keep);
        }
        if (phase === "hill-calculate") {
          const a = M.parse(v.a);
          if (!a) return syntax("Vul een getal of breuk in, bijvoorbeeld \u22121/2.");
          const r2 = W.check(t.legacy, { index: 2, values: {} }, a);
          const message = r2.ok ? `Juist: a = ${W.text(a)}.` : W.eq(a, W.mul(-1, t.model.a)) ? "Controleer de tekens. Gebruik bij beide aftrekkingen dezelfde richting." : t.model.a.n && W.eq(a, W.div(1, t.model.a)) ? "Je hebt de breuk omgekeerd. Deel \u0394y door \u0394x." : "Reken de teller en noemer uit en deel \u0394y door \u0394x.";
          return result(r2, message);
        }
        const key = phase === "hill-dx" ? "dx" : phase === "hill-dy" ? "dy" : "a", field = key === "a" ? "rateChoice" : key + "Choice", i = String(v[field] ?? "");
        if (!/^[0-3]$/.test(i)) return syntax("Kies eerst een antwoord.");
        const value = t.options[key][Number(i)], r = key === "a" ? W.check(t.legacy, { index: 2, values: {} }, value) : M.checkDeltas(t, { direction: "AB", dx: W.text(key === "dx" ? value : t.dx), dy: W.text(key === "dy" ? value : t.dy) });
        return result(r, r.ok ? `Juist: ${key === "a" ? "a" : "\u0394" + key[1]} = ${W.text(value)}.` : key === "dx" ? "\u0394x = xB \u2212 xA. Kijk naar de horizontale verandering." : key === "dy" ? "\u0394y = yB \u2212 yA. Omlaag is negatief; omhoog is positief." : "Deel \u0394y door \u0394x. Let op de volgorde en de tekens.");
      }
      return Object.freeze({ lines: L, taskCount: (skill) => L.skills.includes(skill) ? L.count(skill) : count, skills, count, slots, names, fraction, makeTask, firstPhase, nextPhase, coordinate, check });
    });
  }
});

// games/rechten/rechtenwereld/grens-core.js
var require_grens_core = __commonJS({
  "games/rechten/rechtenwereld/grens-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_wave_core(), require_semantic_math_core());
      else root.RechtenV2Grens = factory(root.RechtenWave, root.RechtenV2Math);
    })(globalThis, function(W, M) {
      "use strict";
      const skills = ["zeroRead", "zero", "signchart", "positive", "negative"], count = 6;
      const titles = { zeroRead: "Nulwaarde aflezen", zero: "Nulwaarde berekenen", signchart: "Tekenschema", positive: "Wanneer is f(x) > 0?", negative: "Wanneer is f(x) < 0?" };
      const slots = ["chartLeft", "chartZero", "chartRight"];
      const firstPhase = (skill) => skill === "signchart" ? "grens-chart" : ["positive", "negative"].includes(skill) ? "grens-root" : "grens-zero";
      function choices(root, model, seed) {
        const candidates = [root, W.mul(-1, root), model.b, W.q(0), W.add(root, 1), W.sub(root, 1), W.add(root, 2)];
        const unique = [];
        for (const q of candidates) if (!unique.some((p) => W.eq(p, q))) unique.push(q);
        const result = unique.slice(0, 4);
        for (let i = result.length - 1; i > 0; i--) {
          seed = seed * 1664525 + 1013904223 >>> 0;
          const j = seed % (i + 1);
          [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
      }
      function makeTask(skill, index = 0, run = 1) {
        if (!skills.includes(skill)) throw Error("Onbekende Grenspas-vaardigheid");
        const rows = skill === "positive" ? [[-1, -2], [1, 3], [-0.5, 0], [2, -1.5], [-2, 1.5], [0.5, -3]] : skill === "signchart" ? [[1, 1], [1, 3], [-1, -2], [-0.5, 0], [2, -1.5], [-2, 1.5]] : [[1, skill === "zeroRead" ? 3 : 2], [-1, -2], [2, 0], [-0.5, 3], [2, 1.5], [-2, -1.5]];
        const [slope, boundary] = rows[index % count], root = W.fromNumber(boundary + [0, 0.5, -0.5][(run - 1) % 3]), a = W.fromNumber(slope), model = { kind: "affine", a, b: W.mul(-1, W.mul(a, root)) };
        const representation = skill === "zero" ? "formula" : skill === "signchart" && index % 2 ? "formula" : "graph", sign = ["positive", "negative"].includes(skill);
        const t = { id: `rechten-v2:grenspas:${skill}:${run}:${index}`, world: "grenspas", key: skill, skill_id: sign ? "sign" : skill, family_id: "F6", index, count, mode: index === 0 ? "discover" : "practice", variant: `${skill}:${a.n > 0 ? "rising" : "falling"}:${root.n === 0 ? "zero" : root.n < 0 ? "negative" : "positive"}:${root.d > 1 ? "fraction" : "integer"}:${representation}`, model, root, ask: skill === "negative" ? "negative" : "positive", representation, given_representations: [representation], bounds: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }, options: choices(root, model, run * 31 + index * 17 + skills.indexOf(skill)), hints: skill === "signchart" ? [
          "Kijk links en rechts van de nulwaarde.",
          "Boven de x-as is f(x) positief; onder de x-as is f(x) negatief.",
          "Op de nulwaarde is f(x) gelijk aan 0.",
          "Bij een stijgende rechte staat links \u2212 en rechts +. Bij een dalende rechte is dat omgekeerd.",
          "Ander voorbeeld: f(x) = \u2212x + 4 heeft nulwaarde 4 en tekens +, 0, \u2212. Probeer een nieuw geval."
        ] : sign ? [
          "Zoek eerst waar de grafiek de x-as snijdt.",
          skill === "negative" ? "Zoek de x-waarden waarvoor de grafiek onder de x-as ligt." : "Zoek de x-waarden waarvoor de grafiek boven de x-as ligt.",
          "Links van de nulwaarde betekent x < de nulwaarde; rechts betekent x > de nulwaarde.",
          "Op de nulwaarde is f(x) = 0. Die grens hoort niet bij f(x) > 0 of f(x) < 0.",
          "Ander voorbeeld: f(x) = x \u2212 4 is positief voor x > 4 en negatief voor x < 4. Probeer een nieuw geval."
        ] : [
          skill === "zero" ? "Stel f(x) gelijk aan 0." : "Lees de x-waarde waar de grafiek de x-as snijdt.",
          "De nulwaarde is een x-waarde, niet de hoogte op de y-as.",
          "In ax + b = 0 breng je b naar rechts en deel je door a.",
          "Controleer door je gekozen x in de formule in te vullen: de uitkomst moet 0 zijn.",
          "Ander voorbeeld: 2x \u2212 8 = 0 geeft 2x = 8 en dus x = 4. Probeer een nieuw geval."
        ] };
        return { ...t, hints: hintsFor(t) };
      }
      function hintsFor(t) {
        return t.key === "signchart" && t.representation === "formula" ? [
          "Kijk naar de richtingsco\xEBffici\xEBnt a: de co\xEBffici\xEBnt van x.",
          "Bij x is a = 1. Bij \u2212x is a = \u22121. Het losse getal is niet de richtingsco\xEBffici\xEBnt.",
          "Als a > 0, stijgt de rechte: links van de nulwaarde \u2212, rechts +.",
          "Als a < 0, daalt de rechte: links van de nulwaarde +, rechts \u2212. Op de nulwaarde staat 0.",
          "Ander voorbeeld: f(x) = \u22122x + 8 heeft a = \u22122 en nulwaarde 4. Het tekenschema is +, 0, \u2212. Probeer een nieuw geval."
        ] : t.hints;
      }
      const syntax = (message) => ({ ok: false, kind: "interaction_error", code: "input.missing", message, keep: {} });
      const signOf = (q) => q.n < 0 ? "-" : q.n > 0 ? "+" : "0";
      function expectedChart(t) {
        return { chartLeft: signOf(M.at(t.model, W.sub(t.root, 1))), chartZero: "0", chartRight: signOf(M.at(t.model, W.add(t.root, 1))) };
      }
      function check(t, v, phase) {
        if (phase === "grens-zero" || phase === "grens-root") {
          const answer = /^[0-3]$/.test(String(v.answer ?? "")) ? t.options[Number(v.answer)] : null;
          if (!answer) return syntax("Kies eerst een antwoord.");
          const r = M.checkRoot(t, W.text(answer));
          return { ...r, keep: { answer: r.ok }, message: r.ok ? `Juist: de nulwaarde is ${W.text(t.root)}.` : t.representation === "formula" ? `Met jouw x krijg je f(x) = ${W.text(M.at(t.model, answer))}. Zoek de x waarvoor f(x) = 0.` : r.message };
        }
        if (phase === "grens-chart") {
          if (slots.some((k) => !["-", "0", "+"].includes(v[k]))) return syntax("Vul eerst alle drie de tekens in.");
          const want = expectedChart(t), keep = Object.fromEntries(slots.map((k) => [k, v[k] === want[k]])), wrong = slots.find((k) => !keep[k]);
          return { ok: !wrong, kind: wrong ? "hypothesis" : "correct", code: wrong === "chartZero" ? "zero.output_zero" : wrong ? "sign.side_reversed" : null, keep, message: !wrong ? "Juist: je tekens passen links, op en rechts van de nulwaarde." : wrong === "chartZero" ? "Op de nulwaarde is f(x) = 0. Behoud je juiste tekens." : t.representation === "formula" ? "Kijk naar a, de co\xEBffici\xEBnt van x. Bij a > 0 zijn de tekens \u2212, 0, +; bij a < 0 zijn ze +, 0, \u2212. Je juiste tekens blijven staan." : `Kijk ${wrong === "chartLeft" ? "links" : "rechts"} van de nulwaarde: ligt de grafiek boven of onder de x-as? Je juiste tekens blijven staan.` };
        }
        if (phase === "grens-inequality") {
          if (!["<", "=", ">"].includes(v.inequality)) return syntax("Kies eerst het juiste x-gebied.");
          const r = M.checkInterval(t, { boundary: W.text(t.root), symbolBoundary: W.text(t.root), closed: false, side: v.inequality === "<" ? "left" : v.inequality === ">" ? "right" : "point", symbol: v.inequality });
          return { ...r, keep: { answer: true }, message: r.ok ? `Juist: f(x) ${t.ask === "negative" ? "<" : ">"} 0 voor x ${v.inequality} ${W.text(t.root)}.` : r.message };
        }
        return syntax("Deze stap is nog niet beschikbaar.");
      }
      return Object.freeze({ skills, count, titles, slots, firstPhase, makeTask, hintsFor, expectedChart, check });
    });
  }
});

// games/rechten/rechtenwereld/formula-core.js
var require_formula_core = __commonJS({
  "games/rechten/rechtenwereld/formula-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_wave_core(), require_semantic_math_core());
      else root.RechtenV2Formula = factory(root.RechtenWave, root.RechtenV2Math);
    })(globalThis, function(W, M) {
      "use strict";
      const skills = ["equation_from_ab", "graph_from_equation", "equation_from_graph", "rewrite_linear_equation", "graph_from_table"], count = 6;
      const worldFor = (skill) => skill === "graph_from_table" ? "signaalstad" : "formulewerf";
      const titles = { graph_from_table: "Rechte uit tabel", equation_from_ab: "Voorschrift uit a en b", graph_from_equation: "Rechte uit voorschrift", equation_from_graph: "Voorschrift uit grafiek", rewrite_linear_equation: "Vergelijking herschrijven" };
      const slots = ["factor", "variable", "operator", "constant"];
      const phases = { graph_from_table: "formula-plot", equation_from_ab: "formula-build", graph_from_equation: "formula-plot", equation_from_graph: "formula-read", rewrite_linear_equation: "formula-rewrite" };
      const firstPhase = (skill) => phases[skill];
      const hints = {
        graph_from_table: ["Elke kolom geeft een punt: (x; f(x)).", "Lees x in de bovenste rij en y in dezelfde kolom eronder.", "Plaats eerst \xE9\xE9n punt. Kies daarna een andere kolom voor het tweede punt.", "De rechte door je punten moet bij alle kolommen passen. Let op negatieve getallen en halve stappen.", "Ander voorbeeld: de kolommen (0; 1) en (2; 3) geven twee punten op dezelfde rechte. Probeer een nieuw geval."],
        equation_from_ab: ["Gebruik de vorm y = ax + b.", "De co\xEBffici\xEBnt van x is a. De constante term is b.", "Kies het teken en het getal zo dat ze samen b voorstellen.", "Ook 0 en negatieve co\xEBffici\xEBnten zijn mogelijk. Een bouwsteen mag je meermaals gebruiken.", "Ander voorbeeld: a = \u22123 en b = 4 geven y = \u22123x + 4. Probeer een nieuw geval."],
        graph_from_equation: ["Bepaal zelf a en b uit het voorschrift.", "b geeft de y-co\xF6rdinaat van het snijpunt met de y-as.", "a vertelt hoe y verandert als x met \xE9\xE9n toeneemt. Let op het teken.", "Je kunt ook twee x-waarden kiezen en hun y-waarden berekenen. Gebruik twee verschillende punten.", "Ander voorbeeld: bij y = \u22123x + 4 liggen (0, 4) en (1, 1) op de rechte. Probeer een nieuw geval."],
        equation_from_graph: ["Lees eerst b af. Onderzoek daarna hoe de rechte stijgt of daalt.", "Op de y-as is x = 0. De hoogte van de rechte is daar b.", "Kies twee goed afleesbare roosterpunten. a is \u0394y gedeeld door \u0394x.", "Bij een horizontale rechte is a = 0. Een dalende rechte heeft een negatieve a.", "Ander voorbeeld: een rechte door (0, 4) en (1, 1) heeft a = \u22123 en b = 4. Probeer een nieuw geval."],
        rewrite_linear_equation: ["Werk tot y alleen links staat.", "Pas elke bewerking toe op beide volledige leden.", "Werk de x-term en eventuele constante links weg.", "Deel beide leden door de co\xEBffici\xEBnt van y. Je mag ook een andere geldige volgorde kiezen.", "Ander voorbeeld: 3y + 9x = 12 wordt 3y = \u22129x + 12 en dan y = \u22123x + 4. Probeer een nieuw geval."]
      };
      function makeTask(skill, index = 0, run = 1) {
        if (!skills.includes(skill)) throw Error("Onbekende Formulewerf-vaardigheid");
        const rows = skill === "graph_from_table" ? [[1, 1], [-1, 2], [2, -1], [0.5, 1], [-0.5, -1], [0, 2]] : skill === "equation_from_ab" ? [[2, 2], [-1, 3], [1, -2], [0.5, 0], [-0.5, -1], [0, 2]] : skill === "rewrite_linear_equation" ? [[2, 3], [-1, -2], [0.5, 1], [-0.5, -1], [0, 2], [1, 0]] : [[2, 1], [1, -1], [-1, 2], [0.5, -2], [-0.5, 1], [0, -1]];
        const [slope, intercept] = rows[index % count], model = { kind: "affine", a: W.fromNumber(slope), b: W.fromNumber(intercept + [0, 1, -1][(run - 1) % 3]) };
        const tableXs = Array.from({ length: 11 }, (_, i) => i - 5).filter((x) => Math.abs(W.num(W.add(W.mul(model.a, x), model.b))) <= 5);
        const table = skill === "graph_from_table" ? [tableXs[0], tableXs[index % count === 0 ? 1 : Math.floor(tableXs.length / 2)], tableXs.at(-1)].map((x) => ({ x: W.q(x), y: W.add(W.mul(model.a, x), model.b) })) : null;
        const world = worldFor(skill);
        const factor = W.q([2, 3, -2, 2, 4, -2][index % count]), equation = { left: W.expr(W.mul(-1, W.mul(model.a, factor)), factor), right: W.expr(0, 0, W.mul(model.b, factor)) };
        const tokens = [model.a, W.q(Math.abs(model.b.n), model.b.d), W.mul(-1, model.a), model.b, W.q(0), W.q(1), W.q(-1), W.q(2)].map(W.text).filter((v, i, a) => a.indexOf(v) === i);
        let seed = run * 31 + index * 19;
        for (let i = tokens.length - 1; i > 0; i--) {
          seed = seed * 1664525 + 1013904223 >>> 0;
          const j = seed % (i + 1);
          [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
        }
        tokens.push("x", "+", "\u2212");
        return { id: `rechten-v2:${world}:${skill}:${run}:${index}`, world, skill_id: skill, family_id: table ? "F5" : "F7", index, count, model, equation, tokens, ...table ? { table } : {}, gridStep: model.a.d > 1 ? 0.5 : 1, parameterStep: 0.5, bounds: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }, mode: index === 0 ? "discover" : "practice", variant: !model.a.n ? "horizontal" : model.a.d > 1 ? model.a.n < 0 ? "negative-fraction" : "positive-fraction" : model.a.n < 0 ? "negative" : "positive", given_representations: [table ? "table" : skill === "equation_from_ab" ? "coefficients" : skill === "equation_from_graph" ? "graph" : "equation"], hints: [...hints[skill]], legacy: { skill: skill === "equation_from_graph" ? "equation_from_ab" : skill, params: { model, equation, scaleX: W.q(1), scaleY: W.q(1) } } };
      }
      const syntax = (message) => ({ ok: false, kind: "interaction_error", code: "input.missing", message, keep: {} });
      const result = (ok, code, message, keep = {}) => ({ ok, kind: ok ? "correct" : "hypothesis", code: ok ? null : code, message, keep });
      const validPoint = (t, p) => !!p && ["x", "y"].every((k) => typeof p[k] === "number" && Number.isFinite(p[k]) && Math.abs(p[k]) <= 5 && Number.isInteger(p[k] / t.gridStep));
      const rationalPoint = (p) => ({ x: W.fromNumber(p.x), y: W.fromNumber(p.y) });
      function currentEquation(t, v) {
        return v.algebraSteps?.at(-1)?.equation || t.equation;
      }
      function operations(t, v) {
        const e = currentEquation(t, v), abs = (q) => W.q(Math.abs(q.n), q.d), x = abs(e.left.x.n ? e.left.x : t.equation.left.x.n ? t.equation.left.x : W.q(2)), c = abs(e.left.c.n ? e.left.c : e.right.c.n ? e.right.c : W.q(1)), factor = !W.eq(e.left.y, 1) && e.left.y.n ? e.left.y : t.equation.left.y;
        return [{ kind: "add", term: "x", value: x }, { kind: "subtract", term: "x", value: x }, { kind: "add", term: "c", value: c }, { kind: "subtract", term: "c", value: c }, { kind: "divide", value: factor }, { kind: "divide", value: W.div(1, factor), multiply: true }];
      }
      function operationLabel(op) {
        const value = op.multiply ? W.div(1, op.value) : op.value, label = W.text(value), wrapped = value.n < 0 ? "(" + label + ")" : label;
        return (op.kind === "divide" ? op.multiply ? "\xD7 " : "\xF7 " : op.kind === "add" ? "+" : "\u2212") + wrapped + (op.kind !== "divide" && op.term === "x" ? "x" : "");
      }
      function applyOperation(t, v, index) {
        const op = operations(t, v)[index];
        if (!op) return { error: "Kies een bewerking." };
        if ((v.algebraSteps?.length || 0) >= 8) return { error: "Maak een stap ongedaan om je uitwerking kort te houden." };
        const r = W.check(t.legacy, { index: 0, equation: currentEquation(t, v) }, op);
        return r.ok ? { equation: r.next, operation: operationLabel(op) } : { error: r.message };
      }
      function check(t, v, phase) {
        if (phase === "formula-build") {
          const a = M.parse(v.factor), b = M.parse(v.constant);
          if (!a || !b || v.variable !== "x" || !["+", "\u2212"].includes(v.operator)) return syntax("Vul de vier vakjes in: getal, x, teken en getal.");
          const r = W.constructionCheck(t.legacy, { a, b, variable: v.variable, sign: v.operator }), aOK = W.eq(a, t.model.a), bOK = W.eq(W.mul(v.operator === "\u2212" ? -1 : 1, b), t.model.b);
          return result(r.ok, r.code, r.ok ? "Juist: je voorschrift heeft de gegeven a en b." : r.message, { factor: aOK, variable: true, operator: bOK, constant: bOK });
        }
        if (phase === "formula-plot") {
          if (!validPoint(t, v.plotA) || !validPoint(t, v.plotB)) return syntax("Plaats eerst twee punten op het rooster.");
          const points = [rationalPoint(v.plotA), rationalPoint(v.plotB)], r = W.constructionCheck(t.legacy, points), same = W.eq(points[0].x, points[1].x) && W.eq(points[0].y, points[1].y), keep = { plotA: W.onLine(points[0], t.model), plotB: !same && W.onLine(points[1], t.model) };
          const message = t.table ? r.ok ? "Juist: jouw rechte past bij alle kolommen uit de tabel." : same ? "Twee gelijke punten bepalen geen rechte. Verplaats \xE9\xE9n punt." : !keep.plotA ? "Punt A past niet bij de tabel. Lees x en f(x) in dezelfde kolom." : "Punt A klopt. Controleer de co\xF6rdinaten van B met de tabel." : r.ok ? "Juist: de rechte door jouw punten hoort bij het voorschrift." : r.message;
          return result(r.ok, r.code, message, keep);
        }
        if (phase === "formula-read") {
          const a = M.parse(v.a), b = M.parse(v.b);
          if (!a || !b) return syntax("Vul a en b in. Een breuk of decimaal mag ook.");
          const r = W.constructionCheck(t.legacy, { a, b, variable: "x", sign: "+" }), keep = { a: W.eq(a, t.model.a), b: W.eq(b, t.model.b) };
          return result(r.ok, r.code, r.ok ? "Juist: a en b beschrijven deze grafiek." : !keep.b ? "Lees b opnieuw af op de y-as. Een juiste a blijft staan." : "Controleer de verandering van y per stap in x. Een juiste b blijft staan.", keep);
        }
        if (phase === "formula-rewrite") {
          if (!v.algebraSteps?.length) return syntax("Kies eerst een bewerking voor beide leden.");
          const equation = currentEquation(t, v);
          if (!W.equivalent(t.equation, equation)) return result(false, "algebra.equivalence", "Je uitwerking moet dezelfde vergelijking blijven voorstellen. Gebruik ongedaan maken.");
          const r = W.check(t.legacy, { index: 0, equation }, { kind: "finish" });
          return result(r.ok, r.code, r.ok ? "Juist: y staat alleen links en de vergelijking is equivalent." : r.message);
        }
        return syntax("Deze stap is niet beschikbaar.");
      }
      return Object.freeze({ worldFor, skills, count, titles, slots, firstPhase, makeTask, validPoint, currentEquation, operations, operationLabel, applyOperation, check });
    });
  }
});

// games/rechten/rechtenwereld/derive-core.js
var require_derive_core = __commonJS({
  "games/rechten/rechtenwereld/derive-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_wave_core(), require_semantic_math_core(), require_hills_core());
      else root.RechtenV2Derive = factory(root.RechtenWave, root.RechtenV2Math, root.RechtenV2Hills);
    })(globalThis, function(W, M, H) {
      "use strict";
      const skills = ["intercept_from_point", "equation_from_point_slope", "equation_from_two_points", "equation_from_table"], count = 6;
      const titles = { intercept_from_point: "Bepaal b met helling en een punt", equation_from_point_slope: "Voorschrift uit helling en een punt", equation_from_two_points: "Voorschrift uit twee punten", equation_from_table: "Voorschrift uit tabel" };
      const slopeSlots = ["y1", "y0", "x1", "x0"], subSlots = ["subY", "subA", "subX"], formulaSlots = ["answerFactor", "answerSign", "answerConstant"];
      const needsSlope = (skill) => ["equation_from_two_points", "equation_from_table"].includes(skill);
      const firstPhase = (skill) => needsSlope(skill) ? "derive-fill" : "derive-substitute";
      const phases = (skill) => [...needsSlope(skill) ? ["derive-fill", "derive-slope"] : [], "derive-substitute", "derive-product", "derive-intercept", ...skill === "intercept_from_point" ? [] : ["derive-formula"]];
      const nextPhase = (skill, phase) => phases(skill)[phases(skill).indexOf(phase) + 1] || "next-task";
      const slots = (phase) => phase === "derive-fill" ? slopeSlots : phase === "derive-substitute" ? subSlots : phase === "derive-formula" ? formulaSlots : [];
      function makeTask(skill, index = 0, run = 1) {
        if (skill === "equation_from_table") {
          const [a2, b2, ...xs] = [[1, 1, -5, -4, 4], [2, -1, -2, 0, 3], [-0.5, 2, -2, 2, 6], [0.5, -1, -3, 1, 5], [0, -2, -4, 0, 3], [1.5, 0.5, -1, 1, 3]][index % count];
          const model2 = { kind: "affine", a: W.fromNumber(a2), b: W.fromNumber(b2 + [0, 1, -1][(run - 1) % 3]) };
          const table = xs.map((x2) => ({ x: W.fromNumber(x2), y: W.add(W.mul(model2.a, W.fromNumber(x2)), model2.b) }));
          return { id: `rechten-v2:formulewerf:${skill}:${run}:${index}`, world: "formulewerf", skill_id: skill, family_id: "F7", index, count, model: model2, table, points: { A: table[0], B: table[1] }, variant: !a2 ? "horizontal" : model2.a.d > 1 ? "fraction" : a2 < 0 ? "negative" : "positive", mode: index === 0 ? "discover" : "practice", given_representations: ["table"], legacy: { skill: "equation_from_two_points", params: { A: table[0], B: table[1], model: model2 } } };
        }
        if (!skills.includes(skill)) throw Error("Onbekende afleidingsvaardigheid");
        const rows = skill === "equation_from_two_points" ? [[-2, 2, 1, 0], [2, -1, -1, 2], [0.5, 1, -2, 2], [-0.5, -1, 1, 3], [0, 2, -3, 2], [1.5, 0.5, -1, 1]] : skill === "equation_from_point_slope" ? [[-2, -2, 0], [2, 1, 1], [0.5, -1, 2], [-0.5, 2, -2], [0, -3, 3], [1.5, 0.5, -1]] : [[2, 1, 1], [-2, -2, -1], [0.5, -1, 2], [-0.5, 2, -2], [0, -3, 3], [1.5, 0.5, -1]];
        const [a, b, x, other] = rows[index % count], model = { kind: "affine", a: W.fromNumber(a), b: W.fromNumber(b + [0, 1, -1][(run - 1) % 3]) }, point = (x2) => ({ x: W.fromNumber(x2), y: W.add(W.mul(model.a, W.fromNumber(x2)), model.b) }), A = point(x), B = other === void 0 ? null : point(other);
        return { id: `rechten-v2:formulewerf:${skill}:${run}:${index}`, world: "formulewerf", skill_id: skill, family_id: "F7", index, count, model, points: { A, ...B ? { B } : {} }, variant: !a ? "horizontal" : model.a.d > 1 ? "fraction" : a < 0 ? "negative" : "positive", mode: index === 0 ? "discover" : "practice", given_representations: [B ? "two-points" : "point-and-slope"], legacy: { skill, params: { A, B: B || point(x + 1), model } } };
      }
      const tableSelection = (t, v) => Array.isArray(v.tableColumns) && v.tableColumns.length === 2 && new Set(v.tableColumns).size === 2 && v.tableColumns.every((i) => Number.isInteger(i) && i >= 0 && i < t.table?.length);
      function workTask(t, v) {
        if (!t.table || !tableSelection(t, v)) return t;
        const [A, B] = v.tableColumns.map((i) => t.table[i]);
        return { ...t, points: { A, B }, legacy: { skill: "equation_from_two_points", params: { A, B, model: t.model } } };
      }
      const selectedPoint = (v) => v.derivePoint === "B" ? "B" : "A";
      function coordinate(t, token) {
        return token === "a" ? t.model.a : /^[AB]\.[xy]$/.test(token || "") ? t.points[token[0]]?.[token[2]] || null : null;
      }
      function tokens(t, v, phase) {
        if (phase === "derive-fill" && t.table && !tableSelection(t, v)) return [];
        if (phase === "derive-fill") return ["A.x", "A.y", "B.x", "B.y"];
        if (phase === "derive-substitute") {
          const p = selectedPoint(v);
          return [p + ".x", p + ".y", "a"];
        }
        if (phase === "derive-formula") {
          const a = M.parse(v.a) || t.model.a, b = M.parse(v.b);
          if (!b) return [];
          return [a, W.mul(-1, b), b, W.q(0), W.q(1)].map(W.text).filter((q, i, all) => all.indexOf(q) === i).concat("+", "\u2212");
        }
        return [];
      }
      function answerChoices(t, v, phase) {
        t = workTask(t, v);
        const correct = phase === "derive-slope" ? t.model.a : phase === "derive-product" ? W.mul(t.model.a, t.points[selectedPoint(v)].x) : phase === "derive-intercept" ? t.model.b : null;
        if (!correct) return [];
        const pool = [correct, W.mul(-1, correct), W.add(correct, 1), W.sub(correct, 1), W.mul(2, correct), W.div(correct, 2)];
        if (correct.n) pool.push(W.div(1, correct));
        for (let i = 2; i <= 6; i++) pool.push(W.add(correct, i), W.sub(correct, i));
        const unique = [];
        for (const q of pool) if (!unique.some((other) => W.eq(q, other))) unique.push(q);
        return unique.slice(0, 6).sort((a, b) => W.num(a) - W.num(b));
      }
      const syntax = (message) => ({ ok: false, kind: "interaction_error", code: "input.missing", message, keep: {} });
      const result = (ok, code, message, keep = {}) => ({ ok, kind: ok ? "correct" : "hypothesis", code: ok ? null : code, message, keep });
      function check(t, v, phase) {
        if (t.table && !tableSelection(t, v)) return syntax("Kies eerst twee verschillende kolommen uit de tabel.");
        t = workTask(t, v);
        if (phase === "derive-fill") return H.check(t, v, "hill-fill");
        if (phase === "derive-substitute") {
          if (!subSlots.every((k) => coordinate(t, v[k]) && tokens(t, v, phase).includes(v[k]))) return syntax("Vul de drie vakjes met de gegevens van het gekozen punt en de helling.");
          const p = selectedPoint(v), want = { subY: p + ".y", subA: "a", subX: p + ".x" }, keep = Object.fromEntries(subSlots.map((k) => [k, v[k] === want[k]])), ok = Object.values(keep).every(Boolean);
          return result(ok, "substitution.position", ok ? "Juist ingevuld. Bereken nu het product." : "Zet de y-co\xF6rdinaat links, a bij de vermenigvuldiging en de x-co\xF6rdinaat ernaast.", keep);
        }
        if (phase === "derive-formula") {
          const a = M.parse(v.answerFactor), b = M.parse(v.answerConstant);
          if (!a || !b || !["+", "\u2212"].includes(v.answerSign)) return syntax("Vul de co\xEBffici\xEBnt, het teken en de constante term in.");
          const r2 = W.constructionCheck({ skill: "equation_from_ab", params: { model: t.model } }, { a, b, variable: "x", sign: v.answerSign }), bOK = W.eq(W.mul(v.answerSign === "\u2212" ? -1 : 1, b), t.model.b);
          return result(r2.ok, r2.code, r2.ok ? "Juist! Je voorschrift past bij de gegevens." : "Gebruik jouw gevonden a en b. Het teken en het laatste getal vormen samen b.", { answerFactor: W.eq(a, t.model.a), answerSign: bOK, answerConstant: bOK });
        }
        const entry = { "derive-slope": ["a", "a"], "derive-product": ["product", "ax"], "derive-intercept": ["b", "b"] }[phase];
        if (!entry) return syntax("Deze stap is niet beschikbaar.");
        const value = M.parse(v[entry[0]]);
        if (!value) return syntax("Vul een getal in. Een decimaal of breuk mag ook.");
        const r = W.check(t.legacy, { index: W.stages(t.legacy).indexOf(entry[1]), values: { point: selectedPoint(v) } }, value);
        const messages = { "derive-slope": ["De helling klopt. Kies nu een punt om b te bepalen.", "Deel het y-verschil door het x-verschil. Houd dezelfde richting."], "derive-product": ["Het product klopt. Maak nu b vrij.", "Bereken a maal de x-co\xF6rdinaat. Let op de tekens."], "derive-intercept": ["Je hebt b juist bepaald.", "Trek het product a \xB7 x af van de y-co\xF6rdinaat. Let op: een negatief getal aftrekken is optellen."] };
        return result(r.ok, r.code, messages[phase][r.ok ? 0 : 1]);
      }
      function retainedFields(phase) {
        return phase === "derive-fill" ? slopeSlots : phase === "derive-substitute" ? [...subSlots, "derivePoint"] : phase === "derive-slope" ? ["a"] : phase === "derive-product" ? ["product"] : phase === "derive-intercept" ? ["b"] : formulaSlots;
      }
      function hints(t, phase) {
        if (t.table) return [phase === "derive-fill" ? "Kies twee kolommen. Boven: verschil in f(x). Onder: verschil in x." : phase === "derive-slope" ? "Deel het verschil in f(x) door het verschil in x." : phase === "derive-formula" ? "Vul je gevonden a en b in. Past je voorschrift bij de tabel?" : "Gebruik een gekozen punt: f(x) = a \xB7 x + b.", "Elke kolom is \xE9\xE9n punt: (x; f(x)). Neem twee verschillende kolommen.", "Gebruik bij beide verschillen dezelfde richting. Let op: de x-stap is niet altijd 1.", "Vul een tabelpunt in: b = f(x) \u2212 a \xB7 x. Bij x = 0 kun je b meteen aflezen.", "Ander voorbeeld: (1; 5) en (3; 9). Dan a = (9 \u2212 5)/(3 \u2212 1) = 2 en b = 5 \u2212 2 \xB7 1 = 3. Dus f(x) = 2x + 3."];
        const first = { "derive-fill": "Teller: y-verschil. Noemer: x-verschil. Kies dezelfde richting.", "derive-slope": "Bereken eerst beide verschillen, en deel daarna.", "derive-substitute": "Een punt geeft x \xE9n y. Vul beide op de juiste plaats in.", "derive-product": "Vermenigvuldig de helling met de x-co\xF6rdinaat.", "derive-intercept": "Maak b vrij door aan beide kanten hetzelfde af te trekken.", "derive-formula": "Gebruik je gevonden waarden in y = ax + b." };
        return [first[phase] || "Werk stap voor stap.", "b is de y-co\xF6rdinaat van het snijpunt met de y-as.", "Voor een punt op de rechte geldt y = a \xB7 x + b. Dus b = y \u2212 a \xB7 x.", "Bij x = 0 is het product a \xB7 x nul. Bij negatieve getallen helpen haakjes.", "Ander voorbeeld: a = 4 en P(2, 13). Dan b = 13 \u2212 4 \xB7 2 = 5, dus y = 4x + 5. Probeer een nieuw geval."];
      }
      return Object.freeze({ skills, count, titles, needsSlope, tableSelection, workTask, firstPhase, phases, nextPhase, slots, makeTask, selectedPoint, coordinate, tokens, answerChoices, check, retainedFields, hints });
    });
  }
});

// games/rechten/rechtenwereld/mission-runtime.js
var require_mission_runtime = __commonJS({
  "games/rechten/rechtenwereld/mission-runtime.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_semantic_math_core(), require_evidence_adapter(), require_points_core(), require_hills_core(), require_grens_core(), require_formula_core(), require_derive_core());
      else root.RechtenV2Runtime = factory(root.RechtenV2Math, root.RechtenV2Evidence, root.RechtenV2Points, root.RechtenV2Hills, root.RechtenV2Grens, root.RechtenV2Formula, root.RechtenV2Derive);
    })(globalThis, function(M, E, P, H, G, F, D) {
      "use strict";
      const clone = (v) => JSON.parse(JSON.stringify(v));
      const WORLDS = ["grenspas", "hellingrug", "signaalstad", "puntenbaai", "formulewerf"];
      const initial = () => ({ schema: 1, screen: "world", active: null, missions: {}, events: [], settings: { reducedMotion: false } });
      const variants = { grenspas: [0, 1, 2, 3], hellingrug: [0, 1], signaalstad: [0, 1] };
      function mission(world, run = 1, index = 0, skill = "point") {
        if (world === "puntenbaai" || H.skills.includes(skill) || G.skills.includes(skill) || (F.skills.includes(skill) || D.skills.includes(skill))) {
          const task2 = (world === "puntenbaai" ? P : D.skills.includes(skill) ? D : F.skills.includes(skill) ? F : G.skills.includes(skill) ? G : H).makeTask(skill, index, run);
          return { world, skill, run, index, variant: task2.variant, task: task2, phase: world === "puntenbaai" ? "coordinate" : D.skills.includes(skill) ? D.firstPhase(skill) : F.skills.includes(skill) ? F.firstPhase(skill) : G.skills.includes(skill) ? G.firstPhase(skill) : H.firstPhase(skill, task2), values: {}, history: [], locks: {}, hints: 0, hintOpen: false, errors: 0, revealed: [], attempt: 0, feedback: null, completed: false, completion: null };
        }
        const variant = variants[world][index], task = M.makeTask(world, { variant, seed: 1, mode: index === 0 ? "discover" : "evidence" });
        return { world, run, index, variant, task, phase: world === "grenspas" ? index === 0 ? "root" : "interval" : world === "hellingrug" ? "deltas" : "probe", values: { direction: "AB", probe: "zero", pins: ["formula", "graph"] }, history: [], locks: {}, hints: 0, hintOpen: false, errors: 0, revealed: [], attempt: 0, feedback: null, completed: false, completion: null };
      }
      function active(state) {
        return state.missions[state.active];
      }
      function start(state, world, restart = false, skill = "point") {
        if (world === "formulewerf" && skill === "point") skill = F.skills[0];
        if (F.skills.includes(world) || D.skills.includes(world)) {
          skill = world;
          world = F.skills.includes(skill) ? F.worldFor(skill) : "formulewerf";
        }
        if (G.skills.includes(world)) {
          skill = world;
          world = "grenspas";
        }
        if (H.skills.includes(world)) {
          skill = world;
          world = "hellingrug";
        }
        if (P.skills.includes(world)) {
          skill = world;
          world = "puntenbaai";
        }
        if (world === "puntenbaai" && !P.skills.includes(skill)) throw Error("Onbekende puntenvaardigheid");
        if (!WORLDS.includes(world)) throw Error("Onbekende missie");
        const s = clone(state);
        const key = world === "puntenbaai" || H.skills.includes(skill) || G.skills.includes(skill) || (F.skills.includes(skill) || D.skills.includes(skill)) ? skill : world;
        s.active = key;
        s.screen = "mission";
        if (!s.missions[key] || restart) s.missions[key] = mission(world, (s.missions[key]?.run || 0) + 1, 0, skill);
        return s;
      }
      function remember(m) {
        m.history.push({ phase: m.phase, values: clone(m.values), locks: clone(m.locks) });
        m.history = m.history.slice(-32);
      }
      function edit(state, name, value) {
        const s = clone(state), m = active(s);
        if (!m || m.feedback || m.completed || m.locks[name]) return s;
        remember(m);
        m.values[name] = value;
        return s;
      }
      function undo(state) {
        const s = clone(state), m = active(s);
        if (!m || m.feedback || m.completed) return s;
        const p = m.history.pop();
        if (p) {
          if (p.phase === m.phase) {
            const kept = Object.fromEntries(Object.keys(m.locks).filter((k) => m.locks[k]).map((k) => [k, m.values[k]]));
            m.values = { ...p.values, ...kept };
            m.locks = { ...p.locks, ...m.locks };
          }
        }
        return s;
      }
      function hint(state) {
        const s = clone(state), m = active(s);
        if (m && !m.completed && !m.feedback) {
          m.hints = Math.min(5, m.hints + 1);
          m.hintOpen = true;
        }
        return s;
      }
      function intervalResponse(m) {
        const v = m.values, side = v.side;
        return { boundary: m.index === 0 ? v.root : v.boundary, side, closed: m.task.model.a.n ? v.closed : false, symbol: m.phase === "interval" && m.index === 0 ? side === "left" ? "<" : side === "right" ? ">" : side : v.symbol, symbolBoundary: m.phase === "interval" && m.index === 0 ? v.root : v.symbolBoundary };
      }
      function commit(state) {
        let s = clone(state), m = active(s);
        if (!m || m.feedback || m.completed) return s;
        let result, next = m.phase;
        switch (m.phase) {
          case "derive-fill":
          case "derive-slope":
          case "derive-substitute":
          case "derive-product":
          case "derive-intercept":
          case "derive-formula":
            result = D.check(m.task, m.values, m.phase);
            next = D.nextPhase(m.skill, m.phase);
            break;
          case "formula-build":
          case "formula-plot":
          case "formula-read":
          case "formula-rewrite":
            result = F.check(m.task, m.values, m.phase);
            next = "next-task";
            break;
          case "grens-zero":
          case "grens-root":
          case "grens-chart":
          case "grens-inequality":
            result = G.check(m.task, m.values, m.phase);
            next = m.phase === "grens-root" ? "grens-inequality" : "next-task";
            break;
          case "line-plot":
          case "line-behavior":
          case "line-special":
          case "hill-dx":
          case "hill-dy":
          case "hill-rate":
          case "hill-fill":
          case "hill-calculate":
            result = H.check(m.task, m.values, m.phase);
            next = H.nextPhase(m.phase);
            break;
          case "coordinate":
            result = P.check(m.task, m.values);
            next = "next-task";
            break;
          case "root":
            result = M.checkRoot(m.task, m.values.root);
            next = "interval";
            break;
          case "interval":
          case "symbol":
            result = M.checkInterval(m.task, intervalResponse(m));
            next = m.index === 0 && m.phase === "interval" ? "symbol" : "next-task";
            break;
          case "deltas":
            result = M.checkDeltas(m.task, m.values);
            next = "rate";
            break;
          case "rate":
            result = M.checkSlope(m.task, m.values);
            next = "hidden";
            break;
          case "probe":
            result = M.signalProbe(m.task, m.values.probe, { expected: m.values.expected });
            next = "repair";
            break;
          case "repair":
            result = M.checkSignal(m.task, m.values);
            next = "hidden";
            break;
          case "hidden":
            result = M.checkHidden(m.task, m.values.hidden);
            next = "next-task";
            break;
          default:
            return s;
        }
        const semantic = result.kind !== "interaction_error" && result.kind !== "authoring_error";
        m.hintOpen = false;
        const priorErrors = m.errors;
        m.attempt++;
        if (!result.ok && semantic) m.errors++;
        const phase = m.phase === "hidden" || m.index > 0 && m.phase === "interval" ? "transfer" : m.phase === "repair" ? "diagnose" : ["root", "probe", "deltas"].includes(m.phase) ? "predict" : "execute";
        const evidence = E.record(s, { taskId: m.task.id + ":run" + m.run, attemptId: `${m.phase}:${m.attempt}`, skill: ["root", "grens-root"].includes(m.phase) ? "zeroRead" : m.task.skill_id, phase, correct: result.ok, mode: m.task.mode, helpLevel: m.hints, supported: priorErrors > 0, feedbackSeen: m.revealed.includes(m.phase), misconception: result.ok ? null : result.code, errorKind: semantic ? null : result.kind, variant: m.task.variant, representation: m.world === "signaalstad" && m.values.pins ? m.values.pins.join("+") : m.task.given_representations.join("+"), revision: m.attempt });
        s = evidence.state;
        m = active(s);
        m.feedback = { result: clone(result), next, committedPhase: m.phase, response: clone(m.values) };
        if (semantic && !m.revealed.includes(m.phase)) m.revealed.push(m.phase);
        return s;
      }
      function advance(state) {
        const s = clone(state), m = active(s);
        if (!m?.feedback) return s;
        const { result, next } = m.feedback;
        if (!result.ok) {
          m.locks = { ...m.locks, ...Object.fromEntries(Object.entries(result.keep || {}).filter(([, v]) => v)) };
          if (m.locks.root && m.index > 0) m.locks.boundary = true;
          if (m.phase === "hill-fill" && m.locks[m.values.selectedSlot]) m.values.selectedSlot = H.slots.find((k) => !m.locks[k]) || m.values.selectedSlot;
          if (D.skills.includes(m.skill)) m.values.deriveSlot = D.slots(m.phase).find((k) => !m.locks[k]) || "";
          if (m.phase === "formula-build") m.values.formulaSlot = F.slots.find((k) => !m.locks[k]) || "factor";
          if (m.phase === "grens-chart") m.values.chartSlot = G.slots.find((k) => !m.locks[k]) || "chartLeft";
          m.feedback = null;
          return s;
        }
        if (next === "next-task") {
          const done = { taskId: m.task.id, supported: m.hints > 0 || m.errors > 0 || m.task.mode === "discover", variant: m.variant };
          if (m.index + 1 < (m.world === "puntenbaai" ? P.count : H.skills.includes(m.skill) ? H.taskCount(m.skill) : G.skills.includes(m.skill) ? G.count : D.skills.includes(m.skill) ? D.count : F.skills.includes(m.skill) ? F.count : variants[m.world].length)) {
            const nextMission = mission(m.world, m.run, m.index + 1, m.skill);
            nextMission.completion = [...m.completion || [], done];
            s.missions[s.active] = nextMission;
          } else {
            m.completed = true;
            m.phase = "complete";
            m.feedback = null;
            m.completion = [...m.completion || [], done];
            m.history = [];
          }
        } else if (D.skills.includes(m.skill)) {
          if (m.task.table && m.phase === "derive-fill") m.locks.tableColumns = true;
          for (const k of D.retainedFields(m.phase)) m.locks[k] = true;
          m.history = [];
          m.phase = next;
          m.feedback = null;
          m.values.deriveSlot = D.slots(next)[0] || "";
        } else {
          m.history = [];
          m.phase = next;
          m.feedback = null;
          m.locks = {};
          if (next === "line-behavior" && m.task.representation === "points") {
            m.locks.plotA = true;
            m.locks.plotB = true;
          }
          if (next === "hill-dy") m.locks.dxChoice = true;
          if (next === "hill-calculate") for (const k of H.slots) m.locks[k] = true;
          if (next === "grens-inequality") m.locks.answer = true;
          if (next === "symbol") {
            m.locks.root = true;
            m.locks.side = true;
            m.locks.closed = true;
          }
          if (next === "rate") {
            m.locks.direction = true;
            m.locks.dx = true;
            m.locks.dy = true;
          }
        }
        return s;
      }
      function newAfterExample(state) {
        const s = clone(state), m = active(s);
        if (!m || m.hints < 5) return s;
        const next = mission(m.world, m.run + 1, m.index, m.skill);
        if (m.world !== "puntenbaai" && !H.skills.includes(m.skill) && !G.skills.includes(m.skill) && !F.skills.includes(m.skill) && !D.skills.includes(m.skill)) next.task = M.makeTask(m.world, { variant: m.variant + 1, seed: 2, mode: "practice" });
        next.variant = next.task.variant;
        next.completion = m.completion;
        s.missions[s.active] = next;
        return s;
      }
      function beginHills(state) {
        const s = clone(state), m = active(s);
        if (m?.phase === "hill-inspect" && !m.completed) {
          m.phase = "hill-fill";
          m.values.selectedSlot = "y1";
        }
        return s;
      }
      function putCoordinate(state, slot, token) {
        const s = clone(state), m = active(s);
        if (!m || m.phase !== "hill-fill" || m.feedback || !H.slots.includes(slot) || m.locks[slot] || !H.coordinate(m.task, token)) return s;
        remember(m);
        m.values[slot] = token;
        const next = H.slots.find((k) => !m.values[k] && !m.locks[k]);
        m.values.selectedSlot = next || slot;
        return s;
      }
      function placeLinePoint(state, name, p) {
        const s = clone(state), m = active(s);
        if (!m || !(H.lines.skills.includes(m.skill) || ["graph_from_equation", "graph_from_table"].includes(m.skill)) || !["line-plot", "line-special", "formula-plot"].includes(m.phase) || m.feedback || m.completed || !["A", "B"].includes(name) || m.locks["plot" + name] || !(["graph_from_equation", "graph_from_table"].includes(m.skill) ? F.validPoint(m.task, p) : H.lines.validPlot(m.task, p))) return s;
        remember(m);
        m.values["plot" + name] = clone(p);
        m.values.selectedPoint = name === "A" && !m.values.plotB ? "B" : name;
        return s;
      }
      function clearLinePoints(state) {
        const s = clone(state), m = active(s);
        if (!m || !["line-plot", "line-special", "formula-plot"].includes(m.phase) || m.feedback || m.completed) return s;
        remember(m);
        for (const name of ["A", "B"]) if (!m.locks["plot" + name]) delete m.values["plot" + name];
        m.values.selectedPoint = m.locks.plotA ? "B" : "A";
        return s;
      }
      function putSign(state, value) {
        const s = clone(state), m = active(s);
        if (!m || m.phase !== "grens-chart" || m.feedback || m.completed || !["-", "0", "+"].includes(value)) return s;
        const slot = m.values.chartSlot || "chartLeft";
        if (!G.slots.includes(slot) || m.locks[slot]) return s;
        remember(m);
        m.values[slot] = value;
        m.values.chartSlot = G.slots.find((k) => !m.values[k] && !m.locks[k]) || G.slots.find((k) => !m.locks[k]) || slot;
        return s;
      }
      function putFormulaToken(state, slot, token) {
        const s = clone(state), m = active(s);
        if (!m || m.phase !== "formula-build" || m.feedback || m.completed || !F.slots.includes(slot) || m.locks[slot] || !m.task.tokens.includes(token)) return s;
        remember(m);
        m.values[slot] = token;
        m.values.formulaSlot = F.slots.find((k) => !m.values[k] && !m.locks[k]) || slot;
        return s;
      }
      function operateFormula(state, index) {
        const s = clone(state), m = active(s);
        if (!m || m.phase !== "formula-rewrite" || m.feedback || m.completed) return s;
        const r = F.applyOperation(m.task, m.values, index);
        if (r.error) {
          m.values.operationError = r.error;
          return s;
        }
        remember(m);
        m.values.algebraSteps = [...m.values.algebraSteps || [], r];
        delete m.values.operationError;
        return s;
      }
      function putDeriveToken(state, slot, token) {
        const s = clone(state), m = active(s);
        if (!m || !D.skills.includes(m.skill) || m.feedback || m.completed || !D.slots(m.phase).includes(slot) || m.locks[slot] || !D.tokens(m.task, m.values, m.phase).includes(token)) return s;
        remember(m);
        m.values[slot] = token;
        m.values.deriveSlot = D.slots(m.phase).find((k) => !m.values[k] && !m.locks[k]) || slot;
        return s;
      }
      function selectDerivePoint(state, name) {
        const s = clone(state), m = active(s);
        if (!m || m.phase !== "derive-substitute" || m.feedback || m.completed || m.locks.derivePoint || !m.task.points[name] || D.selectedPoint(m.values) === name) return s;
        remember(m);
        m.values.derivePoint = name;
        for (const k of D.slots(m.phase)) {
          delete m.values[k];
          delete m.locks[k];
        }
        m.values.deriveSlot = D.slots(m.phase)[0];
        return s;
      }
      function selectTableColumn(state, index) {
        const s = clone(state), m = active(s);
        if (!m || m.skill !== "equation_from_table" || m.phase !== "derive-fill" || m.feedback || m.completed || m.locks.tableColumns || !Number.isInteger(index) || !m.task.table[index]) return s;
        remember(m);
        const chosen = [...m.values.tableColumns || []], at = chosen.indexOf(index);
        if (at >= 0) chosen.splice(at, 1);
        else {
          if (chosen.length === 2) chosen.shift();
          chosen.push(index);
        }
        m.values.tableColumns = chosen;
        for (const k of D.slots(m.phase)) {
          delete m.values[k];
          delete m.locks[k];
        }
        m.values.deriveSlot = D.slots(m.phase)[0];
        return s;
      }
      function battle(world, skill, seed, variant) {
        const s = initial();
        s.active = skill;
        s.screen = "mission";
        s.missions[skill] = mission(world, 1 + (seed >>> 0) % 97, variant % 4, skill);
        s.settings = { reducedMotion: true, autoAdvance: false, shell: { area: world } };
        return s;
      }
      return Object.freeze({ battle, selectTableColumn, putDeriveToken, selectDerivePoint, putFormulaToken, operateFormula, putSign, placeLinePoint, clearLinePoints, beginHills, putCoordinate, initial, start, active, edit, undo, hint, commit, advance, newAfterExample, worlds: WORLDS });
    });
  }
});

// games/rechten/rechtenwereld/battle-config.js
var require_battle_config = __commonJS({
  "games/rechten/rechtenwereld/battle-config.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_mission_runtime());
      else root.BattleGame = factory(root.RechtenV2Runtime);
    })(globalThis, function(R) {
      const worlds = [{ id: "puntenbaai", name: "Puntenbaai", skills: ["point", "point_plot"] }, { id: "hellingrug", name: "Hellingrug", skills: ["delta", "slope", "line_behavior", "special_lines"] }, { id: "grenspas", name: "Grenspas", skills: ["zeroRead", "zero", "signchart", "positive", "negative"] }, { id: "formulewerf", name: "Formulewerf", skills: ["equation_from_ab", "graph_from_equation", "equation_from_graph"] }, { id: "signaalstad", name: "Signaalstad", skills: ["graph_from_table"] }];
      const labels = { point: "Co\xF6rdinaten lezen", point_plot: "Punten plaatsen", delta: "\u0394x en \u0394y", slope: "Richtingsco\xEBffici\xEBnt", line_behavior: "Stijgen en dalen", special_lines: "Bijzondere rechten", zeroRead: "Nulwaarde aflezen", zero: "Nulwaarde berekenen", signchart: "Tekenschema", positive: "Waar is f(x) > 0?", negative: "Waar is f(x) < 0?", equation_from_ab: "Voorschrift bouwen", graph_from_equation: "Rechte tekenen", equation_from_graph: "Voorschrift aflezen", graph_from_table: "Rechte uit tabel" };
      function generate(spec) {
        const world = worlds.find((w) => w.skills.includes(spec.skill));
        if (!world || !Number.isInteger(spec.seed) || !Number.isInteger(spec.variant)) throw Error("Onbekende battleopgave");
        return R.battle(world.id, spec.skill, spec.seed, spec.variant);
      }
      function validate(initial, answer) {
        try {
          if (!Array.isArray(answer?.steps) || !answer.steps.length || answer.steps.length > 8) return { ok: false };
          let s = structuredClone(initial);
          for (let i = 0; i < answer.steps.length; i++) {
            const step = answer.steps[i], m = R.active(s);
            if (step.phase !== m.phase || !step.values || typeof step.values !== "object") return { ok: false };
            for (const [key, value] of Object.entries(step.values)) s = R.edit(s, key, value);
            s = R.commit(s);
            const f = R.active(s).feedback;
            if (!f?.result.ok) return { ok: false };
            if (f.next === "next-task") return { ok: i === answer.steps.length - 1 };
            s = R.advance(s);
          }
          return { ok: false };
        } catch {
          return { ok: false };
        }
      }
      function nextPhase(state) {
        return { "hill-dx": "hill-dy", "line-plot": "line-behavior", "grens-root": "grens-inequality" }[R.active(state).phase] || null;
      }
      function nextInput(state) {
        const s = structuredClone(state), m = R.active(s), next = nextPhase(s);
        if (!next) return s;
        m.phase = next;
        m.feedback = null;
        m.history = [];
        m.locks = {};
        return s;
      }
      return { nextPhase, nextInput, id: "rechten", title: "Rechtenwereld", rpc: "axioma_game_class", playerURL: "battle-player.html", worlds, skills: Object.entries(labels).map(([id, label]) => ({ id, label })), mixedSkills: ["point_plot", "delta", "zeroRead", "graph_from_equation", "graph_from_table"], generate, validate };
    });
  }
});

// games/rechten/rechtenwereld/content/area-maps.js
var require_area_maps = __commonJS({
  "games/rechten/rechtenwereld/content/area-maps.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_wave_core());
      else root.RechtenV2Areas = factory(root.RechtenWave);
    })(globalThis, function(W) {
      "use strict";
      const node = (id, name, label, x, y, extra = {}) => ({ key: id, id, name, label, x, y, ...extra });
      const areas = {
        puntenbaai: { name: "Puntenbaai", caption: "Co\xF6rdinaten en punten", intro: "Vind je plek. Zet je eerste punt.", art: "puntenbaai", zones: [{ id: "route", name: "Rond de baai", nodes: [
          node("point", "Co\xF6rdinaten aflezen", "Co\xF6rdinaten<br>aflezen", 30, 48, { playable: true }),
          node("point_plot", "Punt plaatsen", "Punt<br>plaatsen", 70, 32, { playable: true })
        ] }] },
        hellingrug: { name: "Hellingrug", caption: "Richting en helling", intro: "Van basisverschil tot bergtop.", art: "hellingrug", zones: [{ id: "route", name: "De klimroute", nodes: [
          node("delta", "\u0394x en \u0394y", "\u0394x en \u0394y", 18, 64, { playable: true }),
          node("slope", "Helling uit \u0394y / \u0394x", "Helling uit<br>\u0394y / \u0394x", 35, 49, { playable: true }),
          node("slope_from_two_points", "Helling uit twee punten", "Helling uit<br>twee punten", 54, 33, { playable: true }),
          node("line_behavior", "Stijgend, dalend of constant", "Stijgend, dalend<br>of constant", 75, 41, { playable: true }),
          node("special_lines", "Bijzondere rechten", "Bijzondere<br>rechten", 90, 19, { playable: true })
        ] }] },
        signaalstad: { name: "Signaalstad", caption: "Functies, grafieken en tabellen", intro: "Volg het signaal. Lees en controleer.", art: "signaalstad", zones: [{ id: "route", name: "Het signaalnetwerk", nodes: [
          node("intercept", "y-afsnede b aflezen", "y-afsnede b<br>aflezen", 18, 30),
          node("ab", "a en b herkennen", "a en b<br>herkennen", 39, 30),
          node("fx", "Functiewaarde f(x)", "Bereken<br>f(x)", 60, 30),
          node("table", "Tabel aanvullen", "Tabel<br>aanvullen", 81, 30),
          node("input_from_output", "Welke x hoort bij deze functiewaarde?", "Welke x bij<br>deze f(x)?", 73, 61),
          node("point_on_line", "Ligt dit punt op de rechte?", "Punt op<br>de rechte?", 50, 61),
          node("graph_from_table", "Rechte tekenen uit een tabel", "Rechte tekenen<br>uit tabel", 27, 61, { playable: true })
        ] }] },
        formulewerf: { name: "Formulewerf", caption: "Voorschriften en representaties", intro: "Van de basisvorm naar zelf afleiden.", art: "formulewerf", zones: [{ id: "bouwen", badge: "A", name: "Voorschrift en grafiek", intro: "Gebruik en herken de basisvorm y = ax + b. Daarna leid je zelf voorschriften af in werkplaats B.", nodes: [
          node("equation_from_ab", "Voorschrift uit a en b", "Voorschrift<br>uit a en b", 26, 31, { playable: true }),
          node("graph_from_equation", "Rechte uit voorschrift", "Rechte uit<br>voorschrift", 75, 40, { playable: true }),
          node("equation_from_graph", "Voorschrift uit grafiek", "Voorschrift<br>uit grafiek", 68, 66, { playable: true, entryPolicy: Object.freeze({ difficultyLayers: Object.freeze([0, 1]), readableSlope: true, visibleIntercept: true, requiresInterceptFromArbitraryPoint: false, requiresExtendedTwoPointCalculation: false }) }),
          node("rewrite_linear_equation", "Schrijf de vergelijking in de vorm y = ax + b", "Vergelijking<br>herschrijven", 33, 66, { playable: true })
        ] }, { id: "omzetten", badge: "B", name: "Zelf een voorschrift bepalen", intro: "Van de basisvorm naar zelf afleiden: eerst de parameters, daarna een volledig voorschrift en een context.", nodes: [
          node("intercept_from_point", "b uit helling en punt", "b uit a<br>en punt", 26, 31, { playable: true }),
          node("equation_from_point_slope", "Voorschrift uit helling en punt", "Voorschrift uit<br>helling en punt", 50, 25, { playable: true }),
          node("equation_from_two_points", "Voorschrift uit twee punten", "Voorschrift uit<br>twee punten", 75, 40, { playable: true }),
          node("equation_from_table", "Voorschrift uit tabel", "Voorschrift<br>uit tabel", 68, 66, { playable: true }),
          node("equation_from_context", "Voorschrift uit context", "Voorschrift<br>uit context", 31, 66, { culmination: true })
        ] }] },
        grenspas: { name: "Grenspas", caption: "Nulwaarden en tekens", intro: "Vind de grens. Ontdek het juiste gebied.", art: "grenspas", zones: [{ id: "route", name: "De grensroute", nodes: [
          node("zeroRead", "Nulwaarde aflezen", "Nulwaarde<br>aflezen", 21, 26, { playable: true }),
          node("zero", "Nulwaarde berekenen", "Nulwaarde<br>berekenen", 24, 64, { playable: true }),
          node("sign", "Wanneer is f(x) > 0?", "Wanneer is<br>f(x) &gt; 0?", 49, 45, { key: "positive", variant: "positive", playable: true }),
          node("sign", "Wanneer is f(x) < 0?", "Wanneer is<br>f(x) &lt; 0?", 74, 26, { key: "negative", variant: "negative", playable: true }),
          node("signchart", "Tekenschema", "Tekenschema", 83, 66, { playable: true })
        ] }] }
      };
      for (const a of Object.values(areas)) {
        let i = 0;
        for (const z of a.zones) {
          for (const n of z.nodes) {
            n.number = ++i;
            Object.freeze(n);
          }
          Object.freeze(z.nodes);
          Object.freeze(z);
        }
        Object.freeze(a.zones);
        Object.freeze(a);
      }
      Object.freeze(areas);
      const canonical = (id) => id === "puntbaai" ? "puntenbaai" : id;
      const has = (id) => Object.hasOwn(areas, canonical(id));
      const get = (id) => has(id) ? areas[canonical(id)] : areas.grenspas;
      const all = (a) => a.zones.flatMap((z) => z.nodes);
      function selection(state) {
        const shell = state.settings?.shell || {}, id = has(shell.area) ? canonical(shell.area) : "grenspas", area = get(id), zone = id === "formulewerf" && area.zones.find((z) => z.nodes.some((n) => n.key === shell.stop)) || area.zones.find((z) => z.id === shell.zone) || area.zones[0], stop = zone.nodes.find((n) => n.key === shell.stop);
        return { id, area, zone, stop };
      }
      function positiveDone(state) {
        const m = state.missions?.grenspas;
        return !!m?.completed || !!m?.completion?.some((c) => c.variant === 0 || c.variant === 1) || !!state.events?.some((e) => e.skill === "sign" && e.correct && (e.variant === 0 && e.attemptId?.startsWith("symbol:") || e.variant === 1 && e.phase === "transfer"));
      }
      function statuses(state, id, legacy) {
        const a = get(id), nodes = all(a), raw = legacy?.state || legacy;
        let s = null;
        if (raw?.skills) {
          s = W.migrate(raw);
          s.review ||= [];
          s.skills ||= {};
        }
        const pointsDone = (n) => id === "puntenbaai" && (!!state.missions?.[n.id]?.completed || !!state.events?.some((e) => e.skill === n.id && e.correct && e.taskId?.startsWith("rechten-v2:puntenbaai:") && /:5:run\d+$/.test(e.taskId)));
        const hillDone = (n) => id === "hellingrug" && n.playable && (!!state.missions?.[n.id]?.completed || !!state.events?.some((e) => e.skill === n.id && e.correct && e.taskId?.startsWith("rechten-v2:hellingrug:") && (n.id === "line_behavior" ? /:8:run\d+$/ : /:5:run\d+$/).test(e.taskId) && e.attemptId?.startsWith({ delta: "hill-dy:", slope: "hill-rate:", slope_from_two_points: "hill-calculate:", line_behavior: "line-behavior:", special_lines: "line-special:" }[n.id])));
        const grensDone = (n) => id === "grenspas" && (!!state.missions?.[n.key]?.completed || !!state.events?.some((e) => e.correct && e.taskId?.startsWith("rechten-v2:grenspas:" + n.key + ":") && /:5:run\d+$/.test(e.taskId) && e.attemptId?.startsWith(n.id === "sign" ? "grens-inequality:" : n.id === "signchart" ? "grens-chart:" : "grens-zero:")));
        const formulaDone = (n) => (id === "formulewerf" || id === "signaalstad" && n.id === "graph_from_table") && n.playable && (!!state.missions?.[n.id]?.completed || !!state.events?.some((e) => e.correct && e.skill === n.id && e.taskId?.startsWith("rechten-v2:" + id + ":" + n.id + ":") && /:5:run\d+$/.test(e.taskId) && e.attemptId?.startsWith({ graph_from_table: "formula-plot:", equation_from_ab: "formula-build:", graph_from_equation: "formula-plot:", equation_from_graph: "formula-read:", rewrite_linear_equation: "formula-rewrite:", intercept_from_point: "derive-intercept:", equation_from_point_slope: "derive-formula:", equation_from_two_points: "derive-formula:", equation_from_table: "derive-formula:" }[n.id])));
        const completed = (n) => formulaDone(n) || grensDone(n) || hillDone(n) || pointsDone(n) || (n.key === "positive" ? positiveDone(state) || !!(s && W.ready(s, n.id)) : n.id === "zeroRead" ? !!state.events?.some((e) => e.skill === "zeroRead" && e.correct && !e.taskId?.startsWith("rechten-v2:grenspas:")) || !!(s && W.ready(s, n.id)) : !!(s && W.ready(s, n.id)));
        const released = (n) => !!n.playable;
        const open = unlocked(state, id, legacy);
        const available = (n) => open && released(n);
        const started = (n) => {
          const m = state.missions?.[n.key];
          return !!m && m.world === id && !m.completed;
        };
        const recommended = nodes.find((n) => available(n) && !completed(n) && started(n) && n.key === state.active) || nodes.find((n) => available(n) && !completed(n) && started(n)) || nodes.find((n) => available(n) && !completed(n)) || null;
        const playableTotal = nodes.filter(released).length, playableCompleted = nodes.filter((n) => released(n) && completed(n)).length;
        return { recommended, completed: nodes.filter(completed).length, total: nodes.length, playableTotal, playableCompleted, complete: playableTotal > 0 && playableTotal === playableCompleted, priorKnowledge: id === "puntenbaai", unlocked: open, prerequisite: prerequisite[id] || null, nodes: nodes.map((n) => ({ ...n, started: started(n), recommended: n === recommended, state: completed(n) ? "completed" : !released(n) ? "soon" : !open ? "locked" : started(n) ? "started" : n === recommended ? "current" : "available" })) };
      }
      const routeOrder = Object.freeze(["hellingrug", "grenspas", "formulewerf", "signaalstad"]);
      const prerequisite = Object.freeze({ grenspas: "hellingrug", formulewerf: "grenspas", signaalstad: "formulewerf" });
      function legacyTouched(id, legacy) {
        const raw = legacy?.state || legacy;
        if (!raw) return false;
        const ids = new Set(all(get(id)).filter((n) => n.playable).map((n) => n.id));
        if (Array.isArray(raw.access) && raw.access.some((skill) => ids.has(skill))) return true;
        if (!raw.skills) return false;
        const migrated = W.migrate(raw);
        migrated.review ||= [];
        migrated.skills ||= {};
        return all(get(id)).some((n) => n.playable && W.ready(migrated, n.id));
      }
      function touched(state, id, legacy) {
        return Object.values(state.missions || {}).some((m) => m?.world === id) || (state.events || []).some((e) => String(e?.taskId || "").startsWith("rechten-v2:" + id + ":")) || legacyTouched(id, legacy);
      }
      function unlocked(state, id, legacy) {
        id = canonical(id);
        if (id === "puntenbaai" || id === "hellingrug" || !prerequisite[id]) return true;
        if (touched(state, id, legacy)) return true;
        return statuses(state, prerequisite[id], legacy).complete;
      }
      function recommendation(state, legacy) {
        const active = state.missions?.[state.active];
        const result = (id, node2, resume = false) => ({ id, node: node2, resume, zone: get(id).zones.find((z) => z.nodes.some((n) => n.key === node2?.key))?.id || get(id).zones[0].id });
        if (active && !active.completed && unlocked(state, active.world, legacy)) {
          const summary = statuses(state, active.world, legacy), node2 = summary.nodes.find((n) => n.key === state.active && n.playable && n.state !== "locked");
          if (node2) return result(active.world, node2, true);
        }
        for (const id of routeOrder) {
          const summary = statuses(state, id, legacy);
          if (summary.unlocked && summary.recommended) return result(id, summary.recommended, summary.nodes.find((n) => n.key === summary.recommended.key).started);
        }
        return result("hellingrug", null);
      }
      function locationState(source, screen, { area, zone, stop } = {}) {
        const next = JSON.parse(JSON.stringify(source)), old = selection(source), id = has(area) ? canonical(area) : old.id, a = get(id), z = screen === "stop" && id === "formulewerf" && a.zones.find((z2) => z2.nodes.some((n) => n.key === stop)) || a.zones.find((z2) => z2.id === (zone || (!area || id === old.id ? old.zone.id : null))) || a.zones[0];
        next.settings.shell = { ...next.settings.shell, area: ["area", "stop"].includes(screen) ? id : null, zone: z.id, stop: screen === "stop" && z.nodes.some((n) => n.key === stop) ? stop : null };
        next.screen = ["area", "stop"].includes(screen) ? "world" : screen;
        return next;
      }
      function hash(state) {
        const { id, zone, stop } = selection(state);
        if (state.screen === "world" && state.settings?.shell?.area) return "#" + id + (get(id).zones.length > 1 ? "/" + zone.id : "") + (stop ? "/halte/" + stop.key : "");
        return { world: "#wereld", mission: "#oefenen", book: "#voortgang", profile: "#profiel" }[state.screen] || "#wereld";
      }
      function fromHash(source, hash2) {
        const parts = hash2.replace(/^#/, "").split("/"), id = canonical(parts[0]);
        if (has(id)) {
          const a = get(id), zone = a.zones.find((z) => z.id === parts[1]) || a.zones[0], stop = parts[parts.indexOf("halte") + 1];
          return locationState(source, parts.includes("halte") && (id === "formulewerf" ? all(a) : zone.nodes).some((n) => n.key === stop) ? "stop" : "area", { area: id, zone: zone.id, stop });
        }
        const screen = { "wereld": "world", "voortgang": "book", "profiel": "profile" }[parts[0]];
        return screen ? locationState(source, screen) : locationState(source, "world");
      }
      return Object.freeze({ areas, get, all, selection, statuses, routeOrder, prerequisite, unlocked, recommendation, locationState, hash, fromHash });
    });
  }
});

// shared/multiplayer/rechten-online-policy.cjs
var require_rechten_online_policy = __commonJS({
  "shared/multiplayer/rechten-online-policy.cjs"(exports, module) {
    var Game = require_battle_config();
    var Areas = require_area_maps();
    function learned(state, worldId) {
      if (!state || !state.missions || !Array.isArray(state.events)) return [];
      const skills = [];
      for (const world of Game.worlds.filter((w) => w.id !== "puntenbaai")) {
        const status = Areas.statuses(state, world.id);
        if (!status.unlocked || !status.complete || worldId && world.id !== worldId) continue;
        for (const skill of world.skills) if (status.nodes.some((n) => n.key === skill && n.state === "completed")) skills.push(skill);
      }
      return skills;
    }
    function pool(a, b, worldId) {
      const other = new Set(learned(b, worldId));
      return learned(a, worldId).filter((s) => other.has(s));
    }
    function grade(spec, answer) {
      try {
        return Game.validate(Game.generate(spec), answer).ok === true;
      } catch {
        return false;
      }
    }
    module.exports = { pool, learned, grade };
  }
});

// shared/multiplayer/rechten-learn-engine.cjs
var require_rechten_learn_engine = __commonJS({
  "shared/multiplayer/rechten-learn-engine.cjs"(exports, module) {
    var Game = require_battle_config();
    var policy = require_rechten_online_policy();
    var skills = Object.freeze(["point_plot", "delta", "graph_from_equation"]);
    var copy = (v) => JSON.parse(JSON.stringify(v));
    var live = (r) => r.members.filter((m) => !(r.data.left || []).includes(m.id));
    var builder = (r) => {
      const people = live(r);
      return people[r.data.round % people.length]?.id;
    };
    var spec = (r, user) => ({ skill: r.data.skill, seed: r.data.seed + r.data.round * 104729 + (user ? 1 + r.members.findIndex((m) => m.id === user) : 0) * 7919 >>> 0, variant: r.data.round % 4 });
    var answer = (a) => {
      if (!a || typeof a !== "object" || Array.isArray(a) || JSON.stringify(a).length > 16e3 || !Array.isArray(a.steps) || a.steps.length > 4) throw Error("Ongeldig voorstel.");
      return copy(a);
    };
    function settleMembers(r) {
      const s = r.data, people = live(r);
      if (people.length < 2 && !["lobby", "finished"].includes(s.phase)) {
        s.phase = "paused";
        return;
      }
      if (s.phase === "idea" && people.every((m) => s.ideas?.[m.id])) {
        s.phase = "build";
        s.draft = s.ideas[builder(r)].answer;
      }
      if (s.phase === "individual" && people.every((m) => s.checks?.[m.id])) s.phase = "finished";
    }
    function change(raw, uid, action, input = {}) {
      const r = copy(raw), s = r.data, people = live(r), mine = people.some((m) => m.id === uid);
      if (!mine) throw Error("Je neemt niet meer deel. Je kunt alleen verder leren.");
      const own = builder(r) === uid;
      if (action === "leave") {
        s.left = [...s.left || [], uid];
        s.approvals = [];
        s.revision++;
        settleMembers(r);
        return s;
      }
      if (action === "start") {
        if (s.phase !== "lobby" || people[0]?.id !== uid || people.length < 2) throw Error("Wacht tot jullie met twee of drie zijn.");
        if (people.some((m) => Date.parse(r.now) - Date.parse(m.seen_at) > 2e4)) throw Error("Wacht tot je partners weer online zijn, of ga alleen verder.");
        s.phase = "idea";
        s.ideas = {};
        return s;
      }
      if (action === "continue-duo") {
        const absent = people.filter((m) => Date.parse(r.now) - Date.parse(m.seen_at) > 2e4);
        if (people.length !== 3 || absent.length !== 1 || absent[0].id === uid) throw Error("Wacht even op je partner, of ga alleen verder.");
        s.continueVotes = [.../* @__PURE__ */ new Set([...s.continueVotes || [], uid])];
        if (people.filter((m) => m.id !== absent[0].id).every((m) => s.continueVotes.includes(m.id))) {
          s.left = [...s.left || [], absent[0].id];
          s.approvals = [];
          s.continueVotes = [];
          s.revision++;
          settleMembers(r);
        }
        return s;
      }
      if (action === "idea") {
        if (s.phase !== "idea") throw Error("De eigen denkstap is voorbij.");
        if (!s.ideas[uid]) s.ideas[uid] = { answer: answer(input.answer), skipped: !!input.skipped };
        if (people.every((m) => s.ideas[m.id])) {
          s.phase = "build";
          s.draft = s.ideas[builder(r)].answer;
          s.approvals = [];
          s.revision++;
        }
        return s;
      }
      if (action === "draft") {
        if (s.phase !== "build" || !own) throw Error("Je partner bouwt nu.");
        if (input.revision !== s.revision) throw Error("Het bord is gewijzigd. Bekijk het nieuwste voorstel.");
        const next = answer(input.answer);
        if (JSON.stringify(next) !== JSON.stringify(s.draft)) {
          s.draft = next;
          s.approvals = [];
          s.revision++;
        }
        return s;
      }
      if (action === "approve") {
        if (s.phase !== "build" || !s.draft?.steps?.length || input.revision !== s.revision) throw Error("Bekijk eerst het nieuwste voorstel.");
        s.approvals = [.../* @__PURE__ */ new Set([...s.approvals, uid])];
        return s;
      }
      if (action === "check") {
        if (s.phase !== "build" || !own || input.revision !== s.revision || !people.every((m) => s.approvals.includes(m.id))) throw Error("Iedereen moet dit voorstel eerst goedkeuren.");
        s.correct = policy.grade(spec(r), s.draft);
        s.phase = "result";
        return s;
      }
      if (action === "retry") {
        if (s.phase !== "result" || !own || s.correct) throw Error("Herwerken kan nu niet.");
        s.phase = "build";
        s.draft = { steps: [] };
        s.approvals = [];
        s.revision++;
        return s;
      }
      if (action === "next") {
        if (s.phase !== "result" || !own || !s.correct) throw Error("Rond eerst de opgave samen af.");
        s.round++;
        s.revision++;
        s.ideas = {};
        s.approvals = [];
        s.draft = { steps: [] };
        s.correct = null;
        s.phase = s.round >= 6 ? "individual" : "idea";
        return s;
      }
      if (action === "individual") {
        if (!["individual", "finished"].includes(s.phase)) throw Error("De eigen eindcheck is nog niet begonnen.");
        s.checks ||= {};
        if (!s.checks[uid]) s.checks[uid] = { correct: policy.grade(spec(r, uid), answer(input.answer)) };
        if (people.every((m) => s.checks[m.id])) s.phase = "finished";
        return s;
      }
      throw Error("Onbekende leeractie.");
    }
    function project(r, uid) {
      const s = r.data, people = live(r), participating = people.some((m) => m.id === uid), myIdea = s.ideas?.[uid];
      return {
        id: r.id,
        code: r.code,
        capacity: r.capacity || Math.max(2, people.length),
        peers: r.peers || [],
        invitees: r.invitees || [],
        version: r.version,
        phase: s.phase,
        round: s.round,
        skill: s.skill,
        revision: s.revision,
        builder: builder(r),
        host: people[0]?.id,
        participating,
        members: people.map((m) => ({ id: m.id, alias: m.alias, online: Date.parse(r.now) - Date.parse(m.seen_at) < 2e4, idea: !!s.ideas?.[m.id], approved: !!s.approvals?.includes(m.id), checked: !!s.checks?.[m.id] })),
        task: participating ? spec(r, s.phase === "individual" || s.phase === "finished" ? uid : null) : null,
        draft: participating && ["build", "result"].includes(s.phase) ? s.draft : null,
        ideas: participating && ["build", "result"].includes(s.phase) ? people.map((m) => ({ alias: m.alias, ...s.ideas?.[m.id] })) : null,
        mine: participating ? { idea: !!myIdea, answer: s.phase === "idea" ? myIdea?.answer : null, check: s.checks?.[uid] || null } : null,
        correct: s.phase === "result" ? s.correct : null,
        continueVotes: s.continueVotes || [],
        server_time: r.now
      };
    }
    module.exports = { skills, change, project, spec, builder };
  }
});
export default require_rechten_learn_engine();
