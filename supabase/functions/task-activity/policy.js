var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// games/bewerkingen-trainer/core.js
var require_core = __commonJS({
  "games/bewerkingen-trainer/core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory();
      else root.BewerkingenCore = factory();
    })(globalThis, () => {
      "use strict";
      const letters = ["a", "b", "c", "x", "y"];
      const gcd = (a, b) => {
        a = a < 0n ? -a : a;
        while (b) {
          [a, b] = [b, a % b];
        }
        return a;
      };
      function q(n, d = 1n) {
        n = BigInt(n);
        d = BigInt(d);
        if (!d) throw Error("Delen door nul kan niet.");
        if (d < 0n) {
          n = -n;
          d = -d;
        }
        const g = gcd(n, d);
        return { n: n / g, d: d / g };
      }
      const plus = (a, b) => q(a.n * b.d + b.n * a.d, a.d * b.d), times = (a, b) => q(a.n * b.n, a.d * b.d), inv = (a) => q(a.d, a.n);
      function powq(a, k) {
        return k < 0 ? powq(inv(a), -k) : q(a.n ** BigInt(k), a.d ** BigInt(k));
      }
      function factor(n) {
        if (n < 0n || n > 10000000000n) throw Error("Deze wortel is te groot of niet re\xEBel.");
        if (n === 0n) return [0n, 1n];
        let outer = 1n, inner = 1n;
        for (let p = 2n; p * p <= n; p++) {
          let k = 0;
          while (n % p === 0n) {
            n /= p;
            k++;
          }
          outer *= p ** BigInt(Math.floor(k / 2));
          if (k % 2) inner *= p;
        }
        return [outer, inner * n];
      }
      const key = (r = 1n, e = [0, 0, 0, 0, 0]) => r + ":" + e.join(",");
      function term(c = q(1), r = 1n, e = [0, 0, 0, 0, 0]) {
        return new Map(c.n ? [[key(r, e), c]] : []);
      }
      function unpack(k) {
        const [r, e] = k.split(":");
        return { r: BigInt(r), e: e.split(",").map(Number) };
      }
      function add(a, b, sign = 1) {
        const out = new Map(a);
        for (const [k, c] of b) {
          const v = plus(out.get(k) || q(0), times(c, q(sign)));
          if (v.n) out.set(k, v);
          else out.delete(k);
        }
        if (out.size > 20) throw Error("Houd het antwoord kort.");
        return out;
      }
      function mul(a, b) {
        let out = /* @__PURE__ */ new Map();
        for (const [k, c] of a) for (const [l, d] of b) {
          const u = unpack(k), v = unpack(l), g = gcd(u.r, v.r);
          out = add(out, term(times(times(c, d), q(g)), u.r / g * (v.r / g), u.e.map((x, i) => x + v.e[i])));
        }
        return out;
      }
      function invert(a) {
        if (a.size !== 1) throw Error("Gebruik \xE9\xE9n term in de noemer.");
        const [k, c] = [...a][0], { r, e } = unpack(k);
        return term(times(inv(c), q(1, r)), r, e.map((x) => -x));
      }
      function power(a, n) {
        if (!Number.isInteger(n) || Math.abs(n) > 60) throw Error("Gebruik een gehele exponent van \u221260 tot 60.");
        if (n < 0) return power(invert(a), -n);
        let out = term();
        for (let i = 0; i < n; i++) out = mul(out, a);
        return out;
      }
      function root(a) {
        if (!a.size) return /* @__PURE__ */ new Map();
        if (a.size !== 1) throw Error("Gebruik \xE9\xE9n term onder de wortel.");
        const [k, c] = [...a][0], { r, e } = unpack(k);
        if (r !== 1n || e.some((x) => x % 2) || c.n < 0n) throw Error("Deze wortelvorm wordt hier niet gebruikt.");
        const [o, s] = factor(c.n * c.d);
        return term(q(o, c.d), s, e.map((x) => x / 2));
      }
      function normalize(s) {
        return String(s).trim().replace(/[−–]/g, "-").replace(/[×·⋅]/g, "*").replace(/:/g, "/").replace(/,/g, ".").replace(/\s+/g, "").replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/g, (v) => "^(" + [...v].map((c) => "\u2070\xB9\xB2\xB3\u2074\u2075\u2076\u2077\u2078\u2079\u207B".indexOf(c) === 10 ? "-" : String("\u2070\xB9\xB2\xB3\u2074\u2075\u2076\u2077\u2078\u2079".indexOf(c))).join("") + ")");
      }
      function parse(input) {
        const s = normalize(input);
        if (!s || s.length > 180) throw Error("Vul een kort antwoord in.");
        let i = 0, nodes = 0;
        function node(type, value, args = []) {
          if (++nodes > 80) throw Error("Houd het antwoord kort.");
          return { type, value, args };
        }
        function sum() {
          let a = product();
          while (s[i] === "+" || s[i] === "-") {
            const op = s[i++], b = product();
            a = node(op, add(a.value, b.value, op === "+" ? 1 : -1), [a, b]);
          }
          return a;
        }
        function product() {
          let a = unary();
          while (i < s.length) {
            const op = s[i];
            if (op === "*" || op === "/") {
              i++;
              const b = unary();
              a = node(op, op === "*" ? mul(a.value, b.value) : mul(a.value, invert(b.value)), [a, b]);
            } else if (/[a-z0-9(√]/.test(op)) {
              const b = unary();
              a = node("*", mul(a.value, b.value), [a, b]);
            } else break;
          }
          return a;
        }
        function unary() {
          if (s[i] === "+" || s[i] === "-") {
            const op = s[i++], a = unary();
            return node("sign", op === "-" ? mul(term(q(-1)), a.value) : a.value, [a]);
          }
          return powered();
        }
        function powered() {
          let a = atom();
          if (s[i] === "^") {
            i++;
            const paren = s[i] === "(";
            if (paren) i++;
            const hit = s.slice(i).match(/^[+-]?\d{1,2}/);
            if (!hit) throw Error("Schrijf de exponent als een geheel getal.");
            i += hit[0].length;
            if (paren && s[i++] !== ")") throw Error("Sluit de exponent met ).");
            a = node("^", power(a.value, Number(hit[0])), [a]);
            a.exponent = Number(hit[0]);
          }
          return a;
        }
        function atom() {
          if (s.startsWith("sqrt", i) || s[i] === "\u221A") {
            i += s[i] === "\u221A" ? 1 : 4;
            let a;
            if (s[i] === "(") {
              i++;
              a = sum();
              if (s[i++] !== ")") throw Error("Sluit de wortel met ).");
            } else a = powered();
            return node("root", root(a.value), [a]);
          }
          if (s[i] === "(") {
            i++;
            const a = sum();
            if (s[i++] !== ")") throw Error("Sluit de haakjes met ).");
            return a;
          }
          const hit = s.slice(i).match(/^\d+(?:\.\d+)?/);
          if (hit) {
            i += hit[0].length;
            const [a, b = ""] = hit[0].split(".");
            if ((a + b).length > 28) throw Error("Getal te lang.");
            return node("number", term(q(a + b, 10n ** BigInt(b.length))));
          }
          const at = letters.indexOf(s[i]);
          if (at >= 0) {
            i++;
            const e = [0, 0, 0, 0, 0];
            e[at] = 2;
            const a = node("letter", term(q(1), 1n, e));
            a.letter = letters[at];
            return a;
          }
          throw Error("Gebruik getallen, a, b, c, x, y, machten, breuken en sqrt(...).");
        }
        const ast = sum();
        if (i !== s.length) throw Error("Controleer je notatie bij " + s.slice(i) + ".");
        return ast;
      }
      function signature(poly) {
        return [...poly].sort(([a], [b]) => a.localeCompare(b)).map(([k, c]) => k + "=" + c.n + "/" + c.d).join(";");
      }
      function cost(ast) {
        return 1 + ast.args.reduce((n, a) => n + cost(a), 0);
      }
      function reduced(ast) {
        if (ast.type === "root") {
          if (ast.value.size !== 1) return false;
          const [k, c] = [...ast.value][0], { r, e } = unpack(k);
          if (c.n !== 1n || c.d !== 1n || e.some((v) => v !== 0 && v !== 1) || r === 1n && e.every((v) => v === 0)) return false;
        }
        if (ast.type === "^" && ast.exponent < 0) return false;
        if (ast.type === "/" && ast.args.every((a) => a.type === "number")) {
          const a = [...ast.args[0].value.values()][0] || q(0), b = [...ast.args[1].value.values()][0];
          if (a.d === 1n && b.d === 1n && gcd(a.n, b.n) > 1n) return false;
        }
        return ast.args.every(reduced);
      }
      function plain(poly) {
        if (!poly.size) return "0";
        return [...poly].sort(([a], [b]) => a.localeCompare(b)).map(([k, c], index) => {
          const { r, e } = unpack(k), negative = c.n < 0n, abs = q(negative ? -c.n : c.n, c.d);
          let num = "", den = "", inside = "";
          for (let j = 0; j < e.length; j++) {
            const p = e[j], whole = Math.floor(p / 2), rem = p - 2 * whole;
            if (whole > 0) num += letters[j] + (whole === 1 ? "" : `^${whole}`);
            if (whole < 0) den += letters[j] + (whole === -1 ? "" : `^${-whole}`);
            if (rem) inside += letters[j];
          }
          if (r !== 1n) inside = r + inside;
          if (inside) num += `sqrt(${inside})`;
          if (abs.n !== 1n || !num) num = abs.n + num;
          if (abs.d !== 1n) den = abs.d + den;
          const body = den ? `${num}/(${den})` : num;
          return (negative ? "-" : index ? "+" : "") + body;
        }).join("");
      }
      function tex(input) {
        const s = normalize(input);
        let i = 0;
        function sum() {
          let a = product();
          while (s[i] === "+" || s[i] === "-") {
            const op = s[i++];
            a += ` ${op} ` + product();
          }
          return a;
        }
        function product() {
          let a = unary();
          while (i < s.length) {
            const op = s[i];
            if (op === "*" || op === "/") {
              i++;
              const b = unary();
              a = op === "/" ? `\\frac{${a}}{${b}}` : a + " \\cdot " + b;
            } else if (/[a-z0-9(√]/.test(op)) a += "\\," + unary();
            else break;
          }
          return a;
        }
        function unary() {
          if (s[i] === "+" || s[i] === "-") return s[i++] + unary();
          return powered();
        }
        function powered() {
          let a = atom();
          if (s[i] === "^") {
            i++;
            let exponent;
            if (s[i] === "(") {
              i++;
              const start = i;
              while (i < s.length && s[i] !== ")") i++;
              exponent = s.slice(start, i);
              i++;
            } else {
              const m = s.slice(i).match(/^[+-]?\d+/);
              if (!m) throw Error("Exponent");
              exponent = m[0];
              i += m[0].length;
            }
            a += `^{${exponent}}`;
          }
          return a;
        }
        function atom() {
          if (s.startsWith("sqrt", i) || s[i] === "\u221A") {
            i += s[i] === "\u221A" ? 1 : 4;
            let a;
            if (s[i] === "(") {
              i++;
              a = sum();
              i++;
            } else a = powered();
            return `\\sqrt{${a}}`;
          }
          if (s[i] === "(") {
            i++;
            const a = sum();
            i++;
            return `\\left(${a}\\right)`;
          }
          const m = s.slice(i).match(/^\d+(?:\.\d+)?|^[abcxy]/);
          if (!m) throw Error("Notatie");
          i += m[0].length;
          return m[0].replace(".", "{,}");
        }
        const out = sum();
        if (i !== s.length) throw Error("Notatie");
        return out;
      }
      const SKILLS = [
        ["power-power", "machten", "Macht van een macht", "Vermenigvuldig de exponenten."],
        ["power-product", "machten", "Machten vermenigvuldigen", "Tel de exponenten van dezelfde letter op."],
        ["power-quotient", "machten", "Machten delen", "Trek de exponenten van dezelfde letter af."],
        ["power-monomial", "machten", "Macht van een eenterm", "Verhef elke factor tot de macht."],
        ["power-negative", "machten", "Negatieve machten en breuken", "Een negatieve exponent keert de breuk om."],
        ["power-mixed", "machten", "Gemengde bewerkingen", "Werk producten uit en deel daarna."],
        ["scientific", "wetenschappelijk", "Wetenschappelijke schrijfwijze", "Schrijf een factor van 1 tot 10 maal een macht van 10."],
        ["square-factor", "wortels", "Ontbinden met een kwadraatfactor", "Zoek een volkomen kwadraat dat het getal deelt, bijvoorbeeld 4, 9, 16, 25 of 36."],
        ["root-product", "wortels", "Wortels vermenigvuldigen", "Vermenigvuldig de getallen onder de wortels."],
        ["root-quotient", "wortels", "Wortels delen", "Deel de getallen onder de wortels."],
        ["root-fraction", "wortels", "Wortel van een breuk", "Neem de wortel van teller en noemer."],
        ["root-power", "wortels", "Wortels en machten", "Splits even machten af als kwadraten."],
        ["root-simplify", "wortels", "Vierkantswortels vereenvoudigen", "Haal de grootste kwadraatfactor buiten de wortel."],
        ["root-letters", "wortels", "Wortels met letters", "Haal paren van gelijke letters buiten de wortel."],
        ["root-sum", "wortels", "Gelijksoortige wortels", "Tel alleen termen met dezelfde wortel op."],
        ["root-sum-mixed", "wortels", "Eerst vereenvoudigen, dan optellen", "Vereenvoudig de wortels v\xF3\xF3r je termen samenneemt."]
      ].map(([id, group, label, hint]) => ({ id, group, label, hint }));
      const GROUPS = [{ id: "machten", label: "Machten & letters" }, { id: "wetenschappelijk", label: "Wetenschappelijke schrijfwijze" }, { id: "wortels", label: "Vierkantswortels" }];
      const SCIENTIFIC_VERSION = 2;
      const SCIENTIFIC_LEVELS = Object.freeze([
        Object.freeze({ level: 0, label: "Start", description: "Grote gehele getallen met \xE9\xE9n significant cijfer; positieve exponenten van 2 tot 6." }),
        Object.freeze({ level: 1, label: "Basis", description: "Grote en kleine getallen met twee of drie significante cijfers; exponenten van \u22126 tot 7." }),
        Object.freeze({ level: 2, label: "Verdieping", description: "Heel grote en heel kleine getallen met vier of vijf significante cijfers en nullen in het voorgetal; exponenten tot \xB120." })
      ]);
      function decimal(digits, exponent) {
        const point = 1 + exponent;
        if (point <= 0) return "0." + "0".repeat(-point) + digits;
        if (point >= digits.length) return digits + "0".repeat(point - digits.length);
        return digits.slice(0, point) + "." + digits.slice(point);
      }
      function generate(skill, seed = 1, level = 1, variant = 0, generatorVersion = 1) {
        if (!SKILLS.some((s) => s.id === skill) || !Number.isInteger(seed) || seed < 0 || seed > 4294967295 || ![0, 1, 2].includes(level) || !Number.isInteger(variant) || variant < 0 || variant > 3 || ![1, SCIENTIFIC_VERSION].includes(generatorVersion)) throw Error("Ongeldige opgave.");
        let state = (seed ^ Math.imul(variant + 1, 2654435761)) >>> 0;
        const rnd = () => {
          state = Math.imul(state, 1664525) + 1013904223 >>> 0;
          return state / 4294967296;
        }, pick = (a2) => a2[Math.floor(rnd() * a2.length)], int = (a2, b2) => a2 + Math.floor(rnd() * (b2 - a2 + 1));
        const a = int(2, level === 0 ? 4 : 7), b = int(2, 5), n = int(2, level === 0 ? 3 : 5), m = int(2, 6), r = pick([2, 3, 5, 6, 7]), x = pick(["x", "a", "b"]);
        let expression, steps = [], condition = "", answer;
        switch (skill) {
          case "power-power":
            expression = `(${x}^${m})^${n}`;
            steps = [`${x}^{${m}\\cdot ${n}}`];
            break;
          case "power-product": {
            const k = level === 0 ? int(1, 5) : int(-6, 5);
            expression = `${x}^${m}*${x}^(${k})`;
            steps = [`${x}^{${m}+(${k})}`];
            condition = `${x} \u2260 0`;
            break;
          }
          case "power-quotient": {
            const k = level === 0 ? int(1, m) : int(-6, 8);
            expression = `${x}^${m}/${x}^(${k})`;
            steps = [`${x}^{${m}-(${k})}`];
            condition = `${x} \u2260 0`;
            break;
          }
          case "power-monomial": {
            const c = level === 0 ? a : -a;
            expression = level === 2 ? `(${c}x^${m}y)^${n}` : `(${c}${x}^${m})^${n}`;
            steps = [`${c < 0 ? "(" + c + ")" : c}^{${n}}\\cdot ${level === 2 ? "x" : x}^{${m}\\cdot ${n}}${level === 2 ? `\\cdot y^{${n}}` : ""}`];
            break;
          }
          case "power-negative":
            expression = level === 0 ? `${x}^(-${n})` : `(${a}${x}/${b})^(-${n})`;
            steps = [level === 0 ? `\\frac{1}{${x}^{${n}}}` : `\\left(\\frac{${b}}{${a}${x}}\\right)^{${n}}`];
            condition = `${x} \u2260 0`;
            break;
          case "power-mixed": {
            const kind = level === 0 ? "compound" : pick(["product", "quotient", "compound"]);
            if (kind === "product") {
              expression = `(-${a}${x}^${m})*(${b}${x}^${n})`;
              steps = [`(-${a})\\cdot ${b}\\cdot ${x}^{${m}+${n}}`];
            } else if (kind === "quotient") {
              expression = `(${a}${x}^${m})/(-${a * b}${x}^${n})`;
              steps = [`\\frac{${a}}{-${a * b}}\\cdot ${x}^{${m}-${n}}`];
            } else {
              expression = `(${x}*${x}^${m})/${x}^${n}`;
              steps = [`\\frac{${x}^{1+${m}}}{${x}^{${n}}}`, `${x}^{${1 + m}-${n}}`];
            }
            condition = kind === "product" ? "" : `${x} \u2260 0`;
            break;
          }
          case "scientific": {
            const digits = generatorVersion === 1 ? level === 0 ? pick(["4", "17", "82"]) : pick(["499", "10845", "332", "43", "214", "82", "17"]) : pick(level === 0 ? ["2", "3", "4", "5", "6", "7", "8", "9"] : level === 1 ? ["17", "24", "43", "82", "125", "214", "332", "499"] : ["1005", "10204", "12004", "40801", "90807", "10304", "4007", "8009"]);
            const exponent = generatorVersion === 1 ? pick(level === 0 ? [-4, -2, 3, 5, 8] : [-14, -7, -4, -1, 5, 8, 9, 14]) : pick(level === 0 ? [2, 3, 4, 5, 6] : level === 1 ? [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7] : [-20, -16, -12, -9, -7, 9, 12, 16, 20]);
            expression = decimal(digits, exponent);
            answer = (digits.length === 1 ? digits : digits[0] + "." + digits.slice(1)) + `*10^(${exponent})`;
            steps = [`\\text{Verplaats de komma ${Math.abs(exponent)} plaatsen ${exponent >= 0 ? "naar links" : "naar rechts"}.}`];
            break;
          }
          case "square-factor": {
            const base = int(2, level === 0 ? 5 : level === 1 ? 10 : 15), rest = pick(level === 0 ? [2, 3, 5] : level === 1 ? [2, 3, 5, 7, 11] : [2, 3, 5, 6, 7, 10, 11, 13]);
            const value = base * base * rest, [outer, inner] = factor(BigInt(value));
            expression = String(value);
            answer = `${inner}*${outer}^2`;
            steps = [`${value}= ${inner}\\cdot ${outer * outer}`, `${value}= ${inner}\\cdot ${outer}^{2}`];
            break;
          }
          case "root-product":
            expression = level === 0 ? `sqrt(${a * a}*${b * b})` : `sqrt(${r})*sqrt(${r * a * a})`;
            steps = [`\\sqrt{${level === 0 ? a * a * b * b : r * r * a * a}}`];
            break;
          case "root-quotient": {
            const numerator = level === 2 && variant % 2 ? r * a : r * a * a, denominator = level === 2 && variant % 2 ? a : r;
            expression = `sqrt(${numerator})/sqrt(${denominator})`;
            steps = [`\\sqrt{\\frac{${numerator}}{${denominator}}}`, `\\sqrt{${numerator / denominator}}`];
            break;
          }
          case "root-fraction":
            expression = `sqrt(${a * a}/${b * b})`;
            steps = [`\\frac{\\sqrt{${a * a}}}{\\sqrt{${b * b}}}`, `\\frac{${a}}{${b}}`];
            break;
          case "root-power":
            expression = level === 0 ? `sqrt(${a}^2)` : pick([`(sqrt(${r}))^2`, `sqrt(${a * a}^${n})`, `sqrt(${r}^3)`]);
            steps = expression === `sqrt(${r}^3)` ? [`\\sqrt{${r}^2\\cdot ${r}}`, `${r}\\sqrt{${r}}`] : expression === `sqrt(${a * a}^${n})` ? [`(\\sqrt{${a * a}})^{${n}}`, `${a}^{${n}}`] : [tex(plain(parse(expression).value))];
            break;
          case "root-simplify":
            expression = `sqrt(${a * a * r})`;
            steps = [`\\sqrt{${a * a}\\cdot ${r}}`, `${a}\\sqrt{${r}}`];
            break;
          case "root-letters": {
            expression = level === 0 ? `sqrt(${x}^${2 * n + 1})` : level === 1 ? `sqrt(${a * a}${x}^${2 * n + 1})` : pick([`sqrt(${a * a}a^3b^7c^2)`, `sqrt(a^8b^6)`, `sqrt(b)*sqrt(b^4)*sqrt(b^3)`]);
            condition = "Alle gebruikte letters zijn strikt positief.";
            if (level === 0) steps = [`\\sqrt{${x}^{${2 * n}}\\cdot ${x}}`];
            else if (level === 1) steps = [`\\sqrt{${a * a}\\cdot ${x}^{${2 * n}}\\cdot ${x}}`];
            else if (expression === "sqrt(a^8b^6)") steps = ["\\sqrt{(a^4b^3)^2}"];
            else if (expression.startsWith("sqrt(b)")) steps = ["\\sqrt{b^{1+4+3}}", "\\sqrt{b^8}"];
            else steps = [`\\sqrt{${a * a}a^2b^6c^2\\cdot ab}`];
            break;
          }
          case "root-sum":
            expression = level === 2 ? `${a}sqrt(14)-${b}sqrt(7)+${n}sqrt(14)+sqrt(7)` : `${a}sqrt(${r})-${b}sqrt(${r})+${n}sqrt(${r})+sqrt(${r})`;
            steps = [level === 2 ? `(${a}+${n})\\sqrt{14}+(-${b}+1)\\sqrt{7}` : `(${a}-${b}+${n}+1)\\sqrt{${r}}`];
            break;
          case "root-sum-mixed":
            expression = level === 2 ? "sqrt(75)+sqrt(50)-3sqrt(18)+sqrt(48)" : `${a}sqrt(${r})-sqrt(${b * b * r})+sqrt(${n * n * r})`;
            steps = [level === 2 ? "5\\sqrt{3}+5\\sqrt{2}-9\\sqrt{2}+4\\sqrt{3}" : `${a}\\sqrt{${r}}-${b}\\sqrt{${r}}+${n}\\sqrt{${r}}`];
            break;
        }
        answer = answer || plain(parse(expression).value);
        const answerTex = tex(answer);
        if (skill !== "square-factor" && steps.at(-1) !== answerTex) steps.push(answerTex);
        const versioned = skill === "scientific" && generatorVersion === SCIENTIFIC_VERSION;
        return { id: `${skill}:${seed}:${level}:${variant}${versioned ? ":v" + SCIENTIFIC_VERSION : ""}`, skill, seed, level, variant, ...versioned ? { generatorVersion: SCIENTIFIC_VERSION } : {}, expression, tex: tex(expression), answer, answerTex, steps, condition, hint: SKILLS.find((s) => s.id === skill).hint, ...skill === "square-factor" ? { instruction: "Schrijf het getal als een product van twee natuurlijke factoren. Minstens \xE9\xE9n factor is een volkomen kwadraat.", answerLabel: "Jouw product van twee factoren", inputHelp: "Typ bijvoorbeeld 3*2^2 of 3*4. Je mag de factoren ook omwisselen." } : {} };
      }
      function check(task, input) {
        try {
          const actual = parse(input), expected = parse(task.answer);
          if (signature(actual.value) !== signature(expected.value)) return { ok: false, message: "Nog niet juist. " + task.hint };
          if (task.skill === "square-factor") {
            const naturalFactor = (ast) => {
              if (ast.type !== "number" && !(ast.type === "^" && ast.args[0].type === "number" && ast.exponent >= 0)) return null;
              if (ast.value.size !== 1) return null;
              const [k, c] = [...ast.value][0];
              return k === key() && c.d === 1n && c.n > 0n ? c.n : null;
            };
            const values = actual.type === "*" && actual.args.length === 2 ? actual.args.map(naturalFactor) : [];
            if (values.length !== 2 || values.some((v) => v === null)) return { ok: false, message: "Schrijf een product van precies twee natuurlijke factoren, bijvoorbeeld 3*2^2." };
            if (!values.some((v) => factor(v)[1] === 1n)) return { ok: false, message: "Het product klopt, maar geen van beide factoren is een volkomen kwadraat. " + task.hint };
            return { ok: true, message: "Juist! Het product klopt en minstens \xE9\xE9n factor is een volkomen kwadraat." };
          }
          if (task.skill === "scientific") {
            const match = normalize(input).match(/^([1-9](?:\.\d+)?)\*10\^\(?([+-]?\d+)\)?$/);
            if (!match || Number(match[1]) >= 10) return { ok: false, message: "De waarde klopt. Schrijf ze als a \xB7 10\u207F met 1 \u2264 a < 10." };
          } else if (!reduced(actual) || cost(actual) > cost(expected)) return { ok: false, message: "De waarde klopt. Vereenvoudig verder: neem gelijke machten of worteltermen samen en haal kwadraatfactoren uit de wortel. Gebruik positieve exponenten." };
          return { ok: true, message: "Juist. Mooi vereenvoudigd!" };
        } catch (e) {
          return { ok: false, message: e.message };
        }
      }
      return Object.freeze({ SKILLS, GROUPS, SCIENTIFIC_VERSION, SCIENTIFIC_LEVELS, generate, check, parse, plain, tex, signature, normalize });
    });
  }
});

