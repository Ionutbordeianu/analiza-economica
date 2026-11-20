// Actualizare automată a datelor de sector (rulează în GitHub Actions, Node 20+).
// 1. Caută pe data.gov.ro ultimul an cu situațiile financiare publicate (fișierele WEB_BL_BS_SL_AN și WEB_UU_AN).
// 2. Dacă sursele nu s-au schimbat față de sector.json existent, se oprește.
// 3. Altfel recalculează indicatorii pe sectoare CAEN și scrie sector.json.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const CKAN = (process.env.CKAN_BASE || 'https://data.gov.ro') + '/api/3/action/package_search';
const OUT = 'sector.json';
const log = (...a) => console.log(...a);

async function getJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`); return r.json(); }

// ---------- descoperirea seturilor de date ----------
async function discover() {
  const j = await getJSON(`${CKAN}?q=${encodeURIComponent('situatii financiare')}&rows=200`);
  const years = {};
  for (const p of j.result.results) {
    if (!p.organization || p.organization.name !== 'mfp') continue;
    for (const r of p.resources || []) {
      const id = `${r.name || ''} ${r.url || ''}`.toLowerCase();
      const m = id.match(/web_(bl_bs_sl|uu)_an(20\d\d)/);
      if (!m || !/\.txt(\b|$)/.test((r.url || '').toLowerCase())) continue;
      const y = +m[2], kind = m[1];
      const when = r.last_modified || r.created || r.metadata_modified || '';
      const slot = (years[y] = years[y] || {});
      if (!slot[kind] || when > slot[kind].when) slot[kind] = { url: r.url, when, size: r.size || null };
    }
  }
  return Object.entries(years).filter(([, v]) => v.bl_bs_sl && v.uu).map(([y, v]) => ({ y: +y, files: [v.bl_bs_sl, v.uu] })).sort((a, b) => b.y - a.y);
}
async function nomenclator() {
  const j = await getJSON(`${CKAN}?q=${encodeURIComponent('caen nomenclator')}&rows=20`);
  for (const p of j.result.results) for (const r of p.resources || []) if (/nomenclator_caen\.csv/i.test(r.url || '')) {
    const t = await (await fetch(r.url)).text(); const names = {};
    t.split(/\r?\n/).slice(1).forEach(l => { const [c, d, ver] = l.split('^'); if (!c || !d) return;
      if (ver === 'Versiunea 2025') (names[c] = names[c] || [null, null])[1] = d;
      if (ver === 'Versiunea 2008') (names[c] = names[c] || [null, null])[0] = d; });
    return names;
  }
  return {};
}

// ---------- citire fișiere (format: CUI,CAEN,I1..I20) ----------
// câmpuri păstrate: ai ac st cr cb chav dat vav prov cp cs ca vt cht pn pin sal
const COLS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 19, 20, 21];
async function readAll(files, onRow) {
  let lines = 0;
  for (const f of files) {
    const res = await fetch(f.url); if (!res.ok) throw new Error(`HTTP ${res.status} ${f.url}`);
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '', hdr = null;
    const handle = line => {
      line = line.trim(); if (!line) return; const c = line.split(',');
      if (!hdr) { hdr = c; if (c[0] !== 'CUI' || c[21] !== 'I20') throw new Error('antet neașteptat: ' + line.slice(0, 120)); return; }
      lines++;
      const caen = (c[1] || '').trim(); if (!/^\d{3,4}$/.test(caen)) return;
      const v = COLS.map(j => { const x = c[j]; return x === '' || x == null ? 0 : +x; });
      if (v.some(x => !isFinite(x))) return;
      onRow(caen.padStart(4, '0'), v);
    };
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); let i;
      while ((i = buf.indexOf('\n')) >= 0) { handle(buf.slice(0, i)); buf = buf.slice(i + 1); }
    }
    handle(buf);
  }
  return lines;
}

// ---------- calcul ----------
const R = ['mn','mbr','roa','roe','sg','af','gi','lg','dso','dio','ra','rch','ai_at','ac_at','st_at','cr_at','cb_at','dat_at','cp_at','cas','vts','chs','rns','ats','sal','ca','at','cp'];
const QS = [0.1, 0.25, 0.5, 0.75, 0.9];
const rd = x => { if (!isFinite(x)) return null; const a = Math.abs(x); return a >= 1000 ? Math.round(x) : +x.toPrecision(4); };

async function computeYear(files) {
  const cap = 1600000; const CA = new Int32Array(cap); const V = new Float64Array(cap * 17); let n = 0;
  const lines = await readAll(files, (caen, v) => { if (caen === '0000' || n >= cap) return; CA[n] = +caen; V.set(v, n * 17); n++; });
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => CA[a] - CA[b]);
  function ratios(i) {
    const o = i * 17; const ai=V[o],ac=V[o+1],st=V[o+2],cr=V[o+3],cb=V[o+4],chav=V[o+5],dat=V[o+6],cp=V[o+9],ca=V[o+11],vt=V[o+12],cht=V[o+13],pn=V[o+14],pin=V[o+15],sal=V[o+16];
    const AT = ai + ac + chav, RN = pn - pin, RB = vt - cht;
    return [RN/ca, RB/ca, RN/AT, cp>0?RN/cp:NaN, dat>0?AT/dat:NaN, cp/AT, cp>0?dat/cp:NaN, dat>0?ac/dat:NaN, cr/ca*365, st/ca*365, ca/AT, vt>0?cht/vt:NaN,
            ai/AT, ac/AT, st/AT, cr/AT, cb/AT, dat/AT, cp/AT, sal>0?ca/sal:NaN, sal>0?vt/sal:NaN, sal>0?cht/sal:NaN, sal>0?RN/sal:NaN, sal>0?AT/sal:NaN, sal, ca, AT, cp];
  }
  function group(ids) {
    const all = ids.length; const act = ids.filter(i => V[i*17+11] > 0 && (V[i*17] + V[i*17+1] + V[i*17+5]) > 0);
    const sums = new Array(17).fill(0); let prof = 0, loss = 0, cpneg = 0; const sz = [0,0,0,0,0], szca = [0,0,0,0,0]; const cas = [];
    for (const i of act) { const o = i*17; for (let k = 0; k < 17; k++) sums[k] += V[o+k]; const RN = V[o+14]-V[o+15]; if (RN > 0) prof++; else if (RN < 0) loss++; if (V[o+9] < 0) cpneg++;
      const s = V[o+16]; const c = s === 0 ? 0 : s < 10 ? 1 : s < 50 ? 2 : s < 250 ? 3 : 4; sz[c]++; szca[c] += V[o+11]; cas.push(V[o+11]); }
    cas.sort((a, b) => b - a); const tot = sums[11] || 1;
    const cr4 = cas.slice(0, 4).reduce((a, b) => a + b, 0) / tot, cr10 = cas.slice(0, 10).reduce((a, b) => a + b, 0) / tot;
    const hhi = cas.reduce((a, c) => a + (c / tot) ** 2, 0) * 10000;
    const RR = act.map(ratios);
    const q = R.map((_, k) => { const a = Float64Array.from(RR.map(r => r[k]).filter(x => isFinite(x))).sort(); if (a.length < 10) return null;
      return QS.map(p => { const x = (a.length - 1) * p, lo = Math.floor(x), hi = Math.ceil(x); return rd(a[lo] + (a[hi] - a[lo]) * (x - lo)); }); });
    return [all, act.length, prof, loss, cpneg, sz, szca.map(Math.round), sums.map(Math.round), +cr4.toFixed(4), +cr10.toFixed(4), Math.round(hhi), q];
  }
  const d = {}; let s = 0;
  while (s < n) { let e = s; while (e < n && CA[idx[e]] === CA[idx[s]]) e++; const k = String(CA[idx[s]]).padStart(4, '0'); const ids = idx.slice(s, e); if (ids.length >= 15) d[k] = group(ids); s = e; }
  s = 0; while (s < n) { const dv = Math.floor(CA[idx[s]] / 100); let e = s; while (e < n && Math.floor(CA[idx[e]] / 100) === dv) e++; d[String(dv).padStart(2, '0')] = group(idx.slice(s, e)); s = e; }
  d.ALL = group(idx);
  return { d, rows: n, lines };
}
async function totalsYear(files) {
  const P = {};
  const add = (k, v) => { if (!(v[11] > 0)) return; let g = P[k]; if (!g) g = P[k] = [0, 0, 0, new Array(17).fill(0)]; g[0]++; if (v[14] - v[15] < 0) g[1]++; if (v[9] < 0) g[2]++; for (let j = 0; j < 17; j++) g[3][j] += v[j]; };
  let rows = 0;
  await readAll(files, (caen, v) => { if (caen === '0000') return; rows++; add(caen, v); add(caen.slice(0, 2), v); add('ALL', v); });
  Object.values(P).forEach(g => g[3] = g[3].map(Math.round));
  return { p: P, rows };
}

// ---------- main ----------
const avail = await discover();
if (avail.length < 2) throw new Error('Nu am găsit pe data.gov.ro cel puțin doi ani cu fișierele necesare.');
log('Ani disponibili:', avail.map(a => a.y).join(', '));
const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;

for (let i = 0; i + 1 < avail.length; i++) {
  const cur = avail[i], prev = avail.find(a => a.y === cur.y - 1);
  if (!prev) continue;
  const meta = { an: cur.y, prevAn: prev.y, files: [...cur.files, ...prev.files].map(f => ({ url: f.url, when: f.when })) };
  if (old && JSON.stringify(old.srcMeta) === JSON.stringify(meta) && !process.env.FORCE) { log(`Fără modificări (${cur.y}/${prev.y}). Nu se actualizează.`); process.exit(0); }
  log(`Calculez ${cur.y} (comparativ ${prev.y})…`);
  const y = await computeYear(cur.files);
  const p = await totalsYear(prev.files);
  log(`${cur.y}: ${y.rows} bilanțuri; ${prev.y}: ${p.rows} bilanțuri.`);
  // anul nou trebuie să fie complet: cel puțin 80% din numărul de bilanțuri al anului anterior
  if (y.rows < 0.8 * p.rows) { log(`Anul ${cur.y} pare incomplet (${y.rows} față de ${p.rows}); folosesc perechea anterioară.`); continue; }
  const all = await nomenclator(); const caen = {}; Object.keys(y.d).forEach(k => { if (all[k]) caen[k] = all[k]; });
  const out = { v: 2, an: cur.y, prevAn: prev.y, rev: [cur.y >= 2025 ? 3 : 2, prev.y >= 2025 ? 3 : 2],
    src: `data.gov.ro — Situații financiare ${cur.y} și ${prev.y} (Ministerul Finanțelor): WEB_BL_BS_SL_AN și WEB_UU_AN`,
    updated: new Date().toISOString().slice(0, 10), ratios: R,
    sumFields: ['ai','ac','st','cr','cb','chav','dat','vav','prov','cp','cs','ca','vt','cht','pn','pin','sal'],
    q: QS, d: y.d, p: p.p, caen, srcMeta: meta };
  writeFileSync(OUT, JSON.stringify(out));
  log(`Scris ${OUT}: ${Object.keys(y.d).length} grupe, ${y.rows} bilanțuri pe ${cur.y}.`);
  process.exit(0);
}
throw new Error('Nu am găsit o pereche completă de ani.');
