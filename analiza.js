/* Analiză economico-financiară completă — F10 + F20, verificări, SIG, CAF, bilanț funcțional, Du Pont, cash-flow, scoruri */
(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const U = window.AEU;
const { esc, lei, pct, num, nf0, nf2 } = U;

/* ---------- definiția câmpurilor ---------- */
/* a = cod indicator ANAF (se completează automat), l = nivel de indentare */
const F = [
  { g: 'F10 — Bilanț: Activ' },
  { k: 'ai', n: 'A. Active imobilizate — total', a: 'I1' },
  { k: 'ain', n: 'Imobilizări necorporale', l: 1 },
  { k: 'aic', n: 'Imobilizări corporale', l: 1 },
  { k: 'aif', n: 'Imobilizări financiare', l: 1 },
  { k: 'ac', n: 'B. Active circulante — total', a: 'I2' },
  { k: 'st', n: 'Stocuri', a: 'I3', l: 1 },
  { k: 'cr', n: 'Creanțe', a: 'I4', l: 1 },
  { k: 'crc', n: 'din care: clienți (creanțe comerciale)', l: 2 },
  { k: 'its', n: 'Investiții pe termen scurt', l: 1 },
  { k: 'cb', n: 'Casa și conturi la bănci', a: 'I5', l: 1 },
  { k: 'chav', n: 'C. Cheltuieli în avans', a: 'I6' },
  { g: 'F10 — Bilanț: Datorii și capitaluri' },
  { k: 'dat', n: 'Datorii — total', a: 'I7' },
  { k: 'datc', n: 'Datorii ce trebuie plătite într-un an', l: 1 },
  { k: 'furn', n: 'din care: furnizori', l: 2 },
  { k: 'crts', n: 'din care: credite bancare pe termen scurt', l: 2 },
  { k: 'datl', n: 'Datorii ce trebuie plătite într-o perioadă > 1 an', l: 1 },
  { k: 'crtl', n: 'din care: credite bancare pe termen lung', l: 2 },
  { k: 'prov', n: 'Provizioane', a: 'I9' },
  { k: 'vav', n: 'Venituri în avans', a: 'I8' },
  { k: 'cp', n: 'Capitaluri proprii — total', a: 'I10' },
  { k: 'cs', n: 'Capital subscris vărsat', a: 'I11', l: 1 },
  { k: 'prime', n: 'Prime de capital', l: 1 },
  { k: 'rreev', n: 'Rezerve din reevaluare', l: 1 },
  { k: 'rez', n: 'Rezerve (legale, statutare, alte)', l: 1 },
  { k: 'rrep', n: 'Rezultatul reportat (±)', l: 1 },
  { k: 'rex', n: 'Rezultatul exercițiului (±)', l: 1 },
  { k: 'rep', n: 'Repartizarea profitului', l: 1 },
  { g: 'F20 — Cont de profit și pierdere: Exploatare' },
  { k: 'ca', n: 'Cifra de afaceri netă', a: 'I13' },
  { k: 'pv', n: 'Producția vândută', l: 1 },
  { k: 'vm', n: 'Venituri din vânzarea mărfurilor', l: 1 },
  { k: 'sub', n: 'Subvenții de exploatare aferente CA', l: 1 },
  { k: 'vst', n: 'Variația stocurilor (+ sold C / − sold D)', l: 1 },
  { k: 'pim', n: 'Producția imobilizată', l: 1 },
  { k: 'avex', n: 'Alte venituri din exploatare', l: 1 },
  { k: 've', n: 'Venituri din exploatare — total' },
  { k: 'cmat', n: 'Cheltuieli cu materii prime, materiale, alte ch. materiale', l: 1 },
  { k: 'cen', n: 'Cheltuieli cu energia și apa', l: 1 },
  { k: 'chm', n: 'Cheltuieli privind mărfurile', l: 1 },
  { k: 'rcp', n: 'Reduceri comerciale primite', l: 1 },
  { k: 'chp', n: 'Cheltuieli cu personalul', l: 1 },
  { k: 'amo', n: 'Ajustări de valoare imobilizări (amortizare, net)', l: 1 },
  { k: 'ajac', n: 'Ajustări de valoare active circulante (net)', l: 1 },
  { k: 'cpe', n: 'Cheltuieli cu prestațiile externe', l: 1 },
  { k: 'cit', n: 'Cheltuieli cu impozite, taxe și vărsăminte asimilate', l: 1 },
  { k: 'acex', n: 'Alte cheltuieli de exploatare', l: 1 },
  { k: 'aprov', n: 'Ajustări privind provizioanele (net)', l: 1 },
  { k: 'che', n: 'Cheltuieli de exploatare — total' },
  { g: 'F20 — Financiar, rezultate, personal' },
  { k: 'vf', n: 'Venituri financiare — total' },
  { k: 'chf', n: 'Cheltuieli financiare — total' },
  { k: 'dob', n: 'din care: cheltuieli cu dobânzile', l: 1 },
  { k: 'vt', n: 'Venituri totale', a: 'I14' },
  { k: 'cht', n: 'Cheltuieli totale', a: 'I15' },
  { k: 'pb', n: 'Profit brut', a: 'I16' },
  { k: 'pib', n: 'Pierdere brută', a: 'I17' },
  { k: 'imp', n: 'Impozit pe profit / micro și alte impozite', l: 1 },
  { k: 'pn', n: 'Profit net', a: 'I18' },
  { k: 'pin', n: 'Pierdere netă', a: 'I19' },
  { k: 'sal', n: 'Număr mediu de salariați', a: 'I20' },
  { k: 'div', n: 'Dividende plătite în an (din note / registre)', l: 1 }
];
const KEYS = F.filter(f => f.k).map(f => f.k);
const CODE2KEY = {}; F.forEach(f => { if (f.a) CODE2KEY[f.a] = f.k; });
const NAME_MAP = [
  [/^active imobilizate/, 'ai'], [/^active circulante/, 'ac'], [/^stocuri/, 'st'], [/^creante/, 'cr'], [/^casa si conturi/, 'cb'],
  [/^cheltuieli in avans/, 'chav'], [/^datorii/, 'dat'], [/^venituri in avans/, 'vav'], [/^provizioane/, 'prov'], [/^capitaluri/, 'cp'],
  [/^capital subscris/, 'cs'], [/^cifra de afaceri/, 'ca'], [/^venituri totale/, 'vt'], [/^cheltuieli totale/, 'cht'], [/^profit brut/, 'pb'],
  [/^pierdere bruta/, 'pib'], [/^profit net/, 'pn'], [/^pierdere neta/, 'pin'], [/numar mediu.*salariati/, 'sal']
];



/* ---------- tabel de introducere ---------- */
const tb = $('#finTable tbody');
tb.innerHTML = F.map(f => f.g
  ? `<tr class="grp"><td colspan="3">${f.g}</td></tr>`
  : `<tr class="${f.a ? 'anaf' : ''}"><td class="lv${f.l || 0}">${esc(f.n)}${f.a ? ' <span class="badge ok" title="se încarcă automat de la ANAF">ANAF</span>' : ''}</td>
     <td><input type="number" step="any" data-y="P" data-k="${f.k}"></td>
     <td><input type="number" step="any" data-y="N" data-k="${f.k}"></td></tr>`).join('');
const inp = (y, k) => $(`#finTable input[data-y="${y}"][data-k="${k}"]`);
function setYear(y, o, onlyEmpty) { KEYS.forEach(k => { const el = inp(y, k); if (!onlyEmpty || el.value === '') el.value = o[k] ?? (onlyEmpty ? el.value : ''); }); }
function getYear(y) { const o = {}; let any = false; KEYS.forEach(k => { const v = inp(y, k).value; o[k] = v === '' ? null : +v; if (v !== '') any = true; }); return any ? o : null; }
$('#fullToggle').addEventListener('change', e => document.body.classList.toggle('only-anaf', !e.target.checked));
document.body.classList.add('only-anaf');

/* ---------- încărcare ANAF ---------- */
function parseBilant(j) {
  if (typeof j === 'string') j = JSON.parse(j);
  const o = {};
  (j.i || []).forEach(it => {
    const name = U.strip(it.val_den_indicator); let key = null;
    for (const [re, k] of NAME_MAP) if (re.test(name)) { key = k; break; }
    if (!key) key = CODE2KEY[it.indicator];
    if (key && o[key] == null) o[key] = +it.val_indicator;
  });
  return { o, meta: j, count: Object.keys(o).length };
}
window.AE_parseBilant = parseBilant;
let META = {};
function manualLinks() {
  const c = U.cleanCui($('#bilCui').value) || 'CUI', n = +$('#bilAn').value || new Date().getFullYear() - 1;
  $('#bilManualLinks').innerHTML = [n, n - 1].map(y => `<a href="https://webservicesp.anaf.ro/bilant?an=${y}&cui=${esc(c)}" target="_blank" rel="noopener">bilanț ${y}</a>`).join(' · ');
}
['input', 'change'].forEach(ev => { $('#bilCui').addEventListener(ev, manualLinks); $('#bilAn').addEventListener(ev, manualLinks); });
manualLinks();
async function loadAnaf(cui, an) {
  const c = U.cleanCui(cui); const msg = []; const cache = {};
  let n = +an;
  if (!n) { // anul cel mai recent publicat de ANAF: se încearcă anul trecut, apoi cu un an mai devreme
    const y0 = new Date().getFullYear() - 1;
    for (const y of [y0, y0 - 1]) {
      try { const b = parseBilant(await U.anafBilant(c, y)); cache[y] = b; if (b.count) { n = y; break; } } catch (e) { cache[y] = e; }
    }
    if (!n) n = y0 - 1;
    $('#bilAn').value = n;
    msg.push(`<div class="msg">Cel mai recent bilanț publicat de ANAF pentru acest CUI: <strong>${n}</strong>${n < y0 ? ` (bilanțul pe ${y0} nu este încă publicat)` : ''}.</div>`);
  }
  for (const [y, yr] of [['N', n], ['P', n - 1]]) {
    try {
      if (cache[yr] instanceof Error) throw cache[yr];
      const b = cache[yr] || parseBilant(await U.anafBilant(c, yr));
      if (!b.count) { msg.push(`<div class="msg warn">${yr}: nu există bilanț publicat (PFA/II nu depun bilanț, sau anul nu e încă publicat).</div>`); continue; }
      setYear(y, b.o, false);
      if (y === 'N') { META = { cui: c, an: yr, deni: b.meta.deni, caen: b.meta.caen, den_caen: b.meta.den_caen }; $('#finCaen').value = b.meta.caen || ''; $('#simMode').checked = false; }
      msg.push(`<div class="msg ok">${yr}: ${esc(b.meta.deni || '')} — CAEN ${esc(b.meta.caen || '')} ${esc(b.meta.den_caen || '')}</div>`);
    } catch (e) { msg.push(`<div class="msg warn">${yr}: încărcarea nu a reușit (${esc(e.message)}). Folosește varianta manuală.</div>`); }
  }
  return msg.join('');
}
window.AE_loadAnaf = loadAnaf;
$('#bilLoad').addEventListener('click', async () => {
  const c = U.cleanCui($('#bilCui').value), btn = $('#bilLoad');
  if (!/^\d{2,10}$/.test(c)) { $('#bilMsg').innerHTML = '<div class="msg warn">Introdu un CUI valid.</div>'; return; }
  btn.disabled = true; $('#bilMsg').innerHTML = 'Se încarcă bilanțurile…';
  $('#bilMsg').innerHTML = await loadAnaf(c, $('#bilAn').value);
  btn.disabled = false; manualLinks();
  if (getYear('N')) calc();
});
$$('[data-paste]').forEach(b => b.addEventListener('click', () => {
  try {
    const p = parseBilant($('#bilPaste').value.trim());
    if (!p.count) throw new Error('nu am găsit indicatori');
    setYear(b.dataset.paste, p.o, false);
    if (b.dataset.paste === 'N') { META = { cui: p.meta.cui, an: p.meta.an, deni: p.meta.deni, caen: p.meta.caen, den_caen: p.meta.den_caen }; $('#finCaen').value = p.meta.caen || ''; $('#simMode').checked = false; }
    $('#bilMsg').innerHTML = `<div class="msg ok">Încărcat ${esc(p.meta.an || '')} ${esc(p.meta.deni || '')}.</div>`;
    $('#bilPaste').value = '';
  } catch (e) { $('#bilMsg').innerHTML = `<div class="msg bad">Textul lipit nu este un răspuns ANAF valid (${esc(e.message)}).</div>`; }
}));

$('#finClear').addEventListener('click', () => { setYear('P', {}); setYear('N', {}); $('#finOut').innerHTML = ''; $('#finCaen').value = ''; META = {}; window.AE_LAST = null; });
$('#simMode').addEventListener('change', e => { if (e.target.checked) { META = { sim: true }; $('#fullToggle').checked = true; document.body.classList.remove('only-anaf'); } });
$('#finCalc').addEventListener('click', calc);

/* ---------- calcule ---------- */
const z = v => v ?? 0;
const has = v => v != null && isFinite(v);
const div = (a, b) => (!has(a) || !has(b) || b === 0) ? null : a / b;
const sumOpt = (...xs) => xs.some(has) ? xs.reduce((s, x) => s + z(x), 0) : null;

function compute(d) {
  const AT = z(d.ai) + z(d.ac) + z(d.chav);
  const PT = z(d.dat) + z(d.prov) + z(d.vav) + z(d.cp);
  const RN = z(d.pn) - z(d.pin);
  const RB = z(d.pb) - z(d.pib);
  const DC = d.datc ?? d.dat;
  const DL = d.datl ?? (has(d.datc) && has(d.dat) ? d.dat - d.datc : null);
  const RE = has(d.ve) && has(d.che) ? d.ve - d.che : null;
  const RF = (has(d.vf) || has(d.chf)) ? z(d.vf) - z(d.chf) : null;
  const DOB = d.dob ?? d.chf;
  const EBIT = RE ?? (RB + z(DOB));
  const CHCALC = sumOpt(d.amo, d.ajac, d.aprov);
  const EBITDA = has(EBIT) ? EBIT + z(CHCALC) : null;

  // solduri intermediare de gestiune
  const MC = (has(d.vm) || has(d.chm)) ? z(d.vm) - (z(d.chm) - z(d.rcp)) : null;
  const PE = (has(d.pv) || has(d.vst) || has(d.pim)) ? z(d.pv) + z(d.vst) + z(d.pim) : null;
  const CT = sumOpt(d.cmat, d.cen, d.cpe);
  const VA = (has(MC) || has(PE)) && has(CT) ? z(MC) + z(PE) - CT : null;
  const EBE = has(VA) && has(d.chp) ? VA + z(d.sub) - z(d.cit) - d.chp : null;
  const RE_SIG = has(EBE) ? EBE + z(d.avex) - z(d.acex) - z(CHCALC) : null;
  const CAF = RN + z(CHCALC);
  const AUTOF = has(d.div) ? CAF - d.div : null;

  // bilanț funcțional
  const KP = z(d.cp) + z(DL) + z(d.prov);
  const FR = has(DL) ? KP - z(d.ai) : z(d.ac) - z(DC);
  const NFR = (z(d.st) + z(d.cr) + z(d.chav)) - (z(DC) - z(d.crts)) - z(d.vav);
  const TN = FR - NFR;
  const TNdir = z(d.cb) + z(d.its) - z(d.crts);
  const DF = sumOpt(d.crts, d.crtl);

  const CUMP = sumOpt(d.chm, d.cmat, d.cen, d.cpe);
  const COSTST = sumOpt(d.chm, d.cmat);
  const r = {
    AT, PT, RN, RB, RE, RF, EBIT, EBITDA, MC, PE, CT, VA, EBE, RE_SIG, CAF, AUTOF, KP, FR, NFR, TN, TNdir, DF, DC, DL,
    // lichiditate
    lc: div(d.ac, DC), lr: div(z(d.ac) - z(d.st), DC), li: div(z(d.cb) + z(d.its), DC),
    // structură
    sg: div(AT, d.dat), af: div(d.cp, AT), gi: (d.cp > 0) ? div(d.dat, d.cp) : null, rdlt: has(DL) ? div(DL, KP) : null,
    acim: d.ai ? div(KP, d.ai) : null, acop: DOB ? div(EBIT, DOB) : null, caprb: (has(DF) && CAF > 0) ? DF / CAF : null,
    // rentabilitate
    mn: div(RN, d.ca), mb: div(RB, d.ca), me: div(RE, d.ve), mEBITDA: div(EBITDA, d.ca), rEBE: div(EBE, d.ca), rVA: div(VA, d.ca),
    rCAF: div(CAF, d.ca), roa: div(RN, AT), roe: (d.cp > 0) ? div(RN, d.cp) : null, rimp: (RB > 0 && has(d.imp)) ? d.imp / RB : null,
    rch: div(d.cht, d.vt), rche: div(d.che, d.ve), pchf: div(d.chf, d.ca),
    // gestiune
    ra: div(d.ca, AT), dso: d.ca ? div(z(d.crc ?? d.cr) * 365, d.ca * (d.crc != null ? 1.21 : 1)) : null,
    dio: COSTST ? div(z(d.st) * 365, COSTST) : (d.ca ? div(z(d.st) * 365, d.ca) : null),
    dpo: (has(d.furn) && CUMP) ? d.furn * 365 / (CUMP * 1.21) : null,
    // personal
    pchp: div(d.chp, d.ve), chpVA: div(d.chp, VA), cms: (d.chp && d.sal) ? d.chp / d.sal / 12 : null,
    vas: div(VA, d.sal), cas: div(d.ca, d.sal), rns: div(RN, d.sal)
  };
  r.ccc = has(r.dso) && has(r.dio) && has(r.dpo) ? r.dso + r.dio - r.dpo : null;
  // Du Pont
  r.dpM = div(RN, d.ca); r.dpR = div(d.ca, AT); r.dpL = d.cp > 0 ? div(AT, d.cp) : null;
  // scoruri
  const RES = (has(d.rrep) || has(d.rez)) ? z(d.rrep) + z(d.rez) : z(d.cp) - z(d.cs);
  r.altman = AT && d.dat ? 6.56 * ((z(d.ac) - z(DC)) / AT) + 3.26 * (RES / AT) + 6.72 * (z(EBIT) / AT) + 1.05 * (z(d.cp) / d.dat) : null;
  r.conan = (AT && d.dat && has(EBE) && has(VA) && VA !== 0 && d.ca) ?
    0.24 * (EBE / d.dat) + 0.22 * (KP / AT) + 0.16 * ((z(d.cr) + z(d.cb) + z(d.its)) / AT) - 0.87 * (z(d.chf) / d.ca) - 0.10 * (z(d.chp) / VA) : null;
  r.taffler = (AT && DC && d.dat) ? 0.53 * (RB / DC) + 0.13 * (z(d.ac) / d.dat) + 0.18 * (DC / AT) + 0.16 * (z(d.ca) / AT) : null;
  return r;
}

/* ---------- verificări de coerență ---------- */
function checks(d, r) {
  const out = [];
  const tol = v => Math.max(2, Math.abs(v) * 0.001);
  const ck = (name, a, b, note) => {
    if (!has(a) || !has(b)) return;
    const diff = a - b; out.push({ name, a, b, diff, ok: Math.abs(diff) <= tol(Math.max(Math.abs(a), Math.abs(b))), note });
  };
  ck('Total activ = Total pasiv (datorii + provizioane + venituri în avans + capitaluri)', r.AT, r.PT);
  if ([d.st, d.cr, d.its, d.cb].some(has)) ck('Active circulante = stocuri + creanțe + investiții TS + disponibilități', d.ac, z(d.st) + z(d.cr) + z(d.its) + z(d.cb));
  if ([d.ain, d.aic, d.aif].some(has)) ck('Active imobilizate = necorporale + corporale + financiare', d.ai, z(d.ain) + z(d.aic) + z(d.aif));
  if (has(d.datc) && has(d.datl)) ck('Datorii totale = datorii < 1 an + datorii > 1 an', d.dat, d.datc + d.datl);
  if ([d.prime, d.rreev, d.rez, d.rrep, d.rex].some(has)) ck('Capitaluri proprii = capital + prime + rezerve ± rezultat reportat ± rezultatul exercițiului − repartizare', d.cp, z(d.cs) + z(d.prime) + z(d.rreev) + z(d.rez) + z(d.rrep) + z(d.rex) - z(d.rep));
  if (has(d.rex)) ck('Rezultatul exercițiului din bilanț = rezultatul net din contul de profit și pierdere', d.rex, r.RN);
  if (has(d.ve) && has(d.vf)) ck('Venituri totale = venituri din exploatare + venituri financiare', d.vt, d.ve + d.vf);
  if (has(d.che) && has(d.chf)) ck('Cheltuieli totale = cheltuieli de exploatare + cheltuieli financiare', d.cht, d.che + d.chf);
  if (has(d.vt) && has(d.cht)) ck('Rezultat brut = venituri totale − cheltuieli totale', r.RB, d.vt - d.cht);
  if (has(d.imp)) ck('Rezultat net = rezultat brut − impozit', r.RN, r.RB - d.imp, 'diferențe mici pot proveni din alte impozite (rd. specifice F20)');
  if ([d.pv, d.vm].some(has)) ck('Cifra de afaceri = producția vândută + venituri din mărfuri + subvenții − reduceri acordate', d.ca, z(d.pv) + z(d.vm) + z(d.sub), 'reducerile comerciale acordate scad cifra de afaceri');
  if (has(d.ve) && [d.vst, d.pim, d.avex].some(has)) ck('Venituri din exploatare = CA + variația stocurilor + producția imobilizată + alte venituri', d.ve, z(d.ca) + z(d.vst) + z(d.pim) + z(d.avex), 'pot exista și venituri din reevaluare / investiții imobiliare');
  if (has(d.che) && [d.cmat, d.chp, d.cpe].some(has)) ck('Cheltuieli de exploatare = suma componentelor', d.che, z(d.cmat) + z(d.cen) + z(d.chm) - z(d.rcp) + z(d.chp) + z(d.amo) + z(d.ajac) + z(d.cpe) + z(d.cit) + z(d.acex) + z(d.aprov));
  if (has(r.RE) && has(r.RE_SIG)) ck('Rezultatul exploatării din SIG = venituri − cheltuieli de exploatare', r.RE_SIG, r.RE, 'diferențe apar dacă lipsesc unele componente');
  if (has(d.datc) && has(d.datl)) ck('Trezoreria netă: FR − NFR = disponibilități + investiții TS − credite TS', r.TN, r.TNdir);
  if (has(d.ca) && has(d.ve) && d.ca > d.ve + 2) out.push({ name: 'Cifra de afaceri nu poate depăși veniturile din exploatare', a: d.ca, b: d.ve, diff: d.ca - d.ve, ok: false });
  if (has(d.pb) && has(d.pib) && d.pb > 0 && d.pib > 0) out.push({ name: 'Profit brut și pierdere brută completate simultan', a: d.pb, b: d.pib, diff: null, ok: false });
  return out;
}

/* ---------- interpretări ---------- */
function interpFR(r) {
  const s = [];
  if (r.FR > 0 && r.NFR > 0 && r.TN >= 0) s.push(['ok', 'Echilibru financiar: fondul de rulment acoperă integral nevoia de finanțare a ciclului de exploatare, iar trezoreria este pozitivă.']);
  else if (r.FR > 0 && r.NFR > 0 && r.TN < 0) s.push(['warn', 'Fondul de rulment este pozitiv, dar insuficient pentru NFR — ciclul de exploatare se finanțează parțial din credite pe termen scurt (trezorerie negativă).']);
  else if (r.FR > 0 && r.NFR <= 0) s.push(['ok', 'Ciclul de exploatare generează resurse (NFR negativ, tipic comerțului cu amănuntul); fondul de rulment pozitiv alimentează trezoreria.']);
  else if (r.FR <= 0 && r.NFR <= 0 && r.TN >= 0) s.push(['warn', 'Fond de rulment negativ, compensat de resursele ciclului de exploatare (NFR negativ). Echilibru fragil, dependent de creditul furnizorilor.']);
  else if (r.FR <= 0) s.push(['bad', 'Fond de rulment negativ: o parte din imobilizări este finanțată din surse pe termen scurt — dezechilibru financiar, risc de lichiditate.']);
  return s;
}
const CONAN = v => v > 0.16 ? ['ok', 'situație foarte bună (risc < 10%)'] : v > 0.10 ? ['ok', 'situație bună (risc 10–30%)'] : v > 0.04 ? ['warn', 'alertă (risc 30–65%)'] : v > -0.05 ? ['bad', 'pericol (risc 65–90%)'] : ['bad', 'eșec probabil (risc > 90%)'];
const ALTMAN = v => v > 2.6 ? ['ok', 'zonă sigură'] : v >= 1.1 ? ['warn', 'zonă gri'] : ['bad', 'risc ridicat de dificultate'];
const TAFF = v => v > 0.3 ? ['ok', 'risc redus'] : v >= 0.2 ? ['warn', 'zonă de incertitudine'] : ['bad', 'risc ridicat'];

/* rânduri de indicatori: [eticheta, cheie, format, formula, evaluare] */
const days = v => has(v) ? nf0.format(v) + ' zile' : '—';
const yrs = v => has(v) ? nf2.format(v) + ' ani' : '—';
const R = [
  ['Lichiditate', null],
  ['Lichiditate curentă', 'lc', num, 'Active circulante / Datorii < 1 an', v => v >= 2 ? ['ok', 'bună'] : v >= 1 ? ['warn', 'acceptabilă'] : ['bad', 'risc de plată']],
  ['Lichiditate rapidă', 'lr', num, '(Active circulante − Stocuri) / Datorii < 1 an', v => v >= 1 ? ['ok', 'bună'] : v >= 0.65 ? ['warn', 'acceptabilă'] : ['bad', 'scăzută']],
  ['Lichiditate imediată', 'li', num, '(Disponibilități + investiții TS) / Datorii < 1 an', v => v >= 0.3 ? ['ok', 'bună'] : v >= 0.1 ? ['warn', 'acceptabilă'] : ['bad', 'scăzută']],
  ['Echilibru financiar (bilanț funcțional)', null],
  ['Capital permanent', 'KP', lei, 'Capitaluri proprii + datorii > 1 an + provizioane'],
  ['Fond de rulment (FR)', 'FR', lei, 'Capital permanent − Active imobilizate', v => v > 0 ? ['ok', 'pozitiv'] : ['bad', 'negativ']],
  ['Nevoia de fond de rulment (NFR)', 'NFR', lei, '(Stocuri + creanțe + ch. în avans) − (datorii < 1 an nefinanciare + venituri în avans)'],
  ['Trezoreria netă (TN)', 'TN', lei, 'FR − NFR', v => v >= 0 ? ['ok', 'pozitivă'] : ['warn', 'negativă']],
  ['Structură și solvabilitate', null],
  ['Solvabilitate generală', 'sg', num, 'Active totale / Datorii totale', v => v >= 1.5 ? ['ok', 'bună'] : v >= 1 ? ['warn', 'la limită'] : ['bad', 'datorii > active']],
  ['Autonomie financiară', 'af', pct, 'Capitaluri proprii / Total activ', v => v >= 0.5 ? ['ok', 'ridicată'] : v >= 0.3 ? ['warn', 'medie'] : ['bad', 'dependență de creditori']],
  ['Grad de îndatorare', 'gi', num, 'Datorii totale / Capitaluri proprii', v => v <= 1 ? ['ok', 'moderat'] : v <= 2 ? ['warn', 'ridicat'] : ['bad', 'foarte ridicat']],
  ['Rata datoriilor pe termen lung', 'rdlt', pct, 'Datorii > 1 an / Capital permanent', v => v <= 0.5 ? ['ok', 'sub 50%'] : ['warn', 'peste 50%']],
  ['Acoperirea imobilizărilor din capital permanent', 'acim', num, 'Capital permanent / Active imobilizate', v => v >= 1 ? ['ok', 'acoperite'] : ['bad', 'neacoperite']],
  ['Acoperirea dobânzilor', 'acop', num, 'EBIT / Cheltuieli cu dobânzile', v => v >= 3 ? ['ok', 'confortabilă'] : v >= 1.5 ? ['warn', 'la limită'] : ['bad', 'insuficientă']],
  ['Capacitatea de rambursare', 'caprb', yrs, 'Datorii bancare / CAF', v => v <= 3 ? ['ok', 'bună'] : v <= 5 ? ['warn', 'medie'] : ['bad', 'slabă']],
  ['Solduri intermediare de gestiune', null],
  ['Marja comercială', 'MC', lei, 'Venituri din mărfuri − (cost mărfuri − reduceri primite)'],
  ['Producția exercițiului', 'PE', lei, 'Producția vândută ± variația stocurilor + producția imobilizată'],
  ['Consumuri de la terți', 'CT', lei, 'Materiale + energie + prestații externe'],
  ['Valoarea adăugată (VA)', 'VA', lei, 'Marja comercială + Producția exercițiului − Consumuri de la terți', v => v > 0 ? ['ok', 'pozitivă'] : ['bad', 'negativă']],
  ['Excedentul brut din exploatare (EBE)', 'EBE', lei, 'VA + subvenții − impozite și taxe − cheltuieli cu personalul', v => v > 0 ? ['ok', 'pozitiv'] : ['bad', 'insuficiență']],
  ['Rezultatul exploatării', 'RE', lei, 'Venituri din exploatare − Cheltuieli de exploatare', v => v > 0 ? ['ok', 'profit'] : ['bad', 'pierdere']],
  ['Rezultatul financiar', 'RF', lei, 'Venituri financiare − Cheltuieli financiare', v => v >= 0 ? ['ok', 'pozitiv'] : ['warn', 'negativ']],
  ['Rezultatul brut', 'RB', lei, 'Venituri totale − Cheltuieli totale', v => v > 0 ? ['ok', 'profit'] : ['bad', 'pierdere']],
  ['Rezultatul net', 'RN', lei, 'Profit net − Pierdere netă', v => v > 0 ? ['ok', 'profit'] : v < 0 ? ['bad', 'pierdere'] : ['neu', 'zero']],
  ['EBITDA', 'EBITDA', lei, 'Rezultatul exploatării + amortizări și ajustări', v => v > 0 ? ['ok', 'pozitiv'] : ['bad', 'negativ']],
  ['Capacitatea de autofinanțare (CAF)', 'CAF', lei, 'Rezultat net + cheltuieli calculate nete (amortizări, ajustări, provizioane)', v => v > 0 ? ['ok', 'pozitivă'] : ['bad', 'negativă']],
  ['Autofinanțarea', 'AUTOF', lei, 'CAF − Dividende', v => v >= 0 ? ['ok', 'pozitivă'] : ['warn', 'dividende peste CAF']],
  ['Rentabilitate', null],
  ['Rata valorii adăugate', 'rVA', pct, 'VA / Cifra de afaceri'],
  ['Rata EBE', 'rEBE', pct, 'EBE / Cifra de afaceri', v => v >= 0.08 ? ['ok', 'bună'] : v >= 0 ? ['warn', 'redusă'] : ['bad', 'negativă']],
  ['Marja de exploatare', 'me', pct, 'Rezultatul exploatării / Venituri din exploatare', v => v >= 0.05 ? ['ok', 'bună'] : v >= 0 ? ['warn', 'redusă'] : ['bad', 'negativă']],
  ['Marja EBITDA', 'mEBITDA', pct, 'EBITDA / Cifra de afaceri', v => v >= 0.1 ? ['ok', 'bună'] : v >= 0 ? ['warn', 'redusă'] : ['bad', 'negativă']],
  ['Marja netă', 'mn', pct, 'Rezultat net / Cifra de afaceri', v => v >= 0.05 ? ['ok', 'bună'] : v >= 0 ? ['warn', 'redusă'] : ['bad', 'negativă']],
  ['Rata CAF', 'rCAF', pct, 'CAF / Cifra de afaceri'],
  ['ROA', 'roa', pct, 'Rezultat net / Active totale', v => v >= 0.05 ? ['ok', 'bună'] : v >= 0 ? ['warn', 'redusă'] : ['bad', 'negativă']],
  ['ROE', 'roe', pct, 'Rezultat net / Capitaluri proprii', v => v >= 0.1 ? ['ok', 'bună'] : v >= 0 ? ['warn', 'redusă'] : ['bad', 'negativă']],
  ['Rata efectivă de impozitare', 'rimp', pct, 'Impozit / Rezultat brut', v => v > 0.25 ? ['warn', 'ridicată — verifică nedeductibilele'] : ['neu', '']],
  ['Rata cheltuielilor totale', 'rch', pct, 'Cheltuieli totale / Venituri totale', v => v < 0.95 ? ['ok', 'sub 95%'] : v <= 1 ? ['warn', 'la limită'] : ['bad', 'peste venituri']],
  ['Ponderea cheltuielilor financiare în CA', 'pchf', pct, 'Cheltuieli financiare / CA', v => v <= 0.02 ? ['ok', 'redusă'] : v <= 0.05 ? ['warn', 'moderată'] : ['bad', 'ridicată']],
  ['Gestiunea activelor și ciclul de numerar', null],
  ['Rotația activelor', 'ra', num, 'CA / Active totale'],
  ['Durata de încasare a clienților (DSO)', 'dso', days, 'Clienți / (CA × 1,21) × 365 (sau Creanțe / CA × 365)', v => v <= 60 ? ['ok', 'rapidă'] : v <= 90 ? ['warn', 'medie'] : ['bad', 'lentă']],
  ['Durata de stocare (DIO)', 'dio', days, 'Stocuri / (cost mărfuri + materiale) × 365', () => ['neu', 'comparați cu sectorul']],
  ['Durata de plată a furnizorilor (DPO)', 'dpo', days, 'Furnizori / (cumpărări × 1,21) × 365', v => v > 120 ? ['warn', 'întârzieri la plată?'] : ['neu', '']],
  ['Ciclul de conversie a numerarului', 'ccc', days, 'DSO + DIO − DPO', v => v <= 60 ? ['ok', 'scurt'] : v <= 120 ? ['warn', 'mediu'] : ['bad', 'lung']],
  ['Personal și productivitate', null],
  ['Ponderea cheltuielilor cu personalul', 'pchp', pct, 'Cheltuieli cu personalul / Venituri din exploatare', v => v <= 0.4 ? ['neu', 'depinde de sector'] : v <= 0.6 ? ['warn', 'ridicată'] : ['bad', 'foarte ridicată']],
  ['Cheltuieli cu personalul / VA', 'chpVA', pct, 'Partea din valoarea adăugată care remunerează personalul', v => v <= 0.7 ? ['ok', 'sustenabilă'] : v <= 1 ? ['warn', 'ridicată'] : ['bad', 'peste VA']],
  ['Cost mediu lunar per salariat', 'cms', lei, 'Cheltuieli cu personalul / Nr. salariați / 12', v => v < 4050 ? ['warn', 'sub salariul minim'] : ['neu', '']],
  ['Valoare adăugată / salariat', 'vas', lei, 'VA / Nr. mediu salariați'],
  ['Cifra de afaceri / salariat', 'cas', lei, 'CA / Nr. mediu salariați'],
  ['Rezultat net / salariat', 'rns', lei, 'Rezultat net / Nr. mediu salariați']
];

function alerts(N, P, r, rp) {
  const a = [];
  if (N.cp != null && N.cp < 0) a.push(['bad', 'Capitaluri proprii negative — datoriile depășesc activele (supra-îndatorare, risc de insolvență).']);
  else if (N.cp != null && N.cs && N.cp < N.cs / 2) a.push(['bad', 'Activul net este sub jumătate din capitalul subscris — Legea 31/1990 impune convocarea AGA și reîntregirea sau reducerea capitalului.']);
  if (r.RN < 0) a.push(['bad', `Pierdere netă de ${lei(-r.RN)}.`]);
  if (rp && rp.RN < 0 && r.RN < 0) a.push(['bad', 'Pierderi în doi ani consecutivi.']);
  if (has(r.RE) && r.RE < 0) a.push(['bad', 'Pierdere din exploatare — activitatea de bază nu își acoperă costurile.']);
  if (has(r.RE) && r.RE > 0 && r.RN < 0) a.push(['warn', 'Exploatarea e profitabilă, dar rezultatul net e pierdere — cauza este activitatea financiară.']);
  if (has(r.EBE) && r.EBE < 0) a.push(['bad', 'Insuficiență brută din exploatare (EBE negativ): valoarea adăugată nu acoperă cheltuielile cu personalul și taxele.']);
  if (r.CAF < 0) a.push(['bad', 'Capacitate de autofinanțare negativă — firma consumă resurse.']);
  if (has(r.AUTOF) && r.AUTOF < 0) a.push(['warn', 'Dividendele distribuite depășesc capacitatea de autofinanțare.']);
  if (r.FR < 0) a.push(['bad', 'Fond de rulment negativ — imobilizări finanțate din surse pe termen scurt.']);
  if (!N.ca) a.push(['warn', 'Cifră de afaceri zero — posibilă firmă fără activitate.']);
  if (P && P.ca && has(N.ca)) { const v = (N.ca - P.ca) / Math.abs(P.ca); if (v < -0.2) a.push(['warn', `Cifra de afaceri a scăzut cu ${pct(-v)}.`]); if (v > 2) a.push(['warn', `Creștere foarte rapidă a cifrei de afaceri (${pct(v)}) — verifică sursa veniturilor.`]); }
  if (P && P.dat && has(N.dat)) { const vd = (N.dat - P.dat) / P.dat, vc = P.ca ? (N.ca - P.ca) / P.ca : null; if (vd > 0.3 && (vc == null || vc < vd / 2)) a.push(['warn', `Datoriile au crescut cu ${pct(vd)}, mai repede decât cifra de afaceri.`]); }
  if (has(r.lc) && r.lc < 1) a.push(['bad', 'Lichiditate curentă sub 1.']);
  if (has(r.sg) && r.sg < 1) a.push(['bad', 'Solvabilitate sub 1 — activele nu acoperă datoriile.']);
  if (has(r.dso) && r.dso > 90) a.push(['warn', `Clienții se încasează în medie în ${nf0.format(r.dso)} de zile.`]);
  if (has(r.dpo) && r.dpo > 120) a.push(['warn', `Furnizorii sunt plătiți în medie în ${nf0.format(r.dpo)} de zile — posibile restanțe.`]);
  if (has(r.pchf) && r.pchf > 0.05) a.push(['bad', `Cheltuielile financiare reprezintă ${pct(r.pchf)} din CA.`]);
  if (has(r.chpVA) && r.chpVA > 1) a.push(['bad', 'Cheltuielile cu personalul depășesc valoarea adăugată creată.']);
  if (has(r.cms) && r.cms < 4050) a.push(['warn', `Cost mediu lunar per salariat (${lei(r.cms)}) sub salariul minim brut — timp parțial sau posibilă sub-declarare.`]);
  if (P && N.sal && P.sal && N.sal < P.sal && N.chp > P.chp) a.push(['warn', 'Mai puțini salariați, dar cheltuieli cu personalul mai mari.']);
  if (N.ca > 1000000 && !N.sal) a.push(['warn', 'Cifră de afaceri peste 1 milion lei fără salariați — verifică substanța economică.']);
  if (has(r.rimp) && r.rimp > 0.25) a.push(['warn', `Rata efectivă de impozitare ${pct(r.rimp)} — cheltuieli nedeductibile semnificative?`]);
  if (has(r.caprb) && r.caprb > 5) a.push(['warn', `Datoriile bancare reprezintă ${nf2.format(r.caprb)} ani de CAF.`]);
  if (rp && has(r.dso) && rp.dso && r.dso > rp.dso * 1.3) a.push(['warn', 'Durata de încasare s-a deteriorat cu peste 30%.']);
  return a;
}

/* ---------- cash-flow estimat ---------- */
function cashflow(P, N, rp, r) {
  if (!P) return null;
  const dNFR = r.NFR - rp.NFR;
  const cfe = r.CAF - dNFR;
  const cfi = -((z(N.ai) - z(P.ai)) + z(N.amo));
  const dDF = (z(N.crtl) + z(N.crts)) - (z(P.crtl) + z(P.crts));
  const dCap = (z(N.cs) + z(N.prime)) - (z(P.cs) + z(P.prime));
  const cff = (has(N.crtl) || has(N.crts) ? dDF - z(N.crts) + z(P.crts) : 0) + dCap - z(N.div);
  const dTN = r.TNdir - rp.TNdir;
  return { cfe, cfi, cff, dNFR, sum: cfe + cfi + cff, dTN, dCash: (z(N.cb) + z(N.its)) - (z(P.cb) + z(P.its)) };
}

/* ---------- randare ---------- */
const badge = (v, ev) => { if (!ev || !has(v)) return ''; const [c, t] = ev(v); return t ? `<span class="badge ${c}">${t}</span>` : ''; };
function calc() {
  const N = getYear('N'), P = getYear('P'), out = $('#finOut');
  META.sim = $('#simMode').checked;
  const cz = $('#finCaen').value.replace(/\D/g, ''); META.caen = cz || (META.sim ? '' : META.caen);
  if (META.sim && !META.an) META.an = +$('#bilAn').value || null;
  if (!N) { out.innerHTML = '<div class="msg warn">Completează cel puțin coloana anului N.</div>'; return; }
  const r = compute(N), rp = P ? compute(P) : null;
  const ch = checks(N, r), chp = P ? checks(P, rp) : [];
  const S = window.AE_SECTOR ? window.AE_SECTOR.compare(META.caen, r, N, META.an) : null;
  let h = META.sim ? '<div class="msg sim"><strong>SIMULARE</strong> — analiză pe date introduse manual (ipotetice). Rezultatele nu reprezintă situațiile financiare ale unei firme reale.</div>' : '';

  // 1. verificări
  const bad = ch.filter(c => !c.ok).length;
  h += `<h3 class="sec">1. Verificări de coerență a situațiilor financiare (anul N)</h3>
  <p class="hint">Corelațiile de bază din formularele F10 și F20. Abaterile semnalează erori de completare sau date lipsă.</p>
  <table class="ratios"><thead><tr><th>Corelație</th><th>Valoare</th><th>Control</th><th>Diferență</th><th></th></tr></thead><tbody>
  ${ch.map(c => `<tr><td>${esc(c.name)}${c.note ? `<div class="f">${esc(c.note)}</div>` : ''}</td><td class="num">${lei(c.a)}</td><td class="num">${lei(c.b)}</td><td class="num">${c.diff == null ? '—' : lei(c.diff)}</td><td>${c.ok ? '<span class="badge ok">corect</span>' : '<span class="badge bad">abatere</span>'}</td></tr>`).join('')}
  </tbody></table>
  ${bad ? `<div class="msg warn">${bad} corelații nu se verifică${chp.filter(c => !c.ok).length ? ` (și ${chp.filter(c => !c.ok).length} în anul N-1)` : ''}.</div>` : '<div class="msg ok">Toate corelațiile disponibile se verifică.</div>'}`;

  // 2. scoruri
  const sc = [['Altman Z″ (firme necotate)', r.altman, ALTMAN, '6,56·FR/AT + 3,26·Rezerve/AT + 6,72·EBIT/AT + 1,05·CP/Datorii. Praguri 1,1 / 2,6.'],
    ['Conan-Holder', r.conan, CONAN, '0,24·EBE/Dat + 0,22·Kperm/AT + 0,16·(Cr+Disp)/AT − 0,87·ChFin/CA − 0,10·ChPers/VA. Necesită F20 detaliat.'],
    ['Taffler', r.taffler, TAFF, '0,53·RB/DatCurente + 0,13·AC/Dat + 0,18·DatCurente/AT + 0,16·CA/AT. Praguri 0,2 / 0,3.']];
  h += `<h3 class="sec">2. Scoruri de risc de faliment</h3><div class="score">${sc.map(([t, v, f, d]) => {
    const [c, l] = has(v) ? f(v) : ['neu', 'date insuficiente'];
    return `<div class="box"><div class="hint">${t}</div><div class="big">${has(v) ? nf2.format(v) : '—'}</div><span class="badge ${c}">${l}</span><p class="hint">${d}</p></div>`;
  }).join('')}</div>`;

  // 3. indicatori
  h += `<h3 class="sec">3. Indicatori economico-financiari</h3>
  <table class="ratios"><thead><tr><th>Indicator</th>${rp ? '<th>N-1</th>' : ''}<th>N</th><th>Evaluare</th></tr></thead><tbody>`;
  R.forEach(([lab, k, f, form, ev]) => {
    if (!k) { h += `<tr class="grp"><td colspan="${3 + !!rp}">${lab}</td></tr>`; return; }
    if (!has(r[k]) && !(rp && has(rp[k]))) return;
    h += `<tr><td>${lab}<div class="f">${form}</div></td>${rp ? `<td class="num">${f(rp[k])}</td>` : ''}<td class="num"><strong>${f(r[k])}</strong></td><td>${badge(r[k], ev)}</td></tr>`;
  });
  h += '</tbody></table>';
  if (!has(N.datc)) h += '<p class="hint">Datoriile < 1 an nu au fost completate: lichiditatea folosește datoriile totale, iar FR = active circulante − datorii.</p>';

  // 4. echilibru, Du Pont, cash-flow
  h += `<h3 class="sec">4. Echilibru financiar, Du Pont și fluxuri de numerar</h3><div class="score">`;
  h += `<div class="box"><div class="hint">Bilanț funcțional</div>
    <table class="sum"><tr><td>Fond de rulment</td><td class="num">${lei(r.FR)}</td></tr><tr><td>Nevoia de fond de rulment</td><td class="num">${lei(r.NFR)}</td></tr><tr class="tot"><td>Trezoreria netă</td><td class="num">${lei(r.TN)}</td></tr></table>
    ${interpFR(r).map(([c, t]) => `<div class="msg ${c}">${t}</div>`).join('')}</div>`;
  if (has(r.dpM) && has(r.dpR) && has(r.dpL)) {
    const dpp = rp && has(rp.dpL) ? rp : null;
    h += `<div class="box"><div class="hint">Descompunerea Du Pont a ROE</div>
    <table class="sum"><tr><td></td>${dpp ? '<td class="num">N-1</td>' : ''}<td class="num">N</td></tr>
    <tr><td>Marja netă</td>${dpp ? `<td class="num">${pct(dpp.dpM)}</td>` : ''}<td class="num">${pct(r.dpM)}</td></tr>
    <tr><td>× Rotația activelor</td>${dpp ? `<td class="num">${num(dpp.dpR)}</td>` : ''}<td class="num">${num(r.dpR)}</td></tr>
    <tr><td>× Multiplicatorul capitalului (AT/CP)</td>${dpp ? `<td class="num">${num(dpp.dpL)}</td>` : ''}<td class="num">${num(r.dpL)}</td></tr>
    <tr class="tot"><td>= ROE</td>${dpp ? `<td class="num">${pct(dpp.dpM * dpp.dpR * dpp.dpL)}</td>` : ''}<td class="num">${pct(r.dpM * r.dpR * r.dpL)}</td></tr></table>
    ${dpp ? `<p class="hint">${dupontText(dpp, r)}</p>` : ''}</div>`;
  }
  const cf = cashflow(P, N, rp, r);
  if (cf) h += `<div class="box"><div class="hint">Fluxuri de numerar estimate (metoda indirectă)</div>
    <table class="sum"><tr><td>CAF</td><td class="num">${lei(r.CAF)}</td></tr><tr><td>− Variația NFR</td><td class="num">${lei(-cf.dNFR)}</td></tr>
    <tr class="hl"><td>Flux din exploatare</td><td class="num">${lei(cf.cfe)}</td></tr><tr class="hl"><td>Flux din investiții</td><td class="num">${lei(cf.cfi)}</td></tr>
    <tr class="hl"><td>Flux din finanțare</td><td class="num">${lei(cf.cff)}</td></tr><tr class="tot"><td>Variația trezoreriei nete</td><td class="num">${lei(cf.sum)}</td></tr>
    <tr><td>Control: variația TN din bilanț</td><td class="num">${lei(cf.dTN)}</td></tr></table>
    <p class="hint">Estimare din două bilanțuri; pentru precizie folosiți situația fluxurilor de trezorerie (entități mijlocii și mari).</p></div>`;
  h += '</div>';

  // 5. sector
  if (S) h += S.html;
  else if (META.caen) h += `<div class="msg warn">Codul CAEN ${esc(META.caen)} nu are date de sector (sau datele de sector nu s-au încărcat încă).</div>`;
  else h += '<p class="hint">Pentru comparația cu sectorul, completează codul CAEN (se preia automat la încărcarea de la ANAF).</p>';

  // 6. alerte
  const al = alerts(N, P, r, rp);
  h += `<h3 class="sec">${S ? 6 : 5}. Semnale pentru verificare</h3>` + (al.length
    ? `<ul class="alerts">${al.map(([c, t]) => `<li><span class="badge ${c}">${c === 'bad' ? 'risc' : 'atenție'}</span> ${t}</li>`).join('')}</ul>`
    : '<div class="msg ok">Nu au fost identificate semnale de alertă.</div>');
  h += `<p class="row"><a class="btn" href="#raport" id="toRaport">Generează raportul de analiză →</a></p>
  <p class="disclaimer">Pragurile sunt orientative și diferă între sectoare. Scorurile de faliment au fost calibrate pe alte economii și perioade; folosiți-le ca semnal, nu ca verdict.</p>`;
  out.innerHTML = h;
  window.AE_LAST = { N, P, r, rp, checks: ch, alerts: al, meta: { ...META }, sector: S, cf };
  out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function dupontText(p, n) {
  const roeP = p.dpM * p.dpR * p.dpL, roeN = n.dpM * n.dpR * n.dpL;
  const parts = [['marjei nete', n.dpM / p.dpM], ['rotației activelor', n.dpR / p.dpR], ['îndatorării (multiplicatorul capitalului)', n.dpL / p.dpL]];
  parts.sort((a, b) => Math.abs(Math.log(Math.abs(b[1]) || 1)) - Math.abs(Math.log(Math.abs(a[1]) || 1)));
  return `ROE ${roeN >= roeP ? 'a crescut' : 'a scăzut'} de la ${pct(roeP)} la ${pct(roeN)}; factorul principal este evoluția ${parts[0][0]}.`;
}
window.AE_calc = calc;
window.AE_compute = compute;
})();