// games/bewerkingen-trainer/battle-config.js
var require_battle_config = __commonJS({
  "games/bewerkingen-trainer/battle-config.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_core());
      else root.BattleGame = factory(root.BewerkingenCore);
    })(globalThis, (C) => {
      const skills = C.SKILLS.map((s) => ({ id: s.id, label: s.label, description: s.hint }));
      const worlds = C.GROUPS.map((g) => ({ id: g.id, name: g.label, skills: C.SKILLS.filter((s) => s.group === g.id).map((s) => s.id) }));
      const generate = (s) => C.generate(s.skill, s.seed, s.level ?? 1, s.variant);
      const validate = (task, answer) => C.check(task, typeof answer?.value === "string" ? answer.value : "");
      return Object.freeze({ id: "bewerkingen", title: "Getallenwereld", rpc: "axioma_game_class", classFunction: "bewerkingen-class", classReview: true, multiSelect: true, levelSelect: true, playerURL: "battle-player.html", skills, worlds, mixedSkills: skills.map((s) => s.id), generate, validate });
    });
  }
});

// games/algebra-trainer/core.js
var require_core2 = __commonJS({
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
          this.n = n === 0 ? 0 : n / g;
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
var require_core3 = __commonJS({
  "games/algebra-trainer/stelsels/core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_core2());
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
      if (typeof module === "object" && module.exports) module.exports = factory(require_core2());
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
      if (typeof module === "object" && module.exports) module.exports = factory(require_core2(), require_fraction_core());
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
      if (typeof module === "object" && module.exports) module.exports = factory(require_core2(), require_learning_core(), require_world_core(), require_fraction_core());
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
var require_battle_config2 = __commonJS({
  "games/algebra-trainer/battle-config.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_core2(), require_core3(), require_journey_core());
      else root.BattleGame = factory(root.AlgebraCore, root.StelselsCore, root.AlgebraJourney, root.location?.search || "");
    })(globalThis, (C, S, J, search = "") => {
      const equationsOnly = new URLSearchParams(search).get("osEntry") === "1";
      const skills = [...C.TYPES.map((t) => ({ id: t.id, label: t.label, level: t.level, description: t.desc, topicId: "equations" })), { id: "S1", label: "Eenvoudige stelsels", level: "systems", topicId: "systems", description: "Twee vergelijkingen met x en y. E\xE9n oplossing in gehele getallen." }];
      const worlds = [{ id: "equations", name: "Vergelijkingen", topicId: "equations", skills: C.TYPES.map((t) => t.id) }, { id: "systems", name: "Stelsels", topicId: "systems", skills: ["S1"] }].filter((world) => !equationsOnly || world.id === "equations");
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
      return Object.freeze({ id: "algebra", title: "Algebra", rpc: "axioma_game_class", classFunction: "algebra-class", classReview: true, multiSelect: true, playerURL: "battle-player.html", skills, worlds, presets, mixedSkills: skills.filter((s) => !equationsOnly || s.topicId === "equations").map((s) => s.id), generate, parse, validate });
    });
  }
});

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
var require_battle_config3 = __commonJS({
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

// games/wortelbouw_pro_v0.5.0/wortelbouw/geometry.js
var require_geometry = __commonJS({
  "games/wortelbouw_pro_v0.5.0/wortelbouw/geometry.js"(exports, module) {
    (function(root, factory) {
      const api = factory();
      if (typeof module === "object" && module.exports) module.exports = api;
      else root.WortelbouwGeometry = api;
    })(globalThis, () => {
      "use strict";
      const EPS = 1e-8;
      const levels = [
        { n: 2, kind: "length", best: 1, title: "De eerste wortel", hint: "Probeer twee even lange benen.", lesson: "1\xB2 + 1\xB2 = 2. De schuine zijde is dus \u221A2." },
        { n: 18, kind: "length", label: "3\u221A2", best: 1, title: "Drie keer zo lang", hint: "Denk terug aan \u221A2. Maak beide benen drie keer zo lang.", lesson: "(3\u221A2)\xB2 = 9 \xD7 2 = 18. Driemaal de lengte geeft negenmaal de oppervlakte." },
        { n: 5, kind: "length", best: 1, title: "Ongelijke benen", hint: "Ook twee verschillende maten kunnen samen een wortel maken.", lesson: "1\xB2 + 2\xB2 = 5. De twee benen hoeven niet even lang te zijn." },
        { n: 25, kind: "length", label: "5", best: 1, title: "Een bekende driehoek", hint: "Bouw 5 als schuine zijde met twee verschillende benen.", lesson: "3\xB2 + 4\xB2 = 5\xB2: de bekende 3\u20134\u20135-driehoek. Een wortel kan ook een geheel getal zijn." },
        { n: 100, kind: "length", label: "10", best: 1, maxLength: 10, title: "Dubbel zo groot", hint: "Bouw 10 als schuine zijde. Denk terug aan 3\u20134\u20135 en verdubbel beide benen.", lesson: "6\u20138\u201310 is tweemaal 3\u20134\u20135. De lengtes verdubbelen; de oppervlakten worden viermaal zo groot." },
        { n: 13, kind: "length", best: 1, title: "Twee kwadraten samen", hint: "Welke twee kwadraten vormen samen 13?", lesson: "De oppervlakten op de benen vormen samen de oppervlakte op de schuine zijde." },
        { n: 12, kind: "length", best: 1, title: "Een vierkant eraf", hint: "Gebruik een bestaande zijde als schuine zijde.", lesson: "Bij een verschil is de bestaande zijde de schuine zijde: je trekt een oppervlakte af." },
        { n: 11, kind: "length", best: 1, maxLength: 6, title: "Een maatje groter", hint: "Je liniaal gaat nu tot 6. Welk verschil van kwadraten geeft 11?", lesson: "6\xB2 \u2212 5\xB2 = 36 \u2212 25 = 11. Een kleine wortel kan uit twee grote vierkanten ontstaan." },
        { n: 7, kind: "area", best: 1, title: "Denk in oppervlakte", hint: "Nu is de oppervlakte je doel. Welke zijde hoort daarbij?", lesson: "Oppervlakte 7 en zijde \u221A7 horen bij hetzelfde vierkant." },
        { n: 15, kind: "length", best: 1, title: "Net geen vier", hint: "15 ligt vlak onder een kwadraat.", lesson: "16 \u2212 1 = 15. De gevonden lengte \u221A15 is iets kleiner dan 4." },
        { n: 21, kind: "length", best: 1, title: "Kies je verschil", hint: "Zoek een kwadraat boven 21 en haal er een kleiner kwadraat af.", lesson: "25 \u2212 4 = 21. Oppervlakten helpen je om een onbekende lengte te bouwen." },
        { n: 14, kind: "length", best: 2, title: "Bouw verder", hint: "Niet alles lukt in \xE9\xE9n stap. Gebruik een gevonden zijde opnieuw.", lesson: "Het koord bewaart je nieuwe lengte, zodat je op het resultaat kunt verder bouwen." },
        { n: 6, kind: "length", best: 2, compareRoutes: true, title: "E\xE9n wortel, twee manieren", hint: "Bouw \u221A6 eerst op jouw manier. Zoek daarna een route die anders eindigt: met optellen of met aftrekken.", lesson: "Dezelfde lengte \u221A6 kun je met een som \xE9n met een verschil van oppervlakten bouwen." },
        { n: 104, kind: "length", best: 1, maxLength: 10, title: "De grote verrassing", hint: "De liniaal gaat tot 10. Groot hoeft niet ingewikkeld te zijn.", lesson: "10\xB2 + 2\xB2 = 100 + 4 = 104. Ook deze grote wortel lukt in \xE9\xE9n bouwstap!" }
      ];
      const levelId = (level) => `${level.kind}-${level.n}${level.compareRoutes ? "-two-ways" : ""}`;
      const maxLength = (s) => levels[s.level].maxLength || 5;
      const goalLabel = (level) => level.label || `\u221A${level.n}`;
      const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y }), sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
      const mul = (a, k) => ({ x: a.x * k, y: a.y * k }), dot = (a, b) => a.x * b.x + a.y * b.y;
      const cross = (a, b) => a.x * b.y - a.y * b.x, len = (a) => Math.hypot(a.x, a.y);
      const norm = (a) => mul(a, 1 / len(a)), perp = (a) => ({ x: -a.y, y: a.x });
      const center = (p) => mul(p.reduce(add, { x: 0, y: 0 }), 1 / p.length);
      const signedArea = (p) => p.reduce((sum, a, i) => sum + cross(a, p[(i + 1) % p.length]), 0) / 2;
      const ccw = (p) => signedArea(p) < 0 ? [...p].reverse() : p;
      const edges = (o) => o.points.map((a, i) => ({ a, b: o.points[(i + 1) % o.points.length], index: i, owner: o.id }));
      const copy = (x) => JSON.parse(JSON.stringify(x));
      function overlap(a, b) {
        for (const poly of [a, b]) for (let i = 0; i < poly.length; i++) {
          const axis = norm(perp(sub(poly[(i + 1) % poly.length], poly[i])));
          const pa = a.map((p) => dot(p, axis)), pb = b.map((p) => dot(p, axis));
          if (Math.min(Math.max(...pa), Math.max(...pb)) - Math.max(Math.min(...pa), Math.min(...pb)) <= EPS) return false;
        }
        return true;
      }
      function sharedBoundary(e, f) {
        const d = sub(e.b, e.a), length = len(d), u = mul(d, 1 / length);
        if (Math.abs(cross(u, sub(f.a, e.a))) > EPS || Math.abs(cross(u, sub(f.b, e.a))) > EPS) return false;
        const a = dot(sub(f.a, e.a), u), b = dot(sub(f.b, e.a), u);
        return Math.min(length, Math.max(a, b)) - Math.max(0, Math.min(a, b)) > EPS;
      }
      function freeEdges(s, square) {
        return edges(square).filter((e) => !s.objects.some((o) => o.id !== square.id && edges(o).some((f) => sharedBoundary(e, f))));
      }
      function squareOn(edge, triangle, role, id) {
        const v = sub(edge.b, edge.a), normal = perp(norm(v));
        const sign = cross(v, sub(center(triangle.points), edge.a)) > 0 ? -1 : 1;
        const offset = mul(normal, Math.sqrt(edge.area) * sign);
        return { id, type: "square", role, area: edge.area, points: ccw([edge.a, edge.b, add(edge.b, offset), add(edge.a, offset)]) };
      }
      function initial(level = 0) {
        return { level, objects: [], phase: "start", active: null, pending: null, steps: 0, solutions: [] };
      }
      function startSquare(k, x = 0, y) {
        if (!Number.isInteger(k) || k < 1 || k > 10 || !Number.isFinite(x) || y !== void 0 && !Number.isFinite(y)) throw Error("Kies een liniaalmaat van 1 tot 10.");
        const cy = y === void 0 ? k / 2 : y;
        return { id: "s0", type: "square", role: "result", area: k * k, points: [{ x: x - k / 2, y: cy - k / 2 }, { x: x + k / 2, y: cy - k / 2 }, { x: x + k / 2, y: cy + k / 2 }, { x: x - k / 2, y: cy + k / 2 }], start: true };
      }
      function plan(s, owner, edgeIndex, k, mode = "sum", flip = false) {
        if (!Number.isInteger(k) || k < 1 || k > maxLength(s) || !["sum", "difference"].includes(mode)) return null;
        const square = s.objects.find((o) => o.id === owner && o.type === "square");
        if (!square || !freeEdges(s, square).some((e) => e.index === edgeIndex)) return null;
        const edge = edges(square)[edgeIndex], A = flip ? edge.b : edge.a, B = flip ? edge.a : edge.b;
        const u = norm(sub(B, A)), out = mul(perp(norm(sub(edge.b, edge.a))), -1);
        const area = mode === "sum" ? square.area + k * k : square.area - k * k;
        if (area <= 0) return null;
        const c = Math.sqrt(square.area);
        const C = mode === "sum" ? add(A, mul(out, k)) : add(A, add(mul(u, k * k / c), mul(out, k * Math.sqrt(area) / c)));
        const step = s.steps + 1;
        const triangle = {
          id: `t${step}`,
          type: "triangle",
          owner,
          points: ccw([A, B, C]),
          mode,
          known: k,
          base: { a: A, b: B, area: square.area },
          helper: { a: A, b: C, area: k * k },
          result: { a: B, b: C, area },
          right: mode === "sum" ? A : C,
          revealed: false
        };
        const helper = squareOn(triangle.helper, triangle, "helper", `h${step}`);
        const result = squareOn(triangle.result, triangle, "result", `s${step}`);
        const pieces = [triangle, helper, result];
        let blocked = null;
        for (let i = 0; i < pieces.length; i++) if ([...s.objects, ...pieces.slice(0, i)].some((o) => overlap(o.points, pieces[i].points))) {
          blocked = pieces[i].type === "triangle" ? "driehoek" : pieces[i].role === "helper" ? "tweede veld" : "nieuwe veld";
          break;
        }
        return { owner, edgeIndex, k, mode, flip, triangle, helper, result, valid: !blocked, blocked };
      }
      function apply(s, action) {
        const next = copy(s);
        if (action.type === "nextRoute" && s.phase === "routeDone") return { ...initial(s.level), solutions: copy(s.solutions) };
        if (action.type === "start" && s.phase === "start") {
          if (action.k > maxLength(s)) throw Error(`De liniaal gaat hier tot ${maxLength(s)}.`);
          next.objects = [startSquare(action.k, action.x, action.y)];
          next.active = "s0";
          next.phase = "choose";
          return next;
        }
        if (action.type === "triangle" && s.phase === "choose") {
          const p = plan(s, action.owner, action.edgeIndex, action.k, action.mode, action.flip);
          if (!p || !p.valid) throw Error(p ? `Het ${p.blocked} overlapt een tegel. Spiegel of kies een andere zijde.` : "Deze maat past niet bij de gekozen zijde.");
          next.objects.push(p.triangle);
          next.active = action.owner;
          next.pending = p;
          next.phase = "helper";
          return next;
        }
        if (action.type === "helper" && s.phase === "helper") {
          next.objects.push(next.pending.helper);
          next.phase = "result";
          return next;
        }
        if (action.type === "result" && s.phase === "result") {
          next.objects.push(next.pending.result);
          next.active = next.pending.result.id;
          next.steps++;
          next.phase = "reveal";
          return next;
        }
        if (action.type === "reveal" && s.phase === "reveal") {
          next.objects.find((o) => o.id === s.pending.triangle.id).revealed = true;
          const goal = levels[s.level], reached = next.pending.result.area === goal.n;
          next.phase = reached ? "won" : "choose";
          if (reached && goal.compareRoutes) {
            const mode = next.pending.mode;
            if (!next.solutions.some((route) => route.mode === mode)) {
              const equations = [];
              let owner = next.pending.result.id;
              while (true) {
                const t = next.objects.find((o) => o.type === "triangle" && "s" + o.id.slice(1) === owner);
                if (!t) break;
                equations.unshift({ base: t.base.area, helper: t.helper.area, result: t.result.area, mode: t.mode });
                owner = t.owner;
              }
              next.solutions.push({ mode, equations });
            }
            next.phase = next.solutions.length === 2 ? "won" : "routeDone";
          }
          next.pending = null;
          return next;
        }
        throw Error("Leg eerst het aangegeven stuk.");
      }
      class Game {
        constructor(level = 0) {
          this.state = initial(level);
          this.history = [];
          this.actions = [];
          this.historyLengths = [];
        }
        commit(action) {
          const next = apply(this.state, action);
          if (action.type !== "reveal") {
            this.history.push(copy(this.state));
            this.historyLengths.push(this.actions.length);
          }
          this.actions.push(Object.fromEntries(["type", "k", "x", "y", "owner", "edgeIndex", "mode", "flip"].filter((k) => Object.hasOwn(action, k)).map((k) => [k, action[k]])));
          this.state = next;
          return next;
        }
        undo() {
          if (this.history.length) {
            this.state = this.history.pop();
            this.actions.length = this.historyLengths.pop();
          }
          return this.state;
        }
        reset(level = this.state.level) {
          this.state = initial(level);
          this.history = [];
          this.actions = [];
          this.historyLengths = [];
        }
      }
      function bounds(objects) {
        const p = objects.flatMap((o) => o.points);
        if (!p.length) return { minX: -3, maxX: 3, minY: 0, maxY: 5 };
        return { minX: Math.min(...p.map((p2) => p2.x)), maxX: Math.max(...p.map((p2) => p2.x)), minY: Math.min(...p.map((p2) => p2.y)), maxY: Math.max(...p.map((p2) => p2.y)) };
      }
      return {
        levels,
        levelId,
        maxLength,
        goalLabel,
        Game,
        initial,
        startSquare,
        plan,
        apply,
        overlap,
        sharedBoundary,
        freeEdges,
        edges,
        squareOn,
        bounds,
        add,
        sub,
        mul,
        dot,
        cross,
        len,
        norm,
        perp,
        center,
        signedArea,
        EPS
      };
    });
  }
});

// games/wortelbouw_pro_v0.5.0/wortelbouw/battle-config.js
var require_battle_config4 = __commonJS({
  "games/wortelbouw_pro_v0.5.0/wortelbouw/battle-config.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_geometry());
      else root.BattleGame = factory(root.WortelbouwGeometry);
    })(globalThis, function(G) {
      const pools = { basis: [2, 5, 13, 25], groot: [18, 100, 104] };
      const worlds = Object.entries(pools).map(([id, values]) => ({ id, name: id === "basis" ? "Konijnengrond \xB7 basis" : "Grotere lengtes", skills: values.map((n) => "build_" + n) }));
      function generate(spec) {
        const n = Number(spec.skill.replace("build_", ""));
        if (!Object.values(pools).flat().includes(n)) throw Error("Onbekende bouwopgave");
        return G.levels.findIndex((l) => l.n === n);
      }
      function validate(level, answer) {
        try {
          if (!Array.isArray(answer?.actions) || !answer.actions.length || answer.actions.length > 150) return { ok: false };
          let state = G.initial(level);
          for (const a of answer.actions) {
            if (!a || !["start", "triangle", "helper", "result", "reveal"].includes(a.type)) return { ok: false };
            if (["start", "triangle"].includes(a.type) && (!Number.isInteger(a.k) || a.k < 1 || a.k > G.maxLength(state))) return { ok: false };
            if (a.type === "start" && (!Number.isFinite(a.x) || !Number.isFinite(a.y) || Math.abs(a.x) > 1e3 || Math.abs(a.y) > 1e3)) return { ok: false };
            state = G.apply(state, a);
          }
          return { ok: state.phase === "won" };
        } catch {
          return { ok: false };
        }
      }
      return { id: "wortelbouw", title: "Wortelbouw", rpc: "axioma_game_class", playerURL: "battle-player.html", worlds, skills: Object.values(pools).flat().map((n) => ({ id: "build_" + n, label: "Bouw lengte " + G.goalLabel(G.levels.find((l) => l.n === n)) })), mixedSkills: worlds.flatMap((w) => w.skills), generate, validate };
    });
  }
});

