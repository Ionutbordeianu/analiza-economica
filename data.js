/* Date statice: câmpuri bilanț, parametri fiscali, checklist, resurse, coduri bănci */

window.FIN_FIELDS = [
  { grp: 'Activ' },
  { k: 'ai',   n: 'Active imobilizate' },
  { k: 'ac',   n: 'Active circulante — total' },
  { k: 'st',   n: '  din care: Stocuri' },
  { k: 'cr',   n: '  din care: Creanțe' },
  { k: 'cb',   n: '  din care: Casa și conturi la bănci' },
  { k: 'chav', n: 'Cheltuieli în avans' },
  { grp: 'Pasiv' },
  { k: 'dat',  n: 'Datorii — total' },
  { k: 'datc', n: 'Datorii curente (sub 1 an) — opțional' },
  { k: 'vav',  n: 'Venituri în avans' },
  { k: 'prov', n: 'Provizioane' },
  { k: 'cp',   n: 'Capitaluri proprii — total' },
  { k: 'cs',   n: 'Capital subscris vărsat' },
  { grp: 'Cont de profit și pierdere' },
  { k: 'ca',   n: 'Cifra de afaceri netă' },
  { k: 'vt',   n: 'Venituri totale' },
  { k: 'cht',  n: 'Cheltuieli totale' },
  { k: 'pb',   n: 'Profit brut' },
  { k: 'pib',  n: 'Pierdere brută' },
  { k: 'pn',   n: 'Profit net' },
  { k: 'pin',  n: 'Pierdere netă' },
  { k: 'sal',  n: 'Număr mediu de salariați' },
  { grp: 'Detalii din contul de profit și pierdere (F20) — se completează manual' },
  { k: 've',   n: 'Venituri din exploatare', m: 1 },
  { k: 'che',  n: 'Cheltuieli din exploatare', m: 1 },
  { k: 'chp',  n: '  din care: Cheltuieli cu personalul', m: 1 },
  { k: 'amo',  n: '  din care: Amortizări și ajustări', m: 1 },
  { k: 'vf',   n: 'Venituri financiare', m: 1 },
  { k: 'chf',  n: 'Cheltuieli financiare', m: 1 },
  { k: 'dob',  n: '  din care: Cheltuieli cu dobânzile', m: 1 }
];

/* potrivire denumiri indicatori ANAF -> chei (text fără diacritice, litere mici) */
window.ANAF_MAP = [
  [/^active imobilizate/, 'ai'], [/^active circulante/, 'ac'], [/^stocuri/, 'st'],
  [/^creante/, 'cr'], [/^casa si conturi/, 'cb'], [/^cheltuieli in avans/, 'chav'],
  [/^datorii/, 'dat'], [/^venituri in avans/, 'vav'], [/^provizioane/, 'prov'],
  [/^capitaluri/, 'cp'], [/^capital subscris/, 'cs'], [/^cifra de afaceri/, 'ca'],
  [/^venituri totale/, 'vt'], [/^cheltuieli totale/, 'cht'], [/^profit brut/, 'pb'],
  [/^pierdere bruta/, 'pib'], [/^profit net/, 'pn'], [/^pierdere neta/, 'pin'],
  [/numar mediu.*salariati/, 'sal']
];
/* rezervă: codurile standard pentru bilanțul societăților (nu bănci/asigurări) */
window.ANAF_CODES = { I1:'ai', I2:'ac', I3:'st', I4:'cr', I5:'cb', I6:'chav', I7:'dat', I8:'vav', I9:'prov',
  I10:'cp', I11:'cs', I13:'ca', I14:'vt', I15:'cht', I16:'pb', I17:'pib', I18:'pn', I19:'pin', I20:'sal' };



/* Parametri fiscali PFA (sistem real). smin = salariul minim brut în vigoare la 1 ianuarie. */
window.PFA_PARAMS = {
  2026: { smin: 4050, cassMax: 72, imp: 0.10, cas: 0.25, cass: 0.10 },
  2025: { smin: 4050, cassMax: 60, imp: 0.10, cas: 0.25, cass: 0.10 }
};

