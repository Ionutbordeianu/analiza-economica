/* Modul fiscal 2026: comparator forme de organizare, impozit pe profit cu limite de deductibilitate, TVA, calendar */
(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const U = window.AEU; const { lei, pct, nf0, nf2, esc } = U;
const v = id => +($('#' + id).value || 0);

const P26 = {
  smin: 4050, smin2: 4325, cas: 0.25, cass: 0.10, impPFA: 0.10, cassMaxPFA: 72,
  micro: 0.01, microEUR: 100000, profit: 0.16, div: 0.16, tva: 0.21, tvaRed: 0.11, plafonTVA: 395000, tvaInc: 5000000,
  cam: 0.0225, impSal: 0.10, casSal: 0.25, cassSal: 0.10, protocol: 0.02, sociale: 0.05, auto: 0.5, sponsCA: 0.0075, sponsImp: 0.20,
  dobEUR: 1000000, dobEBITDA: 0.30
};

/* ---------- referință ---------- */
$('#fiscRef').innerHTML = `<table class="sum">
<tr><td>Salariul minim brut — referință pentru plafoanele anului (1 ianuarie 2026)</td><td class="num">${lei(P26.smin)}</td></tr>
<tr><td>Salariul minim brut de la 1 iulie 2026</td><td class="num">${lei(P26.smin2)}</td></tr>
<tr><td>Impozit pe veniturile microîntreprinderilor (cotă unică)</td><td class="num">1%</td></tr>
<tr><td>Plafon microîntreprindere (venituri anul precedent, inclusiv întreprinderi legate)</td><td class="num">100.000 EUR</td></tr>
<tr><td>Impozit pe profit</td><td class="num">16%</td></tr>
<tr><td>Impozit pe dividende (distribuite după 1 ianuarie 2026)</td><td class="num">16%</td></tr>
<tr><td>TVA — cota standard / cota redusă</td><td class="num">21% / 11%</td></tr>
<tr><td>Plafon de scutire TVA (art. 310 Cod fiscal)</td><td class="num">${lei(P26.plafonTVA)}</td></tr>
<tr><td>Plafon TVA la încasare (din 1 martie 2026)</td><td class="num">${lei(P26.tvaInc)}</td></tr>
<tr><td>Salarii: CAS / CASS / impozit (angajat) — CAM (angajator)</td><td class="num">25% / 10% / 10% — 2,25%</td></tr>
<tr><td>PFA sistem real: impozit / CAS / CASS</td><td class="num">10% / 25% / 10%</td></tr>
<tr><td>PFA: plafoane CAS 12 / 24 salarii; CASS minim 6, maxim 72 salarii</td><td class="num">48.600 / 97.200; 24.300 – 291.600 lei</td></tr>
<tr><td>Limite deductibilitate: protocol / cheltuieli sociale / auto cu uz mixt</td><td class="num">2% / 5% din salarii / 50%</td></tr>
<tr><td>Sponsorizare: credit fiscal din impozitul pe profit</td><td class="num">min(0,75% × CA; 20% × impozit)</td></tr>
</table>`;

/* ---------- comparator forme de organizare ---------- */
function cassInvest(x, s) { // CASS pentru venituri din investiții (dividende): bază 6 / 12 / 24 salarii
  if (x < 6 * s) return 0; if (x < 12 * s) return 0.1 * 6 * s; if (x < 24 * s) return 0.1 * 12 * s; return 0.1 * 24 * s;
}
function pfa(V, Ch, s) {
  const net = Math.max(0, V - Ch);
  const casB = net >= 24 * s ? 24 * s : net >= 12 * s ? 12 * s : 0;
  const CAS = casB * 0.25;
  const cassB = net >= 72 * s ? 72 * s : Math.max(net, 6 * s);
  const CASS = cassB * 0.10;
  const IMP = Math.max(0, net - CAS - CASS) * 0.10;
  return { taxe: CAS + CASS + IMP, net: V - Ch - CAS - CASS - IMP, det: `CAS ${lei(CAS)} · CASS ${lei(CASS)} · impozit ${lei(IMP)}` };
}
function srl(V, Ch, s, micro) {
  const impF = micro ? V * P26.micro : Math.max(0, V - Ch) * P26.profit;
  const profit = Math.max(0, V - Ch - impF);
  const impDiv = profit * P26.div;
  const cass = cassInvest(profit, s);
  return { taxe: impF + impDiv + cass, net: profit - impDiv - cass, det: `${micro ? 'impozit micro 1%' : 'impozit profit 16%'} ${lei(impF)} · impozit dividende ${lei(impDiv)} · CASS dividende ${lei(cass)}` };
}
function cmpCalc() {
  const V = v('cmpV'), Ch = v('cmpCh'), eur = v('cmpEur') || 5.1, sal = $('#cmpSal').checked, prevV = v('cmpPrev') || V;
  const s = P26.smin;
  const microOk = prevV <= P26.microEUR * eur && sal;
  const rows = [
    ['PFA — sistem real', pfa(V, Ch, s), true, ''],
    ['SRL microîntreprindere (1% din venituri)', srl(V, Ch, s, true), microOk, microOk ? '' : (!sal ? 'necesită cel puțin un salariat' : `venituri peste ${nf0.format(P26.microEUR * eur)} lei`)],
    ['SRL impozit pe profit (16%)', srl(V, Ch, s, false), true, '']
  ];
  const elig = rows.filter(r => r[2]); const best = elig.reduce((a, b) => b[1].net > a[1].net ? b : a);
  $('#cmpOut').innerHTML = `<table class="ratios"><thead><tr><th>Formă</th><th>Taxe totale</th><th>Rata efectivă</th><th>Rămâne la titular</th><th></th></tr></thead><tbody>
  ${rows.map(([n, r, ok, why]) => `<tr${r === best[1] ? ' class="hl"' : ''}><td>${n}<div class="f">${r.det}</div></td><td class="num">${lei(r.taxe)}</td><td class="num">${pct(V - Ch > 0 ? r.taxe / (V - Ch) : null)}</td><td class="num"><strong>${lei(r.net)}</strong></td><td>${!ok ? `<span class="badge bad">neeligibil: ${why}</span>` : r === best[1] ? '<span class="badge ok">cel mai avantajos</span>' : ''}</td></tr>`).join('')}
  </tbody></table>
  <p class="hint">Ipoteze: tot profitul SRL se distribuie ca dividende în același an; CASS pe dividende la baza de 6/12/24 salarii minime (fără alte venituri extrasalariale); cheltuielile includ salariul angajatului la SRL micro; nu se iau în calcul rezerva legală, nedeductibilele și pierderile reportate. Profesiile liberale cu sistem propriu de pensii (ex. avocații) nu datorează CAS la sistemul public — ajustați manual.</p>`;
}
$$('#cmpForm input').forEach(e => e.addEventListener('input', cmpCalc));
cmpCalc();

/* ---------- impozit pe profit cu limite de deductibilitate ---------- */
function ipCalc() {
  const Vt = v('ipV'), Vn = v('ipVn'), Ch = v('ipCh'), prot = v('ipProt'), soc = v('ipSoc'), sal = v('ipSal'), auto = v('ipAuto'),
        amenzi = v('ipAm'), altn = v('ipAlt'), spons = v('ipSpons'), ca = v('ipCA') || Vt, cs = v('ipCS'), rlex = v('ipRL');
  const PCB = Vt - Ch; // profit contabil brut (fără cheltuiala cu impozitul pe profit)
  // rezerva legală: 5% din PCB, până la 20% din capitalul social
  const rl = Math.max(0, Math.min(PCB * 0.05, cs * 0.2 - rlex));
  const socLim = sal * P26.sociale, socNed = Math.max(0, soc - socLim);
  const autoNed = auto * P26.auto;
  // protocol: 2% × (PCB + impozit pe profit + protocol) — iterativ, impozitul depinde de rezultat
  let imp = 0, protNed = 0, PI = 0;
  for (let i = 0; i < 30; i++) {
    const baza = PCB + imp + prot - Vn;
    const protLim = Math.max(0, baza * P26.protocol);
    protNed = Math.max(0, prot - protLim);
    PI = PCB - Vn - rl + protNed + socNed + autoNed + amenzi + altn;
    const nou = Math.max(0, PI) * P26.profit;
    if (Math.abs(nou - imp) < 0.5) { imp = nou; break; }
    imp = nou;
  }
  const sponsLim = Math.min(ca * P26.sponsCA, imp * P26.sponsImp);
  const sponsDed = Math.min(spons, sponsLim);
  const plata = imp - sponsDed;
  $('#ipOut').innerHTML = `<table class="sum">
  <tr><td>Profit contabil brut (venituri − cheltuieli)</td><td class="num">${lei(PCB)}</td></tr>
  <tr><td>− Venituri neimpozabile</td><td class="num">${lei(-Vn)}</td></tr>
  <tr><td>− Rezerva legală deductibilă (5%, până la 20% din capital)</td><td class="num">${lei(-rl)}</td></tr>
  <tr><td>+ Protocol peste limita de 2%</td><td class="num">${lei(protNed)}</td></tr>
  <tr><td>+ Cheltuieli sociale peste 5% din salarii (limită ${lei(socLim)})</td><td class="num">${lei(socNed)}</td></tr>
  <tr><td>+ 50% din cheltuielile auto cu uz mixt</td><td class="num">${lei(autoNed)}</td></tr>
  <tr><td>+ Amenzi, penalități, alte nedeductibile</td><td class="num">${lei(amenzi + altn)}</td></tr>
  <tr class="hl"><td><strong>Profit impozabil</strong></td><td class="num"><strong>${lei(PI)}</strong></td></tr>
  <tr><td>Impozit pe profit 16%</td><td class="num">${lei(imp)}</td></tr>
  <tr><td>− Sponsorizare scăzută (limită ${lei(sponsLim)})</td><td class="num">${lei(-sponsDed)}</td></tr>
  <tr class="tot"><td>Impozit pe profit de plată</td><td class="num">${lei(plata)}</td></tr>
  <tr><td>Rata efectivă față de profitul contabil</td><td class="num">${pct(PCB > 0 ? plata / PCB : null)}</td></tr>
  ${spons > sponsDed ? `<tr><td>Sponsorizare nescăzută (se reportează 7 ani)</td><td class="num">${lei(spons - sponsDed)}</td></tr>` : ''}
  </table>
  <p class="hint">Simplificat după art. 25 Cod fiscal: nu include pierderi fiscale reportate, amortizarea fiscală diferită de cea contabilă, limitarea costurilor excedentare ale îndatorării (1 mil. EUR + 30% din EBITDA fiscal) și impozitul minim pe cifra de afaceri (doar pentru CA peste 50 mil. EUR).</p>`;
}
$$('#ipForm input').forEach(e => e.addEventListener('input', ipCalc));
ipCalc();

/* ---------- TVA ---------- */
function tvaCalc() {
  const ca = v('tvaCA'), fact = v('tvaFact');
  const after = ca + fact;
  let h;
  if (after <= P26.plafonTVA) h = `<div class="msg ok">Cifra de afaceri cumulată ${lei(after)} rămâne sub plafonul de ${lei(P26.plafonTVA)}. Mai puteți factura ${lei(P26.plafonTVA - after)} în regim de scutire.</div>`;
  else h = `<div class="msg bad">Cu această factură, cifra de afaceri ajunge la ${lei(after)} și depășește plafonul de ${lei(P26.plafonTVA)}. Factura care depășește plafonul se emite cu TVA 21% (${lei(fact * 0.21)}), iar înregistrarea în scopuri de TVA se solicită cel târziu la data depășirii.</div>`;
  $('#tvaOut').innerHTML = h + `<p class="hint">Calculator TVA: ${lei(fact)} fără TVA → TVA 21% ${lei(fact * 0.21)}, total ${lei(fact * 1.21)}; la cota de 11%: TVA ${lei(fact * 0.11)}.</p>`;
}
$$('#tvaForm input').forEach(e => e.addEventListener('input', tvaCalc));
tvaCalc();

/* ---------- calendar ---------- */
const CAL = [
  ['Lunar, până pe 25', 'D112 (salarii și contribuții), D100 (impozite reținute), D300 (TVA lunar), D390 (VIES), D394 (livrări/achiziții interne); plata obligațiilor.'],
  ['Trimestrial, până pe 25 a lunii următoare', 'D300 pentru plătitorii de TVA trimestriali; D100 cu impozitul micro sau impozitul pe profit trimestrial.'],
  ['Ultima zi a lunii următoare perioadei', 'D406 SAF-T (fișierul standard de control fiscal) — lunar sau trimestrial, după categoria contribuabilului.'],
  ['Ultima zi a lunii februarie', 'D205 — declarația informativă privind impozitul reținut la sursă (inclusiv dividende).'],
  ['25 mai', 'Declarația unică D212 — PFA, venituri din chirii, investiții, dividende (CASS).'],
  ['150 de zile de la închiderea exercițiului', 'Situațiile financiare anuale (pentru exercițiul calendaristic, la sfârșitul lui mai — începutul lui iunie).'],
  ['25 iunie', 'D101 — declarația anuală de impozit pe profit (exercițiu calendaristic).'],
  ['La depășirea plafonului de 395.000 lei', 'Cererea de înregistrare în scopuri de TVA (D098/D091), cel târziu la data depășirii.'],
  ['În 15 zile de la modificare', 'Actualizarea registrului beneficiarilor reali la ONRC.']
];
$('#fiscCal').innerHTML = `<table class="ratios"><thead><tr><th>Termen</th><th>Obligație</th></tr></thead><tbody>${CAL.map(([t, o]) => `<tr><td><strong>${t}</strong></td><td>${o}</td></tr>`).join('')}</tbody></table>
<p class="hint">Calendar orientativ. Termenele exacte se publică anual de ANAF; când termenul cade într-o zi nelucrătoare, se prelungește la următoarea zi lucrătoare.</p>`;
})();
