var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// games/algebra-trainer/core.js
var require_core = __commonJS({
  "games/algebra-trainer/core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory();
      else root.AlgebraCore = factory();
    })(globalThis, () => {
      "use strict";
      function gcd(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b) {
          const t = a % b;
          a = b;
          b = t;
        }
        return a || 1;
      }
      function lcm(a, b) {
        return Math.abs(a * b) / gcd(a, b);
      }
      class Rat {
        constructor(n, d = 1) {
          if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d === 0) throw new Error("Ongeldige breuk");
          if (d < 0) {
            n = -n;
            d = -d;
          }
          const g = gcd(n, d);
          this.n = n / g;
          this.d = d / g;
        }
        add(o) {
          o = R(o);
          return new Rat(this.n * o.d + o.n * this.d, this.d * o.d);
        }
        sub(o) {
          o = R(o);
          return new Rat(this.n * o.d - o.n * this.d, this.d * o.d);
        }
        mul(o) {
          o = R(o);
          return new Rat(this.n * o.n, this.d * o.d);
        }
        div(o) {
          o = R(o);
          if (o.n === 0) throw new Error("Delen door nul kan niet");
          return new Rat(this.n * o.d, this.d * o.n);
        }
        neg() {
          return new Rat(-this.n, this.d);
        }
        abs() {
          return new Rat(Math.abs(this.n), this.d);
        }
        eq(o) {
          o = R(o);
          return this.n === o.n && this.d === o.d;
        }
        isZero() {
          return this.n === 0;
        }
        isOne() {
          return this.n === this.d;
        }
        value() {
          return this.n / this.d;
        }
      }
      function R(n, d) {
        if (n instanceof Rat) return n;
        if (d !== void 0) return new Rat(n, d);
        return new Rat(n, 1);
      }
      function ratKey(q) {
        q = R(q);
        return `${q.n}/${q.d}`;
      }
      function reciprocal(q) {
        q = R(q);
        if (q.isZero()) return null;
        return new Rat(q.d * (q.n < 0 ? -1 : 1), Math.abs(q.n));
      }
      function terminatingPlaces(q) {
        q = R(q);
        let d = q.d, tw = 0, fi = 0;
        while (d % 2 === 0) {
          d /= 2;
          tw++;
        }
        while (d % 5 === 0) {
          d /= 5;
          fi++;
        }
        return d === 1 ? Math.max(tw, fi) : null;
      }
      const N = (q, fmt = "auto") => ({ t: "num", q: R(q), fmt });
      const V = () => ({ t: "var", name: "x" });
      const Add = (...terms) => ({ t: "add", terms: terms.flat() });
      const Mul = (...factors) => ({ t: "mul", factors: factors.flat() });
      const Div = (n, d, preserve = false) => ({ t: "div", n, d, preserve });
      const EQ = (l, r) => ({ l, r });
      function cloneExpr(e) {
        if (e.t === "num") return N(new Rat(e.q.n, e.q.d), e.fmt);
        if (e.t === "var") return V();
        if (e.t === "add") return { t: "add", terms: e.terms.map(cloneExpr) };
        if (e.t === "mul") return { t: "mul", factors: e.factors.map(cloneExpr) };
        if (e.t === "div") return { t: "div", n: cloneExpr(e.n), d: cloneExpr(e.d), preserve: !!e.preserve };
        throw new Error("Onbekende expressie");
      }
      function cloneEq(eq) {
        return EQ(cloneExpr(eq.l), cloneExpr(eq.r));
      }
      function isNum(e) {
        return e?.t === "num";
      }
      function isVar(e) {
        return e?.t === "var";
      }
      function num(q, fmt = "auto") {
        return N(q, fmt);
      }
      function linearCoeff(e) {
        if (isVar(e)) return R(1);
        if (e?.t === "mul") {
          let vars = 0, c = R(1);
          for (const f of e.factors) {
            if (isNum(f)) c = c.mul(f.q);
            else if (isVar(f)) vars++;
            else return null;
          }
          return vars === 1 ? c : null;
        }
        if (e?.t === "div" && isNum(e.d)) {
          const c = linearCoeff(e.n);
          return c ? c.div(e.d.q) : null;
        }
        return null;
      }
      function makeLinearTerm(c) {
        c = R(c);
        if (c.isZero()) return N(0);
        if (c.eq(1)) return V();
        return Mul(N(c), V());
      }
      function simplify(e) {
        if (isNum(e) || isVar(e)) return cloneExpr(e);
        if (e.t === "add") {
          let raw = [];
          for (const t of e.terms) {
            const s = simplify(t);
            if (s.t === "add") raw.push(...s.terms);
            else raw.push(s);
          }
          let constant = R(0), xcoef = R(0);
          const others = [];
          let constFmt = "auto";
          for (const t of raw) {
            if (isNum(t)) {
              constant = constant.add(t.q);
              if (constFmt === "auto" && t.fmt !== "auto") constFmt = t.fmt;
              continue;
            }
            const c = linearCoeff(t);
            if (c !== null) {
              xcoef = xcoef.add(c);
              continue;
            }
            others.push(t);
          }
          const out = [];
          if (!xcoef.isZero()) out.push(makeLinearTerm(xcoef));
          out.push(...others);
          if (!constant.isZero()) out.push(N(constant, constFmt));
          if (!out.length) return N(0);
          if (out.length === 1) return out[0];
          return { t: "add", terms: out };
        }
        if (e.t === "mul") {
          let raw = [];
          for (const f of e.factors) {
            const s = simplify(f);
            if (s.t === "mul") raw.push(...s.factors);
            else raw.push(s);
          }
          let coef = R(1), coefFmt = "auto";
          const others = [];
          for (const f of raw) {
            if (isNum(f)) {
              coef = coef.mul(f.q);
              if (coefFmt === "auto" && f.fmt !== "auto") coefFmt = f.fmt;
              continue;
            }
            if (f.t === "div" && isNum(f.d)) {
              coef = coef.div(f.d.q);
              others.push(f.n);
              continue;
            }
            others.push(f);
          }
          if (coef.isZero()) return N(0);
          const out = [];
          if (!coef.eq(1) || !others.length) out.push(N(coef, coefFmt));
          out.push(...others.map(simplify));
          if (out.length === 1) return out[0];
          if (out.length === 2 && isNum(out[0]) && out[0].q.eq(1)) return out[1];
          return { t: "mul", factors: out };
        }
        if (e.t === "div") {
          const n = simplify(e.n), d = simplify(e.d);
          if (isNum(d)) {
            if (d.q.isZero()) throw new Error("Delen door nul kan niet");
            if (d.q.eq(1)) return n;
            if (isNum(n)) return N(n.q.div(d.q), n.fmt);
            if (e.preserve) return { t: "div", n, d, preserve: true };
            if (n.t === "mul") return simplify(Mul(N(R(1).div(d.q)), n));
            if (n.t === "add") {
              return simplify(Add(...n.terms.map((t) => Mul(N(R(1).div(d.q)), t))));
            }
            if (n.t === "div" && isNum(n.d)) {
              return simplify(Div(n.n, N(n.d.q.mul(d.q))));
            }
            return { t: "div", n, d, preserve: false };
          }
          return { t: "div", n, d, preserve: !!e.preserve };
        }
        throw new Error("Onbekende expressie");
      }
      function negExpr(e) {
        return simplify(Mul(N(-1), e));
      }
      function simplifyEq(eq) {
        return EQ(simplify(eq.l), simplify(eq.r));
      }
      function exprSig(e) {
        e = simplify(e);
        if (isNum(e)) return `n:${ratKey(e.q)}`;
        if (isVar(e)) return "x";
        if (e.t === "add") return `a(${e.terms.map(exprSig).join(",")})`;
        if (e.t === "mul") return `m(${e.factors.map(exprSig).join(",")})`;
        if (e.t === "div") return `d(${exprSig(e.n)},${exprSig(e.d)})`;
      }
      function eqSig(eq) {
        eq = simplifyEq(eq);
        return `${exprSig(eq.l)}=${exprSig(eq.r)}`;
      }
      function exprNodeCount(e) {
        if (isNum(e) || isVar(e)) return 1;
        if (e.t === "add") return 1 + e.terms.reduce((s, t) => s + exprNodeCount(t), 0);
        if (e.t === "mul") return 1 + e.factors.reduce((s, t) => s + exprNodeCount(t), 0);
        if (e.t === "div") return 2 + exprNodeCount(e.n) + exprNodeCount(e.d);
        return 1;
      }
      function equationComplexity(eq) {
        eq = simplifyEq(eq);
        let score = exprNodeCount(eq.l) + exprNodeCount(eq.r);
        const lc = containsVar(eq.l), rc = containsVar(eq.r);
        if (lc && rc) score += 5;
        score += countType(eq.l, "div") * 2 + countType(eq.r, "div") * 2;
        return score;
      }
      function containsVar(e) {
        if (isVar(e)) return true;
        if (isNum(e)) return false;
        if (e.t === "add") return e.terms.some(containsVar);
        if (e.t === "mul") return e.factors.some(containsVar);
        if (e.t === "div") return containsVar(e.n) || containsVar(e.d);
        return false;
      }
      function countType(e, t) {
        let n = e.t === t ? 1 : 0;
        if (e.t === "add") for (const x of e.terms) n += countType(x, t);
        if (e.t === "mul") for (const x of e.factors) n += countType(x, t);
        if (e.t === "div") {
          n += countType(e.n, t);
          n += countType(e.d, t);
        }
        return n;
      }
      function solvedEquation(eq) {
        eq = simplifyEq(eq);
        return isVar(eq.l) && isNum(eq.r) || isVar(eq.r) && isNum(eq.l);
      }
      function operandIsNumeric(e) {
        return isNum(simplify(e));
      }
      function applyEquation(eq, op, operand) {
        eq = cloneEq(eq);
        operand = cloneExpr(operand);
        if ((op === "*" || op === "/") && !operandIsNumeric(operand)) throw new Error("Vermenigvuldigen of delen gebeurt hier met een getal.");
        const oq = operandIsNumeric(operand) ? simplify(operand).q : null;
        if ((op === "*" || op === "/") && oq.isZero()) {
          if (op === "*") throw new Error("\xB7 0 bewaart de oplossingsverzameling niet.");
          throw new Error("\xF7 0 kan niet.");
        }
        let l, r;
        if (op === "+") {
          l = Add(eq.l, operand);
          r = Add(eq.r, operand);
        } else if (op === "-") {
          l = Add(eq.l, negExpr(operand));
          r = Add(eq.r, negExpr(operand));
        } else if (op === "*") {
          const scale = (side) => {
            const s = simplify(side);
            return s.t === "add" ? Add(...s.terms.map((t) => Mul(t, operand))) : Mul(s, operand);
          };
          l = scale(eq.l);
          r = scale(eq.r);
        } else if (op === "/") {
          l = Div(eq.l, operand);
          r = Div(eq.r, operand);
        } else throw new Error("Onbekende bewerking");
        return simplifyEq(EQ(l, r));
      }
      function decimalText(q) {
        q = R(q);
        const p = terminatingPlaces(q);
        if (p === null || p > 2) return null;
        let s = q.value().toFixed(Math.max(1, p)).replace(/\.?0+$/, "");
        return s.replace(".", ",");
      }
      function hashRat(q) {
        q = R(q);
        return Math.abs((q.n * 37 + q.d * 101) % 17);
      }
      function autoNumberFormat(q, policy) {
        q = R(q);
        if (q.d === 1) return "integer";
        if (policy.allowDecimals && terminatingPlaces(q) !== null && terminatingPlaces(q) <= 1) {
          if (!policy.allowFractions) return "decimal";
          return hashRat(q) % 2 === 0 ? "decimal" : "fraction";
        }
        return "fraction";
      }
      function ratLatex(q, fmt = "auto", policy = currentPolicy()) {
        q = R(q);
        const neg = q.n < 0;
        const a = q.abs();
        const use = fmt === "auto" ? autoNumberFormat(a, policy) : fmt;
        let body;
        if (a.d === 1) body = String(a.n);
        else if (use === "decimal" && decimalText(a) !== null) body = decimalText(a).replace(",", "{,}");
        else body = `\\frac{${a.n}}{${a.d}}`;
        return neg ? `-${body}` : body;
      }
      function splitSign(e) {
        e = simplify(e);
        if (isNum(e) && e.q.n < 0) return { neg: true, abs: N(e.q.abs(), e.fmt) };
        if (e.t === "mul" && e.factors.length && isNum(e.factors[0]) && e.factors[0].q.n < 0) {
          const fs = e.factors.map(cloneExpr);
          fs[0] = N(fs[0].q.abs(), fs[0].fmt);
          return { neg: true, abs: simplify(Mul(...fs)) };
        }
        if (e.t === "div") {
          const s = splitSign(e.n);
          if (s.neg) return { neg: true, abs: Div(s.abs, e.d) };
        }
        return { neg: false, abs: e };
      }
      function latexExpr(e, policy = currentPolicy(), parentPrec = 0) {
        e = simplify(e);
        if (isNum(e)) return ratLatex(e.q, e.fmt, policy);
        if (isVar(e)) return "x";
        if (e.t === "add") {
          let s = "";
          e.terms.forEach((term, i) => {
            const sp = splitSign(term);
            const body = latexExpr(sp.abs, policy, 1);
            if (i === 0) s += (sp.neg ? "-" : "") + body;
            else s += sp.neg ? ` - ${body}` : ` + ${body}`;
          });
          return parentPrec > 1 ? `\\left(${s}\\right)` : s;
        }
        if (e.t === "mul") {
          const sp = splitSign(e);
          if (sp.neg && exprSig(sp.abs) !== exprSig(e)) return `-${latexExpr(sp.abs, policy, parentPrec)}`;
          const fs = e.factors;
          let out = "";
          fs.forEach((f, i) => {
            const ftex = latexExpr(f, policy, 2);
            const grouped = f.t === "add" ? `\\left(${latexExpr(f, policy, 0)}\\right)` : ftex;
            if (i === 0) {
              out += grouped;
              return;
            }
            const prev = fs[i - 1];
            const implicit = isNum(prev) && (isVar(f) || f.t === "add") || isVar(prev) && f.t === "add";
            out += implicit ? grouped : `\\,${grouped}`;
          });
          return parentPrec > 2 ? `\\left(${out}\\right)` : out;
        }
        if (e.t === "div") {
          return `\\frac{${latexExpr(e.n, policy, 0)}}{${latexExpr(e.d, policy, 0)}}`;
        }
        return "?";
      }
      function latexEq(eq, policy = currentPolicy()) {
        eq = simplifyEq(eq);
        return `${latexExpr(eq.l, policy, 0)} = ${latexExpr(eq.r, policy, 0)}`;
      }
      function operationLatex(op, operand, policy = currentPolicy()) {
        const sym = op === "*" ? "\\cdot" : op === "/" ? "\\div" : op === "-" ? "-" : "+";
        return `${sym}\\;${latexExpr(operand, policy, 0)}`;
      }
      function fallbackText(tex) {
        return tex.replace(/\\left|\\right/g, "").replace(/\\(?:times|cdot)/g, "\xB7").replace(/\\div/g, "\xF7").replace(/\\,/g, " ").replace(/\{,\}/g, ",").replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)").replace(/[{}]/g, "");
      }
      function texHTML(tex, display = false) {
        if (window.katex) {
          try {
            return window.katex.renderToString(tex, { throwOnError: false, displayMode: display, strict: "ignore" });
          } catch (_) {
          }
        }
        return `<span class="texFallback">${escapeHTML(fallbackText(tex))}</span>`;
      }
      function renderMathNodes(root = document) {
        root.querySelectorAll("[data-tex]").forEach((el) => {
          el.innerHTML = texHTML(el.dataset.tex, el.dataset.display === "1");
        });
      }
      const TYPES = [
        { level: "beginner", id: "A1", label: "ax = b", desc: "factor wegwerken" },
        { level: "beginner", id: "A2", label: "x + a = b", desc: "optelling wegwerken" },
        { level: "beginner", id: "A3", label: "x \u2212 a = b", desc: "aftrekking wegwerken" },
        { level: "beginner", id: "A4", label: "x / a = b", desc: "deling wegwerken" },
        { level: "basis", id: "B1", label: "ax + b = c", desc: "twee stappen" },
        { level: "basis", id: "B2", label: "ax \u2212 b = c", desc: "twee stappen" },
        { level: "basis", id: "B3", label: "b \u2212 ax = c", desc: "negatieve x-term" },
        { level: "basis", id: "B4", label: "x / a + b = c", desc: "breukvorm + constante" },
        { level: "basis", id: "B5", label: "x / a \u2212 b = c", desc: "breukvorm \u2212 constante" },
        { level: "advanced", id: "C1", label: "a(x + b) = c", desc: "buitenfactor + haakjes" },
        { level: "advanced", id: "C2", label: "a(x \u2212 b) = c", desc: "buitenfactor + aftrekking" },
        { level: "advanced", id: "D1", label: "a(bx + c) = d", desc: "drie structurele stappen" },
        { level: "advanced", id: "D2", label: "(ax + b) / c = d", desc: "volledige teller in breuk" },
        { level: "advanced", id: "D3", label: "a(bx \u2212 c) + d = e", desc: "vier stappen" },
        { level: "advanced", id: "E1", label: "ax + b = cx + d", desc: "x aan beide kanten" },
        { level: "advanced", id: "E2", label: "ax \u2212 b = cx", desc: "x aan beide kanten, \xE9\xE9n constante" },
        { level: "advanced", id: "E3", label: "ax = cx + d", desc: "x aan beide kanten, \xE9\xE9n constante" }
      ];
      const LEVEL_META = {
        beginner: { label: "Beginner", subtitle: "\xC9\xE9n inverse bewerking. Ideaal voor remedi\xEBring." },
        basis: { label: "Basis", subtitle: "Twee stappen, tekeninzicht en eenvoudige breukvormen." },
        advanced: { label: "Verdieping", subtitle: "Haakjes, samengestelde breuken en x aan beide kanten." }
      };
      const INT_COEFF = [2, 3, 4, 5, 6, 7].map((n) => R(n));
      const INT_SHIFT = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => R(n));
      const FRAC_COEFF = [R(1, 2), R(2, 3), R(3, 2), R(4, 3), R(5, 2), R(5, 3)].map(R);
      const FRAC_SHIFT = [R(1, 2), R(1, 3), R(2, 3), R(3, 2), R(3, 4), R(5, 2)].map(R);
      const DEC_COEFF = [R(1, 2), R(4, 5), R(6, 5), R(3, 2), R(9, 5), R(5, 2)].map(R);
      const DEC_SHIFT = [R(1, 2), R(3, 2), R(5, 2), R(7, 2), R(6, 5), R(12, 5)].map(R);
      let seededRandom = null;
      const random = () => seededRandom ? seededRandom() : Math.random();
      function pick(a) {
        return a[Math.floor(random() * a.length)];
      }
      function chance(p) {
        return random() < p;
      }
      function currentPolicy() {
        return {
          allowFractions: !!globalThis.document?.getElementById("allowFractions")?.checked,
          allowDecimals: !!globalThis.document?.getElementById("allowDecimals")?.checked,
          allowNegative: !!globalThis.document?.getElementById("allowNegative")?.checked
        };
      }
      function pickFmt(policy) {
        const bag = ["integer", "integer", "integer"];
        if (policy.allowFractions) bag.push("fraction", "fraction");
        if (policy.allowDecimals) bag.push("decimal", "decimal");
        return pick(bag);
      }
      function pickParam(policy, kind = "coeff") {
        let fmt = pickFmt(policy), q;
        if (fmt === "fraction") q = pick(kind === "coeff" ? FRAC_COEFF : FRAC_SHIFT);
        else if (fmt === "decimal") q = pick(kind === "coeff" ? DEC_COEFF : DEC_SHIFT);
        else q = pick(kind === "coeff" ? INT_COEFF : INT_SHIFT);
        return { q, fmt };
      }
      function pickSolution(policy) {
        let q = R(pick([2, 3, 4, 5, 6, 7, 8]));
        if (policy.allowFractions && chance(0.18)) q = pick([R(3, 2), R(5, 2), R(7, 2), R(4, 3), R(5, 3)]);
        if (policy.allowDecimals && chance(0.18)) q = pick([R(3, 2), R(5, 2), R(7, 2), R(6, 5), R(12, 5)]);
        if (policy.allowNegative && chance(0.28)) q = q.neg();
        return q;
      }
      function numNodeFromParam(p) {
        return N(p.q, p.fmt);
      }
      function nice(q, max = 90) {
        q = R(q);
        return Math.abs(q.value()) <= max && q.d <= 12 && Math.abs(q.n) <= 180;
      }
      function rhsFmt(q, policy) {
        q = R(q);
        if (q.d === 1) return "integer";
        if (policy.allowDecimals && terminatingPlaces(q) !== null && terminatingPlaces(q) <= 1 && chance(0.5)) return "decimal";
        return policy.allowFractions ? "fraction" : "auto";
      }
      function positiveDifferentCoeffs(policy) {
        for (let i = 0; i < 100; i++) {
          const a = pickParam(policy, "coeff"), c = pickParam(policy, "coeff");
          if (!a.q.eq(c.q) && a.q.value() > c.q.value()) return { a, c };
        }
        return { a: { q: R(5), fmt: "integer" }, c: { q: R(2), fmt: "integer" } };
      }
      function step(op, operand) {
        return { op, operand: simplify(operand) };
      }
      function generateExercise(typeId, policy, index = 0) {
        for (let tries = 0; tries < 1200; tries++) {
          const A = pickParam(policy, "coeff"), B = pickParam(policy, "shift"), C = pickParam(policy, "coeff"), D = pickParam(policy, "shift");
          const x = pickSolution(policy);
          const a = A.q.abs(), b = B.q.abs(), c = C.q.abs(), d = D.q.abs();
          let eq, steps = [];
          if (typeId === "A1") {
            const rhs = a.mul(x);
            if (!nice(rhs)) continue;
            eq = EQ(Mul(numNodeFromParam(A), V()), N(rhs, rhsFmt(rhs, policy)));
            steps = [step("/", numNodeFromParam(A))];
          }
          if (typeId === "A2") {
            const rhs = x.add(b);
            if (!nice(rhs)) continue;
            eq = EQ(Add(V(), numNodeFromParam(B)), N(rhs, rhsFmt(rhs, policy)));
            steps = [step("-", numNodeFromParam(B))];
          }
          if (typeId === "A3") {
            const rhs = x.sub(b);
            if (!nice(rhs)) continue;
            eq = EQ(Add(V(), N(b.neg(), B.fmt)), N(rhs, rhsFmt(rhs, policy)));
            steps = [step("+", numNodeFromParam(B))];
          }
          if (typeId === "A4") {
            const q = pickSolution({ ...policy, allowNegative: false });
            const xx = a.mul(q);
            if (!nice(xx)) continue;
            eq = EQ(Div(V(), numNodeFromParam(A)), N(q, rhsFmt(q, policy)));
            steps = [step("*", numNodeFromParam(A))];
          }
          if (typeId === "B1") {
            const rhs = a.mul(x).add(b);
            if (!nice(rhs)) continue;
            eq = EQ(Add(Mul(numNodeFromParam(A), V()), numNodeFromParam(B)), N(rhs, rhsFmt(rhs, policy)));
            steps = [step("-", numNodeFromParam(B)), step("/", numNodeFromParam(A))];
          }
          if (typeId === "B2") {
            const rhs = a.mul(x).sub(b);
            if (!nice(rhs)) continue;
            eq = EQ(Add(Mul(numNodeFromParam(A), V()), N(b.neg(), B.fmt)), N(rhs, rhsFmt(rhs, policy)));
            steps = [step("+", numNodeFromParam(B)), step("/", numNodeFromParam(A))];
          }
          if (typeId === "B3") {
            const rhs = b.sub(a.mul(x));
            if (!nice(rhs)) continue;
            eq = EQ(Add(numNodeFromParam(B), Mul(N(a.neg(), A.fmt), V())), N(rhs, rhsFmt(rhs, policy)));
            steps = [step("-", numNodeFromParam(B)), step("/", N(a.neg(), A.fmt))];
          }
          if (typeId === "B4") {
            const q = pickSolution(policy), xx = a.mul(q), rhs = q.add(b);
            if (!nice(xx) || !nice(rhs)) continue;
            eq = EQ(Add(Div(V(), numNodeFromParam(A)), numNodeFromParam(B)), N(rhs, rhsFmt(rhs, policy)));
            steps = [step("-", numNodeFromParam(B)), step("*", numNodeFromParam(A))];
          }
          if (typeId === "B5") {
            const q = pickSolution(policy), xx = a.mul(q), rhs = q.sub(b);
            if (!nice(xx) || !nice(rhs)) continue;
            eq = EQ(Add(Div(V(), numNodeFromParam(A)), N(b.neg(), B.fmt)), N(rhs, rhsFmt(rhs, policy)));
            steps = [step("+", numNodeFromParam(B)), step("*", numNodeFromParam(A))];
          }
          if (typeId === "C1") {
            const rhs = a.mul(x.add(b));
            if (!nice(rhs)) continue;
            eq = EQ(Mul(numNodeFromParam(A), Add(V(), numNodeFromParam(B))), N(rhs, rhsFmt(rhs, policy)));
            steps = [step("/", numNodeFromParam(A)), step("-", numNodeFromParam(B))];
          }
          if (typeId === "C2") {
            const rhs = a.mul(x.sub(b));
            if (!nice(rhs)) continue;
            eq = EQ(Mul(numNodeFromParam(A), Add(V(), N(b.neg(), B.fmt))), N(rhs, rhsFmt(rhs, policy)));
            steps = [step("/", numNodeFromParam(A)), step("+", numNodeFromParam(B))];
          }
          if (typeId === "D1") {
            const rhs = a.mul(c.mul(x).add(b));
            if (!nice(rhs)) continue;
            eq = EQ(Mul(numNodeFromParam(A), Add(Mul(numNodeFromParam(C), V()), numNodeFromParam(B))), N(rhs, rhsFmt(rhs, policy)));
            steps = [step("/", numNodeFromParam(A)), step("-", numNodeFromParam(B)), step("/", numNodeFromParam(C))];
          }
          if (typeId === "D2") {
            const target = pickSolution(policy);
            const bb = c.mul(target).sub(a.mul(x));
            if (bb.isZero() || bb.n < 0 || !nice(bb, 35)) continue;
            const bNode = N(bb, rhsFmt(bb, policy));
            eq = EQ(Div(Add(Mul(numNodeFromParam(A), V()), bNode), numNodeFromParam(C), true), N(target, rhsFmt(target, policy)));
            steps = [step("*", numNodeFromParam(C)), step("-", bNode), step("/", numNodeFromParam(A))];
          }
          if (typeId === "D3") {
            const rhs = a.mul(c.mul(x).sub(b)).add(d);
            if (!nice(rhs)) continue;
            eq = EQ(Add(Mul(numNodeFromParam(A), Add(Mul(numNodeFromParam(C), V()), N(b.neg(), B.fmt))), numNodeFromParam(D)), N(rhs, rhsFmt(rhs, policy)));
            steps = [step("-", numNodeFromParam(D)), step("/", numNodeFromParam(A)), step("+", numNodeFromParam(B)), step("/", numNodeFromParam(C))];
          }
          if (typeId === "E1" || typeId === "E2" || typeId === "E3") {
            const pair = positiveDifferentCoeffs(policy), aa = pair.a.q, cc = pair.c.q;
            const diff = aa.sub(cc);
            if (diff.isZero()) continue;
            if (typeId === "E1") {
              const bb = pickParam(policy, "shift");
              const bv = bb.q.abs();
              const dd = diff.mul(x).add(bv);
              if (!nice(dd) || dd.isZero()) continue;
              eq = EQ(
                Add(Mul(numNodeFromParam(pair.a), V()), numNodeFromParam(bb)),
                Add(Mul(numNodeFromParam(pair.c), V()), N(dd, rhsFmt(dd, policy)))
              );
              steps = [step("-", Mul(numNodeFromParam(pair.c), V())), step("-", numNodeFromParam(bb)), step("/", N(diff))];
            }
            if (typeId === "E2") {
              const xpos = pickSolution({ ...policy, allowNegative: false }).abs();
              const bv2 = diff.mul(xpos);
              if (bv2.n <= 0 || !nice(bv2, 40)) continue;
              const bnode = N(bv2, rhsFmt(bv2, policy));
              eq = EQ(Add(Mul(numNodeFromParam(pair.a), V()), N(bv2.neg(), bnode.fmt)), Mul(numNodeFromParam(pair.c), V()));
              steps = [step("-", Mul(numNodeFromParam(pair.c), V())), step("+", bnode), step("/", N(diff))];
            }
            if (typeId === "E3") {
              const dd = diff.mul(x);
              if (!nice(dd) || dd.isZero()) continue;
              eq = EQ(Mul(numNodeFromParam(pair.a), V()), Add(Mul(numNodeFromParam(pair.c), V()), N(dd, rhsFmt(dd, policy))));
              steps = [step("-", Mul(numNodeFromParam(pair.c), V())), step("/", N(diff))];
            }
          }
          if (!eq) continue;
          eq = EQ(cloneExpr(eq.l), cloneExpr(eq.r));
          const states = [cloneEq(eq)];
          let cur = cloneEq(eq), ok = true;
          try {
            for (const st of steps) {
              cur = applyEquation(cur, st.op, st.operand);
              states.push(cloneEq(cur));
            }
          } catch (_) {
            ok = false;
          }
          if (!ok || !solvedEquation(cur)) continue;
          if (!operandRepresentable(eq.l, policy, false) || !operandRepresentable(eq.r, policy, false) || steps.some((s) => !operandRepresentable(s.operand, policy)) || !operandRepresentable(cur.l, policy) || !operandRepresentable(cur.r, policy)) continue;
          return {
            id: `${typeId}-${index}-${random().toString(36).slice(2, 7)}`,
            type: typeId,
            policy: { ...policy },
            start: eq,
            steps,
            states,
            solution: states.at(-1).l.t === "var" ? states.at(-1).r.q : states.at(-1).l.q
          };
        }
        throw new Error(`Geen nette oefening gevonden voor ${typeId}`);
      }
      function generateSeeded(type, policy, index, seed) {
        const previous = seededRandom;
        let value = seed >>> 0;
        seededRandom = () => {
          value = value + 1831565813 | 0;
          let n = Math.imul(value ^ value >>> 15, 1 | value);
          n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
          return ((n ^ n >>> 14) >>> 0) / 4294967296;
        };
        try {
          return generateExercise(type, policy, index);
        } finally {
          seededRandom = previous;
        }
      }
      function topTerms(e) {
        e = simplify(e);
        return e.t === "add" ? e.terms : [e];
      }
      function absExpr(e) {
        const s = splitSign(e);
        return s.abs;
      }
      function exprIsZero(e) {
        return isNum(simplify(e)) && simplify(e).q.isZero();
      }
      function collectNumericDenominators(e, out = []) {
        e = simplify(e);
        if (isNum(e)) {
          if (e.q.d > 1) out.push(e.q.d);
          return out;
        }
        if (e.t === "div" && isNum(e.d)) {
          if (e.d.q.d === 1 && Math.abs(e.d.q.n) > 1) out.push(Math.abs(e.d.q.n));
        }
        if (e.t === "add") e.terms.forEach((x) => collectNumericDenominators(x, out));
        if (e.t === "mul") e.factors.forEach((x) => collectNumericDenominators(x, out));
        if (e.t === "div") {
          collectNumericDenominators(e.n, out);
          collectNumericDenominators(e.d, out);
        }
        return out;
      }
      function outerScalar(e) {
        e = simplify(e);
        if (e.t === "mul" && e.factors.length && isNum(e.factors[0])) return e.factors[0].q;
        if (e.t === "div" && isNum(e.d)) return R(1).div(e.d.q);
        const c = linearCoeff(e);
        return c;
      }
      function operandRepresentable(e, policy, simplifyInput = true) {
        if (simplifyInput) e = simplify(e);
        const nums = [];
        (function walk(x) {
          if (isNum(x)) nums.push(x.q);
          else if (x.t === "add") x.terms.forEach(walk);
          else if (x.t === "mul") x.factors.forEach(walk);
          else if (x.t === "div") {
            walk(x.n);
            walk(x.d);
          }
        })(e);
        return nums.every((q) => {
          if (q.d === 1) return true;
          if (policy.allowFractions) return true;
          return policy.allowDecimals && terminatingPlaces(q) !== null && terminatingPlaces(q) <= 1;
        });
      }
      function canonicalStepAt(ex, eq) {
        const sig = eqSig(eq);
        for (let i = 0; i < ex.states.length - 1; i++) {
          if (eqSig(ex.states[i]) === sig) return ex.steps[i];
        }
        return null;
      }
      function candidateOperands(ex, eq, op) {
        const policy = ex.policy;
        const important = [], extra = [];
        const seen = /* @__PURE__ */ new Set();
        function add(arr, e) {
          e = simplify(e);
          const k = exprSig(e);
          if (exprIsZero(e)) return;
          if ((op === "*" || op === "/") && !operandIsNumeric(e)) return;
          if (arr !== important && !operandRepresentable(e, policy)) return;
          if (seen.has(k)) {
            if (arr === important) {
              const i = extra.findIndex((v) => exprSig(v) === k);
              if (i >= 0) {
                extra.splice(i, 1);
                important.push(e);
              }
            }
            return;
          }
          seen.add(k);
          arr.push(e);
        }
        const canon = canonicalStepAt(ex, eq);
        if (canon) {
          if (canon.op === op) add(important, canon.operand);
          if (canon.op === "/" && op === "*") {
            const q = simplify(canon.operand);
            if (isNum(q)) {
              const inv = reciprocal(q.q);
              if (inv) add(important, N(inv));
            }
          }
          if (canon.op === "*" && op === "/") {
            const q = simplify(canon.operand);
            if (isNum(q)) {
              const inv = reciprocal(q.q);
              if (inv) add(important, N(inv));
            }
          }
        }
        if (op === "+" || op === "-") {
          for (const side of [eq.l, eq.r]) {
            for (const t of topTerms(side)) {
              const sp = splitSign(t);
              if (op === "-" && !sp.neg) add(important, sp.abs);
              if (op === "+" && sp.neg) add(important, sp.abs);
              add(extra, sp.abs);
            }
          }
        }
        if (op === "*" || op === "/") {
          for (const side of [eq.l, eq.r]) {
            for (const term of [side, ...topTerms(side)]) {
              const s = outerScalar(term);
              if (s && !s.isZero() && !s.eq(1)) {
                if (op === "*") {
                  const inv = reciprocal(s);
                  if (inv) add(important, N(inv));
                } else add(important, N(s));
              }
            }
          }
          if (op === "*") {
            const dens = [...collectNumericDenominators(eq.l), ...collectNumericDenominators(eq.r)];
            if (dens.length) {
              const common = dens.reduce((a, d) => lcm(a, d), 1);
              if (common > 1 && Number.isSafeInteger(common)) add(important, N(common));
            }
          }
        }
        const literals = [];
        function collectLiterals(x) {
          if (isNum(x)) {
            if (!x.q.isZero()) literals.push(x);
          } else if (x.t === "add") x.terms.forEach(collectLiterals);
          else if (x.t === "mul") x.factors.forEach(collectLiterals);
          else if (x.t === "div") {
            collectLiterals(x.n);
            collectLiterals(x.d);
          }
        }
        [eq.l, eq.r, ex.start.l, ex.start.r].forEach(collectLiterals);
        literals.forEach((x) => add(extra, absExpr(x)));
        if (op === "*" || op === "/") {
          literals.forEach((x) => {
            const s = simplify(x);
            if (isNum(s)) {
              const inv = reciprocal(s.q);
              if (inv) add(extra, N(inv));
            }
          });
        }
        [1, 2, 3, 4, 5, 6].forEach((n) => add(extra, N(n)));
        return [...important, ...extra.slice(0, Math.max(0, 8 - important.length))];
      }
      function escapeHTML(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
      }
      return Object.freeze({ gcd, lcm, Rat, R, ratKey, reciprocal, terminatingPlaces, N, V, Add, Mul, Div, EQ, cloneExpr, cloneEq, isNum, isVar, num, linearCoeff, makeLinearTerm, simplify, negExpr, simplifyEq, exprSig, eqSig, exprNodeCount, equationComplexity, containsVar, countType, solvedEquation, operandIsNumeric, applyEquation, decimalText, hashRat, autoNumberFormat, ratLatex, splitSign, latexExpr, latexEq, operationLatex, fallbackText, texHTML, renderMathNodes, TYPES, LEVEL_META, INT_COEFF, INT_SHIFT, FRAC_COEFF, FRAC_SHIFT, DEC_COEFF, DEC_SHIFT, pick, chance, currentPolicy, pickFmt, pickParam, pickSolution, numNodeFromParam, nice, rhsFmt, positiveDifferentCoeffs, step, generateExercise, generateSeeded, topTerms, absExpr, exprIsZero, collectNumericDenominators, outerScalar, operandRepresentable, canonicalStepAt, candidateOperands, escapeHTML });
    });
  }
});