window.CHECKLIST = [
  { t: 'Identificare și situație juridică', items: [
    ['CUI valid și existent în Registrul contribuabililor ANAF', 'Cifra de control corectă; denumirea și adresa corespund documentelor primite.'],
    ['Starea la Registrul Comerțului (ONRC)', 'Funcțiune / suspendare / dizolvare / radiere; nr. de ordine J.'],
    ['Certificat constatator recent', 'Asociați, administratori, sedii secundare, coduri CAEN autorizate, puncte de lucru.'],
    ['Beneficiarul real declarat', 'Persoana fizică ce controlează efectiv entitatea; coerență cu structura acționariatului.'],
    ['Vechime și istoric de modificări', 'Schimbări dese de asociați, sediu sau denumire pot fi semnale de risc.'],
    ['Activitatea reală corespunde codului CAEN', 'Codul CAEN principal și cele autorizate la sediu / puncte de lucru.']
  ]},
  { t: 'Fiscal', items: [
    ['Nu figurează ca inactiv fiscal', 'Facturile de la un contribuabil inactiv nu dau drept de deducere a TVA și a cheltuielilor.'],
    ['Statutul de plătitor de TVA la data tranzacției', 'Inclusiv TVA la încasare și plata defalcată (split TVA).'],
    ['Înregistrat în Registrul RO e-Factura', 'Relevant pentru transmiterea facturilor B2B prin SPV.'],
    ['Cod de TVA intracomunitar valid (VIES)', 'Pentru livrări / achiziții intracomunitare.'],
    ['Datorii fiscale restante', 'ANAF publică lista debitorilor cu obligații restante; se poate cere certificat de atestare fiscală.'],
    ['Depunerea la timp a declarațiilor', 'Bilanț depus, declarații periodice; nedepunerea repetată duce la inactivare.']
  ]},
  { t: 'Financiar', items: [
    ['Bilanțul ultimilor 2–3 ani', 'Cifra de afaceri, rezultat, capitaluri proprii, datorii — vezi fila Analiză financiară.'],
    ['Capitaluri proprii pozitive', 'Activ net sub jumătate din capitalul subscris impune măsuri legale (Legea 31/1990).'],
    ['Lichiditate și solvabilitate acceptabile', 'Lichiditate curentă ≥ 1, solvabilitate generală ≥ 1,5.'],
    ['Durata de încasare a creanțelor', 'Peste 90 de zile indică probleme de încasare sau clienți riscanți.'],
    ['Coerența dintre salariați și cifra de afaceri', 'CA mare fără personal sau active poate indica lipsa substanței economice.'],
    ['Garanții, ipoteci, popriri', 'Arhiva Electronică de Garanții Reale Mobiliare (AEGRM), cartea funciară.']
  ]},
  { t: 'Litigii, insolvență, conformitate', items: [
    ['Dosare în instanță (portal.just.ro)', 'Căutare după denumire; atenție la litigii cu ANAF, salariați, furnizori.'],
    ['Buletinul Procedurilor de Insolvență (BPI)', 'Insolvență, reorganizare, faliment, concordat preventiv.'],
    ['Publicații în Monitorul Oficial', 'Hotărâri AGA, majorări / reduceri de capital, fuziuni, dizolvări.'],
    ['Liste de sancțiuni internaționale', 'Entitatea și beneficiarii reali nu figurează pe liste UE / ONU.'],
    ['Persoane expuse politic / spălarea banilor', 'Proceduri KYC conform Legii 129/2019, unde se aplică.']
  ]},
  { t: 'Operațional și contractual', items: [
    ['Sediul social există și corespunde activității', 'Adresă reală, nu doar sediu „de domiciliere” fără activitate.'],
    ['Autorizații și licențe specifice domeniului', 'ex. ANSVSA, ISU, ANRE, licențe de transport, avize de mediu.'],
    ['Persoana care semnează are drept de reprezentare', 'Administrator din certificatul constatator sau împuternicire valabilă.'],
    ['Cont bancar pe numele entității', 'IBAN-ul de pe factură aparține furnizorului (fila Validări).'],
    ['Referințe comerciale și prezență publică', 'Site, clienți, contracte publice (SICAP), recenzii.']
  ]},
  { t: 'Specific PFA / II / IF', items: [
    ['Înregistrare la ONRC ca PFA / II / IF', 'Sau, pentru profesii liberale, în registrul organismului profesional.'],
    ['Sistemul de impozitare', 'Sistem real sau normă de venit; plătitor sau neplătitor de TVA.'],
    ['Declarația Unică depusă', 'Estimarea pentru anul curent și definitivarea pentru anul anterior.'],
    ['Registrul de evidență fiscală și registrul jurnal', 'Ținute corect pentru sistemul real.'],
    ['Plafoanele CAS / CASS respectate', 'Contribuții calculate după salariul minim de la 1 ianuarie (fila Calculator PFA).']
  ]}
];