// games/stelsels/exercises.js
var require_exercises = __commonJS({
  "games/stelsels/exercises.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory();
      else root.StelselsExercises = factory();
    })(globalThis, () => {
      return [
        // BASIS
        { id: 1, eq: [["2", "1", "5"], ["1", "2", "4"]] },
        { id: 2, eq: [["-2", "1", "4"], ["1", "3", "5"]] },
        { id: 3, eq: [["2", "1", "5"], ["1", "-2", "5"]] },
        { id: 4, eq: [["-3", "1", "-5"], ["1", "4", "6"]] },
        { id: 5, eq: [["1/2", "1", "2"], ["1", "-1", "1"]] },
        // METHODEBEWUSTE VARIATIE
        // combinatie: y valt onmiddellijk weg
        { id: 6, eq: [["3", "2", "7"], ["3", "-2", "-1"]] },
        // substitutie: x staat meteen met coefficient 1
        { id: 7, eq: [["1", "-3", "-5"], ["2", "1", "4"]] },
        // negatieve x-coefficient
        { id: 8, eq: [["-1", "1", "4"], ["2", "1", "1"]] },
        // beide oplossingscoordinaten negatief
        { id: 9, eq: [["1", "1", "-3"], ["2", "-1", "-3"]] },
        // combinatie vraagt twee verschillende factoren
        { id: 10, eq: [["2", "3", "7"], ["3", "-2", "4"]] },
        // UITDAGING
        // breuken als oplossing
        { id: 11, eq: [["2", "1", "2"], ["1", "-1", "0"]] },
        // breuk als coefficient
        { id: 12, eq: [["2/3", "-1", "-1"], ["1", "1", "6"]] },
        // SPECIALE GEVALLEN — minder onmiddellijk herkenbaar
        // tweede vergelijking = -2 maal de eerste
        { id: 13, eq: [["2", "-1", "3"], ["-4", "2", "-6"]] },
        // zelfde linkerlidverhouding, ander rechterlid: evenwijdig
        { id: 14, eq: [["2", "-1", "3"], ["-4", "2", "-8"]] }
      ];
    });
  }
});