// games/algebra-trainer/stelsels/core.js
var require_core2 = __commonJS({
  "games/algebra-trainer/stelsels/core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_core());
      else root.StelselsCore = factory(root.AlgebraCore);
    })(globalThis, (C) => {
      "use strict";
      const { R, Rat } = C;
      const expr = (x = 0, y = 0, c = 0) => ({ x: R(x), y: R(y), c: R(c) });
      const copy = (e) => expr(e.x, e.y, e.c), equation = (l, r) => ({ l: copy(l), r: copy(r) });
      const clone = (s) => s.map((e) => equation(e.l, e.r));
      const add = (a, b) => expr(a.x.add(b.x), a.y.add(b.y), a.c.add(b.c));
      const scale = (a, k) => expr(a.x.mul(k), a.y.mul(k), a.c.mul(k));
      const sub = (a, b) => add(a, scale(b, R(-1)));
      const reduced = (e) => sub(e.l, e.r);
      function parse(s) {
        s = String(s).trim().replace(/[−–]/g, "-").replace(",", ".");
        if (!/^[+-]?(?:\d{1,6}(?:\.\d{1,4})?|\d{1,6}\s*\/\s*[+-]?\d{1,6})$/.test(s)) throw Error("Gebruik een getal, bijvoorbeeld \u22122, 0,5 of 1/2.");
        if (s.includes("/")) {
          const [n2, d2] = s.split("/").map(Number);
          return R(n2, d2);
        }
        const n = Number(s), d = s.includes(".") ? 10 ** s.split(".")[1].length : 1;
        return R(Math.round(n * d), d);
      }
      const text = (q) => q.d === 1 ? String(q.n) : `${q.n}/${q.d}`;
      function operationText(op, value, term = "c") {
        value = R(value);
        if (!["+", "-", "*", "/"].includes(op) || !["x", "y", "c"].includes(term)) throw Error("Kies een geldige bewerking.");
        if (["*", "/"].includes(op)) {
          if (term !== "c") throw Error("Vermenigvuldig of deel door een getal, bijvoorbeeld \xF72.");
          return (op === "*" ? "\xD7" : "\xF7") + text(value);
        }
        if (value.n < 0) {
          value = value.neg();
          op = op === "-" ? "+" : "-";
        }
        return op + (term !== "c" && value.isOne() ? "" : text(value)) + (term === "c" ? "" : term);
      }
      function parseOperation(input, fallbackOp = "-") {
        let body = String(input).trim().replace(/[−–]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
        if (!body) throw Error("Vul een bewerking in, bijvoorbeeld \u2212y, +3x of \xF72.");
        let op = fallbackOp;
        if (/^[+*/-]/.test(body)) {
          op = body[0];
          body = body.slice(1);
        }
        if (!["+", "-", "*", "/"].includes(op)) throw Error("Kies optellen, aftrekken, vermenigvuldigen of delen.");
        const term = /[xy]$/i.test(body) ? body.at(-1).toLowerCase() : "c";
        if (term !== "c") body = body.slice(0, -1);
        if (["*", "/"].includes(op) && term !== "c") throw Error("Vermenigvuldig of deel door een getal, bijvoorbeeld \xF72.");
        const value = parse(body || (term === "c" ? "" : "1"));
        const command = operationText(op, value, term);
        if (["+", "-"].includes(op) && value.n < 0) {
          op = op === "-" ? "+" : "-";
          return { op, value: value.neg(), term, command };
        }
        return { op, value, term, command };
      }
      function format(e, tex = false) {
        let out = "";
        for (const k of ["x", "y", "c"]) {
          const q = e[k];
          if (q.isZero()) continue;
          const a = q.abs();
          let term = k === "c" || !a.isOne() ? tex ? C.ratLatex(a, {}) : text(a) : "";
          if (k !== "c") term += k;
          out += (out ? q.n < 0 ? " \u2212 " : " + " : q.n < 0 ? "\u2212" : "") + term;
        }
        return out || "0";
      }
      const eqText = (e, tex = false) => format(e.l, tex) + " = " + format(e.r, tex);
      const systemTex = (s, raw) => "\\left\\{\\begin{aligned}" + s.map((e, i) => raw && raw.row === i ? raw.tex : eqText(e, true)).join("\\\\") + "\\end{aligned}\\right.";
      function solution(s) {
        const [a, b] = s.map(reduced), det = a.x.mul(b.y).sub(b.x.mul(a.y));
        if (det.isZero()) {
          const impossible = [a, b].some((e) => e.x.isZero() && e.y.isZero() && !e.c.isZero());
          const inconsistent = !a.x.mul(b.c).eq(b.x.mul(a.c)) || !a.y.mul(b.c).eq(b.y.mul(a.c));
          return { kind: impossible || inconsistent ? "none" : "infinite" };
        }
        return { kind: "unique", x: a.y.mul(b.c).sub(b.y.mul(a.c)).div(det), y: a.c.mul(b.x).sub(b.c.mul(a.x)).div(det) };
      }
      function bounded(s) {
        for (const e of s) for (const side of [e.l, e.r]) for (const q of Object.values(side)) if (Math.abs(q.n) > 1e7 || q.d > 1e6) throw Error("Deze getallen worden te groot. Maak eerst eenvoudiger of doe een stap terug.");
        return s;
      }
      function operate(s, row, op, value, term = "c") {
        if (![0, 1].includes(row) || !["x", "y", "c"].includes(term)) throw Error("Kies een vergelijking.");
        value = R(value);
        const out = clone(s), e = out[row];
        if (["+", "-"].includes(op)) {
          const v = expr();
          v[term] = op === "-" ? value.neg() : value;
          e.l = add(e.l, v);
          e.r = add(e.r, v);
        } else {
          if (value.isZero()) throw Error("Vermenigvuldigen of delen door nul behoudt het stelsel niet.");
          if (!["*", "/"].includes(op) || term !== "c") throw Error("Vermenigvuldig of deel door een getal.");
          const factor = op === "/" ? R(1).div(value) : value;
          e.l = scale(e.l, factor);
          e.r = scale(e.r, factor);
        }
        return bounded(out);
      }
      function isolated(e) {
        for (const [l, r] of [[e.l, e.r], [e.r, e.l]]) for (const v of ["x", "y"]) if (l[v].isOne() && l[v === "x" ? "y" : "x"].isZero() && l.c.isZero() && r[v].isZero()) return { variable: v, value: copy(r) };
        return null;
      }
      function substitute(s, source) {
        const found = isolated(s[source]);
        if (!found) throw Error("Maak eerst x of y vrij in de gekozen vergelijking.");
        const row = 1 - source, v = found.variable, out = clone(s), target = out[row];
        if (target.l[v].isZero() && target.r[v].isZero()) throw Error("Die onbekende staat niet meer in de andere vergelijking.");
        const replace = (e) => {
          const base = copy(e), coef = base[v];
          base[v] = R(0);
          return add(base, scale(found.value, coef));
        };
        const rawSide = (e, tex) => {
          const base = copy(e), coef = base[v];
          base[v] = R(0);
          if (coef.isZero()) return format(base, tex);
          const magnitude = coef.abs();
          const factor = magnitude.isOne() ? "" : (tex ? C.ratLatex(magnitude, {}) : text(magnitude)) + (tex ? "\\cdot " : " \xB7 ");
          const term = (coef.n < 0 ? "\u2212" : "") + factor + (tex ? "\\bigl(" : "(") + format(found.value, tex) + (tex ? "\\bigr)" : ")");
          const tail = format(base, tex);
          return term + (tail === "0" ? "" : tail.startsWith("\u2212") ? " \u2212 " + tail.slice(1) : " + " + tail);
        };
        const raw = { row, tex: rawSide(target.l, true) + " = " + rawSide(target.r, true), text: rawSide(target.l, false) + " = " + rawSide(target.r, false) };
        target.l = replace(target.l);
        target.r = replace(target.r);
        return { system: bounded(out), raw, variable: v };
      }
      function combine(s, f1, f2, op, target) {
        if (![0, 1].includes(target) || !["+", "-"].includes(op)) throw Error("Kies de te vervangen vergelijking.");
        f1 = R(f1);
        f2 = R(f2);
        if (f1.isZero() || f2.isZero()) throw Error("Beide factoren moeten verschillen van nul.");
        const out = clone(s), sign = op === "-" ? R(-1) : R(1);
        out[target] = equation(add(scale(s[0].l, f1), scale(s[1].l, f2.mul(sign))), add(scale(s[0].r, f1), scale(s[1].r, f2.mul(sign))));
        return bounded(out);
      }
      function solved(s) {
        const values = s.map(isolated);
        return values.every(Boolean) && new Set(values.map((v) => v.variable)).size === 2 && values.every((v) => v.value.x.isZero() && v.value.y.isZero());
      }
      function containsPoint(e, x, y) {
        const r = reduced(e);
        return r.x.mul(x).add(r.y.mul(y)).add(r.c).isZero();
      }
      function generate(seed, level = "beginner", kind = "unique") {
        if (!["beginner", "basis", "advanced"].includes(level) || !["unique", "none", "infinite"].includes(kind)) throw Error("Onbekend oefentype.");
        let z = seed >>> 0;
        const rnd = () => {
          z += 1831565813;
          let t = z;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
        const pick = (a2) => a2[Math.floor(rnd() * a2.length)];
        const x = R(pick([-4, -3, -2, -1, 1, 2, 3, 4]), level === "advanced" ? 2 : 1), y = R(pick([-4, -3, -2, -1, 1, 2, 3, 4]), level === "advanced" ? 2 : 1);
        let a, b, c, d;
        if (level === "beginner") {
          a = R(1);
          b = R(pick([-2, -1, 1, 2]));
          c = R(1);
          d = R(pick([-3, -2, -1, 1, 2, 3].filter((n) => n !== b.n)));
        } else {
          do {
            a = R(pick([-4, -3, -2, 2, 3, 4]));
            b = R(pick([-4, -3, -2, 2, 3, 4]));
            c = R(pick([-4, -3, -2, 2, 3, 4]));
            d = R(pick([-4, -3, -2, 2, 3, 4]));
          } while (a.mul(d).eq(b.mul(c)));
        }
        let s = [equation(expr(a, b), expr(0, 0, a.mul(x).add(b.mul(y)))), equation(expr(c, d), expr(0, 0, c.mul(x).add(d.mul(y))))];
        if (kind !== "unique") {
          const f = R(pick([2, 3, -2]));
          s[1] = equation(scale(s[0].l, f), scale(s[0].r, f));
          if (kind === "none") s[1].r.c = s[1].r.c.add(R(pick([1, 2, 3])));
        }
        if (level === "advanced") {
          s = operate(s, 0, "+", R(pick([1, 2])), "y");
          s = operate(s, 1, "-", R(pick([1, 2])), "x");
        }
        return { id: `${seed >>> 0}-${level}-${kind}`, seed: seed >>> 0, level, kind, start: s, solution: solution(s) };
      }
      function canonical(ex, method = "substitution") {
        let s = clone(ex.start);
        const steps = [{ system: clone(s), label: "Start" }];
        const push = (label, raw) => steps.push({ system: clone(s), label, ...raw ? { raw } : {} });
        const op = (row, o, q, term = "c") => {
          s = operate(s, row, o, q, term);
          push(`Vergelijking ${row + 1}: ${o === "*" ? "\xB7" : o === "/" ? "\xF7" : o === "-" ? "\u2212" : "+"} ${q.n < 0 ? "(" + text(q) + ")" : text(q)}${term === "c" ? "" : term} aan beide leden`);
        };
        const normalize = (row) => {
          const e2 = s[row];
          if (!e2.r.x.isZero()) op(row, "-", e2.r.x, "x");
          if (!s[row].r.y.isZero()) op(row, "-", s[row].r.y, "y");
          if (!s[row].l.c.isZero()) op(row, "-", s[row].l.c);
        };
        if (method === "combination") {
          normalize(0);
          normalize(1);
          const a = s[0].l.x, b = s[1].l.x;
          s = combine(s, b, a, "-", 1);
          push(`Vervang II door (${text(b)}) \xB7 I \u2212 (${text(a)}) \xB7 II`);
        } else {
          normalize(0);
          const y = s[0].l.y;
          if (!y.isZero()) op(0, "-", y, "y");
          if (!s[0].l.x.isOne()) op(0, "/", s[0].l.x);
          const r2 = substitute(s, 0);
          s = r2.system;
          push("Vul x in vergelijking II in", r2.raw);
          push("Werk de haakjes uit en neem samen");
        }
        normalize(1);
        const e = s[1], v = e.l.x.isZero() ? "y" : "x", k = e.l[v];
        if (k.isZero()) {
          push(ex.solution.kind === "none" ? "Onmogelijke gelijkheid: geen oplossing." : "Identiteit: oneindig veel oplossingen.");
          return steps;
        }
        if (!k.isOne()) op(1, "/", k);
        const r = substitute(s, 1);
        s = r.system;
        push(`Vul ${r.variable} in vergelijking I in`, r.raw);
        push("Werk de haakjes uit en neem samen");
        normalize(0);
        const w = v === "x" ? "y" : "x";
        if (!s[0].l[w].isOne()) op(0, "/", s[0].l[w]);
        return steps;
      }
      function graphPoints(e) {
        const points = [];
        for (let x = -8; x <= 8; x++) {
          const r = reduced(e);
          if (!r.y.isZero()) {
            const y = r.x.mul(R(x)).add(r.c).neg().div(r.y);
            if (Math.abs(y.value()) <= 8) points.push({ x: R(x), y });
          }
        }
        if (!points.length) {
          const r = reduced(e);
          if (!r.x.isZero()) {
            const x = r.c.neg().div(r.x);
            points.push({ x, y: R(-3) }, { x, y: R(3) });
          }
        }
        return [points[0], points.at(-1)];
      }
      function revive(s) {
        return JSON.parse(s, (k, v) => v && typeof v === "object" && Object.keys(v).length === 2 && Number.isSafeInteger(v.n) && Number.isSafeInteger(v.d) ? R(v.n, v.d) : v);
      }
      return { R, Rat, expr, equation, clone, add, scale, sub, reduced, parse, parseOperation, operationText, text, format, eqText, systemTex, solution, operate, isolated, substitute, combine, solved, containsPoint, generate, canonical, graphPoints, revive };
    });
  }
});