window.RESOURCES = [
  { t: 'ANAF și Ministerul Finanțelor', l: [
    ['Agenți economici — informații publice (MFinanțe)', 'https://mfinante.gov.ro/apps/agenticod.html?pagina=domenii', 'Date de identificare, bilanțuri publicate, obligații fiscale.'],
    ['Portalul ANAF', 'https://www.anaf.ro', 'Registrul TVA, contribuabili inactivi, debitori, SPV, e-Factura.'],
    ['Servicii web publice ANAF (documentație)', 'https://static.anaf.ro/static/10/Anaf/Informatii_R/Servicii_web/servicii_sincron.html', 'API-urile folosite de acest site: Registrul TVA v9, bilanțuri, RO e-Factura.'],
    ['VIES — validare cod TVA UE', 'https://ec.europa.eu/taxation_customs/vies/', 'Verificarea codurilor de TVA intracomunitare.']
  ]},
  { t: 'Registrul Comerțului și instanțe', l: [
    ['Oficiul Național al Registrului Comerțului', 'https://www.onrc.ro', 'Certificate constatatoare, BPI, informații RECOM.'],
    ['Date deschise ONRC (data.gov.ro)', 'https://data.gov.ro/organization/onrc', 'Seturi de date cu firmele înregistrate.'],
    ['Portalul instanțelor de judecată', 'https://portal.just.ro', 'Dosare și ședințe, căutare după numele părții.'],
    ['Monitorul Oficial', 'https://www.monitoruloficial.ro', 'Publicații ale societăților (Partea a IV-a).']
  ]},
  { t: 'Legislație', l: [
    ['Portal legislativ', 'https://legislatie.just.ro', 'Codul fiscal (Legea 227/2015), Codul de procedură fiscală (Legea 207/2015), Legea 31/1990, Legea contabilității 82/1991, OMFP 1802/2014.'],
    ['CECCAR', 'https://ceccar.ro', 'Corpul Experților Contabili și Contabililor Autorizați.'],
    ['CAFR — auditorii financiari', 'https://www.cafr.ro', 'Registrul auditorilor financiari.']
  ]},
  { t: 'Alte verificări', l: [
    ['Arhiva Electronică de Garanții Reale Mobiliare', 'https://www.aegrm.ro', 'Garanții, ipoteci mobiliare, popriri.'],
    ['SICAP — achiziții publice', 'https://www.e-licitatie.ro', 'Contracte cu autoritățile publice.'],
    ['Banca Națională a României', 'https://www.bnr.ro', 'Cursuri valutare, dobânda de referință, statistici.'],
    ['Harta sancțiunilor UE', 'https://www.sanctionsmap.eu', 'Măsuri restrictive ale Uniunii Europene.'],
    ['ONPCSB', 'https://www.onpcsb.ro', 'Prevenirea și combaterea spălării banilor.']
  ]}
];

window.RO_BANKS = {
  BTRL: 'Banca Transilvania', RNCB: 'BCR — Banca Comercială Română', BRDE: 'BRD — Groupe Société Générale',
  INGB: 'ING Bank', RZBR: 'Raiffeisen Bank', BACX: 'UniCredit Bank', CECE: 'CEC Bank', PIRB: 'First Bank',
  OTPV: 'OTP Bank', UGBI: 'Garanti BBVA', BREL: 'Libra Internet Bank', WBAN: 'Intesa Sanpaolo Bank',
  CARP: 'Patria Bank', EGNA: 'Vista Bank', FNNB: 'Credit Europe Bank', MIRO: 'ProCredit Bank',
  BUCU: 'Alpha Bank', EXIM: 'Exim Banca Românească', PORL: 'Porsche Bank', NBOR: 'Banca Națională a României',
  TREZ: 'Trezoreria Statului'
};
