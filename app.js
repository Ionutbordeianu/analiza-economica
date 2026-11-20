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
const PROXY = 'https://anaf-proxy.ionut-bordeianu.workers.dev';
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stocare indisponibilă */ } }
};

async function anafBilant(cui, an) {
  let r;
  try { r = await fetch(`${PROXY}/bilant?an=${an}&cui=${cui}`); if (!r.ok) throw new Error('HTTP ' + r.status); }
  catch (e) { r = await fetch(`https://webservicesp.anaf.ro/bilant?an=${an}&cui=${cui}`); if (!r.ok) throw new Error('HTTP ' + r.status); }
  return await r.json();
}
async function anafTva(cuis, data) {
  return anafPost('https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva', cuis.map(c => ({ cui: +c, data: data || today() })));
}
window.AEU = { esc, nf0, nf2, lei, pct, num, strip, today, store, cleanCui: s => cleanCui(s), cuiValid: s => cuiValid(s), anafBilant, anafTva: (a, d) => anafTva(a, d) };

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
  try {
    const r = await fetch(PROXY + '/tva', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) return await r.json();
  } catch (e) { /* încearcă direct */ }
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
    if (data.found && data.found.length) { window.AE_CO = data.found[0]; out.innerHTML = renderCompany(data.found[0]); }
    else out.innerHTML = '<div class="msg warn">ANAF nu a returnat date pentru acest CUI (inexistent sau nealocat).</div>';
  } catch (err) {
    out.innerHTML = `<div class="msg warn">Interogarea directă ANAF nu a reușit din browser (${esc(err.message)}). ANAF poate bloca cererile de pe alte site-uri sau poate fi temporar indisponibil. Folosește linkurile oficiale de mai jos.</div>`;
  } finally { if (btn) btn.disabled = false; }
});
document.addEventListener('click', e => {
  const a = e.target.closest('[data-goan]');
  if (!a) return;
  $('#bilCui').value = a.dataset.goan;
  setTimeout(() => $('#bilLoad').click(), 80);
});

/* ---------------- CALCULATOR PFA ---------------- */
function pfaYear() {
  const an = $('#pfaAn').value; $('#pfaSmin').value = PFA_PARAMS[an].smin; pfaCalc();
}
function pfaCalc() {
  const an = $('#pfaAn').value, P = PFA_PARAMS[an];
  const s = +$('#pfaSmin').value || P.smin;
  const V = +$('#pfaVenit').value || 0, Ch = +$('#pfaChelt').value || 0, Ded = +$('#pfaDed').value || 0;
  if ($('#pfaVenit').value === '') { $('#pfaOut').innerHTML = '<p class="hint">Introdu veniturile brute încasate în an pentru a vedea calculul.</p>'; return; }
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
window.__AE = { cuiValid, ibanCheck };
})();
