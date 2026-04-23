import 'dotenv/config';
import {
  PrismaClient,
  InvoiceStatus,
  PaymentMethod,
  RiskLevel,
  ExpenseCategory,
  RecurringInterval,
  AuditAction,
  Channel,
  ReminderStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// ── 30 Romanian clients (first 10 use CUIs from ANAF demo seed) ─────────────
const CLIENT_DATA = [
  { name: 'DEDEMAN SRL',                      cui: '2816464',  email: 'achizitii@dedeman.ro',      phone: '+40 234 206 800', address: 'Str. Calea Romanului nr. 24, Bacau' },
  { name: 'EMAG INTERNET SRL',                cui: '2921185',  email: 'business@emag.ro',           phone: '+40 374 107 007', address: 'Str. Avionului nr. 8B, Sector 1, Bucuresti' },
  { name: 'AUTOMOBILE DACIA SA',              cui: '1463252',  email: 'furnizori@dacia.ro',         phone: '+40 248 501 100', address: 'Str. Uzinei nr. 1, Mioveni, Arges' },
  { name: 'OMV PETROM SA',                    cui: '1590082',  email: 'procurement@petrom.com',     phone: '+40 21 406 0000', address: 'Str. Coralilor nr. 22, Sector 1, Bucuresti' },
  { name: 'KAUFLAND ROMANIA SCS',             cui: '11279758', email: 'office@kaufland.ro',         phone: '+40 21 207 0000', address: 'Str. Barbu Vacarescu nr. 120, Bucuresti' },
  { name: 'BANCA COMERCIALA ROMANA SA',       cui: '361757',   email: 'vendors@bcr.ro',             phone: '+40 21 407 4200', address: 'Bd. Regina Elisabeta nr. 5, Sector 3, Bucuresti' },
  { name: 'ORANGE ROMANIA SA',                cui: '1639906',  email: 'b2b@orange.ro',              phone: '+40 21 203 5000', address: 'Str. Lascar Catargiu nr. 47-53, Bucuresti' },
  { name: 'VODAFONE ROMANIA SA',              cui: '9010105',  email: 'business@vodafone.ro',       phone: '+40 21 201 1200', address: 'Calea Dorobantilor nr. 239, Sector 1, Bucuresti' },
  { name: 'BRD GROUPE SOCIETE GENERALE SA',   cui: '361579',   email: 'achizitii@brd.ro',           phone: '+40 21 301 6100', address: 'Bd. Ion Mihalache nr. 1-7, Sector 1, Bucuresti' },
  { name: 'ALTEX ROMANIA SRL',                cui: '1596639',  email: 'procurement@altex.ro',       phone: '+40 21 201 2222', address: 'Str. Fabrica de Glucoza nr. 5, Bucuresti' },
  { name: 'CONSTRUCT PLUS SRL',               cui: '33451872', email: 'office@constructplus.ro',    phone: '0756 123 456',    address: 'Str. Industriilor nr. 14, Cluj-Napoca' },
  { name: 'AGRO TRANS SRL',                   cui: '24567891', email: 'agrotrans@gmail.com',        phone: '0744 987 654',    address: 'Str. Principala nr. 45, Brasov' },
  { name: 'IT SOLUTIONS GRUP SRL',            cui: '38901234', email: 'contact@itsolutions.ro',     phone: '0723 456 789',    address: 'Bd. Unirii nr. 23, Iasi' },
  { name: 'METAL EXPERT SA',                  cui: '12890456', email: 'office@metalexpert.ro',      phone: '0751 234 567',    address: 'Str. Metalurgiei nr. 7, Timisoara' },
  { name: 'FARM NATURA SRL',                  cui: '29834567', email: 'info@farmnatura.ro',         phone: '0765 678 901',    address: 'Str. Campului nr. 3, Craiova' },
  { name: 'LOGISTIC RAPID SRL',               cui: '41237890', email: 'logistic@rapid.ro',          phone: '0733 890 123',    address: 'Str. Transportatorilor nr. 18, Constanta' },
  { name: 'ENERGY SOLAR SRL',                 cui: '35678901', email: 'contact@energysolar.ro',     phone: '0712 345 678',    address: 'Str. Soarelui nr. 5, Cluj-Napoca' },
  { name: 'CLEAN SERVICES SRL',               cui: '28901234', email: 'office@cleanservices.ro',    phone: '0742 901 234',    address: 'Str. Curatenie nr. 10, Bucuresti' },
  { name: 'PRIM CONSULTING SRL',              cui: '37654321', email: 'consulting@prim.ro',         phone: '0761 543 210',    address: 'Bd. Eroilor nr. 30, Ploiesti' },
  { name: 'SMART TECH SRL',                   cui: '44123789', email: 'smart@tech.ro',              phone: '0754 321 987',    address: 'Str. Inovatiei nr. 2, Sibiu' },
  { name: 'TEXTIL FASHION SRL',               cui: '19876543', email: 'fashion@textil.ro',          phone: '0722 876 543',    address: 'Str. Fabricii nr. 20, Bacau' },
  { name: 'PRODUSE LEMN SRL',                 cui: '26543210', email: 'lemn@produse.ro',            phone: '0743 210 987',    address: 'Str. Forestiera nr. 8, Suceava' },
  { name: 'MED PHARMA SRL',                   cui: '32109876', email: 'pharma@med.ro',              phone: '0711 098 765',    address: 'Str. Sanatatii nr. 15, Galati' },
  { name: 'TURISM ACTIV SRL',                 cui: '21098765', email: 'turism@activ.ro',            phone: '0766 765 432',    address: 'Str. Turistilor nr. 6, Sinaia' },
  { name: 'AUTO PIESE SRL',                   cui: '27890123', email: 'piese@auto.ro',              phone: '0755 890 123',    address: 'Str. Mecanicilor nr. 4, Pitesti' },
  { name: 'GRAV CONSTRUCT SRL',               cui: '43210987', email: 'office@gravconstruct.ro',    phone: '0732 098 765',    address: 'Str. Constructorilor nr. 12, Oradea' },
  { name: 'DATA SYSTEMS SRL',                 cui: '36789012', email: 'data@systems.ro',            phone: '0753 789 012',    address: 'Str. Digitala nr. 9, Iasi' },
  { name: 'VERDE AGRO SRL',                   cui: '23456789', email: 'agro@verde.ro',              phone: '0744 456 789',    address: 'Str. Campurilor nr. 22, Buzau' },
  { name: 'IMPEX GLOBAL SRL',                 cui: '39012345', email: 'global@impex.ro',            phone: '0721 012 345',    address: 'Str. Comertului nr. 17, Tulcea' },
  { name: 'RETAIL STAR SRL',                  cui: '31234567', email: 'star@retail.ro',             phone: '0763 234 567',    address: 'Str. Comerciala nr. 33, Arad' },
];

const SERVICES = [
  'Servicii consultanta IT', 'Servicii mentenanta software', 'Licente software anuale',
  'Servicii contabilitate', 'Servicii audit financiar', 'Servicii curatenie spatii',
  'Servicii transport marfa', 'Furnizare materiale constructii', 'Servicii marketing digital',
  'Servicii proiectare arhitectura', 'Furnizare echipamente IT', 'Servicii training angajati',
  'Consultanta fiscala', 'Servicii juridice', 'Furnizare consumabile birou',
  'Servicii securitate paza', 'Servicii reparatii utilaje', 'Furnizare produse alimentare',
];

async function main() {
  console.log('🌱 Starting seed…');

  // ── Company ────────────────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {
      name: 'ACME SOLUTIONS SRL',
      cui: 'RO40123456',
      email: 'office@acmesolutions.ro',
      phone: '0721 000 001',
      address: 'Str. Victoriei nr. 10',
      city: 'Bucuresti',
      county: 'Ilfov',
      vatRate: 19,
    },
    create: {
      id: 1,
      name: 'ACME SOLUTIONS SRL',
      cui: 'RO40123456',
      email: 'office@acmesolutions.ro',
      phone: '0721 000 001',
      address: 'Str. Victoriei nr. 10',
      city: 'Bucuresti',
      county: 'Ilfov',
      vatRate: 19,
    },
  });
  console.log('✅ Company:', company.name);

  // ── Admin user ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin1234!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@acmesolutions.ro' },
    update: {},
    create: {
      companyId: 1,
      email: 'admin@acmesolutions.ro',
      passwordHash,
      fullName: 'Administrator ACME',
      phone: '0721 000 001',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
    },
  });
  console.log('✅ User:', user.email);

  // ── Invoice series ─────────────────────────────────────────────────────────
  await prisma.invoiceSeries.deleteMany({ where: { companyId: 1 } });
  const series = await prisma.invoiceSeries.createMany({
    data: [
      { companyId: 1, name: 'Serie Principala', prefix: 'FACT', nextNumber: 101, isDefault: true },
      { companyId: 1, name: 'Serie Servicii', prefix: 'SERV', nextNumber: 51, isDefault: false },
    ],
  });
  console.log('✅ Invoice series created');

  // ── Bank accounts ──────────────────────────────────────────────────────────
  await prisma.bankAccount.deleteMany({ where: { companyId: 1 } });
  await prisma.bankAccount.createMany({
    data: [
      { companyId: 1, bankName: 'Banca Transilvania',     iban: 'RO49BTRLRONCRT0123456789', accountHolder: 'ACME SOLUTIONS SRL', currency: 'RON', isDefault: true },
      { companyId: 1, bankName: 'BRD Groupe Societe Generale', iban: 'RO66BRDE450SV98765432100', accountHolder: 'ACME SOLUTIONS SRL', currency: 'RON', isDefault: false },
    ],
  });
  console.log('✅ Bank accounts created');

  // ── Reminder rules ─────────────────────────────────────────────────────────
  await prisma.reminderRule.deleteMany({ where: { companyId: 1 } });
  const [rule1, rule2, rule3] = await Promise.all([
    prisma.reminderRule.create({ data: { companyId: 1, name: 'Reamintire 7 zile inainte', daysOffset: -7,  channel: 'EMAIL', templateCode: 'pre_due',    isActive: true } }),
    prisma.reminderRule.create({ data: { companyId: 1, name: 'Notificare scadenta',        daysOffset: 0,   channel: 'EMAIL', templateCode: 'due_today',  isActive: true } }),
    prisma.reminderRule.create({ data: { companyId: 1, name: 'Somatie 30 zile intarziere', daysOffset: 30,  channel: 'EMAIL', templateCode: 'overdue_30', isActive: true } }),
  ]);
  console.log('✅ Reminder rules created');

  // ── Clients ────────────────────────────────────────────────────────────────
  await prisma.client.deleteMany({ where: { companyId: 1 } });
  const clients = await Promise.all(
    CLIENT_DATA.map((c) =>
      prisma.client.create({
        data: { companyId: 1, name: c.name, cui: c.cui, email: c.email, phone: c.phone, address: c.address },
      }),
    ),
  );
  console.log(`✅ ${clients.length} clients created`);

  // ── Invoices + Payments ────────────────────────────────────────────────────
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({ where: { companyId: 1 } });

  // Scenario profiles per client index
  const scenarios: Array<{ status: InvoiceStatus; issuedDaysAgo: number; dueDaysOffset: number; partialPct?: number }[]> = [
    // 0 DEDEMAN — large, reliable payer
    [
      { status: 'PAID',    issuedDaysAgo: 120, dueDaysOffset: 30 },
      { status: 'PAID',    issuedDaysAgo: 90,  dueDaysOffset: 30 },
      { status: 'OPEN',    issuedDaysAgo: 15,  dueDaysOffset: 15 },
    ],
    // 1 EMAG — good payer, one partial
    [
      { status: 'PAID',    issuedDaysAgo: 100, dueDaysOffset: 30 },
      { status: 'PARTIAL', issuedDaysAgo: 45,  dueDaysOffset: 30, partialPct: 60 },
      { status: 'OPEN',    issuedDaysAgo: 10,  dueDaysOffset: 20 },
    ],
    // 2 DACIA — mixed
    [
      { status: 'PAID',    issuedDaysAgo: 150, dueDaysOffset: 45 },
      { status: 'PAID',    issuedDaysAgo: 80,  dueDaysOffset: 30 },
      { status: 'OPEN',    issuedDaysAgo: 50,  dueDaysOffset: -20 },
      { status: 'OPEN',    issuedDaysAgo: 5,   dueDaysOffset: 25 },
    ],
    // 3 PETROM — overdue
    [
      { status: 'PAID',    issuedDaysAgo: 200, dueDaysOffset: 30 },
      { status: 'OPEN',    issuedDaysAgo: 70,  dueDaysOffset: -40 },
      { status: 'OPEN',    issuedDaysAgo: 20,  dueDaysOffset: 10 },
    ],
    // 4 KAUFLAND — reliable
    [
      { status: 'PAID',    issuedDaysAgo: 180, dueDaysOffset: 30 },
      { status: 'PAID',    issuedDaysAgo: 90,  dueDaysOffset: 30 },
      { status: 'PAID',    issuedDaysAgo: 30,  dueDaysOffset: 30 },
    ],
    // 5 BCR — large amounts, partial
    [
      { status: 'PAID',    issuedDaysAgo: 110, dueDaysOffset: 30 },
      { status: 'PARTIAL', issuedDaysAgo: 60,  dueDaysOffset: 30, partialPct: 40 },
      { status: 'OPEN',    issuedDaysAgo: 8,   dueDaysOffset: 22 },
    ],
    // 6 ORANGE — on time
    [
      { status: 'PAID',    issuedDaysAgo: 95,  dueDaysOffset: 30 },
      { status: 'PAID',    issuedDaysAgo: 50,  dueDaysOffset: 30 },
      { status: 'OPEN',    issuedDaysAgo: 12,  dueDaysOffset: 18 },
    ],
    // 7 VODAFONE — canceled + overdue
    [
      { status: 'PAID',    issuedDaysAgo: 130, dueDaysOffset: 30 },
      { status: 'CANCELED',issuedDaysAgo: 85,  dueDaysOffset: 30 },
      { status: 'OPEN',    issuedDaysAgo: 55,  dueDaysOffset: -25 },
    ],
    // 8 BRD — reliable
    [
      { status: 'PAID',    issuedDaysAgo: 160, dueDaysOffset: 30 },
      { status: 'PAID',    issuedDaysAgo: 70,  dueDaysOffset: 30 },
      { status: 'OPEN',    issuedDaysAgo: 20,  dueDaysOffset: 10 },
    ],
    // 9 ALTEX — partial + open
    [
      { status: 'PAID',    issuedDaysAgo: 140, dueDaysOffset: 30 },
      { status: 'PARTIAL', issuedDaysAgo: 75,  dueDaysOffset: 30, partialPct: 75 },
      { status: 'OPEN',    issuedDaysAgo: 40,  dueDaysOffset: -10 },
    ],
    // 10-29: generate 2-3 invoices per remaining client
    ...Array.from({ length: 20 }, (_, i) => {
      const patterns: Array<{ status: InvoiceStatus; issuedDaysAgo: number; dueDaysOffset: number; partialPct?: number }[]> = [
        [
          { status: 'PAID',    issuedDaysAgo: 100 + i * 3, dueDaysOffset: 30 },
          { status: 'OPEN',    issuedDaysAgo: 20,           dueDaysOffset: 10 },
        ],
        [
          { status: 'PAID',    issuedDaysAgo: 90 + i * 2,  dueDaysOffset: 30 },
          { status: 'PARTIAL', issuedDaysAgo: 50,           dueDaysOffset: 30, partialPct: 50 },
          { status: 'OPEN',    issuedDaysAgo: 10,           dueDaysOffset: 20 },
        ],
        [
          { status: 'PAID',    issuedDaysAgo: 120 + i,      dueDaysOffset: 30 },
          { status: 'OPEN',    issuedDaysAgo: 60,            dueDaysOffset: -15 },
          { status: 'OPEN',    issuedDaysAgo: 5,             dueDaysOffset: 25 },
        ],
      ];
      return patterns[i % patterns.length];
    }),
  ];

  let invoiceCounter = 100;
  const allInvoices: { id: number; clientId: number; status: InvoiceStatus; totalAmount: number }[] = [];

  for (let ci = 0; ci < clients.length; ci++) {
    const client = clients[ci];
    const clientScenarios = scenarios[ci] ?? scenarios[ci % 10];

    for (const sc of clientScenarios) {
      invoiceCounter++;
      const issueDate = daysAgo(sc.issuedDaysAgo);
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + sc.dueDaysOffset);

      const amount = rand(2000, 85000);
      const prefix = invoiceCounter % 3 === 0 ? 'SERV' : 'FACT';

      const invoice = await prisma.invoice.create({
        data: {
          companyId: 1,
          clientId: client.id,
          series: prefix,
          number: String(invoiceCounter),
          issueDate,
          dueDate,
          currency: 'RON',
          totalAmount: amount,
          status: sc.status,
          notes: pick(SERVICES),
        },
      });

      allInvoices.push({ id: invoice.id, clientId: client.id, status: sc.status, totalAmount: amount });

      // Payments
      if (sc.status === 'PAID') {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount,
            paidAt: new Date(dueDate.getTime() - rand(1, 5) * 86_400_000),
            method: pick<PaymentMethod>(['BANK', 'BANK', 'BANK', 'CARD', 'CASH']),
            reference: `OP-${invoiceCounter}-${Math.floor(Math.random() * 9000 + 1000)}`,
          },
        });
      } else if (sc.status === 'PARTIAL' && sc.partialPct) {
        const paid = Math.round(amount * (sc.partialPct / 100) * 100) / 100;
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: paid,
            paidAt: new Date(dueDate.getTime() - rand(1, 10) * 86_400_000),
            method: 'BANK',
            reference: `OP-${invoiceCounter}-PART`,
          },
        });
      }
    }
  }
  console.log(`✅ ${invoiceCounter - 100} invoices created with payments`);

  // ── Expenses ───────────────────────────────────────────────────────────────
  await prisma.expense.deleteMany({ where: { companyId: 1 } });
  const expenseData: Array<{ category: ExpenseCategory; description: string; amount: number; supplier: string; daysAgoN: number }> = [
    { category: 'RENT',      description: 'Chirie spatiu birouri mai 2026',       amount: 4500,   supplier: 'IMOBILIARE PREMIUM SRL',   daysAgoN: 5  },
    { category: 'RENT',      description: 'Chirie spatiu birouri apr 2026',        amount: 4500,   supplier: 'IMOBILIARE PREMIUM SRL',   daysAgoN: 35 },
    { category: 'RENT',      description: 'Chirie spatiu birouri mar 2026',        amount: 4500,   supplier: 'IMOBILIARE PREMIUM SRL',   daysAgoN: 65 },
    { category: 'SALARIES',  description: 'Salarii personal mai 2026',             amount: 32000,  supplier: 'Intern',                   daysAgoN: 3  },
    { category: 'SALARIES',  description: 'Salarii personal apr 2026',             amount: 31500,  supplier: 'Intern',                   daysAgoN: 33 },
    { category: 'SALARIES',  description: 'Salarii personal mar 2026',             amount: 31500,  supplier: 'Intern',                   daysAgoN: 63 },
    { category: 'UTILITIES', description: 'Factura energie electrica apr 2026',    amount: 1200,   supplier: 'ENGIE ROMANIA SA',         daysAgoN: 20 },
    { category: 'UTILITIES', description: 'Factura internet apr 2026',             amount: 350,    supplier: 'RCS & RDS SA',             daysAgoN: 22 },
    { category: 'UTILITIES', description: 'Factura telefonie mobile mar 2026',     amount: 890,    supplier: 'ORANGE ROMANIA SA',        daysAgoN: 55 },
    { category: 'SUPPLIES',  description: 'Consumabile imprimanta si birotica',    amount: 680,    supplier: 'OFFICE DEPOT SRL',         daysAgoN: 40 },
    { category: 'SUPPLIES',  description: 'Echipamente IT – laptop Dell',          amount: 7200,   supplier: 'ALTEX ROMANIA SRL',        daysAgoN: 80 },
    { category: 'SERVICES',  description: 'Servicii contabilitate Q1 2026',        amount: 2400,   supplier: 'EXPERT CONT SRL',          daysAgoN: 30 },
    { category: 'SERVICES',  description: 'Abonament software ERP anual',          amount: 3600,   supplier: 'SAP ROMANIA SRL',          daysAgoN: 90 },
    { category: 'SERVICES',  description: 'Servicii curatenie birouri feb 2026',   amount: 850,    supplier: 'CLEAN SERVICES SRL',       daysAgoN: 75 },
    { category: 'TAXES',     description: 'Impozit pe profit trim I 2026',         amount: 8500,   supplier: 'ANAF',                     daysAgoN: 28 },
    { category: 'TAXES',     description: 'TVA de plata mar 2026',                 amount: 12300,  supplier: 'ANAF',                     daysAgoN: 50 },
    { category: 'OTHER',     description: 'Protocol si reprezentare client',        amount: 1100,   supplier: 'RESTAURANT CARU CU BERE', daysAgoN: 15 },
    { category: 'OTHER',     description: 'Asigurare raspundere civila 2026',      amount: 3200,   supplier: 'ALLIANZ TIRIAC SRL',       daysAgoN: 120 },
  ];
  await prisma.expense.createMany({
    data: expenseData.map((e) => ({
      companyId: 1,
      category: e.category,
      description: e.description,
      amount: e.amount,
      currency: 'RON',
      date: daysAgo(e.daysAgoN),
      supplier: e.supplier,
      reference: `REF-${Math.floor(Math.random() * 90000 + 10000)}`,
    })),
  });
  console.log(`✅ ${expenseData.length} expenses created`);

  // ── Recurring invoices ─────────────────────────────────────────────────────
  await prisma.recurringInvoice.deleteMany({ where: { companyId: 1 } });
  const recurringData = [
    { clientIdx: 0,  name: 'Mentenanta lunara DEDEMAN',    amount: 5500,  interval: 'MONTHLY'   as RecurringInterval, day: 1  },
    { clientIdx: 2,  name: 'Audit trimestrial DACIA',       amount: 12000, interval: 'QUARTERLY' as RecurringInterval, day: 15 },
    { clientIdx: 4,  name: 'Licente software KAUFLAND',     amount: 3200,  interval: 'YEARLY'    as RecurringInterval, day: 1  },
    { clientIdx: 6,  name: 'Consultanta IT ORANGE',         amount: 8000,  interval: 'MONTHLY'   as RecurringInterval, day: 5  },
    { clientIdx: 10, name: 'Servicii lunare CONSTRUCT+',    amount: 4200,  interval: 'MONTHLY'   as RecurringInterval, day: 10 },
  ];
  await prisma.recurringInvoice.createMany({
    data: recurringData.map((r) => ({
      companyId: 1,
      clientId: clients[r.clientIdx].id,
      templateName: r.name,
      series: 'FACT',
      amount: r.amount,
      currency: 'RON',
      interval: r.interval,
      dayOfMonth: r.day,
      nextRunAt: daysFromNow(r.day),
      isActive: true,
    })),
  });
  console.log(`✅ ${recurringData.length} recurring invoices created`);

  // ── AI scores ──────────────────────────────────────────────────────────────
  await prisma.aIClientScore.deleteMany({ where: { companyId: 1 } });
  const aiProfiles: Array<{ trustScore: number; riskLevel: RiskLevel; lateProb: number }> = [
    { trustScore: 92, riskLevel: 'LOW',    lateProb: 0.04 },
    { trustScore: 88, riskLevel: 'LOW',    lateProb: 0.08 },
    { trustScore: 74, riskLevel: 'MEDIUM', lateProb: 0.22 },
    { trustScore: 45, riskLevel: 'HIGH',   lateProb: 0.61 },
    { trustScore: 95, riskLevel: 'LOW',    lateProb: 0.02 },
    { trustScore: 79, riskLevel: 'MEDIUM', lateProb: 0.18 },
    { trustScore: 90, riskLevel: 'LOW',    lateProb: 0.05 },
    { trustScore: 55, riskLevel: 'HIGH',   lateProb: 0.48 },
    { trustScore: 93, riskLevel: 'LOW',    lateProb: 0.03 },
    { trustScore: 72, riskLevel: 'MEDIUM', lateProb: 0.25 },
  ];
  await prisma.aIClientScore.createMany({
    data: clients.map((c, i) => {
      const profile = aiProfiles[i % aiProfiles.length];
      return {
        companyId: 1,
        clientId: c.id,
        trustScore: profile.trustScore + Math.floor(Math.random() * 6 - 3),
        riskLevel: profile.riskLevel,
        lateProb: profile.lateProb,
        modelVersion: 'v1.0',
        calculatedAt: daysAgo(Math.floor(Math.random() * 14)),
      };
    }),
  });
  console.log(`✅ AI scores created for ${clients.length} clients`);

  // ── Reminders ──────────────────────────────────────────────────────────────
  await prisma.reminder.deleteMany({});
  const overdueInvoices = allInvoices.filter(
    (inv) => inv.status === 'OPEN' || inv.status === 'PARTIAL',
  ).slice(0, 12);
  for (const inv of overdueInvoices) {
    const client = clients.find((c) => c.id === inv.clientId)!;
    if (!client?.email) continue;
    await prisma.reminder.create({
      data: {
        invoiceId: inv.id,
        ruleId: pick([rule1.id, rule2.id, rule3.id]),
        channel: 'EMAIL',
        recipient: client.email,
        status: pick<ReminderStatus>(['SENT', 'SENT', 'SENT', 'FAILED']),
        sentAt: daysAgo(Math.floor(Math.random() * 20)),
      },
    });
  }
  console.log('✅ Reminders created');

  // ── Audit logs ─────────────────────────────────────────────────────────────
  await prisma.auditLog.deleteMany({ where: { companyId: 1 } });
  const auditEntries: AuditAction[] = [
    'LOGIN', 'CREATE_CLIENT', 'CREATE_INVOICE', 'ADD_PAYMENT',
    'CREATE_CLIENT', 'CREATE_INVOICE', 'SEND_REMINDER', 'CALCULATE_AI_SCORE',
    'CREATE_INVOICE', 'ADD_PAYMENT', 'UPDATE_CLIENT', 'CANCEL_INVOICE',
    'LOGIN', 'UPDATE_SETTINGS', 'GENERATE_NOTICE', 'SEND_REMINDER',
  ];
  await prisma.auditLog.createMany({
    data: auditEntries.map((action, i) => ({
      companyId: 1,
      userId: user.id,
      action,
      entityType: action.includes('CLIENT') ? 'Client' : action.includes('INVOICE') ? 'Invoice' : action.includes('PAYMENT') ? 'Payment' : null,
      entityId: Math.floor(Math.random() * 30) + 1,
      success: Math.random() > 0.05,
      ipAddress: '192.168.1.' + (i + 1),
      createdAt: daysAgo(Math.floor(Math.random() * 60)),
    })),
  });
  console.log('✅ Audit logs created');

  console.log('\n🎉 Seed complete!');
  console.log('   Login: admin@acmesolutions.ro / Admin1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