// games/algebra-trainer/fraction-core.js
var require_fraction_core = __commonJS({
  "games/algebra-trainer/fraction-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object" && module.exports) module.exports = factory(require_core());
      else root.AlgebraFractions = factory(root.AlgebraCore);
    })(globalThis, (C) => {
      "use strict";
      const token = (n, d = 1, x = false) => ({ n, d, x }), copy = (v) => JSON.parse(JSON.stringify(v));
      const key = (t) => `${t.n}/${t.d}:${t.x ? "x" : "1"}`;
      function tex(t) {
        const n = Math.abs(t.n), numerator = t.x ? n === 1 ? "x" : n + "x" : String(n);
        return (t.n < 0 ? "-" : "") + (t.d === 1 ? numerator : "\\frac{" + numerator + "}{" + t.d + "}");
      }
      function sideTex(terms) {
        return terms.map((t, i) => (i && t.n >= 0 ? " + " : i ? " - " : "") + tex(i && t.n < 0 ? { ...t, n: -t.n } : t)).join("") || "\\square";
      }
      const equationTex = (eq) => sideTex(eq.lhs) + " = " + sideTex(eq.rhs);
      const node = (t) => C.Div(t.x ? C.makeLinearTerm(C.R(t.n)) : C.N(t.n), C.N(t.d), t.d !== 1);
      const equation = (eq) => C.EQ(C.Add(...eq.lhs.map(node)), C.Add(...eq.rhs.map(node)));
      function common(eq) {
        return [...eq.lhs, ...eq.rhs].reduce((n, t) => C.lcm(n, t.d), 1);
      }
      function sameDenominator(eq) {
        return new Set([...eq.lhs, ...eq.rhs].map((t) => t.d)).size === 1;
      }
      function task(seed, intro = false) {
        let a = 1, b = 1, da = 3, db = 2, x = 1;
        if (!intro) {
          const u = seed >>> 0;
          a = 1 + u % 2;
          b = 1 + Math.floor(u / 2) % 3;
          da = 2 + Math.floor(u / 6) % 4;
          if (a === da) da = 3;
          db = 2 + Math.floor(u / 24) % 3;
          if (db === da) db = db === 4 ? 2 : db + 1;
          if (C.gcd(b, db) > 1) b = 1;
          x = 1 + Math.floor(u / 72) % 6;
        }
        const d = C.lcm(da, db), rhs = a * x * (d / da) + b * (d / db), source = { lhs: [token(a, da, true), token(b, db)], rhs: [token(rhs, d)] };
        const start = equation(source), steps = [{ op: "*", operand: C.N(d) }, { op: "-", operand: C.N(b * d / db) }];
        if (a * d / da !== 1) steps.push({ op: "/", operand: C.N(a * d / da) });
        const states = [start];
        for (const st of steps) states.push(C.applyEquation(states.at(-1), st.op, st.operand));
        return { kind: "fractions", seed, stage: "Kies je aanpak", guided: true, goal: "Maak losse breuken gelijknamig of werk elke noemer weg, en los op.", prompt: "Kies je aanpak voor de losse breuken.", display: equationTex(source), fractions: source, ex: { type: "B4", policy: { allowFractions: true, allowDecimals: false, allowNegative: false }, start, steps, states, solution: C.R(x) } };
      }
      function init(t, r) {
        if (!r.fraction) r.fraction = { phase: "route", current: copy(t.fractions), blocks: { lhs: [], rhs: [] }, field: "lhs", signs: {}, steps: [] };
        return r.fraction;
      }
      function numberChoices(eq) {
        const d = common(eq);
        return [...new Set([...eq.lhs, ...eq.rhs].map((t) => t.d).concat([d, d * 2, 2, 3]))].filter((n) => n > 1).slice(0, 4).sort((a, b) => a - b);
      }
      function numberCheck(eq, n) {
        if (!Number.isSafeInteger(n) || n < 1) return { ok: false, message: "Kies een positief geheel getal." };
        const bad = [...eq.lhs, ...eq.rhs].find((t) => n % t.d !== 0);
        if (bad) return { ok: false, message: n + " is niet deelbaar door " + bad.d + ". Kies een veelvoud van alle noemers." };
        const d = common(eq);
        return { ok: true, message: n === d ? "Bouw nu zelf de nieuwe regel." : n + " werkt ook. " + d + " is het kleinste gemeenschappelijke veelvoud. Bouw de nieuwe regel." };
      }
      function prepare(s, kind, n) {
        const source = copy(s.current), change = (t) => kind === "common" ? token(t.n * n / t.d, n, t.x) : token(t.n * n / t.d, 1, t.x);
        return { kind, number: n, source, target: { lhs: source.lhs.map(change), rhs: source.rhs.map(change) } };
      }
      function coefficients(terms) {
        return terms.reduce((o, t) => {
          const name = t.x ? "a" : "b";
          o[name] = o[name].add(C.R(t.n, t.d));
          return o;
        }, { a: C.R(0), b: C.R(0) });
      }
      function normalTerms(a, b) {
        const terms = [];
        if (!a.isZero()) terms.push(token(a.n, a.d, true));
        if (!b.isZero() || !terms.length) terms.push(token(b.n, b.d));
        return terms;
      }
      function operationChoices(eq) {
        const l = coefficients(eq.lhs), choices = [];
        if (!l.b.isZero()) choices.push({ op: "-", value: { n: l.b.n, d: l.b.d } }, { op: "+", value: { n: l.b.n, d: l.b.d } });
        if (!l.a.isZero() && !l.a.eq(1)) choices.push({ op: "/", value: { n: l.a.n, d: l.a.d } }, { op: "*", value: { n: l.a.n, d: l.a.d } });
        return choices;
      }
      function operationTex(st) {
        return { "-": "-", "+": "+", "/": "\\div", "*": "\\cdot" }[st.op] + "\\;" + tex(token(st.value.n, st.value.d));
      }
      function prepareOperation(s, st) {
        const q = C.R(st.value.n, st.value.d), change = (terms) => {
          let { a, b } = coefficients(terms);
          if (st.op === "-") b = b.sub(q);
          if (st.op === "+") b = b.add(q);
          if (st.op === "/") {
            a = a.div(q);
            b = b.div(q);
          }
          if (st.op === "*") {
            a = a.mul(q);
            b = b.mul(q);
          }
          return normalTerms(a, b);
        };
        return { kind: "operation", operation: copy(st), source: copy(s.current), target: { lhs: change(s.current.lhs), rhs: change(s.current.rhs) } };
      }
      function palette(s) {
        const side = s.field, required = s.build.target[side], source = s.build.source[side], pool = [], seen = /* @__PURE__ */ new Set();
        function add(t) {
          if (!Number.isSafeInteger(t.n) || !Number.isSafeInteger(t.d) || t.d < 1) return;
          const k = key(t);
          if (!seen.has(k)) {
            seen.add(k);
            pool.push(copy(t));
          }
        }
        required.forEach(add);
        source.forEach(add);
        if (s.build.kind === "common") source.forEach((t) => add(token(t.n, s.build.number, t.x)));
        if (s.build.kind === "clear") source.forEach((t) => add(token(t.n * s.build.number, t.d, t.x)));
        required.forEach((t) => add({ ...t, n: t.n + 1 }));
        return pool.slice(0, 6).sort((a, b) => (a.n * 17 + a.d * 11 + (a.x ? 7 : 0)) % 29 - (b.n * 17 + b.d * 11 + (b.x ? 7 : 0)) % 29);
      }
      function sorted(terms) {
        return terms.map(key).sort().join("|");
      }
      function validate(t, r) {
        const s = init(t, r);
        if (s.phase !== "build" || !s.build) return { ok: false, incomplete: true, message: "Kies eerst een aanpak en een getal." };
        if (Object.values(s.signs).some(Boolean)) return { ok: false, incomplete: true, message: "Kies nog een term, of neem het teken terug met \u21B6." };
        for (const side of ["lhs", "rhs"]) {
          const own = s.blocks[side], expected = s.build.target[side], label = side === "lhs" ? "links" : "rechts";
          if (!own.length) return { ok: false, incomplete: true, message: "Bouw ook het " + (side === "lhs" ? "linker" : "rechter") + " lid." };
          if (sorted(own) === sorted(expected)) continue;
          if (own.length < expected.length) return { ok: false, message: "Er ontbreekt een term " + label + ". Neem elke term mee in de nieuwe regel." };
          if (s.build.kind === "common") {
            const denominator = own.find((v) => v.d !== s.build.number);
            if (denominator) return { ok: false, message: "Maak ook deze breuk " + label + " gelijknamig: gebruik noemer " + s.build.number + "." };
            return { ok: false, message: "Bij een grotere noemer verandert de teller mee. Vermenigvuldig teller en noemer met hetzelfde getal." };
          }
          if (s.build.kind === "clear") {
            const unchanged = own.find((v) => s.build.source[side].some((w) => key(w) === key(v)));
            return { ok: false, message: unchanged ? "Een term " + label + " bleef onveranderd. Vermenigvuldig elke term in beide leden met " + s.build.number + "." : "De factor " + s.build.number + " werkt op elke volledige breuk. Reken daarna de deling uit." };
          }
          return { ok: false, message: "Voer dezelfde bewerking " + label + " uit en reken dit volledige lid uit." };
        }
        return { ok: true, message: s.build.kind === "common" ? "Juist. De waarde van elke breuk bleef gelijk." : s.build.kind === "clear" ? "Juist. Elke term in beide leden is vermenigvuldigd." : "Juist. Dezelfde bewerking is op beide leden uitgevoerd." };
      }
      function solved(eq) {
        const l = coefficients(eq.lhs), r = coefficients(eq.rhs);
        return l.a.eq(1) && l.b.isZero() && r.a.isZero();
      }
      function commit(s) {
        const b = copy(s.build);
        s.steps.push(b);
        s.current = copy(b.target);
        s.lastKind = b.kind;
        s.blocks = { lhs: [], rhs: [] };
        s.signs = {};
        s.field = "lhs";
        delete s.build;
        s.phase = solved(s.current) ? "done" : b.kind === "common" ? "route" : "operation";
        return s.phase === "done";
      }
      function prompt(s) {
        return s.phase === "route" ? "Kies je aanpak voor de losse breuken." : s.phase === "number" ? s.route === "common" ? "Kies een gemeenschappelijke noemer." : "Kies een factor voor \xE9lke term in beide leden." : s.phase === "build" ? s.build.kind === "common" ? "Maak elke breuk gelijknamig. Bouw links \xE9n rechts." : s.build.kind === "clear" ? "Vermenigvuldig elke term met " + s.build.number + ". Bouw de nieuwe regel." : "Voer " + C.fallbackText(operationTex(s.build.operation)) + " op beide leden uit. Bouw de nieuwe regel." : s.phase === "done" ? "x staat vrij." : "Kies een bewerking op beide leden om x vrij te maken.";
      }
      function demo(t, s, seed) {
        let example;
        for (let i = 0; i < 12; i++) {
          example = task(seed + i * 104729 >>> 0);
          if (equationTex(example.fractions) !== equationTex(t.fractions)) break;
        }
        const kind = s.build?.kind || (s.phase === "operation" ? "operation" : s.route || "common");
        let current = copy(example.fractions), b;
        if (kind === "operation") {
          const reference = s.build?.source || s.current, hasFractions = [...reference.lhs, ...reference.rhs].some((v) => v.d > 1);
          current = prepare({ current }, hasFractions ? "common" : "clear", common(current)).target;
          if (coefficients(reference.lhs).b.isZero()) {
            const a = coefficients(current.lhs).a;
            current = { lhs: normalTerms(a, C.R(0)), rhs: normalTerms(C.R(0), a.mul(example.ex.solution)) };
          }
          const choices = operationChoices(current), wanted = s.build?.operation?.op;
          const operation = choices.find((st) => st.op === wanted) || choices[0];
          b = prepareOperation({ current }, operation);
        } else b = prepare({ current }, kind, common(current));
        const start = equation(current), before = equationTex(current), after = equationTex(b.target);
        let middle, caption;
        if (kind === "common") {
          const term = (v) => {
            const f = b.number / v.d;
            return f === 1 ? tex(v) : "\\frac{" + (v.x ? v.n === 1 ? "x" : v.n + "x" : v.n) + "\\cdot " + f + "}{" + v.d + "\\cdot " + f + "}";
          };
          middle = current.lhs.map(term).join(" + ") + " = " + current.rhs.map(term).join(" + ");
          caption = "Noemer " + b.number + ": vermenigvuldig bij elke breuk teller \xE9n noemer met hetzelfde getal.";
        } else if (kind === "clear") {
          const term = (v) => "\\htmlClass{motion-new}{" + b.number + "}\\cdot " + tex(v);
          middle = current.lhs.map(term).join(" + ") + " = " + current.rhs.map(term).join(" + ");
          caption = "De factor " + b.number + " vermenigvuldigt elke term links \xE9n rechts.";
        } else {
          const op = operationTex(b.operation);
          middle = "\\left(" + sideTex(current.lhs) + "\\right) " + op + " = \\left(" + sideTex(current.rhs) + "\\right) " + op;
          caption = "Dezelfde bewerking werkt op het volledige linker \xE9n rechter lid.";
        }
        return { ex: { ...example.ex, start }, total: 1, timeline: [{ tex: before, previous: null, caption: kind === "common" ? "We maken deze losse breuken gelijknamig." : kind === "clear" ? "We werken alle noemers weg." : "We maken x verder vrij.", step: 0, delay: 1500 }, { tex: middle, previous: before, caption, step: 1, delay: 3e3 }, { tex: after, previous: before, caption: kind === "common" ? "De noemers zijn gelijk. De waarde van elke breuk is behouden." : "Reken alle termen uit. De gelijkheid blijft behouden.", step: 1, delay: 2200 }] };
      }
      return Object.freeze({ token, key, tex, sideTex, equationTex, equation, common, sameDenominator, task, init, numberChoices, numberCheck, prepare, operationChoices, operationTex, prepareOperation, palette, validate, solved, commit, prompt, demo, copy });
    });
  }
});

