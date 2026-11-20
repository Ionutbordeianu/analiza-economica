/* Verificare în masă a unei liste de CUI-uri + raport tipăribil */
(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const U = window.AEU; const { esc, lei, pct, num, nf0, nf2 } = U;

/* ================= VERIFICARE ÎN MASĂ ================= */
let ROWS = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function rowOf(f) {
  const g = f.date_generale || {}, t = f.inregistrare_scop_Tva || {}, inc = f.inregistrare_RTVAI || {}, ina = f.stare_inactiv || {}, sp = f.inregistrare_SplitTVA || {};
  const risc = [];
  if (ina.dataRadiere) risc.push('radiat');
  if (ina.statusInactivi) risc.push('inactiv');
  if (/radiere|dizolv|lichid|suspend|faliment|insolv/i.test(g.stare_inregistrare || '')) risc.push('stare: ' + g.stare_inregistrare);
  return { cui: g.cui, den: g.denumire, adresa: g.adresa, stare: g.stare_inregistrare, caen: g.cod_CAEN, tva: !!t.scpTVA, tvainc: !!inc.statusTvaIncasare,
           split: !!sp.statusSplitTVA, efact: !!g.statusRO_e_Factura, inactiv: !!ina.statusInactivi, radiat: !!ina.dataRadiere, risc };
}
$('#masaGo').addEventListener('click', async () => {
  const raw = $('#masaIn').value.split(/[\s,;]+/).map(x => U.cleanCui(x)).filter(x => /^\d{2,10}$/.test(x));
  const list = [...new Set(raw)];
  const out = $('#masaOut'), btn = $('#masaGo');
  if (!list.length) { out.innerHTML = '<div class="msg warn">Nu am găsit CUI-uri valide în listă.</div>'; return; }
  if (list.length > 500) { out.innerHTML = '<div class="msg warn">Maximum 500 de CUI-uri o dată.</div>'; return; }
  btn.disabled = true; ROWS = []; const notFound = []; const invalid = list.filter(c => !U.cuiValid(c).ok);
  for (let i = 0; i < list.length; i += 10) {
    const chunk = list.slice(i, i + 10);
    out.innerHTML = `<div class="msg">Se verifică ${Math.min(i + 10, list.length)} din ${list.length}…</div><div class="progress"><div style="width:${Math.min(i + 10, list.length) / list.length * 100}%"></div></div>`;
    try {
      const d = await U.anafTva(chunk);
      (d.found || []).forEach(f => ROWS.push(rowOf(f)));
      (d.notFound || []).forEach(n => notFound.push(typeof n === 'object' ? (n.cui ?? JSON.stringify(n)) : n));
    } catch (e) { chunk.forEach(c => notFound.push(c + ' (eroare: ' + e.message + ')')); }
    if (i + 10 < list.length) await sleep(1100); // max. 1 cerere / secundă, conform regulilor ANAF
  }
  btn.disabled = false;
  render(notFound, invalid);
});
function render(notFound, invalid) {
  const yn = (b, t) => b ? `<span class="badge ${t || 'ok'}">da</span>` : '<span class="badge neu">nu</span>';
  const risky = ROWS.filter(r => r.risc.length);
  $('#masaOut').innerHTML = `
  <div class="score">
    <div class="box"><div class="hint">Verificate</div><div class="big">${ROWS.length}</div></div>
    <div class="box"><div class="hint">Cu probleme (inactiv / radiat / în lichidare)</div><div class="big" style="color:var(--bad)">${risky.length}</div></div>
    <div class="box"><div class="hint">Negăsite / cifră de control greșită</div><div class="big">${notFound.length} / ${invalid.length}</div></div>
  </div>
  <p class="row"><button class="btn sm" type="button" id="masaCsv">Descarcă CSV</button> <button class="btn sm ghost" type="button" onclick="window.print()">Tipărește</button></p>
  <table class="ratios"><thead><tr><th>CUI</th><th>Denumire</th><th>Stare</th><th>CAEN</th><th>TVA</th><th>TVA înc.</th><th>e-Factura</th><th>Risc</th></tr></thead><tbody>
  ${ROWS.sort((a, b) => b.risc.length - a.risc.length).map(r => `<tr><td>${esc(r.cui)}</td><td>${esc(r.den)}<div class="f">${esc(r.adresa)}</div></td><td class="f">${esc(r.stare)}</td><td>${esc(r.caen)}</td><td>${yn(r.tva)}</td><td>${yn(r.tvainc, 'warn')}</td><td>${yn(r.efact)}</td><td>${r.risc.length ? r.risc.map(x => `<span class="badge bad">${esc(x)}</span>`).join(' ') : '<span class="badge ok">fără semnale</span>'}</td></tr>`).join('')}
  </tbody></table>
  ${notFound.length ? `<p class="hint">Negăsite la ANAF: ${notFound.map(esc).join(', ')}</p>` : ''}
  ${invalid.length ? `<p class="hint">Cifră de control incorectă: ${invalid.map(esc).join(', ')}</p>` : ''}`;
  $('#masaCsv').onclick = () => {
    const h = ['CUI', 'Denumire', 'Adresa', 'Stare', 'CAEN', 'Platitor TVA', 'TVA incasare', 'Split TVA', 'RO e-Factura', 'Inactiv', 'Radiat', 'Semnale'];
    const q = x => '"' + String(x ?? '').replace(/"/g, '""') + '"';
    const csv = [h.join(';'), ...ROWS.map(r => [r.cui, r.den, r.adresa, r.stare, r.caen, r.tva ? 'DA' : 'NU', r.tvainc ? 'DA' : 'NU', r.split ? 'DA' : 'NU', r.efact ? 'DA' : 'NU', r.inactiv ? 'DA' : 'NU', r.radiat ? 'DA' : 'NU', r.risc.join(' | ')].map(q).join(';'))].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'verificare-cui-' + U.today() + '.csv'; a.click();
  };
}

/* ================= RAPORT ================= */
const has = v => v != null && isFinite(v);
function build() {
  const L = window.AE_LAST, C = window.AE_CO, out = $('#raportOut');
  if (!L) { out.innerHTML = '<div class="msg warn">Rulează mai întâi analiza în fila „Analiză financiară” (încarcă bilanțul de la ANAF sau completează datele), apoi revino aici.</div>'; return; }
  const { N, P, r, rp, checks, alerts, meta, sector, cf } = L;
  const g = C && C.date_generale && String(C.date_generale.cui) === String(meta.cui) ? C : null;
  const den = meta.sim ? 'Simulare — entitate ipotetică' : (meta.deni || (g && g.date_generale.denumire) || 'Entitatea analizată');
  const strengths = [], weak = [];
  const rule = (cond, t, arr) => { if (cond) arr.push(t); };
  rule(r.RN > 0, `Rezultat net pozitiv (${lei(r.RN)}), marjă netă ${pct(r.mn)}.`, strengths);
  rule(r.RN < 0, `Pierdere netă de ${lei(-r.RN)}.`, weak);
  rule(has(r.lc) && r.lc >= 1.5, `Lichiditate curentă confortabilă (${num(r.lc)}).`, strengths);
  rule(has(r.lc) && r.lc < 1, `Lichiditate curentă sub 1 (${num(r.lc)}) — risc de neplată pe termen scurt.`, weak);
  rule(has(r.af) && r.af >= 0.5, `Autonomie financiară ridicată (${pct(r.af)}).`, strengths);
  rule(has(r.af) && r.af < 0.3, `Autonomie financiară redusă (${pct(r.af)}) — dependență de creditori.`, weak);
  rule(N.cp < 0, 'Capitaluri proprii negative.', weak);
  rule(r.FR > 0 && r.TN >= 0, 'Echilibru financiar: FR și trezorerie netă pozitive.', strengths);
  rule(r.FR < 0, 'Fond de rulment negativ.', weak);
  rule(has(r.EBE) && r.EBE > 0 && has(r.rEBE) && r.rEBE >= 0.08, `Exploatare generatoare de numerar (rata EBE ${pct(r.rEBE)}).`, strengths);
  rule(r.CAF > 0, `Capacitate de autofinanțare pozitivă (${lei(r.CAF)}).`, strengths);
  rule(has(r.dso) && r.dso > 90, `Încasare lentă a creanțelor (${nf0.format(r.dso)} zile).`, weak);
  rule(has(r.acop) && r.acop < 1.5, 'Acoperire slabă a dobânzilor.', weak);
  if (rp && N.ca && P && P.ca) { const v = (N.ca - P.ca) / P.ca; rule(v > 0.05, `Creștere a cifrei de afaceri cu ${pct(v)}.`, strengths); rule(v < -0.05, `Scădere a cifrei de afaceri cu ${pct(-v)}.`, weak); }
  const scores = [['Altman Z″', r.altman, v => v > 2.6 ? 'zonă sigură' : v >= 1.1 ? 'zonă gri' : 'risc ridicat'], ['Conan-Holder', r.conan, v => v > 0.16 ? 'foarte bună' : v > 0.10 ? 'bună' : v > 0.04 ? 'alertă' : v > -0.05 ? 'pericol' : 'eșec'], ['Taffler', r.taffler, v => v > 0.3 ? 'risc redus' : v >= 0.2 ? 'incertitudine' : 'risc ridicat']].filter(s => has(s[1]));
  const badCk = checks.filter(c => !c.ok);
  const badScores = (has(r.altman) && r.altman < 1.1) + (has(r.conan) && r.conan <= 0.04) + (has(r.taffler) && r.taffler < 0.2);
  const badAlerts = alerts.filter(a => a[0] === 'bad').length;
  const verdict = (N.cp < 0 || badScores >= 2 || (r.RN < 0 && badScores >= 1)) ? ['bad', 'Risc ridicat']
    : (badScores >= 1 || badAlerts >= 1 || weak.length > strengths.length) ? ['warn', 'Risc moderat — necesită monitorizare'] : ['ok', 'Risc redus'];
  const pl = (n, a, b) => n === 1 ? `1 ${a}` : `${n} ${b}`;
  const tr = (l, a, b, f) => `<tr><td>${l}</td>${P ? `<td class="num">${f(a)}</td>` : ''}<td class="num">${f(b)}</td></tr>`;
  out.innerHTML = `<article class="raport">${meta.sim ? '<div class="msg sim"><strong>SIMULARE</strong> — raport pe date introduse manual (ipotetice). Nu reprezintă situațiile financiare ale unei firme reale.</div>' : ''}
  <header><h2>Raport de analiză economico-financiară</h2>
  <p><strong>${esc(den)}</strong>${meta.cui ? ` · CUI ${esc(meta.cui)}` : ''}${meta.caen ? ` · CAEN ${esc(meta.caen)} ${esc(meta.den_caen || '')}` : ''}<br>
  Exercițiul analizat: ${esc(meta.an || 'N')}${P ? ` (comparativ cu ${esc(meta.an ? meta.an - 1 : 'N-1')})` : ''} · Data raportului: ${new Date().toLocaleDateString('ro-RO')}</p></header>
  <section><h3>1. Concluzie</h3><div class="msg ${verdict[0]}"><strong>${verdict[1]}.</strong> ${pl(strengths.length, 'punct tare', 'puncte forte')}, ${pl(weak.length, 'punct slab', 'puncte slabe')}, ${pl(alerts.length, 'semnal de verificat', 'semnale de verificat')}${sector ? `; firma depășește mediana sectorului la ${sector.fav} din ${sector.fav + sector.unf} indicatori` : ''}.</div></section>
  ${g ? `<section><h3>2. Situația juridică și fiscală (ANAF, ${esc(g.date_generale.data)})</h3><table class="sum">
    <tr><td>Stare înregistrare</td><td>${esc(g.date_generale.stare_inregistrare)}</td></tr>
    <tr><td>Contribuabil inactiv</td><td>${g.stare_inactiv && g.stare_inactiv.statusInactivi ? 'DA' : 'nu'}</td></tr>
    <tr><td>Plătitor TVA / TVA la încasare</td><td>${g.inregistrare_scop_Tva && g.inregistrare_scop_Tva.scpTVA ? 'da' : 'nu'} / ${g.inregistrare_RTVAI && g.inregistrare_RTVAI.statusTvaIncasare ? 'da' : 'nu'}</td></tr>
    <tr><td>Adresă</td><td>${esc(g.date_generale.adresa)}</td></tr></table></section>` : ''}
  <section><h3>${g ? 3 : 2}. Date financiare sintetice</h3><table class="sum"><tr><td></td>${P ? '<td class="num">N-1</td>' : ''}<td class="num">N</td></tr>
    ${tr('Cifra de afaceri', P && P.ca, N.ca, lei)}${tr('Rezultat net', rp && rp.RN, r.RN, lei)}${tr('Capitaluri proprii', P && P.cp, N.cp, lei)}${tr('Datorii totale', P && P.dat, N.dat, lei)}
    ${tr('Active totale', rp && rp.AT, r.AT, lei)}${tr('Număr mediu salariați', P && P.sal, N.sal, x => has(x) ? nf0.format(x) : '—')}
    ${tr('Lichiditate curentă', rp && rp.lc, r.lc, num)}${tr('Solvabilitate generală', rp && rp.sg, r.sg, num)}${tr('Autonomie financiară', rp && rp.af, r.af, pct)}
    ${tr('Marja netă', rp && rp.mn, r.mn, pct)}${tr('ROE', rp && rp.roe, r.roe, pct)}${tr('EBE', rp && rp.EBE, r.EBE, lei)}${tr('CAF', rp && rp.CAF, r.CAF, lei)}
    ${tr('Fond de rulment', rp && rp.FR, r.FR, lei)}${tr('Trezorerie netă', rp && rp.TN, r.TN, lei)}</table></section>
  <section><h3>${g ? 4 : 3}. Puncte forte și puncte slabe</h3><div class="cards two">
    <div class="panel"><h4>Puncte forte</h4><ul>${strengths.map(s => `<li>${s}</li>`).join('') || '<li>—</li>'}</ul></div>
    <div class="panel"><h4>Puncte slabe</h4><ul>${weak.map(s => `<li>${s}</li>`).join('') || '<li>—</li>'}</ul></div></div></section>
  ${scores.length ? `<section><h3>${g ? 5 : 4}. Scoruri de risc</h3><table class="sum">${scores.map(([n, v, f]) => `<tr><td>${n}</td><td class="num">${nf2.format(v)}</td><td>${f(v)}</td></tr>`).join('')}</table></section>` : ''}
  ${cf ? `<section><h3>Fluxuri de numerar estimate</h3><table class="sum"><tr><td>Exploatare</td><td class="num">${lei(cf.cfe)}</td></tr><tr><td>Investiții</td><td class="num">${lei(cf.cfi)}</td></tr><tr><td>Finanțare</td><td class="num">${lei(cf.cff)}</td></tr></table></section>` : ''}
  ${sector ? `<section>${sector.html.replace('<h3 class="sec">5. ', '<h3>').replace(/<p class="hint">Indicatorii firmei[\s\S]*?<\/p>/, '')}</section>` : ''}
  <section><h3>Semnale pentru verificare</h3>${alerts.length ? `<ul>${alerts.map(a => `<li>${a[1]}</li>`).join('')}</ul>` : '<p>Nu au fost identificate.</p>'}</section>
  <section><h3>Calitatea datelor</h3><p>${badCk.length ? `${badCk.length} corelații contabile nu se verifică: ${badCk.map(c => esc(c.name)).join('; ')}.` : 'Corelațiile contabile disponibile se verifică.'} Sursa datelor: bilanțurile publicate de ANAF${checks.length > 3 ? ' și datele introduse din F10/F20' : ''}.</p></section>
  <footer class="disclaimer">Raport generat automat, cu scop informativ. Nu constituie opinie de audit, raport de expertiză contabilă sau consultanță fiscală. Indicatorii depind de calitatea datelor introduse; pentru decizii importante consultați un expert contabil sau un auditor financiar.</footer>
  </article>`;
}
window.addEventListener('hashchange', () => { if (location.hash === '#raport') build(); });
document.addEventListener('click', e => { if (e.target.id === 'toRaport') setTimeout(build, 30); });
if (location.hash === '#raport') setTimeout(build, 100);
$('#raportRefresh').addEventListener('click', build);
})();
