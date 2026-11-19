# Analiză Economică — verificare firme și PFA

Site static (HTML + CSS + JavaScript, fără server și fără dependențe) pentru verificarea activității societăților comerciale și a PFA din România.

## Funcții
- **Verificare CUI** — interogare a serviciului web public ANAF (Registrul TVA v9): denumire, adresă, stare, inactiv/radiat, TVA, TVA la încasare, split TVA, RO e-Factura, CAEN.
- **Analiză financiară** — încărcare bilanț publicat de ANAF (N și N-1) sau completare manuală; lichiditate, solvabilitate, îndatorare, rentabilitate, rotație, scor Altman Z″, semnale de alertă.
- **Calculator PFA** — impozit 10%, CAS 25%, CASS 10% în sistem real, plafoane 6/12/24/72 salarii minime (2026: salariu minim de referință 4.050 lei).
- **Checklist due diligence** — salvat local în browser, tipăribil.
- **Validări** — cifra de control CUI, IBAN (mod 97) cu banca emitentă.
- **Resurse oficiale** — ANAF, MFinanțe, ONRC, portal.just.ro, Monitorul Oficial, legislație.

## Publicare pe GitHub Pages
Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.

## Notă
Dacă ANAF blochează cererile directe din browser (CORS), site-ul afișează linkuri oficiale și permite lipirea manuală a răspunsului JSON al bilanțului.
Instrumentele au scop informativ și nu înlocuiesc opinia unui specialist.