// games/algebra-trainer/learning-core.js
var require_learning_core = __commonJS({
  "games/algebra-trainer/learning-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object" && module.exports) module.exports = factory(require_core(), require_fraction_core());
      else root.AlgebraLearning = factory(root.AlgebraCore, root.AlgebraFractions);
    })(globalThis, (C, F) => {
      "use strict";
      const { R, N, V, Add, Mul, Div, EQ, simplify, applyEquation } = C;
      const goals = { A1: "Maak een factor ongedaan door beide leden te delen.", A2: "Maak een optelling ongedaan op beide leden.", A3: "Maak een aftrekking ongedaan op beide leden.", A4: "Maak een deling ongedaan door beide leden te vermenigvuldigen.", B1: "Plan twee stappen: losse term en factor.", B2: "Plan twee stappen bij een negatieve losse term.", B3: "Behoud het teken van de x-term; deel door de juiste factor.", C1: "Behandel de haakjes als \xE9\xE9n groep.", C2: "Werk een factor met een minteken correct uit.", D1: "Onderscheid de buitenfactor en de factor bij x.", D2: "De noemer deelt de volledige teller.", D3: "Onderscheid de losse term buiten en binnen de groep.", B4: "Onderscheid x gedeeld door a van de losse term.", B5: "Werk een aftrekking buiten de breuk weg.", E1: "Verzamel x-termen met een geldige bewerking op beide leden.", E2: "Kies aan welk lid je de x-termen verzamelt.", E3: "Vergelijk routes naar dezelfde oplossing." };
      function affine(e) {
        if (e.t === "num") return { a: R(0), b: R(e.q.n, e.q.d) };
        if (e.t === "var") return { a: R(1), b: R(0) };
        if (e.t === "add") return e.terms.map(affine).reduce((p, q) => ({ a: p.a.add(q.a), b: p.b.add(q.b) }), { a: R(0), b: R(0) });
        if (e.t === "div") {
          const n = affine(e.n), d = affine(e.d);
          if (!d.a.isZero()) throw Error("De noemer moet hier een getal zijn.");
          return { a: n.a.div(d.b), b: n.b.div(d.b) };
        }
        if (e.t === "mul") return e.factors.map(affine).reduce((p, q) => {
          if (!p.a.isZero() && !q.a.isZero()) throw Error("Gebruik hier een lineaire uitdrukking.");
          return { a: p.a.mul(q.b).add(q.a.mul(p.b)), b: p.b.mul(q.b) };
        }, { a: R(0), b: R(1) });
        throw Error("Onbekende uitdrukking.");
      }
      const fromAffine = (e) => simplify(Add(Mul(N(e.a), V()), N(e.b)));
      function expandEquation(eq) {
        return EQ(fromAffine(affine(eq.l)), fromAffine(affine(eq.r)));
      }
      function parseExpression(text) {
        text = String(text).replace(/[−–]/g, "-").replace(/×|·/g, "*").replace(/÷/g, "/").replace(/,/g, ".").replace(/\s/g, "");
        if (!text || text.length > 140 || /[^0-9x+*/().-]/.test(text)) throw Error("Gebruik x, getallen en + \u2212 \xB7 / ( ).");
        const tokens = text.match(/\d+(?:\.\d+)?|[x+*/().-]/g) || [];
        let i = 0;
        function atom() {
          const t = tokens[i++];
          if (t === "+" || t === "-") return t === "-" ? Mul(N(-1), atom()) : atom();
          if (t === "x") return V();
          if (t === "(") {
            const e2 = sum();
            if (tokens[i++] !== ")") throw Error("Sluit de haakjes.");
            return e2;
          }
          if (/^\d+(?:\.\d+)?$/.test(t || "")) {
            const [n, d = ""] = t.split(".");
            if (n.length + d.length > 7) throw Error("Gebruik kleinere getallen.");
            return N(R(Number(n + d), 10 ** d.length));
          }
          throw Error("Vul een volledige uitdrukking in.");
        }
        function product() {
          let e2 = atom();
          while (i < tokens.length) {
            const t = tokens[i];
            if (t === "*" || t === "/") {
              i++;
              const r = atom();
              e2 = t === "*" ? Mul(e2, r) : Div(e2, r);
            } else if (t === "x" || t === "(" || /^\d/.test(t)) {
              e2 = Mul(e2, atom());
            } else break;
          }
          return e2;
        }
        function sum() {
          let e2 = product();
          while (tokens[i] === "+" || tokens[i] === "-") {
            const op = tokens[i++], r = product();
            e2 = Add(e2, op === "-" ? Mul(N(-1), r) : r);
          }
          return e2;
        }
        const e = sum();
        if (i !== tokens.length) throw Error("Controleer de notatie.");
        affine(e);
        return simplify(e);
      }
      function parseEquation(text) {
        const parts = String(text).split("=");
        if (parts.length !== 2) throw Error("Schrijf beide leden met \xE9\xE9n gelijkteken.");
        return EQ(parseExpression(parts[0]), parseExpression(parts[1]));
      }
      const sameExpr = (a, b) => {
        const p = affine(a), q = affine(b);
        return p.a.eq(q.a) && p.b.eq(q.b);
      };
      const sameEquation = (a, b) => sameExpr(a.l, b.l) && sameExpr(a.r, b.r) || sameExpr(a.l, b.r) && sameExpr(a.r, b.l);
      function evaluate(e, x) {
        x = typeof x === "object" ? R(x.n, x.d) : R(x);
        const q = affine(e);
        return q.a.mul(x).add(q.b);
      }
      function operationText(step, policy) {
        return (step.op === "*" ? "\xB7" : step.op === "/" ? "\xF7" : step.op === "-" ? "\u2212" : "+") + " " + C.fallbackText(C.latexExpr(step.operand, policy));
      }
      function mission(skill, seed = Date.now()) {
        if (!goals[skill]) throw Error("Onbekende halte.");
        const policy = { allowFractions: ["B4", "B5", "D2"].includes(skill), allowDecimals: false, allowNegative: ["B3", "C2", "D3", "E1", "E2", "E3"].includes(skill) };
        const ex = (i) => C.generateSeeded(skill, { ...policy, allowFractions: i === 4 && policy.allowFractions && skill !== "B5", allowDecimals: i === 4 && skill === "B5" }, i, seed + i * 7219 >>> 0);
        const tasks = [0, 1, 2, 3, 4].map((i) => ({ id: seed + ":" + i, kind: "solve", ex: ex(i), stage: ["Ontdekken", "Begeleid", "Zelf produceren", "Zelfstandig", "Toepassen"][i], goal: goals[skill], guided: i < 2 }));
        tasks[0].prompt = "Maak x vrij. Kijk wat jouw bewerking op beide leden doet.";
        const guided = tasks[1], predict = tasks[2], transfer = tasks[4];
        if (["C1", "C2", "D1", "D3"].includes(skill)) {
          guided.kind = "repair";
          guided.expected = expandEquation(guided.ex.start);
          const l = affine(guided.expected.l), group = findGroup(guided.ex.start.l);
          const delta = group ? affine(group.inside).b.mul(R(1).sub(group.factor)) : R(1);
          guided.fault = EQ(fromAffine({ a: l.a, b: l.b.add(delta) }), guided.expected.r);
          guided.location = "group";
          guided.prompt = "Een term in de groep is fout uitgewerkt. Herstel de volledige regel.";
          guided.goal = "De buitenfactor vermenigvuldigt elke term in de groep.";
        } else {
          guided.kind = "routes";
          const st = guided.ex.steps[0], other = { op: st.op === "/" ? "*" : st.op === "*" ? "/" : st.op === "-" ? "+" : "-", operand: st.operand };
          guided.routes = [st, other];
          guided.prompt = "Welke eerste stap maakt de structuur eenvoudiger?";
          guided.goal = "Kies een doelgerichte stap; beide bewerkingen zijn geldig.";
        }
        predict.kind = "predict";
        predict.operation = predict.ex.steps[0];
        predict.expected = applyEquation(predict.ex.start, predict.operation.op, predict.operation.operand);
        predict.prompt = "Bouw de regel na " + operationText(predict.operation, predict.ex.policy) + " op beide leden.";
        predict.goal = "Produceer beide leden van de volgende regel.";
        tasks[3].prompt = "Los op via een geldige route die jij kiest.";
        if (["B1", "B2", "A1", "A2", "A3"].includes(skill)) {
          transfer.kind = "build";
          transfer.x = R(2 + seed % 4);
          transfer.factor = R(2 + Math.floor(seed / 4) % 4);
          transfer.sign = ["B2", "A3"].includes(skill) ? -1 : 1;
          transfer.expectedNumber = R(1 + Math.floor(seed / 16) % 9);
          transfer.rhs = transfer.factor.mul(transfer.x).add(transfer.expectedNumber.mul(R(transfer.sign)));
          transfer.prompt = "Vul het vak zodat x = " + transfer.x.n + " de oplossing is.";
          transfer.display = transfer.factor.n + "x " + (transfer.sign === -1 ? "\u2212" : "+") + " \\square = " + transfer.rhs.n;
          transfer.goal = "Bouw een vergelijking met de gevraagde oplossing.";
        } else if (["C1", "C2", "D1", "D3"].includes(skill)) {
          transfer.kind = "expand";
          transfer.expected = expandEquation(transfer.ex.start);
          transfer.prompt = "Werk de haakjes uit. Bouw de volledige nieuwe regel.";
          transfer.goal = "Voer distributiviteit zelf uit; alleen oplossen is hier onvoldoende.";
        } else {
          transfer.kind = "verify";
          transfer.proposed = transfer.ex.solution.add(R(seed % 2 ? 1 : 0));
          transfer.prompt = "Is deze x-waarde een oplossing? Vul haar in en vergelijk links en rechts.";
          transfer.goal = "Controleer een oplossing door exact in te vullen.";
        }
        if (["E1", "E2", "E3"].includes(skill)) {
          const a = 3 + seed % 4, b = 1 + Math.floor(seed / 4) % (a - 1), left = 1 + Math.floor(seed / 16) % 8, x = R(2 + Math.floor(seed / 128) % 5);
          const start = EQ(Add(Mul(N(a), V()), N(left)), Add(Mul(N(b), V()), N(R(a - b).mul(x).add(R(left)))));
          const steps = [{ op: "-", operand: Mul(N(b), V()) }, { op: "-", operand: N(left) }, { op: "/", operand: N(a - b) }], states = [start];
          for (const st of steps) states.push(applyEquation(states.at(-1), st.op, st.operand));
          guided.ex = { ...guided.ex, start, steps, states, solution: x };
          guided.routes = [{ op: "/", operand: N(a) }, { op: "-", operand: Mul(N(b), V()) }];
          guided.goal = "Kies een eerste stap die breuken vermijdt.";
          guided.prompt = "Welke route houdt alle co\xEBffici\xEBnten geheel?";
          guided.strategy = "integers";
        }
        return { version: 2, skill, seed, index: 0, tasks, results: tasks.map((t) => ({ kind: t.kind, goal: t.goal, done: false, supported: t.guided, errors: 0, hints: 0, input: "", left: "", right: "", choice: "" })), completed: false };
      }
      function validate(task, values) {
        if (task.kind === "fractions") return F.validate(task, values);
        if (["predict", "repair", "expand"].includes(task.kind)) {
          if (task.kind === "repair" && values.location !== task.location) return { ok: false, message: "De fout zit bij het vermenigvuldigen van de volledige groep." };
          const answer = parseEquation(values.input);
          if (!sameEquation(answer, task.expected)) return { ok: false, message: "Controleer elke term en beide leden van deze stap." };
          if (["expand", "repair"].includes(task.kind) && (hasGroup(answer.l) || hasGroup(answer.r))) return { ok: false, message: "Werk de groep uit: vermenigvuldig elke term met de buitenfactor." };
          return { ok: true, message: task.kind === "predict" ? causal(task.ex.start, task.expected, task.operation.op, task.operation.operand) : "Juist. Elke term van de groep is correct vermenigvuldigd." };
        }
        if (task.kind === "routes") {
          if (!/^[01]$/.test(String(values.choice))) return { ok: false, message: "Kies een route." };
          const st = task.routes[Number(values.choice)];
          if (!st) return { ok: false, message: "Kies een route." };
          const after = applyEquation(task.ex.start, st.op, st.operand);
          const integral = (eq) => [...Object.values(affine(eq.l)), ...Object.values(affine(eq.r))].every((q) => q.d === 1);
          const ok = task.strategy === "integers" ? integral(after) : C.equationComplexity(after) < C.equationComplexity(task.ex.start);
          return { ok, valid: true, message: ok ? "Deze geldige stap past bij je doel." : "Dit is een geldige bewerking. Ze past minder goed bij het gevraagde doel." };
        }
        if (task.kind === "build") {
          const q = affine(parseExpression(values.input));
          if (!q.a.isZero()) throw Error("Vul een getal in het vak.");
          const ok = task.factor.mul(task.x).add(q.b.mul(R(task.sign || 1))).eq(task.rhs);
          return { ok, message: ok ? "Juist. Met jouw getal voldoen beide leden aan de gevraagde oplossing." : "Vul de gegeven x-waarde in en bepaal welk getal nog ontbreekt." };
        }
        if (task.kind === "verify") {
          const a = affine(parseExpression(values.left)), b = affine(parseExpression(values.right));
          if (!a.a.isZero() || !b.a.isZero()) throw Error("Bereken de twee getalwaarden.");
          const left = evaluate(task.ex.start.l, task.proposed), right = evaluate(task.ex.start.r, task.proposed);
          const ok = a.b.eq(left) && b.b.eq(right) && values.choice === (left.eq(right) ? "yes" : "no");
          return { ok, message: ok ? left.eq(right) ? "De twee leden zijn gelijk: de oplossing klopt." : "De twee leden verschillen: dit is geen oplossing." : "Vul dezelfde x-waarde in beide leden in en vergelijk de resultaten." };
        }
        return { ok: false, message: "Werk verder tot x vrijstaat." };
      }
      function findGroup(e) {
        if (e.t === "mul") {
          const inside = e.factors.find((f) => f.t === "add");
          if (inside) return { inside, factor: e.factors.filter((f) => f !== inside).map((f) => affine(f).b).reduce((p, q) => p.mul(q), R(1)) };
        }
        if (e.t === "add") return e.terms.map(findGroup).find(Boolean);
        if (e.t === "div") return findGroup(e.n);
        return null;
      }
      function hasGroup(e) {
        return e.t === "mul" && e.factors.some((f) => f.t === "add") || e.t === "add" && e.terms.some(hasGroup) || e.t === "div" && hasGroup(e.n);
      }
      function hint(task, eq, level) {
        if (level < 2) return task.kind === "repair" || task.kind === "expand" ? "De buitenfactor werkt op elke term binnen de haakjes." : task.kind === "predict" ? "Voer de gekozen bewerking uit op links \xE9n rechts." : task.kind === "build" ? "Vul de gegeven x-waarde in. Wat ontbreekt nog?" : task.kind === "verify" ? "Bereken links en rechts afzonderlijk met dezelfde x." : "Bekijk wat bij x staat of waarmee x vermenigvuldigd wordt.";
        if (task.kind === "solve") {
          const q = affine(eq.l), r = affine(eq.r);
          if (!q.a.isZero() && !r.a.isZero()) return "Trek een x-term af van beide leden.";
          const side = !q.a.isZero() ? q : r;
          if (!side.b.isZero()) return "Werk de losse term weg met de inverse bewerking.";
          return "Maak de factor bij x ongedaan.";
        }
        if (task.expected) return "Een correcte regel is " + C.fallbackText(C.latexEq(task.expected, task.ex.policy)) + ".";
        if (task.kind === "routes") return "Kijk of de losse term of een x-term verdwijnt, en of er breuken bijkomen.";
        if (task.kind === "build") return task.factor.n + " \xB7 " + task.x.n + " = " + task.factor.mul(task.x).n + ". Het ontbrekende getal is " + task.expectedNumber.n + ".";
        return "Vervang elke x door " + C.fallbackText(C.ratLatex(task.proposed, task.ex.policy)) + ".";
      }
      function causal(before, after, op, operand) {
        if (C.solvedEquation(after)) return "Juist. x staat vrij.";
        const a = affine(before.l), b = affine(after.l), r = affine(before.r), s = affine(after.r);
        if (!a.b.isZero() && b.b.isZero()) return "De " + (a.b.n > 0 ? "+" : "") + C.fallbackText(C.ratLatex(a.b, {})) + " verdwijnt. Alleen de term met x blijft links.";
        if (!r.b.isZero() && s.b.isZero()) return "De losse term rechts verdwijnt. Dezelfde bewerking is op beide leden uitgevoerd.";
        if (!a.a.isZero() && b.a.isZero() || !r.a.isZero() && s.a.isZero()) return "De x-term verdwijnt aan \xE9\xE9n lid. De gelijkheid blijft behouden.";
        if (hasGroup(before.l) && !hasGroup(after.l)) return "De buitenfactor is weggewerkt. De groep wordt zichtbaar.";
        return "Geldige stap op beide leden. " + (C.equationComplexity(after) > C.equationComplexity(before) ? "De vorm is voorlopig complexer." : "De gelijkheid blijft behouden.");
      }
      return Object.freeze({ goals, affine, parseExpression, parseEquation, sameExpr, sameEquation, evaluate, expandEquation, mission, validate, hint, causal, operationText });
    });
  }
});