// games/stelsels/task-config.js
var require_task_config = __commonJS({
  "games/stelsels/task-config.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_exercises());
      else root.StelselsTaskConfig = factory(root.StelselsExercises);
    })(globalThis, (E) => {
      "use strict";
      const skills = E.map((e) => ({ id: "system_" + e.id, label: "Stelsel " + e.id }));
      function generate(spec) {
        const e = E.find((e2) => "system_" + e2.id === spec?.skill);
        if (!e) throw Error("Onbekend stelsel.");
        return e;
      }
      function number(s) {
        if (typeof s !== "string" || s.length > 40 || !/^[-+]?\d+(?:[.,]\d+)?(?:\/[-+]?\d+(?:[.,]\d+)?)?$/.test(s.trim())) return null;
        const [a, b = "1"] = s.trim().replaceAll(",", ".").split("/").map(Number);
        return Number.isFinite(a / b) && Math.abs(a / b) <= 1e6 ? a / b : null;
      }
      function validate(task, answer) {
        try {
          const [[a, b, c], [d, e, f]] = task.eq.map((row) => row.map(number));
          if (a * e - d * b === 0) return { ok: answer?.kind === (a * f === d * c && b * f === e * c ? "coincident" : "parallel") };
          const x = number(answer?.x), y = number(answer?.y);
          return { ok: x !== null && y !== null && Math.abs(a * x + b * y - c) < 1e-9 && Math.abs(d * x + e * y - f) < 1e-9 };
        } catch {
          return { ok: false };
        }
      }
      return { skills, generate, validate, worlds: [{ id: "basis", name: "Basis", skills: skills.slice(0, 5).map((s) => s.id) }, { id: "methodes", name: "Methodes oefenen", skills: skills.slice(5, 10).map((s) => s.id) }, { id: "uitdaging", name: "Breuken en bijzondere gevallen", skills: skills.slice(10).map((s) => s.id) }] };
    });
  }
});

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
        const claims = { grenspas: "Koppel nulwaarde en teken van f(x) aan een strikt x-interval.", hellingrug: "Construeer een exacte gerichte rate uit twee punten en voorspel een derde punt.", signaalstad: "Diagnosticeer verwisselde a en b met een gekozen probe en herstel de koppeling." };
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
      const skills = ["equation_from_ab", "graph_from_equation", "equation_from_graph", "rewrite_linear_equation", "graph_from_table", "intercept"], count = 6;
      const worldFor = (skill) => ["graph_from_table", "intercept"].includes(skill) ? "signaalstad" : "formulewerf";
      const titles = { intercept: "Snijpunt met de y-as", graph_from_table: "Rechte uit tabel", equation_from_ab: "Voorschrift uit a en b", graph_from_equation: "Rechte uit voorschrift", equation_from_graph: "Voorschrift uit grafiek", rewrite_linear_equation: "Vergelijking herschrijven" };
      const slots = ["factor", "variable", "operator", "constant"];
      const phases = { intercept: "formula-read", graph_from_table: "formula-plot", equation_from_ab: "formula-build", graph_from_equation: "formula-plot", equation_from_graph: "formula-read", rewrite_linear_equation: "formula-rewrite" };
      const firstPhase = (skill) => phases[skill];
      const hints = {
        intercept: ["Zoek het snijpunt P met de y-as. Vul beide co\xF6rdinaten in: eerst x, dan y.", "De y-as is de verticale as door 0. Welke x-co\xF6rdinaat hebben punten op die as?", "Op de y-as is x altijd 0. Lees daarna de y-co\xF6rdinaat van P af.", "Boven 0 is y positief, onder 0 negatief. De oorsprong heeft co\xF6rdinaten (0; 0).", "Ander voorbeeld: P = (0; 4) ligt op de y-as op hoogte 4. Die y-co\xF6rdinaat noemen we b. Probeer een nieuw geval."],
        graph_from_table: ["Elke kolom geeft een punt: (x; f(x)).", "Lees x in de bovenste rij en y in dezelfde kolom eronder.", "Plaats eerst \xE9\xE9n punt. Kies daarna een andere kolom voor het tweede punt.", "De rechte door je punten moet bij alle kolommen passen. Let op negatieve getallen en halve stappen.", "Ander voorbeeld: de kolommen (0; 1) en (2; 3) geven twee punten op dezelfde rechte. Probeer een nieuw geval."],
        equation_from_ab: ["Gebruik de vorm y = ax + b.", "De co\xEBffici\xEBnt van x is a. De constante term is b.", "Kies het teken en het getal zo dat ze samen b voorstellen.", "Ook 0 en negatieve co\xEBffici\xEBnten zijn mogelijk. Een bouwsteen mag je meermaals gebruiken.", "Ander voorbeeld: a = \u22123 en b = 4 geven y = \u22123x + 4. Probeer een nieuw geval."],
        graph_from_equation: ["Bepaal zelf a en b uit het voorschrift.", "b geeft de y-co\xF6rdinaat van het snijpunt met de y-as.", "a vertelt hoe y verandert als x met \xE9\xE9n toeneemt. Let op het teken.", "Je kunt ook twee x-waarden kiezen en hun y-waarden berekenen. Gebruik twee verschillende punten.", "Ander voorbeeld: bij y = \u22123x + 4 liggen (0, 4) en (1, 1) op de rechte. Probeer een nieuw geval."],
        equation_from_graph: ["Lees eerst b af. Onderzoek daarna hoe de rechte stijgt of daalt.", "Op de y-as is x = 0. De hoogte van de rechte is daar b.", "Kies twee goed afleesbare roosterpunten. a is \u0394y gedeeld door \u0394x.", "Bij een horizontale rechte is a = 0. Een dalende rechte heeft een negatieve a.", "Ander voorbeeld: een rechte door (0, 4) en (1, 1) heeft a = \u22123 en b = 4. Probeer een nieuw geval."],
        rewrite_linear_equation: ["Werk tot y alleen links staat.", "Pas elke bewerking toe op beide volledige leden.", "Werk de x-term en eventuele constante links weg.", "Deel beide leden door de co\xEBffici\xEBnt van y. Je mag ook een andere geldige volgorde kiezen.", "Ander voorbeeld: 3y + 9x = 12 wordt 3y = \u22129x + 12 en dan y = \u22123x + 4. Probeer een nieuw geval."]
      };
      function makeTask(skill, index = 0, run = 1) {
        if (!skills.includes(skill)) throw Error("Onbekende Formulewerf-vaardigheid");
        const rows = skill === "intercept" ? [[1, 2], [2, 1], [-1, 3], [1, -2], [-2, 0], [0, -1]] : skill === "graph_from_table" ? [[1, 1], [-1, 2], [2, -1], [0.5, 1], [-0.5, -1], [0, 2]] : skill === "equation_from_ab" ? [[2, 2], [-1, 3], [1, -2], [0.5, 0], [-0.5, -1], [0, 2]] : skill === "rewrite_linear_equation" ? [[2, 3], [-1, -2], [0.5, 1], [-0.5, -1], [0, 2], [1, 0]] : [[2, 1], [1, -1], [-1, 2], [0.5, -2], [-0.5, 1], [0, -1]];
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
        return { id: `rechten-v2:${world}:${skill}:${run}:${index}`, world, skill_id: skill, family_id: skill === "intercept" ? "F3" : table ? "F5" : "F7", index, count, model, equation, tokens, ...table ? { table } : {}, gridStep: model.a.d > 1 ? 0.5 : 1, parameterStep: skill === "intercept" ? 1 : 0.5, bounds: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }, mode: index === 0 ? "discover" : "practice", variant: !model.a.n ? "horizontal" : model.a.d > 1 ? model.a.n < 0 ? "negative-fraction" : "positive-fraction" : model.a.n < 0 ? "negative" : "positive", given_representations: [table ? "table" : skill === "equation_from_ab" ? "coefficients" : ["equation_from_graph", "intercept"].includes(skill) ? "graph" : "equation"], hints: [...hints[skill]], legacy: { skill: skill === "equation_from_graph" ? "equation_from_ab" : skill, params: { model, equation, scaleX: W.q(1), scaleY: W.q(1) } } };
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
        if (phase === "formula-read" && t.skill_id === "intercept") {
          const x = M.parse(v.x), y = M.parse(v.b), keep = { x: !!x && W.eq(x, 0), b: !!y && W.eq(y, t.model.b) };
          if (!x || !y) return { ...syntax("Vul beide co\xF6rdinaten van P in: x en y."), keep };
          const correct = keep.x && keep.b;
          return result(correct, !keep.x ? "intercept.x" : "intercept.read", correct ? "Juist: P = (0; " + W.text(y) + "). Op de y-as is x = 0. De y-co\xF6rdinaat noemen we b." : !keep.x ? "P ligt op de y-as. Daar is x = 0." + (keep.b ? " Je y-co\xF6rdinaat klopt en blijft staan." : " Controleer daarna ook de y-co\xF6rdinaat.") : "Je x-co\xF6rdinaat klopt. Lees de y-co\xF6rdinaat af waar de rechte de y-as snijdt; onder 0 is die negatief.", keep);
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

// games/rechten/rechtenwereld/context-core.js
var require_context_core = __commonJS({
  "games/rechten/rechtenwereld/context-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_wave_core());
      else root.RechtenV2Context = factory(root.RechtenWave);
    })(globalThis, function(W) {
      "use strict";
      const skills = ["equation_from_context"], count = 1, scenario = "world-toll";
      const phases = ["context-start", "context-add", "context-table", "context-check", "context-rule", "context-plot"];
      const firstPhase = () => phases[0], nextPhase = (_, phase) => phases[phases.indexOf(phase) + 1] || "next-task";
      const fields = (phase) => ({ "context-start": ["openingCost"], "context-add": ["onePrice"], "context-table": ["twoPrice", "threePrice"], "context-rule": ["perUnit", "gateFee"], "context-plot": ["plotY1", "plotY2"], "context-check": ["caravanTotal"] })[phase] || [];
      const numericFields = (phase) => fields(phase), plotXs = [1, 3];
      function makeTask(skill, index = 0, run = 1) {
        if (!skills.includes(skill)) throw Error("Onbekende contextvaardigheid");
        const variant = (run - 1) % 3, [perUnit, gateFee] = [[3, 2], [3, 1], [2, 2]][variant], groupSize = 4;
        return { id: `rechten-v2:formulewerf:${skill}:${run}:0`, world: "formulewerf", skill_id: skill, family_id: "F7", scenario, index: 0, count, variant, model: { kind: "affine", a: W.q(perUnit), b: W.q(gateFee) }, perUnit, gateFee, groupSize, bounds: { xMax: 4, yMax: 16 }, mode: "practice", given_representations: ["context", "carts", "tollboard", "table"] };
      }
      const total = (t, carts) => W.num(W.add(W.mul(t.model.a, W.q(carts)), t.model.b));
      const result = (ok, code, message, keep = {}) => ({ ok, kind: ok ? "correct" : "hypothesis", code: ok ? null : code, message, keep });
      const syntax = (message) => ({ ok: false, kind: "interaction_error", code: "input.missing", message, keep: {} });
      function check(t, v, phase) {
        const keys = numericFields(phase), q = keys.map((k) => W.parse(v[k]));
        if (!keys.length || q.some((x) => !x)) return syntax("Tik een leeg bedrag aan en vul het in.");
        if (q.some((x) => x.d !== 1 || x.n < 0)) return syntax("Vul een heel aantal munten in: 0 of meer.");
        const expected = { "context-start": [t.gateFee], "context-add": [total(t, 1)], "context-table": [total(t, 2), total(t, 3)], "context-rule": [t.perUnit, t.gateFee], "context-plot": plotXs.map((x) => total(t, x)), "context-check": [total(t, t.groupSize)] }[phase];
        const keep = Object.fromEntries(keys.map((key, i) => [key, W.eq(q[i], W.q(expected[i]))]));
        if (phase === "context-check") {
          const ok2 = keep.caravanTotal, price = total(t, t.groupSize);
          return result(ok2, "context.toll", ok2 ? `De tol voor ${t.groupSize} karren is ${price} munten: \xE9\xE9n keer ${t.gateFee} voor de poort en ${t.perUnit} per kar.` : "Tel de tol voor alle karren samen. Tel het openen van de poort \xE9\xE9n keer erbij.", keep);
        }
        const ok = Object.values(keep).every(Boolean), messages = {
          "context-start": [`De poort openen kost ${t.gateFee} munten. Dat betaal je \xE9\xE9n keer voor de karavaan.`, "Lees op het tolbord wat de poort openen kost."],
          "context-add": [`E\xE9n kar: ${t.perUnit} munten + ${t.gateFee} voor de poort = ${total(t, 1)} munten.`, "Tel de tol voor \xE9\xE9n kar en het openen van de poort samen."],
          "context-table": [`Een extra kar kost ${t.perUnit} munten extra. De poort gaat maar \xE9\xE9n keer open.`, `E\xE9n kar kost samen ${total(t, 1)} munten. Tel per extra kar ${t.perUnit} erbij.`],
          "context-rule": [`De regel klopt: ${t.perUnit} per kar + \xE9\xE9n keer ${t.gateFee} voor de poort.`, "Het eerste aantal munten hoort bij elke kar. Het openen komt er \xE9\xE9n keer bij."],
          "context-plot": ["De punten tonen de tol voor de karavaan.", "Lees in de tabel de tol bij 1 en bij 3 karren."]
        };
        return result(ok, "context." + phase.slice(8), messages[phase][ok ? 0 : 1], keep);
      }
      function hint(phase, level = 1) {
        const hints = {
          "context-start": ["Wat kost het om de poort te openen?", "Kijk naar het bedrag dat \xE9\xE9n keer voor de karavaan geldt.", "De poort gaat \xE9\xE9n keer open, ongeacht het aantal karren."],
          "context-add": ["Er komt \xE9\xE9n kar door de poort.", "Begin met de tol voor die kar.", "Tel het openen van de poort erbij."],
          "context-table": ["Elke extra kar kost hetzelfde aantal munten.", "Ga vanaf de vorige rij \xE9\xE9n kar verder. Tel de tol voor \xE9\xE9n kar erbij.", "Het openen zit al in de vorige prijs. Tel dat niet opnieuw erbij."],
          "context-check": ["Hoeveel karren heeft jouw karavaan?", "Tel de tol voor alle karren samen.", "Tel het openen van de poort \xE9\xE9n keer erbij."],
          "context-rule": ["Wat betaal je per kar, en wat maar \xE9\xE9n keer?", "Vermenigvuldig de tol per kar met het aantal karren.", "Tel het openen van de poort erbij."],
          "context-plot": ["De tabel vertelt waar je punten komen.", "Onderaan staat het aantal karren. Omhoog lees je de tol in munten.", "Gebruik de tabelrijen bij 1 en bij 3 karren."]
        };
        return hints[phase]?.[Math.max(0, Math.min(2, level - 1))] || "Werk stap voor stap.";
      }
      function enter(m, key) {
        const open = numericFields(m.phase).filter((k) => !m.locks[k]), field = open.includes(m.values.contextField) ? m.values.contextField : open[0];
        if (!field) return null;
        let value = String(m.values[field] ?? "");
        if (key === "back") value = value.slice(0, -1);
        else if (key === "clear") value = "";
        else if (/^[0-9]$/.test(key) && value.length < 3) value += key;
        else return null;
        return { field, value };
      }
      const evidenceSkill = (phase) => phase === "context-plot" ? "graph_from_equation" : "equation_from_context";
      return Object.freeze({ skills, count, scenario, phases, plotXs, firstPhase, nextPhase, fields, numericFields, makeTask, total, check, hint, enter, evidenceSkill });
    });
  }
});

// games/rechten/rechtenwereld/ab-core.js
var require_ab_core = __commonJS({
  "games/rechten/rechtenwereld/ab-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_wave_core(), require_semantic_math_core());
      else root.RechtenV2AB = factory(root.RechtenWave, root.RechtenV2Math);
    })(globalThis, function(W, M) {
      "use strict";
      const skills = ["ab"], count = 6, phases = ["ab-intercept", "ab-slope", "ab-rule"];
      const firstPhase = () => phases[0], nextPhase = (phase) => phases[phases.indexOf(phase) + 1] || "next-task";
      const retainedFields = (phase) => phase === "ab-intercept" ? ["b"] : phase === "ab-slope" ? ["a"] : [];
      const hints = [
        "Begin waar de rechte de verticale y-as raakt. Die hoogte is b.",
        "Op de y-as is x = 0. Zet je eerste punt op de rechte.",
        "Ga vanaf dat punt \xE9\xE9n eenheid naar rechts. Hoeveel moet je omhoog of omlaag om weer op de rechte te komen? Dat is a.",
        "Omhoog geeft een positieve a, omlaag een negatieve a. Bij een horizontale rechte is a = 0. Een halve stap is 0,5 of 1/2.",
        "Ander voorbeeld: van (0; 2) naar (1; 1) ga je \xE9\xE9n omlaag. Dan is a = \u22121, b = 2 en y = \u2212x + 2. Probeer een nieuw geval."
      ];
      function makeTask(skill = "ab", index = 0, run = 1) {
        if (!skills.includes(skill)) throw Error("Onbekende a/b-vaardigheid");
        const [slope, intercept] = [[2, 1], [1, 2], [-1, 3], [0, -2], [0.5, -1], [-0.5, 1]][index % count];
        const model = { kind: "affine", a: W.fromNumber(slope), b: W.q(intercept + [0, 1, -1][(run - 1) % 3]) };
        const tokens = [model.a, model.b, W.q(Math.abs(model.b.n), model.b.d), W.mul(-1, model.a), W.mul(-1, model.b), W.q(0), W.q(1), W.q(2)].map(W.text).filter((v, i, a) => a.indexOf(v) === i);
        let seed = run * 37 + index * 23;
        for (let i = tokens.length - 1; i > 0; i--) {
          seed = seed * 1664525 + 1013904223 >>> 0;
          const j = seed % (i + 1);
          [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
        }
        tokens.push("x", "+", "\u2212");
        return { id: `rechten-v2:signaalstad:ab:${run}:${index}`, world: "signaalstad", skill_id: "ab", family_id: "F3", index, count, model, tokens, gridStep: model.a.d > 1 ? 0.5 : 1, bounds: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }, mode: index === 0 ? "discover" : "practice", variant: !model.a.n ? "horizontal" : model.a.d > 1 ? model.a.n < 0 ? "negative-fraction" : "positive-fraction" : model.a.n < 0 ? "negative" : "positive", given_representations: ["graph"], hints: [...hints] };
      }
      const syntax = (message) => ({ ok: false, kind: "interaction_error", code: "input.missing", message, keep: {} });
      const result = (ok, code, message, keep = {}) => ({ ok, kind: ok ? "correct" : "hypothesis", code: ok ? null : code, message, keep });
      function rule(values) {
        const a = M.parse(values.factor), n = M.parse(values.constant);
        if (!a || !n || values.variable !== "x" || !["+", "\u2212"].includes(values.operator)) return null;
        return { kind: "affine", a, b: W.mul(values.operator === "\u2212" ? -1 : 1, n) };
      }
      function check(t, v, phase) {
        if (phase === "ab-intercept") {
          const b = M.parse(v.b);
          if (!b) return syntax("Plaats je punt op de y-as of vul de hoogte b in.");
          const ok = W.eq(b, t.model.b);
          return result(ok, "intercept.read", ok ? `Je punt (0; ${W.text(b)}) ligt op de rechte. Je hebt b gevonden.` : "Je punt ligt nog niet op de rechte. Zoek het snijpunt met de verticale y-as.", { b: ok });
        }
        if (phase === "ab-slope") {
          const a = M.parse(v.a), b = M.parse(v.b);
          if (!a || !b) return syntax("Maak de verticale stap of vul a in. Een breuk of decimaal mag ook.");
          const aOK = W.eq(a, t.model.a), bOK = W.eq(b, t.model.b), height = W.add(b, a), needed = W.add(t.model.b, t.model.a), ok = aOK && bOK;
          return result(ok, "slope.rate", ok ? `E\xE9n stap x verandert y met ${W.text(a)}. Je hebt a gevonden.` : `Je eindpunt heeft y = ${W.text(height)}. De rechte heeft bij x = 1 hoogte ${W.text(needed)}. Pas je verticale stap aan.`, { a: aOK, b: bOK });
        }
        if (phase === "ab-rule") {
          const candidate = rule(v);
          if (!candidate) return syntax("Vul alle vier de vakjes: getal, x, teken en getal.");
          const aOK = W.eq(candidate.a, t.model.a), bOK = W.eq(candidate.b, t.model.b), ok = aOK && bOK;
          const code = W.eq(candidate.a, t.model.b) && W.eq(candidate.b, t.model.a) ? "param.slope_intercept_swap" : !aOK ? "param.rate" : "param.intercept";
          return result(ok, code, ok ? "Je voorschrift past bij de rechte: a geeft de helling en b de hoogte bij x = 0." : !aOK ? "Zet jouw gemeten a v\xF3\xF3r x. Een juiste constante term blijft staan." : "Controleer het teken en het getal van b. Een juiste a blijft staan.", { factor: aOK, variable: true, operator: bOK, constant: bOK });
        }
        return syntax("Deze stap is niet beschikbaar.");
      }
      function step(m) {
        return m.phase === "ab-intercept" ? 1 : m.task.gridStep;
      }
      function selection(m, y) {
        const name = m.phase === "ab-intercept" ? "b" : m.phase === "ab-slope" ? "a" : null;
        if (!name || !Number.isFinite(y)) return null;
        const origin = name === "a" ? M.parse(m.values.b) : W.q(0);
        if (!origin) return null;
        const height = Math.max(-5, Math.min(5, Math.round(y / step(m)) * step(m)));
        return { name, value: W.text(W.sub(W.fromNumber(height), origin)) };
      }
      function adjust(m, amount) {
        const name = m.phase === "ab-intercept" ? "b" : m.phase === "ab-slope" ? "a" : null;
        if (!name || ![-1, 1].includes(amount)) return null;
        const value = M.parse(m.values[name] || "0"), origin = name === "a" ? M.parse(m.values.b) : W.q(0);
        if (!value || !origin) return null;
        return selection(m, W.num(W.add(origin, value)) + amount * step(m));
      }
      return Object.freeze({ skills, count, phases, firstPhase, nextPhase, retainedFields, makeTask, rule, check, step, selection, adjust });
    });
  }
});

