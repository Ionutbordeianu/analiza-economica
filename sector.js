/* Comparație cu sectorul CAEN — quartile calculate din situațiile financiare 2025 (data.gov.ro) */
(function () {
'use strict';
const U = window.AEU; const { lei, pct, num, nf0, nf2, esc } = U;
let DATA = null;
fetch('sector2025.json?v=4').then(r => r.json()).then(j => { DATA = j; }).catch(() => {});

const days = v => v == null || !isFinite(v) ? '—' : nf0.format(v) + ' zile';
/* [cheie sector, etichetă, format, funcție valoare firmă (aceeași definiție ca în calculul sectorului), sens: 1 = mai mare e mai bine, -1 invers, 0 neutru] */
const DEF = [
  ['mn', 'Marja netă', pct, d => d.ca ? (d.pn - d.pin) / d.ca : null, 1],
  ['roa', 'ROA', pct, (d, A) => A ? (d.pn - d.pin) / A : null, 1],
  ['roe', 'ROE', pct, d => d.cp > 0 ? (d.pn - d.pin) / d.cp : null, 1],
  ['sg', 'Solvabilitate generală', num, (d, A) => d.dat ? A / d.dat : null, 1],
  ['af', 'Autonomie financiară', pct, (d, A) => A ? d.cp / A : null, 1],
  ['gi', 'Grad de îndatorare (Datorii/CP)', num, d => d.cp > 0 ? d.dat / d.cp : null, -1],
  ['lg', 'Active circulante / Datorii totale', num, d => d.dat ? d.ac / d.dat : null, 1],
  ['dso', 'Creanțe / CA × 365', days, d => d.ca ? d.cr / d.ca * 365 : null, -1],
  ['dio', 'Stocuri / CA × 365', days, d => d.ca ? d.st / d.ca * 365 : null, 0],
  ['ra', 'Rotația activelor (CA/AT)', num, (d, A) => A ? d.ca / A : null, 1],
  ['rch', 'Cheltuieli totale / Venituri totale', pct, d => d.vt ? d.cht / d.vt : null, -1],
  ['cas', 'Cifra de afaceri / salariat', lei, d => d.sal ? d.ca / d.sal : null, 1],
  ['rns', 'Rezultat net / salariat', lei, d => d.sal ? (d.pn - d.pin) / d.sal : null, 1],
  ['sal', 'Număr mediu de salariați', v => v == null ? '—' : nf0.format(v), d => d.sal, 0],
  ['ca', 'Cifra de afaceri', lei, d => d.ca, 0]
];

function compare(caen, r, N) {
  if (!DATA || !caen) return null;
  const c = String(caen).replace(/\D/g, '').padStart(4, '0').slice(0, 4);
  let key = c, level = 'clasa CAEN ' + c;
  if (!DATA.d[key]) { key = c.slice(0, 2); level = 'diviziunea CAEN ' + key; }
  if (!DATA.d[key]) return null;
  const row = DATA.d[key]; const idx = k => DATA.r.indexOf(k);
  const d = {}; ['ai', 'ac', 'chav', 'st', 'cr', 'dat', 'cp', 'ca', 'vt', 'cht', 'pn', 'pin', 'sal'].forEach(k => d[k] = N[k] ?? 0);
  const A = d.ai + d.ac + d.chav;
  const n = row[0], loss = row[1], cpneg = row[2];
  let fav = 0, unf = 0;
  const rows = DEF.map(([k, lab, f, fn, dir]) => {
    const q = row[3 + idx(k)]; const v = fn(d, A);
    if (!q || v == null || !isFinite(v)) return null;
    let pos, cls = 'neu';
    if (v < q[0]) pos = 'sub quartila 1 (cele mai slabe 25%)';
    else if (v < q[1]) pos = 'între Q1 și mediană';
    else if (v <= q[2]) pos = 'între mediană și Q3';
    else pos = 'peste quartila 3 (cele mai bune 25%)';
    if (dir) {
      const good = dir > 0 ? v >= q[1] : v <= q[1];
      cls = good ? 'ok' : 'warn';
      if (dir > 0 ? v < q[0] : v > q[2]) cls = 'bad';
      if (dir < 0) pos = v > q[2] ? 'peste Q3 (mai slab decât 75% din firme)' : v < q[0] ? 'sub Q1 (mai bun decât 75% din firme)' : pos;
      good ? fav++ : unf++;
    }
    return `<tr><td>${lab}</td><td class="num"><strong>${f(v)}</strong></td><td class="num">${f(q[0])}</td><td class="num">${f(q[1])}</td><td class="num">${f(q[2])}</td><td><span class="badge ${cls}">${pos}</span></td></tr>`;
  }).filter(Boolean);
  const html = `<h3 class="sec">5. Comparație cu sectorul — ${esc(level)}</h3>
  <p class="hint">${nf0.format(n)} firme active în ${esc(level)} (bilanțurile pe ${DATA.an}, sursa: ${esc(DATA.src)}). În sector, ${pct(loss)} dintre firme au raportat pierdere, iar ${pct(cpneg)} au capitaluri proprii negative. Indicatorii firmei sunt recalculați cu aceeași definiție ca în calculul sectorului.</p>
  <table class="ratios"><thead><tr><th>Indicator</th><th>Firma</th><th>Q1 (25%)</th><th>Mediana</th><th>Q3 (75%)</th><th>Poziție</th></tr></thead><tbody>${rows.join('')}</tbody></table>
  <div class="msg ${fav >= unf ? 'ok' : 'warn'}">Firma se situează peste mediana sectorului la ${fav} din ${fav + unf} indicatori comparabili.</div>`;
  return { html, key, level, fav, unf, n };
}
window.AE_SECTOR = { compare, ready: () => !!DATA };
})();