// games/algebra-trainer/world-core.js
var require_world_core = __commonJS({
  "games/algebra-trainer/world-core.js"(exports, module) {
    (function(root, factory) {
      const api = factory();
      if (typeof module === "object" && module.exports) module.exports = api;
      else root.AlgebraWorld = api;
    })(typeof window === "object" ? window : globalThis, () => {
      "use strict";
      const worlds = [
        { id: "balance", title: "Balansbaai", subject: "E\xE9n bewerking", description: "Ontdek hoe je x alleen laat staan.", icon: "\u2696", color: "blue", requires: [], engine: "equations", topics: [["A2", "Optelling wegwerken", "x + 4 = 9"], ["A3", "Aftrekking wegwerken", "x \u2212 3 = 5"], ["A1", "Een factor wegwerken", "3x = 12"], ["A4", "Een deling wegwerken", "x / 2 = 6"]] },
        { id: "steps", title: "Vergelijkingenstad", subject: "Twee stappen plannen", description: "Kies een volgorde en voorspel wat er overblijft.", icon: "\u25A5", color: "orange", requires: ["eq-A4"], engine: "equations", topics: [["B1", "Eerst de losse term", "3x + 6 = 18"], ["B2", "Een aftrekking ongedaan maken", "3x \u2212 2 = 10"]] },
        { id: "signs", title: "Tekenatelier", subject: "Tekens begrijpen", description: "Behoud mintekens bij termen en factoren.", icon: "\u2212", color: "purple", requires: ["eq-B2"], engine: "equations", topics: [["B3", "Een negatieve x-term", "10 \u2212 2x = 4"]] },
        { id: "brackets", title: "Haakjeswerkplaats", subject: "Haakjes en groepen", description: "Herken een groep; deel of werk distributief uit.", icon: "( )", color: "purple", requires: ["eq-B3"], engine: "equations", topics: [["C1", "Een volledige groep delen", "2(x + 3) = 14"], ["C2", "Uitwerken met een minteken", "3(x \u2212 2) = 12"], ["D1", "Een factor binnen de groep", "2(3x + 1) = 14"], ["D3", "Binnen en buiten de groep", "2(3x \u2212 1) + 4 = 14"]] },
        { id: "fractions", title: "Breukenbrug", subject: "Breuken en delingsstructuur", description: "Zie welke termen door de noemer gedeeld worden.", icon: "\xBD", color: "teal", requires: ["eq-D3"], engine: "equations", topics: [["B4", "Alleen x in de breuk", "x / 2 + 3 = 7"], ["B5", "Een breuk en een aftrekking", "x / 3 \u2212 2 = 4"], ["D2", "Een volledige teller delen", "(2x + 4) / 3 = 6"]] },
        { id: "both", title: "Overkant", subject: "x aan beide leden", description: "Verzamel x-termen en vergelijk geldige routes.", icon: "\u21C4", color: "teal", requires: ["eq-D2"], engine: "equations", topics: [["E3", "Een losse term rechts", "3x = x + 8"], ["E2", "Een losse term links", "3x \u2212 4 = x"], ["E1", "Routes vergelijken", "4x + 6 = 2x + 10"]] },
        { id: "powers", title: "Machtenberg", subject: "Machten & letters", description: "Bouw verder met exponenten en eentermen.", icon: "x\xB2", color: "green", requires: [], engine: "operations", topics: [["power-power", "Macht van een macht", "(x\xB2)\xB3"], ["power-product", "Machten vermenigvuldigen", "x\xB2 \xB7 x\xB3"], ["power-quotient", "Machten delen", "x\u2075 / x\xB2"], ["power-monomial", "Macht van een eenterm", "(2x\xB2)\xB3"], ["power-negative", "Negatieve machten", "x\u207B\xB2"], ["power-mixed", "Machten combineren", "x\xB3 \xB7 x\xB2 / x"]] },
        { id: "roots", title: "Wortelwoud", subject: "Vierkantswortels", description: "Vind kwadraten en vereenvoudig wortels.", icon: "\u221A", color: "teal", requires: [], engine: "operations", topics: [["square-factor", "Een kwadraatfactor vinden", "12 = 4 \xB7 3"], ["root-simplify", "Een wortel vereenvoudigen", "\u221A12"], ["root-product", "Wortels vermenigvuldigen", "\u221A2 \xB7 \u221A8"], ["root-quotient", "Wortels delen", "\u221A18 / \u221A2"], ["root-fraction", "Wortel van een breuk", "\u221A(9 / 16)"], ["root-power", "Wortels en machten", "\u221A(3\xB2)"], ["root-letters", "Wortels met letters", "\u221A(x\u2074)"], ["root-sum", "Gelijke wortels optellen", "2\u221A3 + 4\u221A3"], ["root-sum-mixed", "Vereenvoudigen en optellen", "\u221A12 + \u221A27"]] },
        { id: "scientific", title: "Getallensterren", subject: "Wetenschappelijke schrijfwijze", description: "Schrijf heel grote en heel kleine getallen korter.", icon: "10\u207F", color: "purple", requires: [], engine: "operations", topics: [["scientific", "Schrijven met machten van tien", "3500 = 3,5 \xB7 10\xB3"]] },
        { id: "systems", title: "Kruispunt", subject: "Stelsels", description: "Onderzoek twee vergelijkingen tegelijk.", icon: "\u2573", color: "orange", requires: ["eq-E1"], engine: "systems", topics: [["graphic", "Grafisch oplossen", "Twee rechten, \xE9\xE9n gezamenlijk punt"], ["substitution", "Substitutie", "Maak vrij en vul in"], ["combination", "Combinatie", "Maak \xE9\xE9n onbekende weg"], ["unique", "E\xE9n oplossing", "Twee rechten kruisen elkaar"], ["none", "Geen oplossing", "Twee evenwijdige rechten"], ["infinite", "Oneindig veel oplossingen", "Twee keer dezelfde rechte"]] }
      ].map((w) => ({ ...w, topics: w.topics.map(([skill, title, example], index) => ({ id: (w.engine === "equations" ? "eq-" : w.engine === "operations" ? "op-" : "sys-") + skill, skill, title, example, world: w.id, engine: w.engine, requires: index ? [(w.engine === "equations" ? "eq-" : w.engine === "operations" ? "op-" : "sys-") + w.topics[index - 1][0]] : w.requires })) }));
      worlds.find((w) => w.id === "systems").topics.find((t) => t.id === "sys-unique").requires = ["eq-E1"];
      const topics = worlds.flatMap((w) => w.topics), GOAL = 3, REWARD = 30;
      const topic = (id) => topics.find((t) => t.id === id), world = (id) => worlds.find((w) => w.id === id);
      function normalize(raw) {
        const out = { topics: {} };
        for (const t of topics) {
          const r = raw?.topics?.[t.id];
          if (!r) continue;
          const answers = [...new Set((Array.isArray(r.answers) ? r.answers : []).filter((s) => typeof s === "string" && s.length <= 1e3))].slice(0, GOAL);
          const evidence = Array.isArray(r.evidence) ? r.evidence.slice(0, 5).map((e) => ({ kind: String(e.kind || "solve"), goal: String(e.goal || "").slice(0, 180), supported: !!e.supported, errors: Math.max(0, Number(e.errors) || 0), done: e.done === true })) : [];
          const finished = evidence.length === 5 && evidence.every((e) => e.done);
          const rewarded = (answers.length === GOAL || finished) && r.rewarded === true;
          out.topics[t.id] = { answers, rewarded, xp: rewarded ? REWARD : 0, ...evidence.length ? { evidence, finished } : {} };
        }
        return out;
      }
      function merge(...records) {
        const out = { topics: {} };
        for (const raw of records) Object.assign(out.topics, normalize(raw).topics);
        return out;
      }
      function complete(progress, id, legacy = []) {
        const r = normalize(progress).topics[id];
        return !!r?.finished || r?.answers.length === GOAL || legacy.includes(id);
      }
      function unlocked(progress, id, legacy = []) {
        return !!topic(id);
      }
      function record(progress, id, answer, legacy = []) {
        const next = normalize(progress), t = topic(id);
        if (!t || !unlocked(next, id, legacy) || typeof answer !== "string" || !answer || answer.length > 1e3) return { progress: next, xp: 0 };
        const r = next.topics[id] || (next.topics[id] = { answers: [], rewarded: false, xp: 0 });
        if (!r.answers.includes(answer) && r.answers.length < GOAL) r.answers.push(answer);
        let xp2 = 0;
        if (r.answers.length === GOAL && !r.rewarded) {
          r.rewarded = true;
          r.xp = REWARD;
          xp2 = REWARD;
        }
        return { progress: next, xp: xp2 };
      }
      function recordMission(progress, id, evidence, legacy = []) {
        const next = normalize(progress), t = topic(id);
        if (!t || !unlocked(next, id, legacy) || !Array.isArray(evidence) || evidence.length !== 5 || evidence.some((e) => !e.done)) return { progress: next, xp: 0 };
        const old = next.topics[id] || { answers: [], rewarded: false, xp: 0 };
        next.topics[id] = { ...old, evidence, finished: true, rewarded: true, xp: REWARD };
        return { progress: normalize(next), xp: old.rewarded ? 0 : REWARD };
      }
      function platformProgress(progress) {
        const p = normalize(progress), tracked = topics.filter((t) => t.engine !== "operations");
        return { completed: tracked.filter((t) => p.topics[t.id]?.finished).map((t) => t.id), total: tracked.length };
      }
      function xp(progress) {
        return Object.values(normalize(progress).topics).filter((t) => t.rewarded).length * REWARD;
      }
      return Object.freeze({ worlds, topics, topic, world, normalize, merge, complete, unlocked, record, recordMission, platformProgress, xp, GOAL, REWARD });
    });
  }
});