// games/rechten/rechtenwereld/values-core.js
var require_values_core = __commonJS({
  "games/rechten/rechtenwereld/values-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_wave_core(), require_semantic_math_core());
      else root.RechtenV2Values = factory(root.RechtenWave, root.RechtenV2Math);
    })(globalThis, function(W, M) {
      "use strict";
      const skills = ["fx", "table"], count = 6, firstPhase = (skill) => skill === "fx" ? "fx-substitute" : "table-fill";
      const output = (t, x) => W.add(W.mul(t.model.a, x), t.model.b);
      function makeTask(skill, index = 0, run = 1) {
        if (!skills.includes(skill)) throw Error("Onbekende functiewaardevaardigheid");
        const [a, b, x] = [[2, 1, 3], [-1, 3, -2], [3, -2, 0], [0.5, -1, -3], [-0.5, 0, 3], [0, -2, -4]][index % count];
        const model = { kind: "affine", a: W.fromNumber(a), b: W.q(b + [0, 1, -1][(run - 1) % 3]) };
        const inputs = [[-2, -1, 0, 1, 2], [-3, -1, 0, 2, 4], [-2, -1, 0, 3, 5], [-3, -1, 0, 2, 4], [-4, -2, 0, 1, 3], [-3, -1, 0, 2, 5]][index % count].map(W.fromNumber);
        const task = { id: `rechten-v2:signaalstad:${skill}:${run}:${index}`, world: "signaalstad", skill_id: skill, family_id: "F4", index, count, model, x: W.q(x), inputs, givenColumn: 2, mode: index === 0 ? "discover" : "practice", variant: !a ? "constant" : Math.abs(a) < 1 ? a < 0 ? "negative-fraction" : "positive-fraction" : a < 0 ? "negative" : "positive", given_representations: skill === "fx" ? ["formula", "input"] : ["formula", "table"], hints: skill === "fx" ? [
          "Vervang x door de gegeven invoer. Bereken eerst het product en daarna de functiewaarde.",
          "f(x) is de uitvoer van de functie bij invoer x. Het betekent niet f maal x.",
          "Vermenigvuldig eerst de co\xEBffici\xEBnt van x met de invoer. Verwerk daarna de constante term.",
          "Let op de tekens: min maal min wordt plus. Een breuk of decimaal mag ook.",
          "Ander voorbeeld: f(x) = 2x \u2212 1. Bij x = 4 is het product 8 en f(4) = 7. Probeer een nieuw geval."
        ] : [
          "Gebruik het voorschrift voor elke lege cel. Elke kolom heeft haar eigen x-waarde.",
          "Lees x in de bovenste rij. De onderste rij bevat de bijbehorende functiewaarde f(x).",
          "Vermenigvuldig elke x met de co\xEBffici\xEBnt en verwerk daarna de constante term.",
          "Niet alle x-waarden staan \xE9\xE9n stap uit elkaar. Bereken elke cel met het voorschrift.",
          "Ander voorbeeld: bij f(x) = 2x + 1 horen x = \u22121, 0 en 3 bij f(x) = \u22121, 1 en 7. Probeer een nieuw geval."
        ] };
        return task;
      }
      const nextPhase = (phase) => phase === "fx-substitute" ? "fx-calculate" : "next-task";
      const retainedFields = (phase) => phase === "fx-substitute" ? ["substitution"] : [];
      const fields = (t, phase = firstPhase(t.skill_id)) => t.skill_id === "fx" ? phase === "fx-substitute" ? ["substitution"] : ["product", "answer"] : t.inputs.map((_, i) => "cell" + i).filter((_, i) => i !== t.givenColumn);
      const expected = (t, name) => name === "substitution" ? t.x : name === "product" ? W.mul(t.model.a, t.x) : name === "answer" ? output(t, t.x) : output(t, t.inputs[Number(name.slice(4))]);
      function check(t, v, phase) {
        if (!(t.skill_id === "fx" ? ["fx-substitute", "fx-calculate"] : ["table-fill"]).includes(phase)) return { ok: false, kind: "interaction_error", code: "input.phase", message: "Deze stap is niet beschikbaar.", keep: {} };
        const names = fields(t, phase), parsed = Object.fromEntries(names.map((name) => [name, M.parse(v[name])])), keep = Object.fromEntries(names.map((name) => [name, !!parsed[name] && W.eq(parsed[name], expected(t, name))]));
        if (names.some((name) => !parsed[name])) return { ok: false, kind: "interaction_error", code: "input.missing", message: phase === "fx-substitute" ? "Vervang x in de uitdrukking door de gegeven invoer." : t.skill_id === "fx" ? "Vul het product en de functiewaarde in. Een breuk of decimaal mag ook." : "Vul elke lege tabelcel in. Een breuk of decimaal mag ook.", keep };
        const wrong = names.find((name) => !keep[name]);
        let message, code = null;
        if (!wrong) message = phase === "fx-substitute" ? `Juist: je hebt x vervangen door ${W.text(t.x)}. Bereken nu de functiewaarde.` : t.skill_id === "fx" ? `Juist: f(${W.text(t.x)}) = ${W.text(output(t, t.x))}.` : "Juist: alle ingevulde functiewaarden passen bij het voorschrift.";
        else if (phase === "fx-substitute") {
          code = "fx.substitution";
          message = `We zoeken f(${W.text(t.x)}). Vervang dus x door ${W.text(t.x)} in de uitdrukking, v\xF3\xF3r je rekent.`;
        } else if (t.skill_id === "fx") {
          code = wrong === "product" ? "fx.product" : "fx.output";
          message = wrong === "product" ? `Controleer het product: ${W.text(t.model.a)} maal (${W.text(t.x)}). Let op de tekens.` : `Het product klopt. Verwerk nu de constante term ${W.text(t.model.b)} om f(${W.text(t.x)}) te vinden.`;
        } else {
          const x = t.inputs[Number(wrong.slice(4))];
          code = "table.output";
          message = `Controleer de cel bij x = ${W.text(x)}. Gebruik het voorschrift voor juist deze x-waarde. Correcte cellen blijven staan.`;
        }
        return { ok: !wrong, kind: wrong ? "hypothesis" : "correct", code, message, keep };
      }
      function selected(m) {
        const names = fields(m.task, m.phase), name = m.values.valueField;
        return names.includes(name) && !m.locks[name] ? name : names.find((name2) => !m.locks[name2]) || null;
      }
      function editText(raw, key, selection) {
        let value = String(raw ?? ""), start = Math.max(0, Math.min(value.length, selection?.start ?? value.length)), end = Math.max(start, Math.min(value.length, selection?.end ?? start)), caret = start;
        if (key === "clear") {
          value = "";
          caret = 0;
        } else if (key === "back") {
          if (start === end) start = Math.max(0, start - 1);
          value = value.slice(0, start) + value.slice(end);
          caret = start;
        } else if (key === "minus") {
          const signed = value.startsWith("-") || value.startsWith("\u2212");
          value = signed ? value.slice(1) : "-" + value;
          caret = Math.max(0, start + (signed ? -1 : 1));
        } else if (/^[0-9]$/.test(key) || key === "/" || key === ",") {
          value = value.slice(0, start) + key + value.slice(end);
          caret = start + 1;
        } else return null;
        return value.length <= 16 ? { value, caret } : null;
      }
      function enter(m, key, selection) {
        if (m.feedback || m.completed) return null;
        const name = selected(m);
        if (!name) return null;
        const next = editText(m.values[name], key, selection);
        return next ? selection ? { name, ...next } : { name, value: next.value } : null;
      }
      return Object.freeze({ skills, count, firstPhase, nextPhase, retainedFields, makeTask, fields, output, expected, check, selected, enter, editText });
    });
  }
});

// games/rechten/rechtenwereld/checks-core.js
var require_checks_core = __commonJS({
  "games/rechten/rechtenwereld/checks-core.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_wave_core(), require_semantic_math_core(), require_values_core());
      else root.RechtenV2Checks = factory(root.RechtenWave, root.RechtenV2Math, root.RechtenV2Values);
    })(globalThis, function(W, M, V) {
      "use strict";
      const skills = ["input_from_output", "point_on_line"], count = 6;
      const output = (t, x) => W.add(W.mul(t.model.a, x), t.model.b);
      function makeTask(skill, index = 0, run = 1) {
        if (!skills.includes(skill)) throw Error("Onbekende controlevaardigheid");
        const offset = [0, 1, -1][(run - 1) % 3], inverse = skill === "input_from_output";
        const [a, b, x, y] = inverse ? [[2, 1, 0, 9], [-3, 2, 0, 11], [2, -1, 0, 0], [-0.5, -2, 0, -3.5], [0, 3, 0, 3], [0, -2, 0, 1]][index % count] : [[2, 1, 2, 5], [-1, 3, -2, 4], [0.5, -1, -3, -2.5], [-0.5, 0, 3, -1], [0, -2, 4, -2], [0, 2, -3, 3]][index % count];
        const model = { kind: "affine", a: W.fromNumber(a), b: W.fromNumber(b + offset) }, target = W.fromNumber(y + offset), point = { x: W.fromNumber(x), y: target };
        const solution = a ? W.div(W.sub(target, model.b), model.a) : null;
        const variant = inverse ? a ? solution.d > 1 ? "fraction" : solution.n < 0 ? "negative" : "integer" : W.eq(target, model.b) ? "all" : "none" : (!a ? "constant-" : "") + (W.eq(output({ model }, point.x), point.y) ? "on" : "off");
        return { id: `rechten-v2:signaalstad:${skill}:${run}:${index}`, world: "signaalstad", skill_id: skill, family_id: "F4", index, count, model, target, point, solution, variant, mode: index === 0 ? "discover" : "practice", given_representations: inverse ? ["formula", "output"] : ["formula", "point"], hints: inverse ? [
          "De functiewaarde is gegeven. Welke invoer x levert die waarde op?",
          "Vervang f(x) door de gegeven functiewaarde. x blijft onbekend.",
          a ? "Werk eerst de constante term weg aan beide kanten. Deel daarna door de co\xEBffici\xEBnt van x." : "Bij a = 0 is de functiewaarde altijd b. Vergelijk die vaste waarde met de gevraagde uitvoer.",
          a ? "Controleer je gevonden x door die in het oorspronkelijke voorschrift in te vullen." : "Een constante functie levert de gevraagde uitvoer voor elke x of voor geen enkele x.",
          "Ander voorbeeld: f(x) = 2x + 3 en f(x) = 11. Dan 2x = 8, dus x = 4. Controle: 2 \xB7 4 + 3 = 11. Probeer een nieuw geval."
        ] : [
          "Voer de x-co\xF6rdinaat van het punt in. Vergelijk de uitkomst met zijn y-co\xF6rdinaat.",
          "In P = (x; y) staat de invoer eerst en de hoogte daarna.",
          "Bereken eerst het product a \xB7 x en verwerk dan de constante term b.",
          "Een punt ligt precies op de rechte als f(x) gelijk is aan zijn y-co\xF6rdinaat. Bijna gelijk is niet genoeg.",
          "Ander voorbeeld: f(x) = 2x + 1 en P = (3; 8). f(3) = 7. Omdat 7 niet gelijk is aan 8, ligt P niet op de rechte. Probeer een nieuw geval."
        ] };
      }
      const firstPhase = (skill) => skill === "input_from_output" ? "input-equation" : "point-substitute";
      const phases = (t) => t.skill_id === "input_from_output" ? ["input-equation", ...t.model.a.n ? ["input-isolate", "input-solve", "input-verify"] : ["input-constant"]] : ["point-substitute", "point-calculate", "point-verdict"];
      function nextPhase(t, phase) {
        const p = phases(t);
        return p[p.indexOf(phase) + 1] || "next-task";
      }
      const fields = (t, phase = firstPhase(t.skill_id)) => ({ "input-equation": ["givenOutput"], "input-isolate": ["residual"], "input-solve": ["input"], "input-verify": ["verification"], "input-constant": ["constantValue", "solutions"], "point-substitute": ["substitution"], "point-calculate": ["product", "answer"], "point-verdict": ["verdict"] })[phase] || [];
      const numericFields = (t, phase) => fields(t, phase).filter((name) => !["solutions", "verdict"].includes(name));
      function expected(t, name) {
        switch (name) {
          case "givenOutput":
          case "verification":
            return t.target;
          case "residual":
            return W.sub(t.target, t.model.b);
          case "input":
            return t.solution;
          case "constantValue":
            return t.model.b;
          case "solutions":
            return W.eq(t.target, t.model.b) ? "all" : "none";
          case "substitution":
            return t.point.x;
          case "product":
            return W.mul(t.model.a, t.point.x);
          case "answer":
            return output(t, t.point.x);
          case "verdict":
            return W.eq(output(t, t.point.x), t.point.y) ? "on" : "off";
          default:
            return null;
        }
      }
      function check(t, v, phase) {
        if (!phases(t).includes(phase)) return { ok: false, kind: "interaction_error", code: "input.phase", message: "Deze stap is niet beschikbaar.", keep: {} };
        const names = fields(t, phase), numeric = numericFields(t, phase), parsed = Object.fromEntries(names.map((name) => [name, numeric.includes(name) ? M.parse(v[name]) : ["on", "off", "all", "none"].includes(v[name]) ? v[name] : null]));
        const keep = Object.fromEntries(names.map((name) => [name, !!parsed[name] && (numeric.includes(name) ? W.eq(parsed[name], expected(t, name)) : parsed[name] === expected(t, name))]));
        if (names.some((name) => !parsed[name])) return { ok: false, kind: "interaction_error", code: "input.missing", message: phase === "point-verdict" ? "Vergelijk de twee waarden en kies of P op de rechte ligt." : phase === "input-constant" ? "Vul de vaste functiewaarde in en kies hoeveel x-waarden mogelijk zijn." : "Vul elk antwoordvak van deze stap in. Een breuk of decimaal mag ook.", keep };
        const wrong = names.find((name) => !keep[name]), messages = {
          givenOutput: "De functiewaarde is gegeven. Vul die in voor f(x); x blijft de onbekende.",
          residual: `Werk de constante term ${W.text(t.model.b)} weg aan beide kanten. Bereken de gegeven uitvoer min b.`,
          input: `Deel beide kanten door ${W.text(t.model.a)} om x alleen over te houden. Let op het teken.`,
          verification: "Vul je gevonden x terug in het oorspronkelijke voorschrift. Bereken eerst het product, daarna de constante term.",
          constantValue: "Bij a = 0 is het product 0 voor elke x. De functiewaarde is dus altijd b.",
          solutions: "Vergelijk de vaste functiewaarde met de gevraagde uitvoer. Gelijk: elke x is mogelijk. Verschillend: geen enkele x is mogelijk.",
          substitution: "Vervang x door de eerste co\xF6rdinaat van P. De tweede co\xF6rdinaat is de y-waarde waarmee je straks vergelijkt.",
          product: "Controleer het product a \xB7 x met de x-co\xF6rdinaat van P. Let op de tekens.",
          answer: "Het product klopt. Verwerk nu de constante term om f(x) te vinden.",
          verdict: "Vergelijk jouw berekende f(x) met de gegeven y-co\xF6rdinaat. Alleen bij exact gelijke waarden ligt P op de rechte."
        };
        const success = {
          "input-equation": "Juist: je hebt de gegeven uitvoer ingevuld. Zoek nu welke x daarbij hoort.",
          "input-isolate": "Juist: de constante term is weggewerkt. Deel nu om x te vinden.",
          "input-solve": "Juist: je hebt x gevonden. Controleer die in het oorspronkelijke voorschrift.",
          "input-verify": `Juist: de controle levert ${W.text(t.target)} op, de gevraagde functiewaarde.`,
          "input-constant": W.eq(t.target, t.model.b) ? "Juist: de uitvoer is altijd de gevraagde waarde. Elke x is mogelijk." : "Juist: de vaste uitvoer verschilt van de gevraagde waarde. Er is geen passende x.",
          "point-substitute": "Juist: de x-co\xF6rdinaat staat op de plaats van x. Bereken nu f(x).",
          "point-calculate": "Juist: je hebt f(x) berekend. Vergelijk die nu met de y-co\xF6rdinaat van P.",
          "point-verdict": W.eq(output(t, t.point.x), t.point.y) ? "Juist: f(x) en de y-co\xF6rdinaat zijn gelijk. P ligt op de rechte." : "Juist: f(x) en de y-co\xF6rdinaat verschillen. P ligt niet op de rechte."
        };
        return { ok: !wrong, kind: wrong ? "hypothesis" : "correct", code: wrong ? "check." + wrong : null, message: wrong ? messages[wrong] : success[phase], keep };
      }
      function selected(m) {
        const names = numericFields(m.task, m.phase), name = m.values.valueField;
        return names.includes(name) && !m.locks[name] ? name : names.find((name2) => !m.locks[name2]) || null;
      }
      function enter(m, key, selection) {
        if (m.feedback || m.completed) return null;
        const name = selected(m);
        if (!name) return null;
        const next = V.editText(m.values[name], key, selection);
        return next ? selection ? { name, ...next } : { name, value: next.value } : null;
      }
      return Object.freeze({ skills, count, makeTask, output, firstPhase, phases, nextPhase, fields, numericFields, expected, check, selected, enter });
    });
  }
});

