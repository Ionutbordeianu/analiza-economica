(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf0 = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const lei = v => (v == null || !isFinite(v)) ? '—' : nf0.format(Math.round(v)) + ' lei';
const pct = v => (v == null || !isFinite(v)) ? '—' : nf2.format(v * 100) + '%';
const num = v => (v == null || !isFinite(v)) ? '—' : nf2.format(v);
const strip = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const today = () => new Date().toISOString().slice(0, 10);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stocare indisponibilă */ } }
};

/* ---------------- navigare ---------------- */
function show(tab) {
  if (!document.getElementById(tab)) tab = 'acasa';
  $$('.tab').forEach(s => s.hidden = s.id !== tab);
  $$('#nav a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => show(location.hash.slice(1)));
show(location.hash.slice(1) || 'acasa');

/* ---------------- CUI ---------------- */
function cleanCui(s) { return String(s || '').toUpperCase().replace(/^RO/, '').replace(/\s|\./g, ''); }
function cuiValid(raw) {
  const c = cleanCui(raw);
  if (!/^\d{2,10}$/.test(c)) return { ok: false, c, msg: 'CUI-ul trebuie să conțină între 2 și 10 cifre.' };
  const key = '753217532';
  const body = c.slice(0, -1).split('').reverse();
  const k = key.split('').reverse();
  let s = 0;
  body.forEach((d, i) => { s += (+d) * (+k[i]); });
  let ctrl = (s * 10) % 11; if (ctrl === 10) ctrl = 0;
  const ok = ctrl === +c.slice(-1);
  return { ok, c, ctrl, msg: ok ? 'Cifra de control este corectă.' : `Cifra de control nu corespunde (ar trebui să fie ${ctrl}).` };
}

async function anafPost(url, body) {
  const opts = ct => ({ method: 'POST', headers: { 'Content-Type': ct }, body: JSON.stringify(body) });
  let lastErr;
  for (const ct of ['application/json', 'text/plain']) {
    try {
      const r = await fetch(url, opts(ct));
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

function cuiLinks(c) {
  const y = new Date().getFullYear() - 1;
  return `<strong>Verifică și la sursele oficiale</strong> (CUI ${esc(c)} <button class="btn sm ghost" type="button" data-copy="${esc(c)}">copiază</button>)
  <ul>
    <li><a href="https://mfinante.gov.ro/apps/agenticod.html?pagina=domenii" target="_blank" rel="noopener">MFinanțe — informații agenți economici și bilanțuri</a></li>
    <li><a href="https://webservicesp.anaf.ro/bilant?an=${y - 1}&cui=${esc(c)}" target="_blank" rel="noopener">Bilanțul ${y - 1} publicat de ANAF (JSON)</a></li>
    <li><a href="https://www.anaf.ro" target="_blank" rel="noopener">ANAF — registre TVA, inactivi, debitori</a></li>
    <li><a href="https://ec.europa.eu/taxation_customs/vies/" target="_blank" rel="noopener">VIES — cod TVA intracomunitar RO${esc(c)}</a></li>
    <li><a href="https://portal.just.ro" target="_blank" rel="noopener">portal.just.ro — dosare (căutare după denumire)</a></li>
    <li><a href="https://www.onrc.ro" target="_blank" rel="noopener">ONRC — certificat constatator, BPI</a></li>
  </ul>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  navigator.clipboard?.writeText(b.dataset.copy).then(() => { b.textContent = 'copiat ✓'; setTimeout(() => b.textContent = 'copiază', 1500); });
});

const yes = (v, t = 'Da', f = 'Nu') => v ? `<span class="badge ok">${t}</span>` : `<span class="badge neu">${f}</span>`;
const fmtD = d => d ? esc(d) : '—';

function renderCompany(f) {
  const g = f.date_generale || {};
  const tva = f.inregistrare_scop_Tva || {};
  const inc = f.inregistrare_RTVAI || {};
  const ina = f.stare_inactiv || {};
  const spl = f.inregistrare_SplitTVA || {};
  const sed = f.adresa_sediu_social || {};
  const radiat = !!ina.dataRadiere;
  const inactiv = !!ina.statusInactivi;
  const stare = String(g.stare_inregistrare || '');
  const badges = [];
  if (radiat) badges.push('<span class="badge bad">RADIAT</span>');
  if (inactiv) badges.push('<span class="badge bad">INACTIV FISCAL</span>');
  else badges.push('<span class="badge ok">Activ fiscal</span>');
  badges.push(tva.scpTVA ? '<span class="badge ok">Plătitor TVA</span>' : '<span class="badge neu">Neplătitor TVA</span>');
  if (inc.statusTvaIncasare) badges.push('<span class="badge warn">TVA la încasare</span>');
  if (spl.statusSplitTVA) badges.push('<span class="badge warn">Split TVA</span>');
  badges.push(g.statusRO_e_Factura ? '<span class="badge ok">RO e-Factura</span>' : '<span class="badge neu">Fără RO e-Factura</span>');

  const per = (tva.perioade_TVA || []).map(p =>
    `${fmtD(p.data_inceput_ScpTVA)} → ${p.data_sfarsit_ScpTVA ? esc(p.data_sfarsit_ScpTVA) : 'prezent'}${p.mesaj_ScpTVA ? ' (' + esc(p.mesaj_ScpTVA) + ')' : ''}`).join('<br>') || '—';
  const adrSed = [sed.sdenumire_Strada, sed.snumar_Strada, sed.sdenumire_Localitate, sed.sdenumire_Judet].filter(Boolean).join(', ');

  const alerts = [];
  if (radiat) alerts.push(`Entitatea a fost radiată la ${esc(ina.dataRadiere)}.`);
  if (inactiv) alerts.push(`Contribuabil inactiv din ${esc(ina.dataInactivare || '?')}. Cheltuielile și TVA din facturile emise de un inactiv nu sunt deductibile.`);
  if (!inactiv && ina.dataReactivare) alerts.push(`A fost inactiv și reactivat la ${esc(ina.dataReactivare)} — merită verificat istoricul.`);
  if (/radiere|dizolv|lichid|suspend|faliment|insolv/i.test(stare)) alerts.push('Stare de înregistrare: ' + esc(stare));

  return `<div class="co">
    <h3>${esc(g.denumire || '—')}</h3>
    <div class="hint">CUI ${esc(g.cui)} · ${esc(g.nrRegCom || 'fără nr. ONRC')} · date ANAF la ${esc(g.data)}</div>
    <div class="badges">${badges.join('')}</div>
    ${alerts.map(a => `<div class="msg bad">${a}</div>`).join('')}
    <dl class="kv">
      <dt>Adresă (domiciliu fiscal)</dt><dd>${esc(g.adresa || '—')}</dd>
      ${adrSed ? `<dt>Sediu social</dt><dd>${esc(adrSed)}</dd>` : ''}
      <dt>Stare înregistrare</dt><dd>${esc(stare || '—')}</dd>
      <dt>Data înregistrării</dt><dd>${fmtD(g.data_inregistrare)}</dd>
      <dt>Cod CAEN</dt><dd>${esc(g.cod_CAEN || '—')}</dd>
      <dt>Formă juridică / organizare</dt><dd>${esc([g.forma_juridica, g.forma_organizare].filter(Boolean).join(' · ') || '—')}</dd>
      <dt>Formă de proprietate</dt><dd>${esc(g.forma_de_proprietate || '—')}</dd>
      <dt>Organ fiscal competent</dt><dd>${esc(g.organFiscalCompetent || '—')}</dd>
      <dt>Perioade înregistrare TVA</dt><dd>${per}</dd>
      <dt>TVA la încasare</dt><dd>${yes(inc.statusTvaIncasare)} ${inc.dataInceputTvaInc ? 'din ' + esc(inc.dataInceputTvaInc) : ''}</dd>
      <dt>Plata defalcată TVA</dt><dd>${yes(spl.statusSplitTVA)}</dd>
      <dt>Inactiv / reactivat</dt><dd>${ina.dataInactivare ? 'inactivat ' + esc(ina.dataInactivare) : 'nu'}${ina.dataReactivare ? ' · reactivat ' + esc(ina.dataReactivare) : ''}</dd>
      ${g.telefon ? `<dt>Telefon</dt><dd>${esc(g.telefon)}</dd>` : ''}
      ${g.iban ? `<dt>IBAN declarat</dt><dd>${esc(g.iban)}</dd>` : ''}
    </dl>
    <p class="row"><a class="btn sm" href="#analiza" data-goan="${esc(g.cui)}">Analizează bilanțul →</a></p>
  </div>`;
}

$('#cuiDate').value = today();
$('#cuiForm').addEventListener('submit', async e => {
  e.preventDefault();
  const v = cuiValid($('#cuiInput').value);
  const chk = $('#cuiCheck'), out = $('#cuiResult'), links = $('#cuiLinks');
  chk.innerHTML = `<div class="msg ${v.ok ? 'ok' : 'warn'}">${esc(v.msg)}</div>`;
  if (!/^\d{2,10}$/.test(v.c)) { out.innerHTML = ''; links.hidden = true; return; }
  links.innerHTML = cuiLinks(v.c); links.hidden = false;
  out.innerHTML = '<p class="note">Se interoghează ANAF…</p>';
  const btn = e.submitter; if (btn) btn.disabled = true;
  try {
    const data = await anafPost('https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva', [{ cui: +v.c, data: $('#cuiDate').value || today() }]);
    if (data.found && data.found.length) out.innerHTML = renderCompany(data.found[0]);
    else out.innerHTML = '<div class="msg warn">ANAF nu a returnat date pentru acest CUI (inexistent sau nealocat).</div>';
  } catch (err) {
    out.innerHTML = `<div class="msg warn">Interogarea directă ANAF nu a reușit din browser (${esc(err.message)}). ANAF poate bloca cererile de pe alte site-uri sau poate fi temporar indisponibil. Folosește linkurile oficiale de mai jos.</div>`;
  } finally { if (btn) btn.disabled = false; }
});
document.addEventListener('click', e => {
  const a = e.target.closest('[data-goan]');
  if (!a) return;
  $('#bilCui').value = a.dataset.goan;
  setTimeout(() => $('#bilLoad').click(), 50);
});

/* ---------------- ANALIZĂ FINANCIARĂ ---------------- */
const tbody = $('#finTable tbody');
tbody.innerHTML = FIN_FIELDS.map(f => f.grp
  ? `<tr class="grp"><td colspan="3">${f.grp}</td></tr>`
  : `<tr><td>${esc(f.n).replace(/^ {2}/, '&nbsp;&nbsp;&nbsp;')}</td>
     <td><input type="number" step="any" data-y="P" data-k="${f.k}"></td>
     <td><input type="number" step="any" data-y="N" data-k="${f.k}"></td></tr>`).join('');
const finIn = (y, k) => $(`#finTable input[data-y="${y}"][data-k="${k}"]`);
function setYear(y, obj) { FIN_FIELDS.forEach(f => { if (f.k) finIn(y, f.k).value = obj[f.k] ?? ''; }); }
function getYear(y) {
  const o = {}; let any = false;
  FIN_FIELDS.forEach(f => { if (!f.k) return; const v = finIn(y, f.k).value; o[f.k] = v === '' ? null : +v; if (v !== '') any = true; });
  return any ? o : null;
}
$('#bilAn').value = new Date().getFullYear() - 2;
function manualLinks() {
  const c = cleanCui($('#bilCui').value) || 'CUI', n = +$('#bilAn').value;
  $('#bilManualLinks').innerHTML = [n, n - 1].map(y =>
    `<a href="https://webservicesp.anaf.ro/bilant?an=${y}&cui=${esc(c)}" target="_blank" rel="noopener">bilanț ${y}</a>`).join(' · ');
}
['input', 'change'].forEach(ev => { $('#bilCui').addEventListener(ev, manualLinks); $('#bilAn').addEventListener(ev, manualLinks); });
manualLinks();

function parseBilant(j) {
  if (typeof j === 'string') j = JSON.parse(j);
  const o = {}; const list = j.i || [];
  list.forEach(it => {
    const name = strip(it.val_den_indicator);
    let key = null;
    for (const [re, k] of ANAF_MAP) if (re.test(name)) { key = k; break; }
    if (!key) key = ANAF_CODES[it.indicator];
    if (key && o[key] == null) o[key] = +it.val_indicator;
  });
  return { o, meta: j, count: Object.keys(o).length };
}
async function fetchBilant(cui, an) {
  const r = await fetch(`https://webservicesp.anaf.ro/bilant?an=${an}&cui=${cui}`);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return parseBilant(await r.json());
}
$('#bilLoad').addEventListener('click', async () => {
  const c = cleanCui($('#bilCui').value), n = +$('#bilAn').value, msg = $('#bilMsg'), btn = $('#bilLoad');
  if (!/^\d{2,10}$/.test(c)) { msg.innerHTML = '<div class="msg warn">Introdu un CUI valid.</div>'; return; }
  btn.disabled = true; msg.innerHTML = 'Se încarcă bilanțurile…';
  const res = [];
  for (const [y, an] of [['N', n], ['P', n - 1]]) {
    try {
      const b = await fetchBilant(c, an);
      if (!b.count) { res.push(`<div class="msg warn">${an}: ANAF nu are bilanț publicat (PFA/II nu depun bilanț; sau anul nu e încă publicat).</div>`); continue; }
      setYear(y, b.o);
      res.push(`<div class="msg ok">${an}: ${esc(b.meta.deni || '')} — CAEN ${esc(b.meta.caen || '')} ${esc(b.meta.den_caen || '')} (${b.count} indicatori)</div>`);
    } catch (e) {
      res.push(`<div class="msg warn">${an}: încărcarea directă nu a reușit (${esc(e.message)}). Folosește varianta manuală de mai jos.</div>`);
    }
  }
  msg.innerHTML = res.join(''); btn.disabled = false; manualLinks();
  if (getYear('N')) calc();
});
$$('[data-paste]').forEach(b => b.addEventListener('click', () => {
  try {
    const p = parseBilant($('#bilPaste').value.trim());
    if (!p.count) throw new Error('nu am găsit indicatori');
    setYear(b.dataset.paste, p.o);
    $('#bilMsg').innerHTML = `<div class="msg ok">Încărcat ${esc(p.meta.an || '')} ${esc(p.meta.deni || '')} în coloana ${b.dataset.paste === 'N' ? 'N' : 'N-1'}.</div>`;
    $('#bilPaste').value = '';
  } catch (e) { $('#bilMsg').innerHTML = `<div class="msg bad">Textul lipit nu este un răspuns ANAF valid (${esc(e.message)}).</div>`; }
}));
$('#finDemo').addEventListener('click', () => { setYear('P', FIN_DEMO.P); setYear('N', FIN_DEMO.N); calc(); });
$('#finClear').addEventListener('click', () => { setYear('P', {}); setYear('N', {}); $('#finOut').innerHTML = ''; });
$('#finCalc').addEventListener('click', calc);

const z = v => v ?? 0;
const div = (a, b) => (b == null || b === 0 || a == null) ? null : a / b;
function ratios(d) {
  const AT = z(d.ai) + z(d.ac) + z(d.chav);
  const DC = d.datc ?? d.dat;
  const RN = z(d.pn) - z(d.pin);
  const RB = z(d.pb) - z(d.pib);
  const EBIT = RB + z(d.dob);
  const EBITDA = EBIT + z(d.amo);
  const FR = z(d.ac) - z(DC);
  return { AT, DC, RN, RB, EBIT, EBITDA, FR,
    lc: div(d.ac, DC), lr: div(z(d.ac) - z(d.st), DC), li: div(d.cb, DC),
    sg: div(AT, d.dat), af: div(d.cp, AT), gi: (d.cp > 0) ? div(d.dat, d.cp) : null,
    mn: div(RN, d.ca), mb: div(RB, d.ca), mE: div(EBITDA, d.ca), roa: div(RN, AT), roe: (d.cp > 0) ? div(RN, d.cp) : null,
    ra: div(d.ca, AT), dso: d.ca ? div(z(d.cr) * 365, d.ca) : null, dio: d.ca ? div(z(d.st) * 365, d.ca) : null,
    rch: div(d.cht, d.vt), cas: div(d.ca, d.sal), rns: div(RN, d.sal), acop: (d.dob) ? div(EBIT, d.dob) : null,
    altman: AT ? (6.56 * (FR / AT) + 3.26 * ((z(d.cp) - z(d.cs)) / AT) + 6.72 * (EBIT / AT) + 1.05 * (d.dat ? z(d.cp) / d.dat : 0)) : null
  };
}
/* [eticheta, cheie, format, formula, evaluare(v)->[clasa,text]] */
const R = [
  ['Lichiditate', null],
  ['Lichiditate curentă', 'lc', num, 'Active circulante / Datorii curente', v => v >= 2 ? ['ok', 'bună'] : v >= 1 ? ['warn', 'acceptabilă'] : ['bad', 'risc de plată']],
  ['Lichiditate rapidă (test acid)', 'lr', num, '(Active circulante − Stocuri) / Datorii curente', v => v >= 1 ? ['ok', 'bună'] : v >= 0.65 ? ['warn', 'acceptabilă'] : ['bad', 'scăzută']],
  ['Lichiditate imediată', 'li', num, 'Disponibilități / Datorii curente', v => v >= 0.3 ? ['ok', 'bună'] : v >= 0.1 ? ['warn', 'acceptabilă'] : ['bad', 'scăzută']],
  ['Fond de rulment net', 'FR', lei, 'Active circulante − Datorii curente', v => v > 0 ? ['ok', 'pozitiv'] : ['bad', 'negativ']],
  ['Structură și solvabilitate', null],
  ['Solvabilitate generală', 'sg', num, 'Active totale / Datorii totale', v => v >= 1.5 ? ['ok', 'bună'] : v >= 1 ? ['warn', 'la limită'] : ['bad', 'datorii > active']],
  ['Autonomie financiară', 'af', pct, 'Capitaluri proprii / Total activ', v => v >= 0.5 ? ['ok', 'ridicată'] : v >= 0.3 ? ['warn', 'medie'] : ['bad', 'dependență de creditori']],
  ['Grad de îndatorare', 'gi', num, 'Datorii totale / Capitaluri proprii', v => v <= 1 ? ['ok', 'moderat'] : v <= 2 ? ['warn', 'ridicat'] : ['bad', 'foarte ridicat']],
  ['Acoperirea dobânzilor', 'acop', num, 'EBIT / Cheltuieli cu dobânzile', v => v >= 3 ? ['ok', 'confortabilă'] : v >= 1.5 ? ['warn', 'la limită'] : ['bad', 'insuficientă']],
  ['Rentabilitate', null],
  ['Rezultat net', 'RN', lei, 'Profit net − Pierdere netă', v => v > 0 ? ['ok', 'profit'] : v < 0 ? ['bad', 'pierdere'] : ['neu', 'zero']],
  ['EBITDA', 'EBITDA', lei, 'Rezultat brut + dobânzi + amortizare', v => v > 0 ? ['ok', 'pozitiv'] : ['bad', 'negativ']],
  ['Marja netă', 'mn', pct, 'Rezultat net / Cifra de afaceri', v => v >= 0.05 ? ['ok', 'bună'] : v >= 0 ? ['warn', 'redusă'] : ['bad', 'negativă']],
  ['Marja brută', 'mb', pct, 'Rezultat brut / Cifra de afaceri', v => v >= 0.06 ? ['ok', 'bună'] : v >= 0 ? ['warn', 'redusă'] : ['bad', 'negativă']],
  ['Marja EBITDA', 'mE', pct, 'EBITDA / Cifra de afaceri', v => v >= 0.1 ? ['ok', 'bună'] : v >= 0 ? ['warn', 'redusă'] : ['bad', 'negativă']],
  ['ROA', 'roa', pct, 'Rezultat net / Active totale', v => v >= 0.05 ? ['ok', 'bună'] : v >= 0 ? ['warn', 'redusă'] : ['bad', 'negativă']],
  ['ROE', 'roe', pct, 'Rezultat net / Capitaluri proprii', v => v >= 0.1 ? ['ok', 'bună'] : v >= 0 ? ['warn', 'redusă'] : ['bad', 'negativă']],
  ['Rata cheltuielilor', 'rch', pct, 'Cheltuieli totale / Venituri totale', v => v < 0.95 ? ['ok', 'sub 95%'] : v <= 1 ? ['warn', 'la limită'] : ['bad', 'peste venituri']],
  ['Gestiune și productivitate', null],
  ['Rotația activelor', 'ra', num, 'Cifra de afaceri / Active totale', () => ['neu', 'comparați cu sectorul']],
  ['Durata de încasare a creanțelor', 'dso', v => v == null ? '—' : nf0.format(v) + ' zile', 'Creanțe / CA × 365', v => v <= 60 ? ['ok', 'rapidă'] : v <= 90 ? ['warn', 'medie'] : ['bad', 'lentă']],
  ['Durata de rotație a stocurilor', 'dio', v => v == null ? '—' : nf0.format(v) + ' zile', 'Stocuri / CA × 365', () => ['neu', 'depinde de sector']],
  ['Cifra de afaceri / salariat', 'cas', lei, 'CA / Număr mediu salariați', () => ['neu', '']],
  ['Rezultat net / salariat', 'rns', lei, 'Rezultat net / Număr mediu salariați', () => ['neu', '']]
];
const badge = (v, ev) => { if (v == null || !isFinite(v)) return ''; const [c, t] = ev(v); return t ? `<span class="badge ${c}">${t}</span>` : ''; };
const varp = (a, b) => (a == null || b == null || a === 0) ? null : (b - a) / Math.abs(a);

function calc() {
  const N = getYear('N'), P = getYear('P'), out = $('#finOut');
  if (!N) { out.innerHTML = '<div class="msg warn">Completează cel puțin coloana anului N.</div>'; return; }
  const rN = ratios(N), rP = P ? ratios(P) : null;
  const noDC = N.datc == null;

  let h = `<h3 style="margin-top:22px">Indicatori</h3>
  <table class="ratios"><thead><tr><th>Indicator</th>${rP ? '<th>N-1</th>' : ''}<th>N</th><th>Evaluare N</th></tr></thead><tbody>`;
  R.forEach(([lab, k, f, form, ev]) => {
    if (!k) { h += `<tr class="grp"><td colspan="${rP ? 4 : 3}">${lab}</td></tr>`; return; }
    h += `<tr><td>${lab}<div class="f">${form}</div></td>${rP ? `<td class="num">${f(rP[k])}</td>` : ''}<td class="num">${f(rN[k])}</td><td>${badge(rN[k], ev)}</td></tr>`;
  });
  h += '</tbody></table>';
  if (noDC) h += '<p class="hint">Datoriile curente nu au fost completate: indicatorii de lichiditate folosesc datoriile totale.</p>';

  // scor Altman
  const zv = rN.altman;
  const zc = zv == null ? ['neu', '—'] : zv > 2.6 ? ['ok', 'zonă sigură'] : zv >= 1.1 ? ['warn', 'zonă gri'] : ['bad', 'risc de dificultate financiară'];
  const red = R.filter(r => r[1] && rN[r[1]] != null && isFinite(rN[r[1]]) && r[4](rN[r[1]])[0] === 'bad').length;
  const grn = R.filter(r => r[1] && rN[r[1]] != null && isFinite(rN[r[1]]) && r[4](rN[r[1]])[0] === 'ok').length;
  h += `<div class="score">
    <div class="box"><div class="hint">Scor Altman Z″ (firme necotate)</div><div class="big">${num(zv)}</div><span class="badge ${zc[0]}">${zc[1]}</span>
      <p class="hint">Z″ = 6,56·X1 + 3,26·X2 + 6,72·X3 + 1,05·X4. X2 aproximat prin (capitaluri proprii − capital subscris) / active; X3 prin (rezultat brut + dobânzi) / active. Praguri: &gt; 2,6 sigur, 1,1–2,6 gri, &lt; 1,1 risc.</p></div>
    <div class="box"><div class="hint">Indicatori favorabili / nefavorabili</div><div class="big"><span style="color:var(--ok)">${grn}</span> / <span style="color:var(--bad)">${red}</span></div>
      <p class="hint">Numărul de indicatori din tabel cu evaluare „bună” vs. „risc”.</p></div>
    ${rP ? `<div class="box"><div class="hint">Evoluție N față de N-1</div>${trend(P, N, rP, rN)}</div>` : ''}
  </div>`;

  // semnale de alertă
  const al = alerts(N, P, rN, rP);
  h += `<h3>Semnale pentru verificare</h3>` + (al.length
    ? `<ul class="alerts">${al.map(([c, t]) => `<li><span class="badge ${c}">${c === 'bad' ? 'risc' : 'atenție'}</span> ${t}</li>`).join('')}</ul>`
    : '<div class="msg ok">Nu au fost identificate semnale de alertă pe baza datelor introduse.</div>');
  h += `<p class="disclaimer">Pragurile sunt orientative și diferă între sectoare (comerț, producție, servicii, construcții). Pentru o concluzie fermă, comparați cu media sectorului CAEN și cu situațiile financiare complete, inclusiv notele explicative.</p>`;
  out.innerHTML = h;
  out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function trend(P, N, rP, rN) {
  const items = [['Cifra de afaceri', P.ca, N.ca], ['Rezultat net', rP.RN, rN.RN], ['Datorii', P.dat, N.dat], ['Capitaluri proprii', P.cp, N.cp], ['Salariați', P.sal, N.sal]];
  return '<div class="bars">' + items.filter(i => i[1] != null || i[2] != null).map(([l, a, b]) => {
    const v = varp(a, b); const c = v == null ? 'neu' : v >= 0 ? 'ok' : 'bad';
    const m = Math.max(Math.abs(z(a)), Math.abs(z(b)), 1);
    return `<div class="bar"><span>${l}</span><div class="t"><span class="p" style="width:${Math.abs(z(a)) / m * 100}%;height:50%"></span><span style="width:${Math.abs(z(b)) / m * 100}%;top:50%"></span></div><span class="badge ${c}">${v == null ? '—' : (v >= 0 ? '+' : '') + nf2.format(v * 100) + '%'}</span></div>`;
  }).join('') + '</div><p class="hint">bara de sus: N-1, bara de jos: N</p>';
}
function alerts(N, P, r, rp) {
  const a = [];
  if (N.cp != null && N.cp < 0) a.push(['bad', 'Capitaluri proprii negative — datoriile depășesc activele. Situație de supra-îndatorare.']);
  else if (N.cp != null && N.cs && N.cp < N.cs / 2) a.push(['bad', 'Activul net este sub jumătate din capitalul subscris — Legea 31/1990 cere convocarea AGA și reîntregirea capitalului sau reducerea lui.']);
  if (r.RN < 0) a.push(['bad', `Pierdere netă de ${lei(-r.RN)} în anul N.`]);
  if (rp && rp.RN < 0 && r.RN < 0) a.push(['bad', 'Pierderi în doi ani consecutivi.']);
  if (!N.ca) a.push(['warn', 'Cifră de afaceri zero sau necompletată — posibilă firmă fără activitate.']);
  if (P && N.ca != null && P.ca) { const v = varp(P.ca, N.ca); if (v < -0.2) a.push(['warn', `Cifra de afaceri a scăzut cu ${pct(-v)} față de anul anterior.`]); if (v > 2) a.push(['warn', `Creștere foarte rapidă a cifrei de afaceri (${pct(v)}) — verifică sustenabilitatea și sursa veniturilor.`]); }
  if (P && P.dat && N.dat != null) { const vd = varp(P.dat, N.dat), vc = varp(P.ca, N.ca); if (vd > 0.3 && (vc == null || vc < vd / 2)) a.push(['warn', `Datoriile au crescut cu ${pct(vd)}, mai repede decât cifra de afaceri.`]); }
  if (r.lc != null && r.lc < 1) a.push(['bad', 'Lichiditate curentă sub 1 — activele circulante nu acoperă datoriile pe termen scurt.']);
  if (r.sg != null && r.sg < 1) a.push(['bad', 'Solvabilitate sub 1 — activele totale nu acoperă datoriile.']);
  if (r.dso != null && r.dso > 90) a.push(['warn', `Creanțele se încasează în medie în ${nf0.format(r.dso)} de zile.`]);
  if (r.acop != null && r.acop < 1.5) a.push(['warn', 'Profitul operațional acoperă greu dobânzile.']);
  if (N.ca > 1000000 && !N.sal) a.push(['warn', 'Cifră de afaceri peste 1 milion lei fără salariați — verifică substanța economică (subcontractare, firmă de tip „fantomă”).']);
  if (N.ac && N.cb != null && N.cb / N.ac < 0.03 && r.lc < 1.2) a.push(['warn', 'Disponibilități foarte reduse în raport cu activele circulante.']);
  if (rp && r.dso != null && rp.dso && r.dso > rp.dso * 1.3) a.push(['warn', 'Durata de încasare a creanțelor s-a deteriorat cu peste 30%.']);
  return a;
}

/* ---------------- CALCULATOR PFA ---------------- */
function pfaYear() {
  const an = $('#pfaAn').value; $('#pfaSmin').value = PFA_PARAMS[an].smin; pfaCalc();
}
function pfaCalc() {
  const an = $('#pfaAn').value, P = PFA_PARAMS[an];
  const s = +$('#pfaSmin').value || P.smin;
  const V = +$('#pfaVenit').value || 0, Ch = +$('#pfaChelt').value || 0, Ded = +$('#pfaDed').value || 0;
  const opt = $('#pfaCasBaza').value, ex = $('#pfaExcept').checked;
  const net = Math.max(0, V - Ch);
  const s6 = 6 * s, s12 = 12 * s, s24 = 24 * s, sMax = P.cassMax * s;

  let casBaza = 0, casNote = '';
  if (opt === 'none') { casBaza = 0; casNote = 'nu se datorează la sistemul public'; }
  else if (opt === '24') { casBaza = s24; casNote = 'bază opțională 24 salarii'; }
  else if (net >= s24) { casBaza = s24; casNote = 'venit ≥ 24 salarii → bază 24 salarii'; }
  else if (net >= s12) { casBaza = s12; casNote = 'venit între 12 și 24 salarii → bază 12 salarii'; }
  else { casBaza = 0; casNote = 'venit sub 12 salarii → nu e obligatoriu (opțional pe 12 salarii)'; }
  const CAS = casBaza * P.cas;

  let cassBaza, cassNote;
  if (net >= sMax) { cassBaza = sMax; cassNote = `plafonat la ${P.cassMax} salarii minime`; }
  else if (net >= s6) { cassBaza = net; cassNote = 'venitul net realizat'; }
  else if (ex) { cassBaza = net; cassNote = 'sub 6 salarii, persoană exceptată → venitul net'; }
  else { cassBaza = s6; cassNote = 'sub 6 salarii → bază minimă 6 salarii'; }
  const CASS = cassBaza * P.cass;

  const bazaImp = Math.max(0, net - CAS - CASS - Ded);
  const IMP = bazaImp * P.imp;
  const TOT = CAS + CASS + IMP;
  const ramas = V - Ch - TOT;

  $('#pfaOut').innerHTML = `<h3>Rezultat ${an}</h3>
  <table class="sum">
    <tr><td>Venit brut</td><td class="num">${lei(V)}</td></tr>
    <tr><td>Cheltuieli deductibile</td><td class="num">− ${lei(Ch)}</td></tr>
    <tr class="hl"><td><strong>Venit net</strong></td><td class="num"><strong>${lei(net)}</strong></td></tr>
    <tr><td>CAS 25% × ${lei(casBaza)}<div class="hint">${casNote}</div></td><td class="num">${lei(CAS)}</td></tr>
    <tr><td>CASS 10% × ${lei(cassBaza)}<div class="hint">${cassNote}</div></td><td class="num">${lei(CASS)}</td></tr>
    <tr><td>Venit impozabil (net − CAS − CASS${Ded ? ' − alte deduceri' : ''})</td><td class="num">${lei(bazaImp)}</td></tr>
    <tr><td>Impozit pe venit 10%</td><td class="num">${lei(IMP)}</td></tr>
    <tr class="tot"><td>Total de plată la stat</td><td class="num">${lei(TOT)}</td></tr>
    <tr><td>Echivalent lunar</td><td class="num">${lei(TOT / 12)}</td></tr>
    <tr><td>Rata efectivă din venitul net</td><td class="num">${pct(net ? TOT / net : null)}</td></tr>
    <tr class="hl"><td><strong>Rămâne după taxe și cheltuieli</strong></td><td class="num"><strong>${lei(ramas)}</strong></td></tr>
  </table>
  <h3 style="margin-top:16px">Plafoane ${an} (salariu minim ${lei(s)})</h3>
  <table class="sum">
    <tr><td>6 salarii — bază minimă CASS</td><td class="num">${lei(s6)}</td><td class="num">CASS ${lei(s6 * .1)}</td></tr>
    <tr><td>12 salarii — prag CAS</td><td class="num">${lei(s12)}</td><td class="num">CAS ${lei(s12 * .25)}</td></tr>
    <tr><td>24 salarii — prag CAS</td><td class="num">${lei(s24)}</td><td class="num">CAS ${lei(s24 * .25)}</td></tr>
    <tr><td>${P.cassMax} salarii — plafon maxim CASS</td><td class="num">${lei(sMax)}</td><td class="num">CASS ${lei(sMax * .1)}</td></tr>
  </table>
  <p class="hint">Contribuțiile și impozitul se declară în Declarația Unică și se plătesc, de regulă, până la 25 mai a anului următor. CAS și CASS datorate se scad din venitul net la calculul impozitului.</p>`;
}
$('#pfaAn').addEventListener('change', pfaYear);
$$('#pfaForm input, #pfaForm select').forEach(el => el.addEventListener('input', pfaCalc));
$('#pfaVenit').value = 60000;
pfaYear();

/* ---------------- CHECKLIST ---------------- */
let cl = store.get('cl', { name: '', done: {} });
function clRender() {
  $('#clName').value = cl.name || '';
  $('#clBody').innerHTML = CHECKLIST.map((sec, si) => {
    const n = sec.items.filter((_, ii) => cl.done[si + '-' + ii]).length;
    return `<div class="cl-sec"><h3><span>${sec.t}</span><span class="hint">${n}/${sec.items.length}</span></h3>` +
      sec.items.map(([t, d], ii) => { const id = si + '-' + ii; return `<label class="cl-item"><input type="checkbox" data-cl="${id}" ${cl.done[id] ? 'checked' : ''}><span>${t}<small>${d}</small></span></label>`; }).join('') + '</div>';
  }).join('');
  const tot = CHECKLIST.reduce((a, s) => a + s.items.length, 0), done = Object.values(cl.done).filter(Boolean).length;
  $('#clBar').style.width = (done / tot * 100) + '%';
}
$('#clBody').addEventListener('change', e => { const id = e.target.dataset.cl; if (!id) return; cl.done[id] = e.target.checked; store.set('cl', cl); clRender(); });
$('#clName').addEventListener('input', e => { cl.name = e.target.value; store.set('cl', cl); });
$('#clReset').addEventListener('click', () => { cl = { name: '', done: {} }; store.set('cl', cl); clRender(); });
clRender();

/* ---------------- VALIDĂRI ---------------- */
$('#vCui').addEventListener('input', e => {
  const v = e.target.value.trim(); const o = $('#vCuiOut');
  if (!v) { o.innerHTML = ''; return; }
  const r = cuiValid(v);
  o.innerHTML = `<div class="msg ${r.ok ? 'ok' : 'bad'}">${esc(r.msg)}</div>${r.ok ? `<a href="#firma" id="goCui">Verifică la ANAF →</a>` : ''}`;
  const g = $('#goCui'); if (g) g.onclick = () => { $('#cuiInput').value = r.c; setTimeout(() => $('#cuiForm').requestSubmit(), 50); };
});
function ibanCheck(raw) {
  const s = raw.toUpperCase().replace(/[\s-]/g, '');
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return { ok: false, msg: 'Format IBAN invalid.' };
  if (s.startsWith('RO') && s.length !== 24) return { ok: false, msg: `IBAN-urile RO au 24 de caractere (acesta are ${s.length}).` };
  const r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => c.charCodeAt(0) - 55);
  let m = 0; for (const ch of r) m = (m * 10 + +ch) % 97;
  const ok = m === 1;
  let bank = '';
  if (s.startsWith('RO')) { const code = s.slice(4, 8); bank = RO_BANKS[code] ? `${RO_BANKS[code]} (${code})` : `cod bancă ${code} — necunoscut în lista locală`; }
  return { ok, s, bank, msg: ok ? 'IBAN valid (cifre de control corecte).' : 'Cifrele de control nu corespund — IBAN greșit.' };
}
$('#vIban').addEventListener('input', e => {
  const v = e.target.value.trim(), o = $('#vIbanOut');
  if (!v) { o.innerHTML = ''; return; }
  const r = ibanCheck(v);
  o.innerHTML = `<div class="msg ${r.ok ? 'ok' : 'bad'}">${esc(r.msg)}</div>${r.bank ? `<div>Bancă: <strong>${esc(r.bank)}</strong></div>` : ''}${r.s ? `<div class="hint">${esc(r.s.replace(/(.{4})/g, '$1 ').trim())}</div>` : ''}`;
});

/* ---------------- RESURSE ---------------- */
$('#resBody').innerHTML = RESOURCES.map(g => `<div class="panel"><h3>${g.t}</h3><ul>${g.l.map(([t, u, d]) =>
  `<li><a href="${u}" target="_blank" rel="noopener">${t}</a><small>${d}</small></li>`).join('')}</ul></div>`).join('');

/* expunere pentru teste */
window.__AE = { cuiValid, ibanCheck, parseBilant, ratios };
})();