// games/algebra-trainer/journey-core.js
var require_journey_core = __commonJS({
  "games/algebra-trainer/journey-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object" && module.exports) module.exports = factory(require_core(), require_learning_core(), require_world_core(), require_fraction_core());
      else root.AlgebraJourney = factory(root.AlgebraCore, root.AlgebraLearning, root.AlgebraWorld, root.AlgebraFractions);
    })(globalThis, (C, L, W, F) => {
      "use strict";
      const stops = [
        { id: "route-inverse", title: "E\xE9n bewerking", short: "E\xE9n bewerking", skills: ["A2", "A3", "A1", "A4"], example: "x + 4 = 9", goal: "Maak optellen, aftrekken, vermenigvuldigen en delen ongedaan.", recipe: [["A2", 0], ["A3", 2], ["A1", 3], ["A4", 3], ["A2", "verify"], ["A3", 4]] },
        { id: "route-two", title: "Twee stappen", short: "Twee stappen", skills: ["B1", "B2"], example: "3x + 6 = 18", goal: "Werk de losse term weg en maak daarna de factor ongedaan.", recipe: [["B1", 0], ["B2", 1], ["B1", 2], ["B2", 3], ["B1", 3], ["B2", 4]] },
        { id: "route-sign", title: "Negatieve x-term", short: "Negatieve x-term", skills: ["B3"], example: "10 \u2212 2x = 4", goal: "Behoud het minteken en deel door de juiste factor.", recipe: [["B3", 0], ["B3", 1], ["B3", 2], ["B3", 3], ["B3", 3], ["B3", 4]] },
        { id: "route-both", title: "x aan beide leden", short: "Beide leden", skills: ["E3", "E2"], example: "3x = x + 8", goal: "Verzamel de x-termen aan het lid dat jij kiest.", recipe: [["E3", 0], ["E2", 1], ["E3", 2], ["E2", 3], ["E3", 3], ["E2", 4]] },
        { id: "route-brackets", title: "Haakjes", short: "Haakjes", skills: ["C1", "C2", "D1", "D3"], example: "2(3x \u2212 1) + 4 = 14", goal: "Herken de groep en houd rekening met elke term binnen en buiten de haakjes.", recipe: [["C1", 0], ["C2", 1], ["D1", 2], ["D3", 3], ["D1", 3], ["C2", 4]] },
        { id: "route-fractions", title: "Breuken", short: "Breuken", skills: ["B4", "B5", "D2"], example: "x / 3 + 1 / 2 = 5 / 6", goal: "Maak losse breuken gelijknamig of werk alle noemers weg.", recipe: [["B4", 0], ["B5", 1], ["D2", 2], ["B4", 3], ["D2", 3], ["B5", 4]] },
        { id: "route-check", title: "Routes en controle", short: "Routes & controle", skills: ["E1"], example: "4x + 6 = 2x + 10", goal: "Kies een doelgerichte route en controleer de oplossing in beide leden.", recipe: [["E1", 0], ["E1", 1], ["E1", 2], ["E1", 3], ["E1", "verify"], ["E1", "verify"]] }
      ];
      const systems = W.world("systems").topics;
      const worlds = [
        { id: "letters", title: "Letters begrijpen", scene: "letters", ready: false, goal: "Van een letter als onbekende naar een uitdrukking met betekenis." },
        { id: "expressions", title: "Rekenen met letters", scene: "expressions", ready: false, goal: "Gelijksoortige termen, distributiviteit, machten en wortels." },
        { id: "equations", title: "Vergelijkingen", scene: "equations", ready: true, stops, goal: "Maak x vrij. Kies, schrijf, los op en controleer." },
        { id: "formulas", title: "Formules", scene: "formulas", ready: false, goal: "Vul waarden in en vorm een formule om." },
        { id: "systems", title: "Stelsels", scene: "systems", ready: true, stops: systems, goal: "Twee vergelijkingen, \xE9\xE9n gezamenlijke oplossing." }
      ];
      const stop = (id) => stops.find((s) => s.id === id), world = (id) => worlds.find((w) => w.id === id);
      function worldFor(id) {
        if (world(id)) return id;
        const old = W.world(id) || W.world(W.topic(id)?.world);
        return old?.engine === "systems" ? "systems" : "equations";
      }
      function mission(id, seed = Date.now(), options = {}) {
        const s = stop(id);
        if (!s) throw Error("Onbekende halte.");
        const tasks = s.recipe.map(([skill, index], i) => {
          const sub = L.mission(skill, seed + i * 104729 >>> 0);
          const t = { ...s.id === "route-fractions" && i === 0 ? F.task(seed, options.intro) : sub.tasks[index === "verify" ? 4 : index], id: id + ":" + seed + ":" + i };
          if (index === "verify") {
            t.kind = "verify";
            t.proposed = t.ex.solution.add(C.R(i === 4 ? seed & 1 : 1 - (seed & 1)));
            delete t.display;
            t.prompt = "Is deze x-waarde een oplossing? Vul haar in en vergelijk links en rechts.";
            t.goal = "Controleer een oplossing door exact in te vullen.";
          }
          t.guided = i < 2;
          t.stage = i < 2 ? i ? "Begeleid oefenen" : "Ontdek" : { predict: "Bouw zelf", solve: "Los zelf op", verify: "Test een x-waarde", build: "Bouw zelf", expand: "Werk zelf uit", repair: "Herstel zelf", routes: "Kies je route", fractions: "Kies je aanpak" }[t.kind];
          if (s.id === "route-fractions" && i === 4) {
            t.ex = C.generateSeeded("D2", { allowFractions: true, allowDecimals: false, allowNegative: false }, i, seed + i * 104729 >>> 0);
          }
          if (t.kind === "solve") {
            const states = [t.ex.start], steps = [];
            for (const st of t.ex.steps) {
              if (C.solvedEquation(states.at(-1))) break;
              const after = C.applyEquation(states.at(-1), st.op, st.operand);
              if (C.eqSig(after) !== C.eqSig(states.at(-1))) {
                steps.push(st);
                states.push(after);
              }
            }
            t.ex = { ...t.ex, steps, states };
          }
          return t;
        });
        return { version: 2, routeVersion: id === "route-fractions" ? 2 : 1, skill: id, seed, index: 0, tasks, results: tasks.map((t) => ({ kind: t.kind, goal: t.goal, done: false, supported: t.guided, errors: 0, hints: 0, input: "", left: "", right: "", choice: "" })), completed: false, work: {} };
      }
      function questionSignature(t) {
        return t.display || C.eqSig(t.ex.start);
      }
      function freshMission(id, previous, seed = Date.now()) {
        const route = stop(id), topic = W.topic(id);
        if (!route && (!topic || topic.engine !== "equations")) throw Error("Onbekende halte.");
        const old = new Set((previous?.tasks || []).map(questionSignature));
        for (let i = 0; i < 256; i++) {
          const nextSeed = seed + i * 104729 >>> 0, run = route ? mission(id, nextSeed, { intro: !previous }) : L.mission(topic.skill, nextSeed);
          const questions = run.tasks.map(questionSignature);
          if (new Set(questions).size === questions.length && questions.every((q) => !old.has(q))) return run;
        }
        throw Error("Er kon geen nieuwe reeks worden gemaakt. Probeer opnieuw.");
      }
      const cleanEvidence = (e) => ({ kind: String(e.kind || "solve"), goal: String(e.goal || "").slice(0, 180), done: e.done === true, supported: !!e.supported, errors: Math.max(0, Number(e.errors) || 0), hints: Math.max(0, Number(e.hints) || 0) });
      function normalize(raw) {
        const out = { version: 1, stops: {}, roundRewards: {} };
        for (const [key, r] of Object.entries(raw?.roundRewards || {})) {
          if (key.length > 500 || !r || !(stop(r.level) || W.topic(r.level)) || ![0, 30].includes(r.xp)) continue;
          out.roundRewards[key] = { level: r.level, xp: r.xp };
        }
        for (const s of stops) {
          const r = raw?.stops?.[s.id];
          if (!r) continue;
          const evidence = Array.isArray(r.evidence) ? r.evidence.slice(0, 6).map(cleanEvidence) : [];
          const finished = evidence.length === 6 && evidence.every((e) => e.done);
          out.stops[s.id] = { evidence, finished, independent: finished && (r.independent === true || independently(evidence)), rewarded: finished && r.rewarded === true, xp: finished && r.rewarded === true && r.xp === 30 ? 30 : 0 };
        }
        return out;
      }
      function independently(evidence) {
        return evidence.filter((r) => r.done && !r.supported && !r.errors && !r.hints).length >= 3 && evidence.some((r) => r.kind === "solve" && r.done && !r.supported && !r.errors && !r.hints);
      }
      function info(progress, id, runs = {}, oldJourney = null, oldSolved = []) {
        const s = stop(id), p = normalize(progress).stops[id];
        if (!s) return null;
        const old = W.normalize(oldJourney), legacy = s.skills.every((k) => old.topics["eq-" + k]?.finished === true);
        const earlier = s.skills.some((k) => oldSolved.includes(k) || W.complete(old, "eq-" + k));
        const oldId = s.skills.map((k) => "eq-" + k).find((k) => runs[k] && !runs[k].completed);
        const activeId = runs[id] && !runs[id].completed ? id : oldId || id, run = runs[activeId], started = !!run && !run.completed, done = run?.results?.filter((r) => r.done).length || 0;
        const finished = !!p?.finished || legacy, independent = !!p?.independent;
        return { finished, independent, started, done, earlier, activeId, total: run?.tasks?.length || 6, status: started ? "Bezig" : independent ? "Zelfstandig gelukt" : finished ? "Geoefend" : earlier ? "Eerder geoefend" : "Nog te oefenen" };
      }
      function record(progress, id, evidence, oldJourney) {
        const next2 = normalize(progress), s = stop(id);
        if (!s || !Array.isArray(evidence) || evidence.length !== 6 || evidence.some((r) => !r.done)) return { progress: next2, xp: 0 };
        const prev = next2.stops[id], old = W.normalize(oldJourney), already = !!prev?.rewarded || s.skills.some((k) => old.topics["eq-" + k]?.rewarded);
        const independent = independently(evidence) || !!prev?.independent;
        next2.stops[id] = { evidence: evidence.map(cleanEvidence), finished: true, independent, rewarded: true, xp: prev?.rewarded ? prev.xp : already ? 0 : 30 };
        return { progress: next2, xp: already ? 0 : 30 };
      }
      function rewardRound(progress, id, run, evidence, baseXP = 0) {
        const next2 = normalize(progress), level = stop(id) || W.topic(id);
        if (!level) return { progress: next2, xp: 0 };
        const expected = stop(id) ? 6 : 5;
        if (!run?.completed || !Array.isArray(evidence) || evidence.length !== expected || evidence.some((r) => !r.done)) return { progress: next2, xp: 0 };
        const key = run.rewardId || id + ":" + (run.seed ?? (run.exercises || []).map((e) => e.id).join(":"));
        if (!key || Object.hasOwn(next2.roundRewards, key)) return { progress: next2, xp: 0 };
        const extra = 30 - Math.min(30, Math.max(0, Number(baseXP) || 0));
        next2.roundRewards[key] = { level: id, xp: extra };
        return { progress: next2, xp: 30 };
      }
      function xp(progress) {
        const p = normalize(progress);
        return Object.values(p.stops).reduce((n, s) => n + s.xp, 0) + Object.values(p.roundRewards).reduce((n, s) => n + s.xp, 0);
      }
      function platform(progress, oldJourney, systemsJourney) {
        const completed = stops.filter((s) => info(progress, s.id, {}, oldJourney).finished).map((s) => s.id);
        const sys = W.normalize(systemsJourney);
        for (const s of systems) if (sys.topics[s.id]?.finished) completed.push(s.id);
        return { completed, total: stops.length + systems.length };
      }
      function next(progress, runs, oldJourney, oldSolved = []) {
        return stops.find((s) => !info(progress, s.id, runs, oldJourney, oldSolved).finished) || stops.find((s) => !info(progress, s.id, runs, oldJourney, oldSolved).independent) || null;
      }
      return Object.freeze({ stops, worlds, stop, world, worldFor, mission, freshMission, questionSignature, normalize, info, record, rewardRound, xp, platform, next, independently });
    });
  }
});