// games/rechten/rechtenwereld/mission-runtime.js
var require_mission_runtime = __commonJS({
  "games/rechten/rechtenwereld/mission-runtime.js"(exports, module) {
    (function(root, factory) {
      if (typeof module === "object") module.exports = factory(require_semantic_math_core(), require_evidence_adapter(), require_points_core(), require_hills_core(), require_grens_core(), require_formula_core(), require_derive_core(), require_context_core(), require_ab_core(), require_values_core(), require_checks_core());
      else root.RechtenV2Runtime = factory(root.RechtenV2Math, root.RechtenV2Evidence, root.RechtenV2Points, root.RechtenV2Hills, root.RechtenV2Grens, root.RechtenV2Formula, root.RechtenV2Derive, root.RechtenV2Context, root.RechtenV2AB, root.RechtenV2Values, root.RechtenV2Checks);
    })(globalThis, function(M, E, P, H, G, F, D, X, B, V, K) {
      "use strict";
      const clone = (v) => JSON.parse(JSON.stringify(v));
      const context = (skill) => !!X?.skills.includes(skill), ab = (skill) => !!B?.skills.includes(skill);
      const values = (skill) => !!V?.skills.includes(skill), checks = (skill) => !!K?.skills.includes(skill);
      const WORLDS = ["grenspas", "hellingrug", "signaalstad", "puntenbaai", "formulewerf"];
      const initial = () => ({ schema: 1, screen: "world", active: null, missions: {}, events: [], settings: { reducedMotion: false } });
      const variants = { grenspas: [0, 1, 2, 3], hellingrug: [0, 1], signaalstad: [0, 1] };
      function mission(world, run = 1, index = 0, skill = "point") {
        if (world === "puntenbaai" || H.skills.includes(skill) || G.skills.includes(skill) || (F.skills.includes(skill) || D.skills.includes(skill) || context(skill) || ab(skill) || values(skill) || checks(skill))) {
          const task2 = (world === "puntenbaai" ? P : checks(skill) ? K : values(skill) ? V : ab(skill) ? B : context(skill) ? X : D.skills.includes(skill) ? D : F.skills.includes(skill) ? F : G.skills.includes(skill) ? G : H).makeTask(skill, index, run);
          return { world, skill, run, index, variant: task2.variant, task: task2, phase: world === "puntenbaai" ? "coordinate" : checks(skill) ? K.firstPhase(skill) : values(skill) ? V.firstPhase(skill) : ab(skill) ? B.firstPhase() : context(skill) ? X.firstPhase() : D.skills.includes(skill) ? D.firstPhase(skill) : F.skills.includes(skill) ? F.firstPhase(skill) : G.skills.includes(skill) ? G.firstPhase(skill) : H.firstPhase(skill, task2), values: {}, history: [], locks: {}, hints: 0, hintOpen: false, errors: 0, revealed: [], attempt: 0, feedback: null, completed: false, completion: null };
        }
        const variant = variants[world][index], task = M.makeTask(world, { variant, seed: 1, mode: index === 0 ? "discover" : "evidence" });
        return { world, run, index, variant, task, phase: world === "grenspas" ? index === 0 ? "root" : "interval" : world === "hellingrug" ? "deltas" : "probe", values: { direction: "AB", probe: "zero", pins: ["formula", "graph"] }, history: [], locks: {}, hints: 0, hintOpen: false, errors: 0, revealed: [], attempt: 0, feedback: null, completed: false, completion: null };
      }
      function active(state) {
        return state.missions[state.active];
      }
      function upgradeContext(source) {
        const s = clone(source), key = "equation_from_context", old = s.missions?.[key];
        if (old && old.task?.scenario !== X.scenario) {
          s.contextArchive ||= {};
          let archiveKey = old.task?.scenario || "scoreInvestigation";
          if (s.contextArchive[archiveKey]) archiveKey += ":run" + (old.run || 1) + ":" + Object.keys(s.contextArchive).length;
          s.contextArchive[archiveKey] = clone(old);
          const next = mission("formulewerf", (old.run || 0) + 1, 0, key);
          s.missions[key] = next;
        }
        return s;
      }
      function start(state, world, restart = false, skill = "point") {
        if (world === "formulewerf" && skill === "point") skill = F.skills[0];
        if (F.skills.includes(world) || D.skills.includes(world) || context(world) || ab(world) || values(world) || checks(world)) {
          skill = world;
          world = F.skills.includes(skill) ? F.worldFor(skill) : ab(skill) || values(skill) || checks(skill) ? "signaalstad" : "formulewerf";
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
        const s = context(skill) ? upgradeContext(state) : clone(state);
        const key = world === "puntenbaai" || H.skills.includes(skill) || G.skills.includes(skill) || (F.skills.includes(skill) || D.skills.includes(skill) || context(skill) || ab(skill) || values(skill) || checks(skill)) ? skill : world;
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
          if (context(m.skill)) {
            m.contextHints ||= {};
            m.contextHints[m.phase] = Math.min(3, (m.contextHints[m.phase] || 0) + 1);
          }
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
        if (checks(m.skill)) {
          result = K.check(m.task, m.values, m.phase);
          next = K.nextPhase(m.task, m.phase);
        } else if (values(m.skill)) {
          result = V.check(m.task, m.values, m.phase);
          next = V.nextPhase(m.phase);
        } else if (ab(m.skill)) {
          result = B.check(m.task, m.values, m.phase);
          next = B.nextPhase(m.phase);
        } else if (context(m.skill)) {
          result = X.check(m.task, m.values, m.phase);
          next = X.nextPhase(m.skill, m.phase);
        } else switch (m.phase) {
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
        const evidence = E.record(s, { taskId: m.task.id + ":run" + m.run, attemptId: `${m.phase}:${m.attempt}`, skill: context(m.skill) ? X.evidenceSkill(m.phase) : ["root", "grens-root"].includes(m.phase) ? "zeroRead" : m.task.skill_id, phase, correct: result.ok, mode: m.task.mode, helpLevel: m.hints, supported: priorErrors > 0, feedbackSeen: m.revealed.includes(m.phase), misconception: result.ok ? null : result.code, errorKind: semantic ? null : result.kind, variant: m.task.variant, representation: m.world === "signaalstad" && m.values.pins ? m.values.pins.join("+") : m.task.given_representations.join("+"), revision: m.attempt });
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
          if (context(m.skill)) m.values.contextField = X.fields(m.phase).find((k) => !m.locks[k]) || "";
          if (["formula-build", "ab-rule"].includes(m.phase)) m.values.formulaSlot = F.slots.find((k) => !m.locks[k]) || "factor";
          if (values(m.skill)) m.values.valueField = V.selected(m) || "";
          if (checks(m.skill)) m.values.valueField = K.selected(m) || "";
          if (m.phase === "grens-chart") m.values.chartSlot = G.slots.find((k) => !m.locks[k]) || "chartLeft";
          m.feedback = null;
          return s;
        }
        if (next === "next-task") {
          const done = { taskId: m.task.id, supported: m.hints > 0 || m.errors > 0 || m.task.mode === "discover", variant: m.variant };
          if (m.index + 1 < (m.world === "puntenbaai" ? P.count : H.skills.includes(m.skill) ? H.taskCount(m.skill) : G.skills.includes(m.skill) ? G.count : context(m.skill) ? X.count : D.skills.includes(m.skill) ? D.count : F.skills.includes(m.skill) ? F.count : checks(m.skill) ? K.count : values(m.skill) ? V.count : ab(m.skill) ? B.count : variants[m.world].length)) {
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
        } else if (checks(m.skill)) {
          for (const k of K.fields(m.task, m.phase)) m.locks[k] = true;
          m.history = [];
          m.phase = next;
          m.feedback = null;
          m.hintOpen = false;
          m.values.valueField = K.numericFields(m.task, next)[0] || "";
        } else if (values(m.skill)) {
          for (const k of V.retainedFields(m.phase)) m.locks[k] = true;
          m.history = [];
          m.phase = next;
          m.feedback = null;
          m.hintOpen = false;
          m.values.valueField = V.fields(m.task, next)[0];
        } else if (ab(m.skill)) {
          for (const k of B.retainedFields(m.phase)) m.locks[k] = true;
          m.history = [];
          m.phase = next;
          m.feedback = null;
          m.hintOpen = false;
          if (next === "ab-rule") m.values.formulaSlot = "factor";
        } else if (context(m.skill)) {
          for (const k of X.fields(m.phase)) m.locks[k] = true;
          m.history = [];
          m.phase = next;
          m.feedback = null;
          m.values.contextField = X.fields(next)[0];
          m.hintOpen = false;
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
        if (m.world !== "puntenbaai" && !H.skills.includes(m.skill) && !G.skills.includes(m.skill) && !F.skills.includes(m.skill) && !D.skills.includes(m.skill) && !context(m.skill) && !ab(m.skill) && !values(m.skill) && !checks(m.skill)) next.task = M.makeTask(m.world, { variant: m.variant + 1, seed: 2, mode: "practice" });
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
        if (!m || !["formula-build", "ab-rule"].includes(m.phase) || m.feedback || m.completed || !F.slots.includes(slot) || m.locks[slot] || !m.task.tokens.includes(token)) return s;
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
      function battle(world, skill, seed, variant, { fullSequence = false } = {}) {
        const s = initial();
        s.active = skill;
        s.screen = "mission";
        s.missions[skill] = mission(world, 1 + (seed >>> 0) % 97, variant % (fullSequence ? H.skills.includes(skill) ? H.taskCount(skill) : 6 : 4), skill);
        s.settings = { reducedMotion: true, autoAdvance: false, shell: { area: world } };
        return s;
      }
      return Object.freeze({ upgradeContext, battle, selectTableColumn, putDeriveToken, selectDerivePoint, putFormulaToken, operateFormula, putSign, placeLinePoint, clearLinePoints, beginHills, putCoordinate, initial, start, active, edit, undo, hint, commit, advance, newAfterExample, worlds: WORLDS });
    });
  }
});

// games/rechten/rechtenwereld/battle-config.js
var require_battle_config5 = __commonJS({
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
          node("intercept", "Snijpunt met de y-as aflezen", "Snijpunt met<br>de y-as", 18, 30, { playable: true, soloOnly: true }),
          node("ab", "a en b herkennen", "a en b<br>herkennen", 39, 30, { playable: true, soloOnly: true }),
          node("fx", "Functiewaarde f(x)", "Bereken<br>f(x)", 60, 30, { playable: true, soloOnly: true }),
          node("table", "Tabel aanvullen", "Tabel<br>aanvullen", 81, 30, { playable: true, soloOnly: true }),
          node("input_from_output", "Welke x hoort bij deze functiewaarde?", "Welke x bij<br>deze f(x)?", 73, 61, { playable: true, soloOnly: true }),
          node("point_on_line", "Ligt dit punt op de rechte?", "Punt op<br>de rechte?", 50, 61, { playable: true, soloOnly: true }),
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
          node("equation_from_context", "Voorschrift uit context \xB7 De tolpoort", "Voorschrift<br>uit context", 31, 66, { culmination: true, playable: true, soloOnly: true })
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
      function statuses(state, id, legacy, account) {
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
        const formulaDone = (n) => (id === "formulewerf" || id === "signaalstad" && ["graph_from_table", "intercept", "ab", "fx", "table", "input_from_output", "point_on_line"].includes(n.id)) && n.playable && (!!state.missions?.[n.id]?.completed || !!state.events?.some((e) => e.correct && e.skill === n.id && e.taskId?.startsWith("rechten-v2:" + id + ":" + n.id + ":") && /:5:run\d+$/.test(e.taskId) && e.attemptId?.startsWith({ input_from_output: "input-constant:", point_on_line: "point-verdict:", fx: "fx-calculate:", table: "table-fill:", ab: "ab-rule:", intercept: "formula-read:", graph_from_table: "formula-plot:", equation_from_ab: "formula-build:", graph_from_equation: "formula-plot:", equation_from_graph: "formula-read:", rewrite_linear_equation: "formula-rewrite:", intercept_from_point: "derive-intercept:", equation_from_point_slope: "derive-formula:", equation_from_two_points: "derive-formula:", equation_from_table: "derive-formula:" }[n.id])));
        const contextDone = (n) => n.id === "equation_from_context" && (!!state.missions?.[n.id]?.completed || Object.values(state.contextArchive || {}).some((m) => m?.skill === "equation_from_context" && m.completed) || !!state.events?.some((e) => e.correct && e.taskId?.startsWith("rechten-v2:formulewerf:equation_from_context:") && (e.attemptId?.startsWith("context-fair:") || e.attemptId?.startsWith(e.representation?.split("+").some((r) => r === "tickets" || r === "carts") ? "context-plot:" : "context-check:"))));
        const completed = (n) => contextDone(n) || formulaDone(n) || grensDone(n) || hillDone(n) || pointsDone(n) || (n.key === "positive" ? positiveDone(state) || !!(s && W.ready(s, n.id)) : n.id === "zeroRead" ? !!state.events?.some((e) => e.skill === "zeroRead" && e.correct && !e.taskId?.startsWith("rechten-v2:grenspas:")) || !!(s && W.ready(s, n.id)) : !!(s && W.ready(s, n.id)));
        const released = (n) => !!n.playable;
        const open = unlocked(state, id, legacy, account);
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
      function unlocked(state, id, legacy, account) {
        if (account?.role === "teacher") return true;
        id = canonical(id);
        if (id === "puntenbaai" || id === "hellingrug" || !prerequisite[id]) return true;
        if (touched(state, id, legacy)) return true;
        return statuses(state, prerequisite[id], legacy).complete;
      }
      function recommendation(state, legacy, account) {
        const active = state.missions?.[state.active];
        const result = (id, node2, resume = false) => ({ id, node: node2, resume, zone: get(id).zones.find((z) => z.nodes.some((n) => n.key === node2?.key))?.id || get(id).zones[0].id });
        if (active && !active.completed && unlocked(state, active.world, legacy, account)) {
          const summary = statuses(state, active.world, legacy, account), node2 = summary.nodes.find((n) => n.key === state.active && n.playable && n.state !== "locked");
          if (node2) return result(active.world, node2, true);
        }
        for (const id of routeOrder) {
          const summary = statuses(state, id, legacy, account);
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
    var Game = require_battle_config5();
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

// games/vectoren/vector-core.js
var require_vector_core = __commonJS({
  "games/vectoren/vector-core.js"(exports, module) {
    (function(root) {
      "use strict";
      const EPS = 1e-8, point = (x, y) => ({ x, y }), vec = (dx, dy) => ({ dx, dy });
      const add = (a, b) => vec(a.dx + b.dx, a.dy + b.dy), scale = (a, k) => vec(a.dx * k, a.dy * k), subtract = (a, b) => add(a, scale(b, -1));
      const vectorFromPoints = (a, b) => vec(b.x - a.x, b.y - a.y), endPointFromVector = (a, v) => point(a.x + v.dx, a.y + v.dy);
      const samePoint = (a, b) => !!a && !!b && Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS;
      const vectorEquals = (a, b) => !!a && !!b && Math.abs(a.dx - b.dx) < EPS && Math.abs(a.dy - b.dy) < EPS;
      const dot = (a, b) => a.dx * b.dx + a.dy * b.dy, cross = (a, b) => a.dx * b.dy - a.dy * b.dx, length = (a) => Math.hypot(a.dx, a.dy);
      const isZero = (a) => length(a) < EPS, isParallel = (a, b) => !isZero(a) && !isZero(b) && Math.abs(cross(a, b)) < EPS;
      const isOpposite = (a, b) => vectorEquals(a, scale(b, -1));
      const scalarFactor = (a, b) => isZero(b) ? isZero(a) ? 0 : null : Math.abs(cross(a, b)) < EPS ? dot(a, b) / dot(b, b) : null;
      const isScalarMultiple = (a, b) => scalarFactor(a, b) !== null;
      const sum = (vs) => vs.reduce(add, vec(0, 0));
      const stroke = (start, end, role = "vector") => ({ start, end, ...vectorFromPoints(start, end), role });
      const recognizeAgainstReferences = (v, refs) => refs.map((r) => ({ name: r.name, factor: scalarFactor(v, r.v) })).filter((r) => r.factor !== null);
      const VectorMath = { point, vec, add, subtract, scale, vectorFromPoints, endPointFromVector, samePoint, vectorEquals, isOpposite, isParallel, isScalarMultiple, scalarFactor, dot, cross, length, isZero, sum, stroke, recognizeAgainstReferences };
      function parseNumber(value) {
        const s = String(value).trim().replaceAll("\u2212", "-").replace(",", ".");
        if (!s) return NaN;
        const parts = s.split("/");
        if (parts.length > 2 || parts.some((p) => !/^[-+]?\d+(?:\.\d+)?$/.test(p))) return NaN;
        const n = Number(parts[0]), d = parts.length === 2 ? Number(parts[1]) : 1;
        return d ? n / d : NaN;
      }
      function format(n) {
        if (Math.abs(n - Math.round(n)) < EPS) return String(Math.round(n)).replace("-", "\u2212");
        for (const d of [2, 3, 4, 5, 6, 8]) if (Math.abs(n * d - Math.round(n * d)) < EPS) return `${Math.round(n * d)}/${d}`.replace("-", "\u2212");
        return String(Math.round(n * 1e3) / 1e3).replace(".", ",").replace("-", "\u2212");
      }
      const coord = (v) => `(${format(v.dx)}, ${format(v.dy)})`;
      function diagnose(v, target, t = {}) {
        if (vectorEquals(v, vec(target.dy, target.dx)) && !vectorEquals(v, target)) return ["xy", "Je x- en y-component zijn verwisseld. Eerst horizontaal (x), dan verticaal (y)."];
        if (isOpposite(v, target)) return [t.skill === "ab" ? "ba" : "opposite", t.skill === "ab" ? "Je berekende A \u2212 B. Voor AB vertrek je in A: neem eindpunt B min beginpunt A." : "De lengte en richting kloppen, maar de zin is omgekeerd."];
        if (t.factor !== void 0 && t.source && (Math.abs(v.dx - target.dx) < EPS && Math.abs(v.dy - t.source.dy) < EPS || Math.abs(v.dy - target.dy) < EPS && Math.abs(v.dx - t.source.dx) < EPS)) return ["one-component", "Vermenigvuldig beide componenten met dezelfde factor."];
        if (isParallel(v, target)) return ["scale", "De richting klopt. Controleer de lengte en het teken van de factor."];
        if (Math.abs(v.dx - target.dx) < EPS || Math.abs(v.dy - target.dy) < EPS) return ["sign", "E\xE9n component klopt al. Controleer het teken en de verplaatsing van de andere."];
        return ["direction", "Vergelijk de horizontale en verticale verplaatsing, niet de plaats van de pijl."];
      }
      const outcome = (RESULT_OK, METHOD_OK, code, message) => ({ RESULT_OK, METHOD_OK, ok: RESULT_OK && METHOD_OK, code, message });
      const ok = (message) => outcome(true, true, "correct", message || "Goed: jouw constructie klopt.");
      const fail = (code, message, result = false) => outcome(result, false, code, message);
      function findChain(lines, start, parts, ordered = false) {
        function visit(p, remaining, path, unused) {
          if (!remaining.length) return path;
          for (const i of unused) {
            const line = lines[i];
            if (!samePoint(line.start, p)) continue;
            for (let j = 0; j < remaining.length; j++) {
              if (ordered && j > 0) break;
              if (!vectorEquals(line, remaining[j])) continue;
              const rest = remaining.filter((_, k) => k !== j), answer = visit(line.end, rest, [...path, line], unused.filter((k) => k !== i));
              if (answer) return answer;
            }
          }
          return null;
        }
        return visit(start, parts, [], lines.map((_, i) => i));
      }
      function validate(t, answer) {
        const lines = (answer.strokes || []).slice(0, 24), vectors = lines, results = lines;
        if (t.interaction === "choice") {
          const chosen = t.options?.[answer.choice];
          if (!chosen) return fail("input", "Kies eerst een antwoord.");
          if (vectorEquals(chosen, t.target)) return ok(t.choiceFormat === "coordinates" ? `Goed: a = ${coord(t.target)}.` : "Goed. Lengte, richting en zin kloppen.");
          const [code, message] = diagnose(chosen, t.target, t);
          return fail(code, message);
        }
        if (t.interaction === "number") {
          const v = vec(parseNumber(answer.values?.[0]), parseNumber(answer.values?.[1]));
          if (!Number.isFinite(v.dx) || !Number.isFinite(v.dy)) return fail("input", "Vul beide componenten in. Een breuk zoals \u22121/2 mag ook.");
          if (vectorEquals(v, t.target)) return ok(`${t.answerLabel || "r"} = ${coord(t.target)}. ${t.success || ""}`);
          const [code, message] = diagnose(v, t.target, t);
          return fail(code, message);
        }
        if (t.interaction === "point") return samePoint(answer.point, t.targetPoint) ? ok(`Punt ${t.pointName || "P"} staat goed. Een punt geeft een plaats aan.`) : fail("point", "Controleer het beginpunt en de totale verplaatsing naar je eindpunt.");
        if (!lines.length) return fail("empty", "Teken eerst: tik een beginpunt en een eindpunt, of sleep ertussen.");
        if (t.policy === "properties") {
          const l = lines[lines.length - 1];
          if (!samePoint(l.start, t.start)) return fail("start", "De verplaatsing moet deze keer vanuit P vertrekken.");
          const valid = t.property === "length" ? isParallel(l, t.source) && dot(l, t.source) > 0 && length(l) > length(t.source) + EPS : t.property === "direction" ? Math.abs(length(l) - length(t.source)) < EPS && !isParallel(l, t.source) : vectorEquals(l, scale(t.source, -1));
          return valid ? ok(t.property === "direction" ? "De richting is veranderd en de lengte is behouden. Bij niet-evenwijdige pijlen vergelijken we de zin niet." : "De gevraagde eigenschap veranderde; de andere eigenschappen bleven behouden.") : fail("property", t.property === "length" ? "Maak langer; behoud richting en zin." : t.property === "direction" ? "Behoud de lengte, maar kies een andere richting." : "Behoud lengte en richting; keer alleen de zin om.");
        }
        if (t.policy === "decompose") {
          if (vectors.length !== 2) return fail("components", "Teken precies twee componenten, \xE9\xE9n volgens elke gegeven richting.");
          const [a, b] = vectors, [d, e] = t.dirs, along = (v, dir) => isZero(v) || isParallel(v, dir);
          const directions = along(a, d) && along(b, e) || along(a, e) && along(b, d);
          const result2 = vectorEquals(add(a, b), t.target);
          if (!directions) return fail("component-direction", "Gebruik beide gegeven richtingen. Een component mag ook de tegengestelde zin hebben.", result2);
          if (!result2) return fail("component-sum", "De richtingen kloppen. Hun som moet nog dezelfde verplaatsing als r geven.");
          return ok(`De twee componenten geven samen r = ${coord(t.target)}.`);
        }
        if (t.policy === "commute") {
          const left = findChain(vectors, t.start, t.parts, true), right = findChain(vectors, t.secondStart, [...t.parts].reverse(), true);
          if (!left || !right) return fail("routes", "Construeer links u gevolgd door v, en rechts v gevolgd door u.");
          return ok("u + v = v + u. De gebroken routes verschillen; hun totale verplaatsing is dezelfde.");
        }
        const targetEnd = endPointFromVector(t.start, t.target);
        const result = (t.policy === "free" ? lines : results).find((s) => samePoint(s.start, t.start) && samePoint(s.end, targetEnd));
        if (t.policy === "free") {
          if (result) return ok(t.success || "Goed. De vector klopt, onafhankelijk van de gekozen tussenstappen.");
          if (t.acceptChain) {
            const queue = [t.start], seen = /* @__PURE__ */ new Set([`${t.start.x},${t.start.y}`]);
            while (queue.length) {
              const p = queue.shift();
              for (const l2 of lines) {
                if (!samePoint(l2.start, p) || !t.refs.some((r) => isScalarMultiple(l2, r.v))) continue;
                if (samePoint(l2.end, targetEnd)) return ok("Goed. Je opeenvolgende veelvouden geven precies de gevraagde verplaatsing.");
                const key = `${l2.end.x},${l2.end.y}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  queue.push(l2.end);
                }
              }
            }
          }
          const l = lines[lines.length - 1];
          if (vectorEquals(l, t.target) && !samePoint(l.start, t.start)) return fail("start", "De vector zelf klopt. Teken hem nu vanuit het gevraagde beginpunt.");
          const [code, message] = diagnose(l, t.target, t);
          return fail(code, message);
        }
        if (t.policy === "parallelogram") {
          const [u, v] = t.parts, a = endPointFromVector(t.start, u), b = endPointFromVector(t.start, v);
          const sides = vectors.some((l) => samePoint(l.start, a) && vectorEquals(l, v)) && vectors.some((l) => samePoint(l.start, b) && vectorEquals(l, u));
          if (result && !sides) return fail("parallelogram", "De resultante klopt. Toon ook beide evenwijdige kopie\xEBn van de zijden.", true);
          if (sides && !result) return fail("resultant", "De parallellogramconstructie klopt. Teken de resultante vanuit P naar de overstaande hoek.");
          return sides && result ? ok("De diagonaal en beide parallelle kopie\xEBn kloppen.") : fail("parallelogram", "Kopieer elke vector vanaf de kop van de andere. Voeg daarna de diagonaal vanuit P toe.");
        }
        if (t.policy === "headtail" || t.policy === "ordered") {
          const chain = findChain(vectors, t.start, t.parts, t.policy === "ordered");
          if (chain && result) return ok(t.policy === "ordered" ? "De gevraagde volgorde \xE9n de resultante kloppen." : "Goed. Beide volgordes geven dezelfde somvector.");
          if (result && t.policy === "ordered" && findChain(vectors, t.start, t.parts)) return fail("order", "Je somvector klopt. Deze keer wilden we u eerst en daarna v.", true);
          if (chain) return fail("resultant", "Je route klopt. Teken de resultante van het begin van de hele ketting naar haar eindpunt.");
          if (t.parts.every((p) => vectors.some((l) => vectorEquals(l, p)))) return fail("headtail", "De losse vectoren kloppen. Leg de staart van de volgende aan de kop van de vorige.", !!result);
          return fail("route", result ? "Je somvector klopt. Toon nu ook de gevraagde kop-staartconstructie." : "Controleer de vectoren in je route: lengte, richting en zin.", !!result);
        }
        return fail("task", "Deze oefening kon niet worden beoordeeld. Keer terug naar het startscherm.");
      }
      const skill = (id, label, deps, intro) => ({ id, label, deps, intro });
      const skills = [
        skill("props", "Lengte, richting en zin", [], "Een vector stelt een verplaatsing voor. De lengte geeft aan hoe ver. De richting bepaalt met welke rechten de pijl evenwijdig is; de zin geeft aan welke kant hij op wijst."),
        skill("equal", "Dezelfde vector", ["props"], "Gelijke vectoren hebben dezelfde lengte, richting en zin. Hun plaats mag verschillen."),
        skill("opposite", "Tegengestelde vector en nulvector", ["equal"], "\u2212a heeft dezelfde lengte en richting als a, maar de tegengestelde zin. De nulvector begint en eindigt op hetzelfde punt; hij heeft geen bepaalde richting of zin."),
        skill("free", "Vrij namaken vanuit P", ["equal"], "Een vector hangt niet vast aan zijn plaats. Kopieer de verplaatsing; het gegeven pijltje blijft staan."),
        skill("scalar", "Vermenigvuldigen met een getal", ["opposite", "free"], "Bij ka wordt de lengte |k| keer zo groot. Een negatieve factor keert ook de zin om. Bij factor 0 krijg je de nulvector; bij factor 1/2 wordt de lengte gehalveerd."),
        skill("sum", "Som als verplaatsing", ["free"], "De som is de ene verplaatsing die hetzelfde doet als twee opeenvolgende verplaatsingen."),
        skill("headtail", "Kop-staart construeren", ["sum"], "Een tweede verplaatsing begint waar de eerste eindigt. De resultante loopt van het allereerste begin naar het laatste eind."),
        skill("commute", "u + v en v + u", ["headtail"], "Vergelijk twee routes met omgekeerde volgorde. Onderzoek of hun totale verplaatsing verandert."),
        skill("parallelogram", "Parallellogram", ["headtail"], "Teken beide vectoren vanuit hetzelfde beginpunt. Kopieer elke vector vanaf de kop van de andere. De diagonaal vanuit het gemeenschappelijke beginpunt stelt de som voor."),
        skill("difference", "Vectoren aftrekken", ["scalar", "sum"], "a \u2212 b betekent a + (\u2212b). Je telt de tegengestelde vector van b bij a op."),
        skill("combination", "Lineaire combinaties", ["difference"], "Je mag veelvouden samenstellen en verplaatsingen in een andere volgorde zetten. 2a \u2212 b kan als a + a \u2212 b of als \u2212b + 2a."),
        skill("decompose", "Ontbinden in richtingen", ["sum"], "Zoek twee componentvectoren volgens de gegeven richtingen. Hun som moet r zijn. In deze opgaven zijn beide componenten niet nul; ze mogen ook de tegengestelde zin hebben."),
        skill("coords", "Van pijl naar (x, y)", ["decompose"], "x is de horizontale verplaatsing, y de verticale. Rechts en omhoog zijn positief. De co\xF6rdinaten beschrijven de verplaatsing, niet het eindpunt."),
        skill("arrow", "Van (x, y) naar pijl", ["coords"], "(x, y) beschrijft hoeveel je horizontaal en verticaal verplaatst, vanaf om het even welk beginpunt."),
        skill("ab", "Van A naar B", ["coords"], "Voor de co\xF6rdinaten van AB neem je die van eindpunt B min die van beginpunt A. Trek de x-co\xF6rdinaten en de y-co\xF6rdinaten afzonderlijk af."),
        skill("points", "Punt en plaatsvector", ["ab", "arrow"], "P is een punt. De plaatsvector OP loopt van de oorsprong O naar P. De co\xF6rdinaten van OP zijn gelijk aan die van P. Vanuit een ander beginpunt leidt dezelfde verplaatsing naar een ander eindpunt."),
        skill("coordadd", "Rekenen: som en verschil", ["coords", "difference"], "Werk horizontaal en verticaal apart. Tel x bij x en y bij y. Bij aftrekken verander je beide tekens van de tweede vector."),
        skill("coordscale", "Rekenen: veelvouden", ["coords", "scalar"], "Vermenigvuldig beide componenten met dezelfde factor. Dit geldt ook bij negatieve factoren en breuken."),
        skill("coordcombo", "Rekenen: combinaties", ["coordadd", "coordscale"], "Werk elke term uit en combineer daarna de horizontale en verticale componenten. Het antwoord hoeft niet op een rooster te passen."),
        skill("unknown", "Ontbrekende vector", ["coordcombo"], "Bij 2a + b = r trek je aan beide kanten 2a af: b = r \u2212 2a. Controleer door de gevonden vector in de oorspronkelijke gelijkheid in te vullen."),
        skill("basis", "Eenheidsvectoren e\u2093 en e\u1D67", ["arrow", "coordscale"], "e\u2093 = (1, 0) en e\u1D67 = (0, 1). Elke vector (x, y) is x e\u2093 + y e\u1D67."),
        skill("figure", "Vectoren in figuren", ["headtail", "difference"], "Volg de letters: AD + DC gaat van A via D naar C. Het resultaat is AC, onafhankelijk van de omweg."),
        skill("route", "Route en eindpunt", ["combination", "points", "coordcombo"], "Een vectoruitdrukking beschrijft de totale verplaatsing. Tel die bij je beginpunt om te weten waar je aankomt."),
        skill("fourth", "Vierde hoekpunt", ["parallelogram", "points"], "Bij opeenvolgende hoekpunten A, B, C, D geldt AD = BC. Bereken elke co\xF6rdinaat van D als die van A plus die van C min die van B. De volgorde van de hoekpunten doet ertoe.")
      ];
      function rng(seed) {
        let a = seed >>> 0;
        return () => {
          a += 1831565813;
          let t = a;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
      }
      const ref = (start, v, name) => ({ start, v, name }), mark = (p, name) => ({ p, name });
      function generate(id, { seed = 1, level = 0, variant = 0, repair = null } = {}) {
        const random = rng(seed), pick = (a2) => a2[Math.floor(random() * a2.length)], sign = () => pick([-1, 1]);
        const a = vec(variant % 4 === 2 ? 0 : pick([1, 2, 3]) * sign(), variant % 4 === 0 ? 0 : pick([1, 2]) * sign()), b = vec(-a.dy, a.dx >= 0 ? 1 : -1);
        const P = point(pick([-2, -1, 0, 1]), pick([-2, -1, 0, 1])), R = point(-4, 2), O = point(0, 0), v = variant % 4;
        const t = { skill: id, seed, variant, level, interaction: "sketch", policy: "free", start: P, target: a, refs: [], points: [mark(P, "P")], dirs: [], representation: "grid", answerLabel: "r", bounds: { minX: -6, maxX: 6, minY: -5, maxY: 5 } };
        const draw = (target, prompt, refs = [ref(R, a, "a")]) => Object.assign(t, { target, prompt, refs });
        const numeric = (target, prompt, givens = "", visual = false) => Object.assign(t, { target, prompt, givens, interaction: "number", representation: visual ? "grid-number" : "symbolic", points: [], refs: visual ? [ref(P, a, "a"), ref(point(2, -2), b, "b")] : [] });
        if (id === "props") {
          t.policy = "properties";
          t.source = a;
          t.property = ["length", "direction", "sense"][variant % 3];
          draw(t.property === "length" ? scale(a, 2) : t.property === "direction" ? vec(-a.dy, a.dx) : scale(a, -1), `Verander alleen de ${t.property === "length" ? "lengte: maak a langer" : t.property === "direction" ? "richting van a" : "zin van a"}. Teken vanuit P.`);
        } else if (id === "equal" || id === "free") draw(a, "Teken dezelfde vector als a vanuit P.");
        else if (id === "opposite") {
          const zero = v === 3;
          draw(zero ? vec(0, 0) : scale(a, -1), zero ? "Teken de nulvector in P." : "Teken \u2212a vanuit P.");
        } else if (id === "scalar") {
          t.factor = repair === "opposite" ? -0.5 : pick(level ? [0.5, -0.5, -2, 1.5] : [2, 3, 0.5, -1]);
          t.source = vec(Math.sign(a.dx) * 2, Math.sign(a.dy) * (t.factor === 3 ? 1 : 2));
          draw(scale(t.source, t.factor), `Teken ${format(t.factor)} a vanuit P.`, [ref(R, t.source, "a")]);
        } else if (id === "sum") draw(add(a, b), "Teken de totale verplaatsing vanuit P.", [ref(P, a, "u"), ref(endPointFromVector(P, a), b, "v")]);
        else if (id === "headtail") {
          t.parts = [a, b];
          t.policy = level && v % 2 ? "ordered" : "headtail";
          draw(add(a, b), t.policy === "ordered" ? "Leg eerst u en daarna v kop-staart vanuit P. Teken ook de resultante." : "Construeer u + v kop-staart vanuit P en teken de resultante. Beide volgordes mogen.", [ref(R, a, "u"), ref(point(2, -2), b, "v")]);
          if (level === 0) t.guidedSteps = true;
        } else if (id === "commute") {
          t.start = point(-4, -2);
          t.secondStart = point(2, -2);
          t.parts = [vec(pick([1, 2]), 0), vec(-1, pick([1, 2]))];
          if (v % 2) t.parts = [vec(1, pick([1, 2])), vec(pick([1, 2]), -2)];
          t.target = sum(t.parts);
          t.policy = "commute";
          t.points = [mark(t.start, "P"), mark(t.secondStart, "Q")];
          t.refs = [ref(point(-4, 3), t.parts[0], "u"), ref(point(1, 3), t.parts[1], "v")];
          t.prompt = "Vanuit P: u dan v. Vanuit Q: v dan u. Verandert de totale verplaatsing?";
        } else if (id === "parallelogram") {
          t.parts = [a, b];
          t.policy = "parallelogram";
          draw(add(a, b), "Construeer u + v met de parallellogrammethode. Teken beide kopie\xEBn en de resultante.", [ref(P, a, "u"), ref(P, b, "v")]);
        } else if (id === "difference") draw(subtract(a, b), "Construeer a \u2212 b vanuit P.", [ref(R, a, "a"), ref(point(2, -2), b, "b")]);
        else if (id === "combination") {
          t.acceptChain = true;
          const factor = v % 2 ? 0.5 : 2;
          t.source = vec(Math.sign(a.dx) * 2, Math.sign(a.dy) * 2);
          t.factor = factor;
          draw(subtract(scale(t.source, factor), b), `Construeer ${format(factor)} a \u2212 b vanuit P. Je kiest zelf de tussenstappen.`, [ref(R, t.source, "a"), ref(point(2, -2), b, "b")]);
        } else if (id === "decompose") {
          const k = pick([1, 2, 3]) * sign(), l = pick([1, 2]) * sign();
          t.dirs = level && v % 2 ? [vec(1, 1), vec(-1, 1)] : [vec(1, 0), vec(0, 1)];
          t.target = add(scale(t.dirs[0], k), scale(t.dirs[1], l));
          t.policy = "decompose";
          t.refs = [ref(P, t.target, "r")];
          t.prompt = "Ontbind r volgens de twee stippelrichtingen. Teken zelf beide componenten.";
        } else if (id === "coords") {
          t.target = level === 0 ? vec(pick([1, 2, 3]) * sign(), pick([1, 2]) * sign()) : a;
          t.refs = [ref(P, t.target, "a")];
          t.points = [];
          t.prompt = "Bepaal de vectorco\xF6rdinaten van a.";
          if (level === 0) {
            t.policy = "decompose";
            t.dirs = [vec(1, 0), vec(0, 1)];
            t.prompt = "Teken de horizontale en verticale component van a.";
            t.representation = "components";
          } else {
            t.interaction = "number";
            t.representation = "grid-number";
            t.axes = true;
            t.answerLabel = "a";
          }
        } else if (id === "arrow") draw(a, `Teken de vector ${coord(a)} vanuit P.`, []);
        else if (id === "ab") {
          const A = point(-2, 1), B = endPointFromVector(A, a);
          numeric(a, "Bepaal de co\xF6rdinaten van AB.", `A = (${A.x}, ${A.y})    B = (${B.x}, ${B.y})`, level < 2);
          t.refs = level < 2 ? [ref(A, a, "AB")] : [];
          t.points = level < 2 ? [mark(A, "A"), mark(B, "B")] : [];
          t.answerLabel = "AB";
          t.axes = true;
          t.inputPoints = { A, B };
        } else if (id === "points") {
          t.axes = true;
          if (v === 0) {
            t.start = O;
            t.points = [mark(O, "O"), mark(point(a.dx, a.dy), "P")];
            draw(a, `P = ${coord(a)}. Teken de plaatsvector OP.`, []);
          } else if (v === 3) {
            t.interaction = "point";
            t.targetPoint = P;
            t.points = [mark(endPointFromVector(P, a), "B")];
            t.pointName = "A";
            t.refs = [];
            const B = endPointFromVector(P, a);
            t.prompt = `B = (${B.x}, ${B.y}) en AB = ${coord(a)}. Plaats beginpunt A.`;
          } else {
            t.interaction = "point";
            t.start = v === 1 ? O : P;
            t.targetPoint = endPointFromVector(t.start, a);
            t.points = [mark(t.start, v === 1 ? "O" : "A")];
            t.refs = [];
            t.prompt = v === 1 ? `OP = ${coord(a)}. Plaats het punt P.` : `A = (${P.x}, ${P.y}) en AP = ${coord(a)}. Plaats P.`;
          }
        } else if (id === "coordadd") {
          const u = level > 1 ? scale(a, 4) : a, w = level > 1 ? scale(b, 3) : b, minus = level > 0 && v % 2;
          numeric(minus ? subtract(u, w) : add(u, w), `Bereken a ${minus ? "\u2212" : "+"} b.`, `a = ${coord(u)}     b = ${coord(w)}`, level === 0);
          t.operation = minus ? "subtract" : "add";
          t.operands = [u, w];
          if (level === 0) t.scaffold = `x: ${format(u.dx)} + (${format(w.dx)})     y: ${format(u.dy)} + (${format(w.dy)})`;
        } else if (id === "coordscale") {
          t.source = level > 1 ? scale(a, 3) : a;
          t.factor = pick(level ? [0.5, -0.5, -2, 1.5] : [2, -1]);
          numeric(scale(t.source, t.factor), `Bereken ${format(t.factor)} a.`, `a = ${coord(t.source)}`, level === 0);
          t.refs = level === 0 ? [ref(P, t.source, "a")] : [];
        } else if (id === "coordcombo") {
          const c = vec(7, -5), u = scale(a, 3), w = scale(b, 2);
          numeric(add(subtract(scale(u, 2), scale(w, 3)), c), "Bereken 2a \u2212 3b + c.", `a = ${coord(u)}    b = ${coord(w)}    c = ${coord(c)}`);
          t.operands = [u, w, c];
        } else if (id === "unknown") {
          const u = scale(a, 2), r = vec(7, -1);
          numeric(subtract(r, scale(u, 2)), "2a + b = r. Bepaal b.", `a = ${coord(u)}    r = ${coord(r)}`);
          t.answerLabel = "b";
          t.operands = [u, r];
        } else if (id === "basis") {
          if (v % 2) {
            numeric(a, `Schrijf a = ${coord(a)} als x e\u2093 + y e\u1D67.`);
            t.slotLabels = ["co\xEBffici\xEBnt van e\u2093", "co\xEBffici\xEBnt van e\u1D67"];
            t.success = `${format(a.dx)}e\u2093 + (${format(a.dy)})e\u1D67`;
          } else {
            draw(a, `Teken ${format(a.dx)}e\u2093 + (${format(a.dy)})e\u1D67 vanuit P.`, level === 0 ? [ref(point(-4, 3), vec(1, 0), "e\u2093"), ref(point(2, 2), vec(0, 1), "e\u1D67")] : []);
            t.axes = true;
          }
        } else if (id === "figure") {
          const x = pick([-3, -2]), y = pick([-2, -1]), w = pick([3, 4, 5]), h = pick([2, 3, 4]), A = point(x, y), B = point(x + w, y), C = point(x + w, y + h), D = point(x, y + h), expr = ["AD + DC", "AB + BC", "CA + AB", "AB \u2212 CB"][v];
          const s = v === 2 ? C : A, e = v === 2 ? B : C;
          t.start = s;
          t.target = vectorFromPoints(s, e);
          t.prompt = `Teken ${expr} vanuit ${v === 2 ? "C" : "A"}.`;
          t.refs = [];
          t.points = [mark(A, "A"), mark(B, "B"), mark(C, "C"), mark(D, "D")];
          t.segments = [[A, B], [B, C], [C, D], [D, A]];
        } else if (id === "route") {
          const u = vec(1, 1), w = vec(-1, 2), c = vec(0, 1), r = subtract(add(scale(u, 2), scale(w, 3)), c);
          t.start = point(2, -3);
          t.points = [mark(t.start, "P")];
          t.target = r;
          t.operands = [u, w, c];
          if (level === 0) {
            draw(r, "Vertrek bij P. Construeer 2a + 3b \u2212 c en teken de totale verplaatsing.", [ref(R, u, "a"), ref(point(3, 0), w, "b"), ref(point(-4, 0), c, "c")]);
            t.start = point(2, -3);
          } else if (level === 1) {
            t.interaction = "point";
            t.targetPoint = endPointFromVector(t.start, r);
            t.axes = true;
            t.prompt = "Voorspel het eindpunt van 2a + 3b \u2212 c vanaf P(2, \u22123).";
            t.givens = `a = ${coord(u)}    b = ${coord(w)}    c = ${coord(c)}`;
          } else {
            const r2 = add(scale(a, 2), scale(b, 3)), start = point(12, -9), e = endPointFromVector(start, r2);
            numeric(vec(e.x, e.y), "Waar eindigt 2a + 3b vanaf P?", `P = (12, \u22129)    a = ${coord(a)}    b = ${coord(b)}`);
            t.answerLabel = "E";
            t.operands = [a, b];
            t.routeStart = start;
          }
        } else if (id === "fourth") {
          const A = point(-2, pick([0, 1, 2])), B = point(pick([1, 2, 3]), 0), C = point(pick([2, 3, 4]), pick([2, 3, 4])), D = point(A.x + C.x - B.x, A.y + C.y - B.y);
          t.inputPoints = { A, B, C, D };
          t.prompt = "A, B, C, D zijn opeenvolgende hoekpunten van een parallellogram. Plaats D.";
          if (level < 2) {
            t.interaction = "point";
            t.axes = true;
            t.points = [mark(A, "A"), mark(B, "B"), mark(C, "C")];
            t.segments = [[A, B], [B, C]];
            t.targetPoint = D;
            t.pointName = "D";
          } else {
            numeric(vec(D.x, D.y), "A, B, C, D liggen in die volgorde op een parallellogram. Bereken D.", `A = (${A.x}, ${A.y})    B = (${B.x}, ${B.y})    C = (${C.x}, ${C.y})`);
            t.answerLabel = "D";
          }
        } else throw Error("Unknown skill: " + id);
        if (variant % 4 === 1 && (["equal", "opposite"].includes(id) || id === "coords" && level > 0)) {
          if (id !== "coords") {
            const reference = vec(2 * Math.sign(a.dx || 1), Math.sign(a.dy || 1));
            t.target = id === "opposite" ? scale(reference, -1) : reference;
            t.refs = [ref(point(-6, 0), reference, "a")];
          }
          const target = t.target, candidates = [target, scale(target, -1), scale(target, 2), vec(target.dy, target.dx), vec(-target.dy, target.dx), add(target, vec(1, 0))], options = [];
          for (const candidate of candidates) if (!options.some((x) => vectorEquals(x, candidate)) && options.length < 4) options.push(candidate);
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
          }
          t.options = options;
          t.interaction = "choice";
          t.representation = "choice-grid";
          t.choiceFormat = id === "coords" ? "coordinates" : "arrows";
          t.points = [];
          if (t.choiceFormat === "arrows") t.choicePositions = [point(0, 2), point(6, 2), point(0, -2), point(6, -2)];
          t.prompt = id === "coords" ? "Welke co\xF6rdinaten horen bij a?" : id === "opposite" ? "Welke pijl is tegengesteld aan a?" : "Welke pijl stelt dezelfde vector als a voor?";
        }
        if (id === "route" && level === 1) t.refs = [ref(point(-4, 2), t.operands[0], "a"), ref(point(3, 0), t.operands[1], "b"), ref(point(-4, 0), t.operands[2], "c")];
        if (t.interaction === "number") {
          const supportedRepresentation = t.representation === "symbolic" ? "supported-number" : t.representation;
          if (["coordadd", "coordcombo", "unknown", "route"].includes(id)) {
            const names = id === "unknown" ? ["a", "r"] : ["a", "b", "c"];
            t.refs = t.operands.map((v2, i) => ref(point(-5 + i * 5, 3 - i * 3), v2, names[i]));
            t.representation = supportedRepresentation;
            if (id === "route") t.points = [mark(t.routeStart, "P")];
          } else if (id === "coordscale") {
            t.refs = [ref(point(-3, 1), t.source, "a")];
            t.representation = supportedRepresentation;
          } else if (id === "ab") {
            t.refs = [ref(t.inputPoints.A, t.target, "AB")];
            t.points = [mark(t.inputPoints.A, "A"), mark(t.inputPoints.B, "B")];
            t.representation = supportedRepresentation;
          } else if (id === "basis") {
            t.refs = [ref(P, a, "a")];
            t.representation = supportedRepresentation;
          } else if (id === "fourth") {
            const { A, B, C } = t.inputPoints;
            t.points = [mark(A, "A"), mark(B, "B"), mark(C, "C")];
            t.segments = [[A, B], [B, C]];
            t.representation = supportedRepresentation;
            t.axes = true;
          }
        }
        t.success = t.success || "";
        t.repair = repair;
        if (t.representation !== "symbolic") {
          const pts = [t.start, ...t.points.map((p) => p.p), ...t.refs.flatMap((r) => [r.start, endPointFromVector(r.start, r.v)]), ...(t.segments || []).flat()];
          if (t.target) pts.push(endPointFromVector(t.start, t.target));
          if (t.targetPoint) pts.push(t.targetPoint);
          if (t.choicePositions) for (let i = 0; i < t.options.length; i++) pts.push(t.choicePositions[i], endPointFromVector(t.choicePositions[i], t.options[i]));
          if (t.parts) for (const start of [t.start, t.secondStart].filter(Boolean)) for (const p of t.parts) pts.push(endPointFromVector(start, p), endPointFromVector(start, sum(t.parts)));
          if (id === "combination") pts.push(endPointFromVector(t.start, scale(t.source, t.factor)), endPointFromVector(t.start, scale(b, -1)));
          if (t.dirs) {
            const [d, e] = t.dirs;
            if (d && e && Math.abs(cross(d, e)) > EPS) {
              const k = cross(t.target, e) / cross(d, e), l = cross(d, t.target) / cross(d, e);
              pts.push(endPointFromVector(t.start, scale(d, k)), endPointFromVector(t.start, scale(e, l)));
            }
          }
          t.bounds = { minX: Math.min(-5, ...pts.map((p) => p.x)) - 1, maxX: Math.max(5, ...pts.map((p) => p.x)) + 1, minY: Math.min(-3, ...pts.map((p) => p.y)) - 1, maxY: Math.max(3, ...pts.map((p) => p.y)) + 1 };
        }
        t.signature = JSON.stringify([id, t.representation, t.interaction, t.prompt, t.targetPoint || t.target, t.refs, t.points, t.source, t.factor, t.property, t.policy]);
        return t;
      }
      function sanitizeActivity(items) {
        return (Array.isArray(items) ? items : []).filter((e) => e && skills.some((s) => s.id === e.skill) && ["independent", "supported", "skipped"].includes(e.outcome)).slice(-30).map((e) => ({ skill: e.skill, outcome: e.outcome, code: typeof e.code === "string" ? e.code.slice(0, 40) : null, at: Number.isFinite(e.at) && e.at > 0 && e.at < 1e14 ? e.at : 0, seq: Number.isInteger(e.seq) && e.seq > 0 ? e.seq : 0, xp: Number.isFinite(e.xp) ? Math.max(0, Math.min(18, e.xp)) : 0 }));
      }
      const freshSkill = () => ({ intro: false, seen: 0, clean: 0, strength: 0, lastAt: 0, lastIndex: -10, representations: [], signatures: [], recent: [], variants: [], due: 0 });
      function freshState() {
        return { version: 2, total: 0, xp: 0, sessions: 0, activity: [], skills: Object.fromEntries(skills.map((s) => [s.id, freshSkill()])), repairs: [], lastSkill: null, lastSignatures: [] };
      }
      function sanitize(raw) {
        const p = freshState();
        if (!raw || raw.version !== 2) return p;
        const number = (n, max = 1e7) => Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0;
        p.total = number(raw.total);
        p.xp = Math.floor(number(raw.xp));
        p.sessions = number(raw.sessions);
        p.lastSkill = skills.some((s) => s.id === raw.lastSkill) ? raw.lastSkill : null;
        for (const s of skills) {
          const v = raw.skills?.[s.id] || {}, out = p.skills[s.id];
          out.intro = v.intro === true;
          for (const k of ["seen", "clean", "lastAt", "due"]) out[k] = number(v[k], 1e14);
          out.lastIndex = Number.isFinite(v.lastIndex) ? Math.max(-10, Math.min(1e14, v.lastIndex)) : -10;
          out.strength = number(v.strength, 1);
          for (const k of ["representations", "signatures", "variants"]) out[k] = Array.isArray(v[k]) ? v[k].filter((x) => typeof x === "string").slice(-30) : [];
          out.recent = Array.isArray(v.recent) ? v.recent.filter((x) => typeof x === "boolean").slice(-6) : [];
        }
        p.repairs = Array.isArray(raw.repairs) ? raw.repairs.filter((r) => p.skills[r.skill] && typeof r.code === "string").slice(-30).map((r) => ({ skill: r.skill, code: r.code, due: number(r.due), stage: number(r.stage, 1) })) : [];
        p.activity = sanitizeActivity(raw.activity);
        p.lastSignatures = Array.isArray(raw.lastSignatures) ? raw.lastSignatures.filter((x) => typeof x === "string").slice(-20) : [];
        return p;
      }
      function unlocked(p) {
        return skills.filter((s) => s.deps.every((id) => p.skills[id].clean >= 2 && p.skills[id].strength >= 0.3)).map((s) => s.id);
      }
      function phase(p, id) {
        const s = p.skills[id];
        if (!unlocked(p).includes(id)) return "locked";
        if (!s.intro) return "new";
        if (s.seen < 2) return "guided";
        if (s.clean >= 5 && s.strength >= 0.78 && s.signatures.length >= 4 && s.variants.length >= 3 && (!["coords", "coordadd", "coordscale", "ab", "route"].includes(id) || s.representations.length >= 2) && s.recent.slice(-4).length === 4 && s.recent.slice(-4).every(Boolean) && !p.repairs.some((r) => r.skill === id)) return "solid";
        return "learning";
      }
      function choose(p, { now = Date.now(), round = 0 } = {}) {
        const ids = unlocked(p), due = p.repairs.filter((r) => r.due <= p.total && ids.includes(r.skill)).sort((a, b) => a.due - b.due);
        if (due.length) return { id: due[0].skill, mode: "repair", repair: due[0].code };
        const newId = ids.find((id2) => !p.skills[id2].intro);
        if (newId && (round > 0 || p.total === 0)) return { id: newId, mode: "intro" };
        const scored = ids.map((id2) => {
          const s = p.skills[id2], age = p.total - s.lastIndex, days = (now - s.lastAt) / 864e5;
          return { id: id2, score: (1 - s.strength) * 4 + Math.min(10, age) * 0.45 + (s.lastAt ? Math.min(4, days) : 0) + (s.due <= p.total && s.clean >= 3 ? 2 : 0) - (id2 === p.lastSkill ? 2 : 0) };
        }).sort((a, b) => b.score - a.score);
        const id = scored[0].id;
        return { id, mode: !p.skills[id].intro ? "intro" : p.skills[id].seen < 2 ? "guided" : round === 0 ? "recall" : "practice" };
      }
      function record(p, t, { clean, solved = clean, code = "practice", now = Date.now() } = {}) {
        const repair = p.repairs.find((r) => r.skill === t.skill);
        const xp = clean ? t.repair ? repair?.stage === 1 ? 18 : 15 : 10 + 2 * t.level : solved ? 5 : 0;
        p.xp = (p.xp || 0) + xp;
        const s = p.skills[t.skill];
        s.intro = true;
        s.seen++;
        s.lastAt = now;
        s.lastIndex = p.total;
        p.total++;
        p.lastSkill = t.skill;
        s.recent = [...s.recent, !!clean].slice(-6);
        if (clean) {
          s.clean++;
          s.strength = Math.min(1, s.strength + (t.level === 0 ? 0.13 : 0.19));
          s.signatures = [.../* @__PURE__ */ new Set([...s.signatures, t.signature])].slice(-30);
          s.representations = [.../* @__PURE__ */ new Set([...s.representations, t.representation])];
          s.variants = [.../* @__PURE__ */ new Set([...s.variants, `${t.level}:${t.variant % 4}`])];
          s.due = p.total + Math.min(30, 3 + s.clean * 3);
          const r = p.repairs.find((r2) => r2.skill === t.skill);
          if (r && t.repair) {
            if (r.stage === 0) {
              r.stage = 1;
              r.due = p.total + 6;
            } else p.repairs = p.repairs.filter((x) => x !== r);
          }
        } else {
          s.strength = Math.max(0, s.strength - 0.14);
          let r = p.repairs.find((r2) => r2.skill === t.skill);
          if (!r) {
            r = { skill: t.skill };
            p.repairs.push(r);
          }
          Object.assign(r, { code, due: p.total + 2, stage: 0 });
        }
        p.lastSignatures = [...p.lastSignatures, t.signature].slice(-20);
        p.activity = [...sanitizeActivity(p.activity), { skill: t.skill, outcome: clean ? "independent" : solved ? "supported" : "skipped", code: clean ? null : code, at: now, seq: p.total, xp }].slice(-30);
        return xp;
      }
      const api = { VectorMath, TaskValidator: { validate, findChain }, MisconceptionModel: { diagnose }, TaskGenerator: { generate, skills, rng }, TrainerScheduler: { freshState, sanitize, unlocked, phase, choose, record }, parseNumber, format, coord };
      if (typeof module !== "undefined" && module.exports) module.exports = api;
      root.VectorTrainerCore = api;
    })(typeof globalThis !== "undefined" ? globalThis : exports);
  }
});

// shared/multiplayer/vector-class-policy.cjs
var require_vector_class_policy = __commonJS({
  "shared/multiplayer/vector-class-policy.cjs"(exports, module) {
    var { TaskGenerator, TaskValidator, VectorMath: M } = require_vector_core();
    function point(p) {
      if (!p || ![p.x, p.y].every((v) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e3)) throw Error("Invalid point");
      return { x: p.x, y: p.y };
    }
    function normalize(a) {
      if (!a || typeof a !== "object" || Array.isArray(a)) throw Error("Invalid answer");
      const strokes = a.strokes || [];
      if (!Array.isArray(strokes) || strokes.length > 24) throw Error("Invalid strokes");
      const values = a.values || [];
      if (!Array.isArray(values) || values.length > 2 || values.some((v) => typeof v !== "string" || v.length > 40)) throw Error("Invalid values");
      return { strokes: strokes.map((s) => M.stroke(point(s.start), point(s.end), s.role === "result" ? "result" : "vector")), values, point: a.point ? point(a.point) : null, choice: Number.isInteger(a.choice) ? a.choice : null };
    }
    function grade(spec, answer) {
      try {
        return TaskValidator.validate(TaskGenerator.generate(spec.skill, { seed: spec.seed, variant: spec.variant, level: 1 }), normalize(answer)).ok === true;
      } catch {
        return false;
      }
    }
    module.exports = { grade, normalize };
  }
});

// tasks/policy.cjs
var require_policy = __commonJS({
  "tasks/policy.cjs"(exports, module) {
    var configs = { numbers: require_battle_config(), algebra: require_battle_config2(), logic: require_battle_config3(), rootsbuild: require_battle_config4(), systems: require_task_config() };
    var rights = require_rechten_online_policy();
    var vectors = require_vector_class_policy();
    module.exports = { grade(spec, answer) {
      try {
        const kind = spec.provider || "rights";
        if (kind === "rights") return rights.grade(spec, answer);
        if (kind === "vectors") return vectors.grade(spec, answer);
        if (kind === "algebra" && spec.skill === "S1") return false;
        const g = configs[kind];
        return !!g && g.validate(g.generate(spec), answer).ok === true;
      } catch {
        return false;
      }
    } };
  }
});
export default require_policy();
