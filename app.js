/* iPAS 色彩規劃管理師 練習站 — 組卷、作答、計分、回傳 */
(() => {
"use strict";
const BANK = window.BANK, CARD = window.CARD, DOMAINS = window.DOMAINS, DIAG_IDS = window.DIAG_IDS;
const CFG = window.CONFIG || {};
const SUBJ = { L11: "色彩學", L12: "色彩計畫實務", L13: "色彩管理" };
const DIFF_NOTE = { "易": "單一主題", "中": "複合主題", "難": "複合應用" };
const $ = (s, r = document) => r.querySelector(s);
const el = (t, a = {}, ...k) => { const e = document.createElement(t);
  for (const [x, v] of Object.entries(a)) { if (v == null) continue; if (x === "class") e.className = v; else if (x === "html") e.innerHTML = v; else if (x.startsWith("on")) e.addEventListener(x.slice(2), v); else e.setAttribute(x, v); }
  k.flat().forEach(c => c != null && e.append(c)); return e; };

/* ---------- 儲存（僅存在本機瀏覽器） ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem("cpm:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("cpm:" + k, JSON.stringify(v)); } catch { /* 無痕模式時略過 */ } }
};
let history = store.get("history", { seen: {}, wrong: {}, diagDone: false });

/* ---------- 隨機 ---------- */
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const R = rng(Date.now());
const pick = a => a[Math.floor(R() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ri = (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
const fmt1 = x => (Math.round(x * 10) / 10).toFixed(1);
const comma = n => n.toLocaleString("en-US");

/* ---------- 計算題模板：每次產生不同數字的平行題 ---------- */
function mc(base, correct, wrongs) {
  const uniq = [correct]; for (const w of wrongs) if (!uniq.includes(w)) uniq.push(w);
  let k = 1; while (uniq.length < 4) uniq.push(correct + "（" + k++ + "）"); // 理論上不會用到
  return Object.assign(base, { type: "mc", opts: uniq.slice(0, 4), correctText: correct, gen: true });
}
const GEN = {
  "G-01": () => { // ΔE*ab
    const L = ri(30, 80), a = ri(-30, 30), b = ri(-30, 30);
    let d = [ri(-6, 6), ri(-6, 6), ri(-6, 6)]; if (d.every(x => x === 0)) d = [2, 3, -1];
    const s = [L + d[0], a + d[1], b + d[2]], e = Math.hypot(...d);
    return mc({ id: "G-01", subj: "L13", codes: ["L13105", "L13103"], diff: "中", level: "應用", dom: "D6",
      stem: `標準色 CIELAB = (${L}, ${a}, ${b})，樣品 = (${s.join(", ")})。兩者的色差 ΔE*ab 約為多少？`,
      explain: `ΔL* = ${d[0]}、Δa* = ${d[1]}、Δb* = ${d[2]}；ΔE*ab = √(${d[0]}² + ${d[1]}² + ${d[2]}²) ≈ ${fmt1(e)}。`,
      trap: "常見錯誤：三個差值直接相加、忘了開根號、漏掉明度差。", src: "計算題模板；科目三指引 1.5" },
      fmt1(e), [fmt1(Math.abs(d[0]) + Math.abs(d[1]) + Math.abs(d[2])), fmt1(d[0] ** 2 + d[1] ** 2 + d[2] ** 2), fmt1(Math.hypot(d[1], d[2])), fmt1(Math.hypot(d[0], d[1])), fmt1(e * 1.5), fmt1(e + 2), fmt1(e / 2)]);
  },
  "G-02": () => { // Lab → LCh
    let a = pick([-1, 1]) * 5 * ri(2, 8), b = pick([-1, 1]) * 5 * ri(2, 8);
    const C = Math.hypot(a, b), h = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360, h0 = Math.atan(Math.abs(b / a)) * 180 / Math.PI;
    const t = (c, hh) => `C* ≈ ${fmt1(c)}，h ≈ ${Math.round(hh)}°`;
    return mc({ id: "G-02", subj: "L12", codes: ["L12102", "L13103"], diff: "中", level: "應用", dom: "D2",
      stem: `某色 CIELAB = (60, ${a}, ${b})，換算成 L*C*h 的 C* 與 h 為何？`,
      explain: `C* = √(${a}² + ${b}²) ≈ ${fmt1(C)}；依 a*、b* 的正負判斷象限，h ≈ ${Math.round(h)}°（0° 紅、90° 黃、180° 綠、270° 藍）。`,
      trap: "C* 不是 |a*| + |b*|；h 要先判斷象限，不能只算 tan⁻¹(|b*|/|a*|)。", src: "計算題模板；科目二指引 1.2" },
      t(C, h), [t(Math.abs(a) + Math.abs(b), h), t(C, h0), t(C, (h + 180) % 360), t(C, (360 - h) % 360), t(Math.abs(a) + Math.abs(b), h0), t(C, (h + 90) % 360)]);
  },
  "G-03": () => { // NCS
    const s = pick([5, 10, 20, 30, 40]), c = pick([10, 20, 30, 40, 50].filter(x => x + s <= 90)), w = 100 - s - c;
    const [p, q] = pick([["Y", "R"], ["R", "B"], ["B", "G"], ["G", "Y"]]), r = pick([10, 20, 30, 40, 60, 70, 80, 90]);
    const name = { Y: "黃", R: "紅", B: "藍", G: "綠" }, pad = n => String(n).padStart(2, "0");
    const t = (ww, x, y) => `含白度 ${ww}%；色相由 ${x}% ${name[p]}、${y}% ${name[q]}組成`;
    return mc({ id: "G-03", subj: "L12", codes: ["L12102"], diff: "易", level: "理解", dom: "D2",
      stem: `NCS 標記 S ${pad(s)}${pad(c)}-${p}${r}${q}，下列解讀何者正確？`,
      explain: `含黑度 ${s}、彩度 ${c}，含白度 = 100 − ${s} − ${c} = ${w}。${p}${r}${q} 表示由${name[p]}往${name[q]}走 ${r}%，即 ${100 - r}% ${name[p]}、${r}% ${name[q]}。`,
      trap: "色相百分比指向後面的主色；含黑度與彩度的位置也常讀反。", src: "計算題模板；科目二指引 1.2" },
      t(w, 100 - r, r), [t(w, r, 100 - r), t(c, 100 - r, r), t(s, r, 100 - r), t(100 - c, 100 - r, r), t(100 - s, r, 100 - r), t(s + c, 100 - r, r)]);
  },
  "G-04": () => { // 孟塞爾面積平衡
    const V1 = ri(2, 4), C1 = pick([2, 4]), V2 = ri(5, 8), C2 = pick([8, 10, 12]);
    const h1 = pick(["5B", "5PB", "5G", "5BG"]), h2 = pick(["5R", "5YR", "5Y", "5RP"]), r = (V2 * C2) / (V1 * C1);
    return mc({ id: "G-04", subj: "L12", codes: ["L12201", "L12102"], diff: "中", level: "應用", dom: "D5",
      stem: `以 ${h1} ${V1}/${C1} 為大面積底色、${h2} ${V2}/${C2} 為點綴色。依孟塞爾「色彩強度與面積成反比」原則，底色與點綴色的面積比約為？`,
      explain: `強度 = 明度 × 彩度：底色 ${V1}×${C1} = ${V1 * C1}，點綴色 ${V2}×${C2} = ${V2 * C2}。面積比 = ${V2 * C2} / ${V1 * C1} ≈ ${fmt1(r)}，弱色面積約為強色的 ${fmt1(r)} 倍。`,
      trap: "反比做成正比，或只比較彩度、只比較明度。", src: "計算題模板；科目二指引 2.2" },
      `約 ${fmt1(r)}：1`, [`約 1：${fmt1(r)}`, `約 ${fmt1(C2 / C1)}：1`, `約 ${fmt1(V2 / V1)}：1`, `約 ${fmt1((V2 + C2) / (V1 + C1))}：1`, `約 ${fmt1(r * 2)}：1`]);
  },
  "G-05": () => { // 照度平方反比
    const d1 = pick([1, 2, 3, 4]), d2 = pick([1, 2, 3, 4, 6].filter(x => x !== d1)), E1 = pick([100, 200, 300, 400, 600, 800, 1200]);
    const E2 = E1 * (d1 / d2) ** 2, f = x => `${Math.round(x)} lx`;
    return mc({ id: "G-05", subj: "L13", codes: ["L13102"], diff: "易", level: "應用", dom: "D1",
      stem: `一盞點光源距檯面 ${d1} m 時照度為 ${E1} lx。若改為距檯面 ${d2} m，照度約為多少？`,
      explain: `照度與距離平方成反比：${E1} × (${d1}/${d2})² ≈ ${f(E2)}。`,
      trap: "以線性反比計算，或把平方反比的方向弄反。", src: "計算題模板；科目三指引 1.1" },
      f(E2), [f(E1 * d1 / d2), f(E1 * (d2 / d1) ** 2), f(E1 * d2 / d1)]);
  },
  "G-06": () => { // 反射濃度
    const R0 = pick([0.5, 0.25, 0.1, 0.05, 0.01, 0.001]), D = Math.log10(1 / R0), f = x => (Math.round(x * 100) / 100).toFixed(2);
    return mc({ id: "G-06", subj: "L13", codes: ["L13104"], diff: "易", level: "應用", dom: "D6",
      stem: `以濃度計量得某色塊反射率 R = ${R0}。其反射濃度 D 約為多少？`,
      explain: `D = log₁₀(1/R) = log₁₀(${1 / R0}) ≈ ${f(D)}。純白的濃度約為 0。`,
      trap: "常見錯誤：用自然對數 ln 計算、把吸收比例 1−R 當成濃度、把 R 與 1−R 弄混。", src: "計算題模板；科目三指引 2.1" },
      f(D), [f(Math.log(1 / R0)), f(1 - R0), f(Math.log10(1 / (1 - R0))), f(D / 2)]);
  },
  "G-07": () => { // XYZ → xy
    let X, Y, Z; do { X = ri(10, 60); Y = ri(10, 60); Z = ri(10, 60); } while (X === Y || Y === Z || X === Z);
    const s = X + Y + Z, f = x => (Math.round(x * 1000) / 1000).toFixed(3);
    const t = (x, y, L) => `(x, y) = (${x}, ${y})，亮度 ${L} cd/m²`;
    return mc({ id: "G-07", subj: "L13", codes: ["L13103", "L13102"], diff: "中", level: "應用", dom: "D6",
      stem: `某色光三刺激值 X = ${X}、Y = ${Y}、Z = ${Z}（以 cd/m² 換算）。下列何者正確？`,
      explain: `x = X/(X+Y+Z) = ${X}/${s} ≈ ${f(X / s)}；y = ${Y}/${s} ≈ ${f(Y / s)}。Y 代表亮度，為 ${Y} cd/m²。`,
      trap: "把 X+Y+Z 當亮度，或只用 X、Y 兩項計算比值。", src: "計算題模板；科目三指引 1.3" },
      t(f(X / s), f(Y / s), Y), [t(f(X / s), f(Y / s), s), t(f(X / (X + Y)), f(Y / (X + Y)), Y), t(f(Y / s), f(X / s), Y), t(f(X / s), f(Y / s), X), t(f(Z / s), f(Y / s), Y), t(f(X / s), f(Z / s), s)]);
  },
  "G-08": () => { // 色彩深度
    const n = pick([5, 6, 8, 10, 12]);
    return mc({ id: "G-08", subj: "L11", codes: ["L11201"], diff: "易", level: "應用", dom: "D3",
      stem: `RGB 影像每個通道以 ${n} bit 記錄，理論上可表現多少種顏色？`,
      explain: `每通道 2^${n} = ${comma(2 ** n)} 階，三通道為 (2^${n})³ = ${comma(2 ** (3 * n))} 種。`,
      trap: "誘答都是把位元數讀錯時的結果（例如誤用 8-bit 全彩的 16,777,216），量級相近，要真的會算才選得出來。", src: "計算題模板；科目一指引 2.1" },
      comma(2 ** (3 * n)), [5, 6, 8, 10, 12, 16].filter(k => k !== n).sort((a, b) => Math.abs(a - n) - Math.abs(b - n)).slice(0, 3).map(k => comma(2 ** (3 * k))));
  }
};
window.__GEN = GEN;
const GEN_FAM = { "G-01": "deltaE", "G-02": "lch", "G-03": "ncs", "G-04": "area", "G-05": "illum", "G-06": "density", "G-07": "xy", "G-08": "bitdepth" };
const famOf = q => q.fam || GEN_FAM[q.id] || q.id;
const GEN_BY_SUBJ = { L11: ["G-08"], L12: ["G-02", "G-03", "G-04"], L13: ["G-01", "G-05", "G-06", "G-07"] };
const genFor = (subjs, diff) => Object.entries(GEN_BY_SUBJ).filter(([s]) => subjs.includes(s)).flatMap(([, g]) => g)
  .filter(g => !diff || GEN[g]().diff === diff);

/* ---------- 組卷 ---------- */
const seenN = id => history.seen[id] || 0;
function pickBalanced(pool, n, used, fams) {
  // 先挑沒做過的、盡量涵蓋不同內容代碼；同一場作答中，同概念的近似題只出一題
  fams = fams || new Set();
  const out = [], codes = new Set();
  const ok = q => !used.has(q.id) && !fams.has(famOf(q));
  const take = q => { out.push(q); used.add(q.id); fams.add(famOf(q)); codes.add(q.codes[0]); };
  const sorted = shuffle(pool).sort((a, b) => seenN(a.id) - seenN(b.id));
  for (const q of sorted) { if (out.length >= n) break; if (ok(q) && !codes.has(q.codes[0])) take(q); }
  for (const q of sorted) { if (out.length >= n) break; if (ok(q)) take(q); }
  return out;
}
function assemble(subjs, n) {
  const pool = BANK.filter(q => subjs.includes(q.subj));
  const want = { "易": Math.round(n * 0.4), "中": Math.round(n * 0.4) }; want["難"] = n - want["易"] - want["中"];
  const used = new Set(), fams = new Set(); let out = [];
  for (const d of ["易", "中", "難"]) {
    // 計算題模板：每 4 題約保留 1 題給「換數字」的平行題，同一模板一場只出一次
    const gens = shuffle(genFor(subjs, d).filter(g => !fams.has(GEN_FAM[g])));
    const g = Math.min(gens.length, Math.floor(want[d] / 4));
    const part = pickBalanced(pool.filter(q => q.diff === d), want[d] - g, used, fams);
    for (let i = 0; i < g; i++) { if (fams.has(GEN_FAM[gens[i]])) continue; part.push(GEN[gens[i]]()); fams.add(GEN_FAM[gens[i]]); }
    while (part.length < want[d]) { // 該難度題目不足，向其他難度借
      const extra = pickBalanced(pool, 1, used, fams); if (!extra.length) break; part.push(extra[0]);
    }
    out = out.concat(part);
  }
  return shuffle(out);
}
function assembleDiag(parallel) {
  const base = DIAG_IDS.map(id => BANK.find(q => q.id === id));
  if (!parallel) return base;
  const used = new Set(DIAG_IDS), fams = new Set();
  return base.map(d => {
    const cell = BANK.filter(q => !q.diag && q.dom === d.dom && q.diff === d.diff);
    const alt = BANK.filter(q => !q.diag && q.dom === d.dom);
    return pickBalanced(cell, 1, used, fams)[0] || pickBalanced(alt, 1, used, fams)[0] || d;
  });
}
function assembleRetry() {
  const wrongIds = Object.keys(history.wrong);
  const used = new Set(), fams = new Set(), out = [];
  for (const id of shuffle(wrongIds).slice(0, 20)) {
    const src = BANK.find(q => q.id === id) || { codes: [history.wrong[id]] };
    const par = BANK.filter(q => q.id !== id && q.codes[0] === src.codes[0]);
    const p = pickBalanced(par, 1, used, fams)[0] || pickBalanced(BANK.filter(q => q.id === id), 1, used, fams)[0];
    if (p) out.push(p);
  }
  return out;
}

/* ---------- 作答流程 ---------- */
let session = null, timerId = null;
function startSession(mode, label, items, subjLabel) {
  // 每次作答都重新打散選項
  items = items.map(q => {
    q = Object.assign({}, q);
    if (q.type === "mc") {
      const correct = q.correctText ?? q.opts["ABCD".indexOf(q.ans)];
      q.opts = shuffle(q.opts); q.ans = "ABCD"[q.opts.indexOf(correct)];
    }
    return q;
  });
  session = { id: Math.random().toString(36).slice(2, 10), mode, label, subj: subjLabel, items, start: Date.now(), limit: Math.round(items.length * 1.5) * 60 };
  renderQuiz();
}
function normTickets(s) { return (s.match(/\d+/g) || []).map(x => x.padStart(2, "0").slice(-2)); }
const digits = s => (s || "").replace(/\D/g, "").split("").filter(Boolean);
function judge(q, raw) {
  if (q.type === "mc") return raw === q.ans;
  if (q.prac) {
    const t = digits(raw);
    if (q.type === "code") return t.join("") === q.ans;
    if (q.type === "set") return t.length === q.ans.length && [...t].sort().join() === [...q.ans].sort().join();
    return t.join("") === q.ans.join("");
  }
  if (q.type === "code") return (raw || "").replace(/\D/g, "") === q.ans;
  const t = normTickets(raw || "");
  if (q.type === "set") return t.length === q.ans.length && [...t].sort().join() === [...q.ans].sort().join();
  return t.join() === q.ans.join();
}
// 實作題格式檢查（11/12 作答分析：空白、照抄範例、輸入全部色票、位數不符）
function pracIssues(q, raw) {
  const t = digits(raw);
  if (!t.length) return ["未作答"];
  const iss = [];
  const n = q.chips && q.chips.length ? q.chips.length : (q.groups ? q.groups.length : 0);
  if (q.type !== "code" && n && t.some(d => +d < 1 || +d > n)) iss.push(`編號只能是 1–${n}`);
  if (q.type !== "code" && new Set(t).size < t.length) iss.push("有重複的編號");
  if ((q.type === "seq" || q.type === "code") && t.length !== q.ans.length) iss.push(`這題要輸入 ${q.ans.length} 個，你輸入了 ${t.length} 個`);
  if (q.type === "one" && t.length !== 1) iss.push("這題只要輸入一個編號");
  if (q.type === "set" && n && t.length >= n) iss.push("你選了全部色票，請確認是否每一張都符合條件");
  if (q.type === "seq" && q.chips && t.length === q.chips.length && t.join("") === q.chips.map(c => c.label).join("")) iss.push("和色票的顯示順序完全相同，請確認是否真的排過");
  return iss;
}
const ansText = q => Array.isArray(q.ans) ? q.ans.join(q.prac ? "" : " ") : q.ans;

function chipCard(compact) {
  const g = el("div", { class: "card-grid" + (compact ? " compact" : ""), role: "list", "aria-label": "60 色票卡" });
  CARD.forEach(c => g.append(el("div", { class: "cc", role: "listitem" }, el("div", { class: "cc-sw", style: `background:${c.hex}` }), el("span", { class: "cc-no" }, c.no))));
  return g;
}
function renderQuiz() {
  const s = session, v = $("#view"); v.innerHTML = "";
  const hasTicket = false;
  const bar = el("div", { class: "bar" },
    el("span", { class: "timer", id: "timer" }, ""),
    el("span", { class: "meta" }, `${s.label}｜${s.items.length} 題`),
    el("span", { class: "spacer" }),
    hasTicket ? el("button", { class: "btn", type: "button", onclick: () => $("#drawer").classList.toggle("open") }, "色票卡") : null,
    el("button", { class: "btn", type: "button", onclick: home }, "離開"),
    el("button", { class: "btn primary", type: "button", onclick: finish }, "交卷"));
  v.append(bar);
  if (hasTicket) v.append(el("div", { id: "drawer", class: "drawer open" }, el("p", { class: "legend" }, "實作題請填色票票號（例如 07 12 33）。色票顯示於中灰背景；螢幕色只是近似，正式考試使用實體色票。"), chipCard(true)));
  s.items.forEach((q, i) => v.append(renderQ(q, i)));
  v.append(el("div", { class: "bar end" }, el("span", { class: "spacer" }), el("button", { class: "btn primary", type: "button", onclick: finish }, "交卷並看解析")));
  clearInterval(timerId);
  const tick = () => { const left = s.limit - Math.floor((Date.now() - s.start) / 1000), t = $("#timer"); if (!t) return;
    const a = Math.abs(left); t.textContent = (left < 0 ? "超時 " : "剩 ") + `${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`; t.classList.toggle("over", left < 0); };
  tick(); timerId = setInterval(tick, 1000); window.scrollTo(0, 0);
}
function renderQ(q, i) {
  const box = el("section", { class: "q", id: `q${i}`, "data-qid": q.id });
  box.append(el("div", { class: "qhead" }, el("span", { class: "qnum" }, `第 ${i + 1} 題`),
    el("span", { class: `pill ${q.diff}` }, `${q.diff}｜${DIFF_NOTE[q.diff]}`), el("span", { class: "pill" }, SUBJ[q.subj]),
    el("span", { class: "pill" }, DOMAINS[q.dom]), q.gen ? el("span", { class: "pill" }, "隨機數字") : null));
  box.append(el("p", { class: "stem" }, q.stem));
  const chipEl = (c, big) => el("div", { class: "chip" }, el("div", { class: "sw" + (big ? " big" : ""), style: `background:${c.hex}`, role: "img", "aria-label": c.label ? `色票 ${c.label}` : "色票" }), c.label ? el("span", { class: "lab" }, c.label) : null, el("span", { class: "spec" }, c.spec));
  if (q.main || q.ends) {
    const ref = el("div", { class: "panel ref" });
    if (q.main) ref.append(el("div", { class: "chip" }, el("div", { class: "sw big", style: `background:${q.main.hex}` }), el("span", { class: "lab" }, q.main.label), el("span", { class: "spec" }, q.main.spec)));
    if (q.ends) q.ends.forEach((c, k) => { if (k) ref.append(el("span", { class: "arrow", "aria-hidden": "true" }, q.chips ? "→ ？ ？ ？ →" : "")); ref.append(el("div", { class: "chip" }, el("div", { class: "sw big", style: `background:${c.hex}` }), el("span", { class: "lab" }, c.label), el("span", { class: "spec show" }, c.spec))); });
    box.append(ref);
  }
  if (q.chips && q.chips.length) { const pnl = el("div", { class: "panel" }); q.chips.forEach(c => pnl.append(chipEl(c))); box.append(pnl); }
  if (q.groups) {
    const pnl = el("div", { class: "panel" });
    q.groups.forEach(g => { const gs = el("div", { class: "gsw" }); g.chips.forEach(c => gs.append(chipEl(c))); pnl.append(el("div", { class: "group" }, el("span", { class: "gname" }, g.label), gs)); });
    box.append(pnl);
  }
  if (q.type === "mc") {
    const g = el("div", { class: "opts", role: "radiogroup" });
    q.opts.forEach((o, k) => { const L = "ABCD"[k], id = `q${i}${L}`;
      g.append(el("label", { class: "opt", for: id, "data-l": L }, el("input", { type: "radio", name: `q${i}`, id, value: L }), el("span", {}, `(${L}) ${o}`))); });
    box.append(g);
  } else {
    const hint = q.prac ? { seq: "依序輸入色票編號", set: "輸入所有符合的色票編號", one: "輸入一個編號", code: "依序輸入代號" }[q.type]
      : { seq: "依序填入票號，以空格分隔", set: "填入所有符合的票號，順序不拘", one: "填入一個票號", code: "填入代號，例如 1234" }[q.type];
    const inp = el("input", { id: `q${i}in`, type: "text", inputmode: "numeric", autocomplete: "off" });
    const chk = el("span", { class: "chk", "aria-live": "polite" }, "");
    if (q.prac) inp.addEventListener("input", () => {
      if (!inp.value.trim()) { chk.textContent = ""; chk.className = "chk"; return; }
      const iss = pracIssues(q, inp.value); chk.textContent = iss.length ? "⚠ " + iss.join("；") : "格式正確（不代表答案正確）"; chk.className = "chk " + (iss.length ? "warn" : "fine");
    });
    box.append(el("div", { class: "ordin" }, el("label", { for: `q${i}in` }, "作答"), inp, el("span", { class: "meta" }, hint), chk));
  }
  box.append(el("div", { class: "feedback" }));
  return box;
}
function finish() {
  const s = session; if (!s || s.done) return;
  if (!s.checked) {
    const probs = [];
    s.items.forEach((q, i) => {
      const box = $(`#q${i}`);
      const raw = q.type === "mc" ? ($(`input[name="q${i}"]:checked`, box) || {}).value || "" : $(`#q${i}in`, box).value.trim();
      const iss = q.prac && q.type !== "mc" ? pracIssues(q, raw) : (raw ? [] : ["未作答"]);
      if (iss.length) probs.push([i, iss.join("；")]);
    });
    if (probs.length) { s.checked = true; showWarn(probs); return; }
  }
  s.done = true; clearInterval(timerId);
  const w = $("#warnbox"); if (w) w.remove();
  const rows = []; let right = 0;
  s.items.forEach((q, i) => {
    const box = $(`#q${i}`);
    const raw = q.type === "mc" ? ($(`input[name="q${i}"]:checked`, box) || {}).value || "" : $(`#q${i}in`, box).value.trim();
    const ok = judge(q, raw); if (ok) right++;
    const got = q.type === "mc" ? raw : (q.prac ? digits(raw).join("") : (q.type === "code" ? raw.replace(/\D/g, "") : normTickets(raw).join(" ")));
    const optText = L => L ? q.opts["ABCD".indexOf(L)] : "";
    rows.push({ id: q.id, subj: SUBJ[q.subj], codes: q.codes.join(","), diff: q.diff, dom: DOMAINS[q.dom],
      got: q.type === "mc" && got ? `${got}｜${optText(got)}` : got, ans: q.type === "mc" ? `${q.ans}｜${optText(q.ans)}` : ansText(q), ok: ok ? 1 : 0, gen: q.gen ? 1 : 0 });
    if (!q.gen) { history.seen[q.id] = seenN(q.id) + 1; if (ok) delete history.wrong[q.id]; else history.wrong[q.id] = q.codes[0]; }
    box.classList.add("done", ok ? "ok" : "bad");
    box.querySelectorAll(".opt").forEach(o => { if (o.dataset.l === q.ans) o.classList.add("right"); else if (o.dataset.l === raw) o.classList.add("wrong"); });
    const fb = $(".feedback", box); fb.innerHTML = "";
    fb.append(el("p", {}, el("span", { class: "verdict " + (ok ? "ok" : "bad") }, ok ? "答對" : (got ? `答錯（你的答案：${got}）` : "未作答")), el("b", {}, `　正確答案：${ansText(q)}`)),
      el("p", {}, el("b", {}, "解析："), q.explain), el("p", {}, el("b", {}, "誘答設計："), q.trap),
      el("p", { class: "meta" }, `${q.id}｜內容代碼 ${q.codes.join("、")}｜出處：${q.src}`));
  });
  if (s.mode === "diag") history.diagDone = true;
  store.set("history", history);
  const dur = Math.round((Date.now() - s.start) / 1000), score = Math.round(right / s.items.length * 100);
  const payload = { classCode: CFG.classCode || "", studentId: store.get("sid", ""), sessionId: s.id, mode: s.label, subject: s.subj,
    startedAt: new Date(s.start).toISOString(), endedAt: new Date().toISOString(), durationSec: dur, total: s.items.length, correct: right, score, items: rows };
  renderSummary(s, rows, right, score, dur);
  send(payload);
}
function showWarn(probs) {
  const old = $("#warnbox"); if (old) old.remove();
  const list = el("ul", {});
  probs.forEach(([i, msg]) => list.append(el("li", {}, el("a", { href: `#q${i}` }, `第 ${i + 1} 題`), `：${msg}`)));
  const box = el("div", { id: "warnbox", class: "warnbox", role: "alert" },
    el("p", {}, el("b", {}, `還有 ${probs.length} 題需要確認`), "　空白或格式不符的題目會直接算錯。"), list,
    el("div", { class: "row-btns" },
      el("button", { class: "btn", type: "button", onclick: () => { session.checked = false; box.remove(); } }, "回去修改"),
      el("button", { class: "btn primary", type: "button", onclick: finish }, "仍要交卷")));
  $(".bar", $("#view")).after(box); window.scrollTo(0, 0);
}
function renderSummary(s, rows, right, score, dur) {
  const box = el("div", { class: "summary" });
  box.append(el("div", {}, el("span", { class: "score" }, `${score} 分`), el("span", { class: "meta" }, `　答對 ${right}/${rows.length}｜用時 ${Math.floor(dur / 60)} 分 ${dur % 60} 秒｜iPAS 單科及格 70 分`)));
  const bars = (title, key, order) => {
    const agg = {}; rows.forEach(r => { (agg[r[key]] ??= [0, 0]); agg[r[key]][1]++; agg[r[key]][0] += r.ok; });
    const list = el("div", { class: "rows" }); box.append(el("p", { class: "legend" }, title));
    (order || Object.keys(agg)).forEach(k => { if (!agg[k]) return; const [a, n] = agg[k], p = a / n;
      list.append(el("div", { class: "row" }, el("span", {}, k), el("div", { class: "track" }, el("div", { class: "fill" + (p < .6 ? " low" : ""), style: `width:${p * 100}%` })), el("span", {}, `${a}/${n}`))); });
    box.append(list);
  };
  bars("依難度", "diff", ["易", "中", "難"]);
  bars("依診斷領域（紅色＝低於 60%，建議優先複習；之後可用「錯題重練」做平行題）", "dom", Object.values(DOMAINS));
  box.append(el("p", { class: "meta", id: "sendStatus" }, "作答紀錄回傳中…"));
  box.append(el("div", { class: "row-btns" }, el("button", { class: "btn", type: "button", onclick: home }, "回首頁"),
    el("button", { class: "btn primary", type: "button", onclick: () => startSession("retry", "錯題重練", assembleRetry(), "依錯題") }, "錯題重練（平行題）")));
  const v = $("#view"); v.insertBefore(box, v.children[1]); window.scrollTo(0, 0);
}

/* ---------- 回傳 Google Sheet ---------- */
async function send(payload) {
  const st = $("#sendStatus");
  if (!CFG.endpoint) { st && (st.textContent = "老師尚未設定回傳網址，這次紀錄只存在本機。"); queue(payload); return; }
  try {
    await fetch(CFG.endpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    st && (st.textContent = "作答紀錄已送出給老師。");
  } catch (e) { queue(payload); st && (st.textContent = "網路連線失敗，紀錄已暫存，下次開啟網站時會自動補送。"); }
}
function queue(p) { const q = store.get("queue", []); q.push(p); store.set("queue", q.slice(-30)); }
async function flushQueue() {
  if (!CFG.endpoint) return; const q = store.get("queue", []); if (!q.length) return; store.set("queue", []);
  for (const p of q) { if (!p.studentId) p.studentId = store.get("sid", ""); await send(p); }
}

/* ---------- 首頁 ---------- */
function home() {
  clearInterval(timerId); session = null; const v = $("#view"); v.innerHTML = "";
  const sid = store.get("sid", "");
  const idBox = el("form", { class: "panel id", onsubmit: e => { e.preventDefault(); const x = $("#sid").value.trim(); if (!/^[A-Za-z0-9]{4,12}$/.test(x)) { $("#sidMsg").textContent = "學號請填 4–12 碼英數字。"; return; } store.set("sid", x); home(); } },
    el("label", { for: "sid" }, "學號"), el("input", { id: "sid", value: sid, autocomplete: "off", required: "required" }),
    el("button", { class: "btn primary", type: "submit" }, sid ? "更新" : "開始"), el("span", { class: "meta", id: "sidMsg" }, sid ? `目前：${sid}（作答紀錄會以此學號回傳給老師）` : "先填學號才能作答。"));
  v.append(idBox);
  if (!sid) return;
  const wrongN = Object.keys(history.wrong).length;
  const grid = el("div", { class: "modes" });
  const diagParallel = history.diagDone;
  grid.append(modeCard("診斷卷", diagParallel ? "平行診斷卷：同領域、同難度換題，用來檢查複習成效。20 題約 30 分鐘。" : "第一次請先做這份。20 題涵蓋 7 個領域，交卷後顯示弱點。",
    [el("button", { class: "btn primary", type: "button", onclick: () => startSession("diag", diagParallel ? "平行診斷卷" : "診斷卷", assembleDiag(diagParallel), "三科混合") }, diagParallel ? "開始平行診斷卷" : "開始診斷卷"),
    ]));
  const sel = el("select", { id: "subj" }, ...[["L11", "色彩學"], ["L12", "色彩計畫實務"], ["L13", "色彩管理"], ["ALL", "三科混合"]].map(([v2, t]) => el("option", { value: v2 }, t)));
  const num = el("select", { id: "num" }, ...[10, 20, 30, 50].map(n => el("option", { value: n }, `${n} 題（${Math.round(n * 1.5)} 分鐘）`)));
  grid.append(modeCard("組卷練習", "依科目自動組卷，難度約易 4：中 4：難 2，優先出你沒做過的題目；計算題每次換數字。選 50 題即為正式考試長度。",
    [el("label", { class: "sr", for: "subj" }, "科目"), sel, el("label", { class: "sr", for: "num" }, "題數"), num,
     el("button", { class: "btn primary", type: "button", onclick: () => { const s = sel.value, n = +num.value, subs = s === "ALL" ? ["L11", "L12", "L13"] : [s];
       startSession("form", `組卷練習（${s === "ALL" ? "三科混合" : SUBJ[s]}）`, assemble(subs, n), s === "ALL" ? "三科混合" : SUBJ[s]); } }, "開始")]));
  grid.append(modeCard("錯題重練", wrongN ? `目前有 ${wrongN} 題答錯紀錄。系統會換成「同一內容代碼」的平行題，不是原題重做。` : "答錯的題目會記在這台裝置上，之後可在這裡用平行題重練。",
    [el("button", { class: "btn primary", type: "button", disabled: wrongN ? null : "disabled", onclick: () => startSession("retry", "錯題重練", assembleRetry(), "依錯題") }, "開始")]));
  grid.append(modeCard("自由選題", "依科目、難度、領域篩選，自己挑題練習。建議搭配診斷卷標紅的領域。",
    [el("button", { class: "btn", type: "button", onclick: freePick }, "進入選題")]));
  grid.append(modeCard("使用說明", "練習順序建議、實作題作答方式、難度標示。",
    [el("a", { class: "btn", href: "guide.html" }, "查看說明")]));
  v.append(grid);
  v.append(el("p", { class: "meta" }, `題庫：色彩學 ${BANK.filter(q => q.subj === "L11").length} 題、色彩計畫實務 ${BANK.filter(q => q.subj === "L12").length} 題、色彩管理 ${BANK.filter(q => q.subj === "L13").length} 題，另有 8 種隨機數字計算題。答錯紀錄只存在這台裝置。`));
}
function modeCard(title, desc, ctrls) { return el("section", { class: "mode" }, el("h2", {}, title), el("p", {}, desc), el("div", { class: "ctrls" }, ...ctrls)); }

function freePick() {
  const v = $("#view"); v.innerHTML = "";
  const f = { subj: "", diff: "", dom: "" };
  const mk = (id, label, opts) => el("label", { class: "flt", for: id }, label, el("select", { id, onchange: e => { f[id] = e.target.value; draw(); } }, el("option", { value: "" }, "全部"), ...opts.map(([a, b]) => el("option", { value: a }, b))));
  const list = el("div", { class: "picklist" });
  const start = el("button", { class: "btn primary", type: "button", onclick: () => {
    const ids = [...list.querySelectorAll("input:checked")].map(x => x.value); if (!ids.length) return;
    startSession("free", "自由選題", ids.map(id => BANK.find(q => q.id === id)), "自選"); } }, "開始作答");
  v.append(el("div", { class: "bar" }, el("button", { class: "btn", type: "button", onclick: home }, "回首頁"), el("span", { class: "spacer" }), start));
  v.append(el("div", { class: "filters" }, mk("subj", "科目", Object.entries(SUBJ)), mk("diff", "難度", [["易", "易"], ["中", "中"], ["難", "難"]]), mk("dom", "領域", Object.entries(DOMAINS)),
    el("button", { class: "btn", type: "button", onclick: () => list.querySelectorAll("input").forEach(x => x.checked = true) }, "全選目前列表")));
  v.append(list);
  function draw() {
    list.innerHTML = "";
    BANK.filter(q => (!f.subj || q.subj === f.subj) && (!f.diff || q.diff === f.diff) && (!f.dom || q.dom === f.dom)).forEach(q => {
      const id = "p-" + q.id;
      list.append(el("label", { class: "pick", for: id }, el("input", { type: "checkbox", id, value: q.id }),
        el("span", { class: `pill ${q.diff}` }, q.diff), el("span", { class: "pill" }, SUBJ[q.subj]),
        el("span", { class: "ptext" }, q.stem.length > 60 ? q.stem.slice(0, 60) + "…" : q.stem), seenN(q.id) ? el("span", { class: "meta" }, `做過 ${seenN(q.id)} 次`) : null));
    });
  }
  draw();
}

window.addEventListener("load", () => { home(); flushQueue(); });
})();