// games/algebra-trainer/battle-config.js
var require_battle_config = __commonJS({
  "games/algebra-trainer/battle-config.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_core(), require_core2(), require_journey_core());
      else root.BattleGame = factory(root.AlgebraCore, root.StelselsCore, root.AlgebraJourney);
    })(globalThis, (C, S, J) => {
      const skills = [...C.TYPES.map((t) => ({ id: t.id, label: t.label, level: t.level, description: t.desc, topicId: "equations" })), { id: "S1", label: "Eenvoudige stelsels", level: "systems", topicId: "systems", description: "Twee vergelijkingen met x en y. E\xE9n oplossing in gehele getallen." }];
      const worlds = [{ id: "equations", name: "Vergelijkingen", topicId: "equations", skills: C.TYPES.map((t) => t.id) }, { id: "systems", name: "Stelsels", topicId: "systems", skills: ["S1"] }];
      const presets = (J?.stops || []).map((t) => ({ id: t.id, label: t.title, skills: [...t.skills] }));
      function generate(s) {
        if (!skills.some((t) => t.id === s.skill) || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 4294967295 || !Number.isInteger(s.variant) || s.variant < 0 || s.variant > 3) throw Error("Ongeldige algebra-opgave");
        if (s.skill === "S1") return { ...S.generate(s.seed + Math.imul(s.variant, 2654435769) >>> 0, "beginner", "unique"), topic: "systems", skill: "S1", generatorVersion: 1 };
        return C.generateSeeded(s.skill, { allowFractions: s.fractions === true, allowDecimals: s.decimals === true, allowNegative: s.negative === true }, s.variant, s.seed);
      }
      function parse(value) {
        if (typeof value !== "string" || value.length > 40) return null;
        const s = value.trim().replace("\u2212", "-").replace(",", ".");
        if (!/^[+-]?\d+(?:\.\d{1,6})?(?:\s*\/\s*[+-]?\d+(?:\.\d{1,6})?)?$/.test(s)) return null;
        const decimal = (x) => {
          const [a, b = ""] = x.trim().split(".");
          return new C.Rat(Number(a + b), 10 ** b.length);
        };
        try {
          const [n, d] = s.split("/");
          return d === void 0 ? decimal(n) : decimal(n).div(decimal(d));
        } catch {
          return null;
        }
      }
      function validate(task, answer) {
        if (task.topic === "systems") {
          const x = parse(answer?.x), y = parse(answer?.y);
          return { ok: !!x && !!y && task.solution.kind === "unique" && x.eq(task.solution.x) && y.eq(task.solution.y) };
        }
        const q = parse(answer?.value);
        return { ok: !!q && q.eq(task.solution) };
      }
      return Object.freeze({ id: "algebra", title: "Algebrawereld", rpc: "axioma_game_class", classFunction: "algebra-class", classReview: true, multiSelect: true, playerURL: "battle-player.html", skills, worlds, presets, mixedSkills: skills.map((s) => s.id), generate, parse, validate });
    });
  }
});

// shared/multiplayer/algebra-class-policy.cjs
var require_algebra_class_policy = __commonJS({
  "shared/multiplayer/algebra-class-policy.cjs"(exports, module) {
    var Game = require_battle_config();
    module.exports = { grade(spec, answer) {
      try {
        return Game.validate(Game.generate(spec), answer).ok;
      } catch {
        return false;
      }
    } };
  }
});
export default require_algebra_class_policy();
