/* Analiză de sector CAEN — din situațiile financiare 2025 și 2024 publicate de Ministerul Finanțelor (data.gov.ro) */
(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const U = window.AEU; const { lei, pct, num, nf0, nf2, esc, strip } = U;
let D = null, LOADING = null;
function load() { if (!LOADING) LOADING = fetch('sector2025.json?v=7').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(j => (D = j)); return LOADING; }
load().then(initTab).catch(e => { const o = $('#secOut'); if (o) o.innerHTML = `<div class="msg bad">Datele de sector nu s-au putut încărca (${esc(e.message)}).</div>`; });

const days = v => v == null || !isFinite(v) ? '—' : nf0.format(v) + ' zile';
const int = v => v == null || !isFinite(v) ? '—' : nf0.format(v);
/* definițiile indicatorilor de sector — identice cu cele din calculul pe date.gov.ro */
const RD = {
  mn: ['Marja netă', pct, 'Rezultat net / CA', 1], mbr: ['Marja brută', pct, '(Venituri totale − Cheltuieli totale) / CA', 1],
  roa: ['ROA', pct, 'Rezultat net / Active totale', 1], roe: ['ROE (firme cu CP > 0)', pct, 'Rezultat net / Capitaluri proprii', 1],
  sg: ['Solvabilitate generală', num, 'Active totale / Datorii', 1], af: ['Autonomie financiară', pct, 'Capitaluri proprii / Active totale', 1],
  gi: ['Grad de îndatorare (firme cu CP > 0)', num, 'Datorii / Capitaluri proprii', -1], lg: ['Active circulante / Datorii', num, 'Lichiditate generală (datorii totale)', 1],
  dso: ['Creanțe / CA × 365', days, 'Durata medie a creanțelor', -1], dio: ['Stocuri / CA × 365', days, 'Durata medie a stocurilor', 0],
  ra: ['Rotația activelor', num, 'CA / Active totale', 1], rch: ['Cheltuieli / Venituri totale', pct, 'Cheltuieli totale / Venituri totale', -1],
  ai_at: ['Active imobilizate / Active totale', pct, 'Structura activului', 0], ac_at: ['Active circulante / Active totale', pct, 'Structura activului', 0],
  st_at: ['Stocuri / Active totale', pct, 'Structura activului', 0], cr_at: ['Creanțe / Active totale', pct, 'Structura activului', 0],
  cb_at: ['Disponibilități / Active totale', pct, 'Structura activului', 0], dat_at: ['Datorii / Active totale', pct, 'Structura pasivului', -1],
  cp_at: ['Capitaluri proprii / Active totale', pct, 'Structura pasivului', 1],
  cas: ['Cifra de afaceri / salariat', lei, 'firme cu salariați', 1], vts: ['Venituri totale / salariat', lei, 'firme cu salariați', 1],
  chs: ['Cheltuieli totale / salariat', lei, 'firme cu salariați', 0], rns: ['Rezultat net / salariat', lei, 'firme cu salariați', 1],
  ats: ['Active totale / salariat', lei, 'firme cu salariați', 0], sal: ['Număr mediu de salariați', int, '', 0],
  ca: ['Cifra de afaceri', lei, '', 0], at: ['Active totale', lei, '', 0], cp: ['Capitaluri proprii', lei, '', 0]
};
const SF = () => D.sumFields;
const sum = (g, k) => g[7][SF().indexOf(k)];
const psum = (p, k) => p[3][SF().indexOf(k)];
function nameOf(code) {
  const n = D.caen[code]; if (!n) return '';
  return n[1] || n[0] || '';
}
function key(code) {
  const c = String(code || '').replace(/\D/g, ''); if (!c) return null;
  const c4 = c.padStart(4, '0').slice(0, 4);
  if (c.length >= 3 && D.d[c4]) return c4;
  const c2 = c.length <= 2 ? c.padStart(2, '0') : c4.slice(0, 2);
  return D.d[c2] ? c2 : null;
}
const label = k => k === 'ALL' ? 'toate firmele' : (k.length === 4 ? `clasa CAEN ${k}` : `diviziunea CAEN ${k}`) + (nameOf(k) ? ` — ${nameOf(k)}` : '');
const sameMeaning = k => { if (k.length !== 4) return false; const n = D.caen[k]; return !!(n && n[0] && n[1] && strip(n[0]).replace(/[^a-z]/g, '') === strip(n[1]).replace(/[^a-z]/g, '')); };
function pctile(q, v) { // percentila estimată prin interpolare între P10, P25, P50, P75, P90
  if (!q || v == null || !isFinite(v)) return null; const P = [10, 25, 50, 75, 90];
  if (v <= q[0]) return [0, 10]; if (v >= q[4]) return [90, 100];
  for (let i = 0; i < 4; i++) if (v >= q[i] && v <= q[i + 1]) { const t = q[i + 1] === q[i] ? 0.5 : (v - q[i]) / (q[i + 1] - q[i]); return [P[i] + t * (P[i + 1] - P[i])]; }
  return null;
}
const pTxt = p => !p ? '—' : p.length === 2 ? (p[0] === 0 ? 'sub P10' : 'peste P90') : 'P' + nf0.format(p[0]);
const chg = (a, b) => (a == null || !b) ? null : (a - b) / Math.abs(b);
const chgTxt = v => v == null ? '—' : `<span class="${v >= 0 ? 'up' : 'down'}">${v >= 0 ? '+' : ''}${nf2.format(v * 100)}%</span>`;

/* ---------- profilul sectorului ---------- */
function profile(k) {
  const g = D.d[k]; const [all, n, prof, loss, cpneg, sz, szca, , cr4, cr10, hhi, q] = g;
  const AT = sum(g, 'ai') + sum(g, 'ac') + sum(g, 'chav');
  const CA = sum(g, 'ca'), VT = sum(g, 'vt'), CHT = sum(g, 'cht'), PN = sum(g, 'pn'), PIN = sum(g, 'pin'), SAL = sum(g, 'sal');
  const DAT = sum(g, 'dat'), CP = sum(g, 'cp'), RN = PN - PIN;
  const p = D.p[k];
  const cls = ['fără salariați', '1–9 salariați', '10–49 salariați', '50–249 salariați', '250+ salariați'];
  let h = `<div class="sec-head"><h3>${esc(label(k))}</h3>
  <p class="hint">Exercițiul financiar ${D.an}. ${nf0.format(n)} firme active (cu cifră de afaceri), din ${nf0.format(all)} care au depus bilanț. Sursa: ${esc(D.src)}.</p></div>
  <div class="score">
    <div class="box"><div class="hint">Firme cu profit / cu pierdere</div><div class="big">${pct(prof / n)}</div><span class="hint">${pct(loss / n)} cu pierdere · ${pct(cpneg / n)} cu capitaluri proprii negative</span></div>
    <div class="box"><div class="hint">Cifra de afaceri a sectorului</div><div class="big">${lei(CA)}</div><span class="hint">${nf0.format(SAL)} salariați · ${lei(SAL ? CA / SAL : null)} / salariat</span></div>
    <div class="box"><div class="hint">Rezultat net agregat</div><div class="big">${lei(RN)}</div><span class="hint">profituri ${lei(PN)} · pierderi ${lei(PIN)} · marjă netă agregată ${pct(CA ? RN / CA : null)}</span></div>
    <div class="box"><div class="hint">Concentrarea pieței</div><div class="big">${pct(cr4)}</div><span class="hint">cota primelor 4 firme · primele 10: ${pct(cr10)} · indice Herfindahl ${nf0.format(hhi)} (din max. 10.000)</span></div>
  </div>`;

  h += `<h4>Bilanțul agregat al sectorului</h4><div class="cards two"><table class="sum">
  <tr class="hl"><td><strong>Active totale</strong></td><td class="num"><strong>${lei(AT)}</strong></td><td class="num">100%</td></tr>
  ${[['Active imobilizate', 'ai'], ['Active circulante', 'ac'], ['— stocuri', 'st'], ['— creanțe', 'cr'], ['— casa și conturi la bănci', 'cb'], ['Cheltuieli în avans', 'chav']].map(([l, f]) => `<tr><td>${l}</td><td class="num">${lei(sum(g, f))}</td><td class="num">${pct(sum(g, f) / AT)}</td></tr>`).join('')}
  </table><table class="sum">
  <tr class="hl"><td><strong>Pasive totale</strong></td><td class="num"><strong>${lei(DAT + sum(g, 'prov') + sum(g, 'vav') + CP)}</strong></td><td class="num">100%</td></tr>
  ${[['Datorii', 'dat'], ['Provizioane', 'prov'], ['Venituri în avans', 'vav'], ['Capitaluri proprii', 'cp'], ['— capital subscris vărsat', 'cs']].map(([l, f]) => `<tr><td>${l}</td><td class="num">${lei(sum(g, f))}</td><td class="num">${pct(sum(g, f) / AT)}</td></tr>`).join('')}
  </table></div>
  <table class="sum"><tr><td>Lichiditate generală agregată (active circulante / datorii)</td><td class="num">${num(sum(g, 'ac') / DAT)}</td><td>Solvabilitate agregată (active / datorii)</td><td class="num">${num(AT / DAT)}</td></tr>
  <tr><td>Autonomie financiară agregată</td><td class="num">${pct(CP / AT)}</td><td>Grad de îndatorare agregat (datorii / CP)</td><td class="num">${CP > 0 ? num(DAT / CP) : '—'}</td></tr></table>`;

  h += `<h4>Venituri, cheltuieli și rezultate agregate</h4><table class="sum">
  <tr><td>Cifra de afaceri netă</td><td class="num">${lei(CA)}</td><td>Venituri totale</td><td class="num">${lei(VT)}</td></tr>
  <tr><td>Cheltuieli totale</td><td class="num">${lei(CHT)}</td><td>Rezultat brut agregat</td><td class="num">${lei(VT - CHT)}</td></tr>
  <tr><td>Număr mediu de salariați (total)</td><td class="num">${nf0.format(SAL)}</td><td>Salariați pe firmă activă (medie)</td><td class="num">${nf2.format(SAL / n)}</td></tr>
  <tr><td>Cifra de afaceri / salariat (agregat)</td><td class="num">${lei(SAL ? CA / SAL : null)}</td><td>Venituri totale / salariat (agregat)</td><td class="num">${lei(SAL ? VT / SAL : null)}</td></tr>
  <tr><td>Cheltuieli totale / salariat (agregat)</td><td class="num">${lei(SAL ? CHT / SAL : null)}</td><td>Rezultat net / salariat (agregat)</td><td class="num">${lei(SAL ? RN / SAL : null)}</td></tr></table>
  <p class="hint">Valorile „agregate” sunt raportul dintre totalurile sectorului (ponderate cu mărimea firmelor). Medianele din tabelul de distribuție descriu firma tipică.</p>`;

  h += `<h4>Structura pe clase de mărime</h4><table class="ratios"><thead><tr><th>Clasă</th><th>Firme</th><th>% din firme</th><th>% din cifra de afaceri</th></tr></thead><tbody>
  ${cls.map((c, i) => `<tr><td>${c}</td><td class="num">${nf0.format(sz[i])}</td><td class="num">${pct(sz[i] / n)}</td><td class="num">${pct(szca[i] / (CA || 1))}</td></tr>`).join('')}</tbody></table>`;

  if (p) {
    const ok4 = k.length !== 4 || sameMeaning(k);
    const PAT = psum(p, 'ai') + psum(p, 'ac') + psum(p, 'chav');
    const rows = [['Firme active', n, p[0], int], ['Cifra de afaceri', CA, psum(p, 'ca'), lei], ['Venituri totale', VT, psum(p, 'vt'), lei], ['Cheltuieli totale', CHT, psum(p, 'cht'), lei],
      ['Rezultat net agregat', RN, psum(p, 'pn') - psum(p, 'pin'), lei], ['Număr mediu de salariați', SAL, psum(p, 'sal'), int], ['Active totale', AT, PAT, lei],
      ['Datorii', DAT, psum(p, 'dat'), lei], ['Capitaluri proprii', CP, psum(p, 'cp'), lei], ['Firme cu pierdere (%)', loss / n, p[1] / p[0], pct]];
    h += `<h4>Evoluția sectorului ${D.prevAn} → ${D.an}</h4>` + (ok4 ? `<table class="ratios"><thead><tr><th>Indicator</th><th>${D.prevAn}</th><th>${D.an}</th><th>Variație</th></tr></thead><tbody>
    ${rows.map(([l, a, b, f]) => `<tr><td>${l}</td><td class="num">${f(b)}</td><td class="num">${f(a)}</td><td class="num">${f === pct ? (a - b >= 0 ? '+' : '') + nf2.format((a - b) * 100) + ' pp' : chgTxt(chg(a, b))}</td></tr>`).join('')}</tbody></table>
    ${k.length === 2 || k === 'ALL' ? '<p class="hint">Atenție: bilanțurile pe 2025 folosesc CAEN Rev.3, iar cele pe 2024 CAEN Rev.2. Unele activități au fost mutate între clase și diviziuni, așa că variațiile pe diviziuni includ și efectul reclasificării.</p>' : ''}`
    : `<p class="hint">Evoluția nu se afișează: denumirea clasei ${k} diferă între CAEN Rev.2 (bilanțurile ${D.prevAn}) și CAEN Rev.3 (bilanțurile ${D.an}), deci firmele comparate nu sunt aceleași.</p>`);
  }

  h += `<h4>Distribuția indicatorilor în sector (firme active)</h4>
  <table class="ratios"><thead><tr><th>Indicator</th><th>P10</th><th>P25</th><th>Mediana</th><th>P75</th><th>P90</th></tr></thead><tbody>
  ${D.ratios.map((r, i) => { const d = RD[r]; const x = q[i]; if (!x || !d) return ''; return `<tr><td>${d[0]}${d[2] ? `<div class="f">${d[2]}</div>` : ''}</td>${x.map((v, j) => `<td class="num${j === 2 ? ' med' : ''}">${d[1](v)}</td>`).join('')}</tr>`; }).join('')}
  </tbody></table><p class="hint">P10 = 10% din firme au valori mai mici; mediana = firma din mijloc; P90 = doar 10% din firme au valori mai mari.</p>`;
  return h;
}

/* ---------- comparația firmei cu sectorul ---------- */
function compare(caen, r, N, an) {
  if (!D || !caen) return null;
  const k = key(caen); if (!k) return null;
  const g = D.d[k]; const q = g[11];
  const d = {}; ['ai', 'ac', 'chav', 'st', 'cr', 'cb', 'dat', 'cp', 'ca', 'vt', 'cht', 'pn', 'pin', 'sal'].forEach(f => d[f] = N[f] ?? 0);
  const AT = d.ai + d.ac + d.chav, RN = d.pn - d.pin, RB = d.vt - d.cht;
  const FV = { mn: d.ca ? RN / d.ca : null, mbr: d.ca ? RB / d.ca : null, roa: AT ? RN / AT : null, roe: d.cp > 0 ? RN / d.cp : null, sg: d.dat ? AT / d.dat : null,
    af: AT ? d.cp / AT : null, gi: d.cp > 0 ? d.dat / d.cp : null, lg: d.dat ? d.ac / d.dat : null, dso: d.ca ? d.cr / d.ca * 365 : null, dio: d.ca ? d.st / d.ca * 365 : null,
    ra: AT ? d.ca / AT : null, rch: d.vt ? d.cht / d.vt : null, ai_at: AT ? d.ai / AT : null, ac_at: AT ? d.ac / AT : null, st_at: AT ? d.st / AT : null,
    cr_at: AT ? d.cr / AT : null, cb_at: AT ? d.cb / AT : null, dat_at: AT ? d.dat / AT : null, cp_at: AT ? d.cp / AT : null,
    cas: d.sal ? d.ca / d.sal : null, vts: d.sal ? d.vt / d.sal : null, chs: d.sal ? d.cht / d.sal : null, rns: d.sal ? RN / d.sal : null, ats: d.sal ? AT / d.sal : null,
    sal: d.sal, ca: d.ca, at: AT, cp: d.cp };
  let fav = 0, unf = 0;
  const rows = D.ratios.map((rk, i) => {
    const def = RD[rk], x = q[i], v = FV[rk]; if (!def || !x || v == null || !isFinite(v)) return '';
    const p = pctile(x, v); const dir = def[3]; let cls = 'neu', txt = pTxt(p);
    if (dir && p) { const pp = p.length === 2 ? (p[0] === 0 ? 5 : 95) : p[0]; const good = dir > 0 ? pp >= 50 : pp <= 50; good ? fav++ : unf++;
      cls = good ? 'ok' : ((dir > 0 ? pp < 25 : pp > 75) ? 'bad' : 'warn'); }
    return `<tr><td>${def[0]}</td><td class="num"><strong>${def[1](v)}</strong></td>${x.map((y, j) => `<td class="num${j === 2 ? ' med' : ''}">${def[1](y)}</td>`).join('')}<td><span class="badge ${cls}">${txt}</span></td></tr>`;
  }).join('');
  const CAs = sum(g, 'ca'), SALs = sum(g, 'sal');
  const share = CAs ? d.ca / CAs : null;
  let warn = '';
  if (an && +an !== D.an) warn = `<div class="msg warn">Firma este analizată pe anul ${esc(an)}, iar datele de sector sunt pentru ${D.an}. ${+an <= 2024 && k.length === 4 && !sameMeaning(k) ? `Atenție: codul ${k} are alt conținut în CAEN Rev.3 (folosit în bilanțurile ${D.an}) decât în CAEN Rev.2.` : 'Comparația este orientativă.'}</div>`;
  const html = `<h3 class="sec">5. Poziția firmei în sector — ${esc(label(k))}</h3>${warn}
  <div class="score">
    <div class="box"><div class="hint">Cota de piață (din cifra de afaceri a sectorului)</div><div class="big">${share == null ? '—' : nf2.format(share * 100) + '%'}</div><span class="hint">CA sector ${D.an}: ${lei(CAs)}</span></div>
    <div class="box"><div class="hint">Poziția după cifra de afaceri</div><div class="big">${pTxt(pctile(q[D.ratios.indexOf('ca')], d.ca))}</div><span class="hint">din ${nf0.format(g[1])} firme active</span></div>
    <div class="box"><div class="hint">Ponderea în salariații sectorului</div><div class="big">${SALs ? nf2.format(d.sal / SALs * 100) + '%' : '—'}</div><span class="hint">${nf0.format(SALs)} salariați în sector</span></div>
    <div class="box"><div class="hint">Indicatori peste mediana sectorului</div><div class="big">${fav} / ${fav + unf}</div><span class="hint">din indicatorii la care „mai mare” sau „mai mic” e clar mai bine</span></div>
  </div>
  <table class="ratios"><thead><tr><th>Indicator</th><th>Firma</th><th>P10</th><th>P25</th><th>Mediana</th><th>P75</th><th>P90</th><th>Percentila firmei</th></tr></thead><tbody>${rows}</tbody></table>
  <p class="hint">Indicatorii firmei sunt recalculați cu aceeași definiție ca în sector (din cei 20 de indicatori publicați). Percentila e estimată prin interpolare între P10, P25, P50, P75 și P90. <a href="#sector" data-seccode="${k}">Profilul complet al sectorului →</a></p>`;
  return { html, key: k, level: label(k), fav, unf, n: g[1], share };
}

/* ---------- fila Sector ---------- */
function initTab() {
  const dl = $('#caenList'); if (!dl) return;
  const keys = Object.keys(D.d).filter(k => k !== 'ALL').sort();
  dl.innerHTML = keys.map(k => `<option value="${k}">${esc(k.length === 4 ? nameOf(k) : 'diviziunea ' + k)}</option>`).join('');
  $('#secGo').addEventListener('click', () => show($('#secCode').value));
  $('#secCode').addEventListener('keydown', e => { if (e.key === 'Enter') show($('#secCode').value); });
  $('#secAll').addEventListener('click', () => show('ALL'));
}
function show(code) {
  const o = $('#secOut'); if (!D) { o.innerHTML = '<p class="hint">Se încarcă datele…</p>'; load().then(() => show(code)); return; }
  const k = code === 'ALL' ? 'ALL' : key(code);
  if (!k) { o.innerHTML = '<div class="msg warn">Codul CAEN nu există în date sau are mai puțin de 15 firme active (se folosește atunci diviziunea, dacă există).</div>'; return; }
  o.innerHTML = (k !== 'ALL' && k.length === 2 && String(code).replace(/\D/g, '').length >= 3 ? `<div class="msg warn">Clasa ${esc(code)} are sub 15 firme active; se afișează diviziunea ${k}.</div>` : '') + profile(k);
}
document.addEventListener('click', e => { const a = e.target.closest('[data-seccode]'); if (!a) return; $('#secCode').value = a.dataset.seccode; setTimeout(() => show(a.dataset.seccode), 50); });
window.AE_SECTOR = { compare, ready: () => !!D, load };
})();
