-- ─── New Enums ────────────────────────────────────────────────────────────────

CREATE TYPE "RecurringInterval" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

CREATE TYPE "ExpenseCategory" AS ENUM ('UTILITIES', 'SALARIES', 'RENT', 'SUPPLIES', 'SERVICES', 'TAXES', 'OTHER');

CREATE TYPE "EFacturaStatus" AS ENUM ('PENDING', 'VALIDATED', 'ERROR');

-- ─── Extend AuditAction enum ──────────────────────────────────────────────────

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'VERIFY_EMAIL';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'UPDATE_SETTINGS';

-- ─── Company: add missing columns ─────────────────────────────────────────────

ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "city"    TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "county"  TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "vatRate" DECIMAL(5,2);

-- ─── User: add missing columns ────────────────────────────────────────────────

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone"                   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isEmailVerified"         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationToken"  TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationExpiry" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"                   ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_emailVerificationToken_key"  ON "User"("emailVerificationToken");

-- ─── InvoiceSeries ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "InvoiceSeries" (
    "id"         SERIAL NOT NULL,
    "companyId"  INTEGER NOT NULL,
    "name"       TEXT NOT NULL,
    "prefix"     TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "isDefault"  BOOLEAN NOT NULL DEFAULT false,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceSeries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceSeries_companyId_prefix_key" ON "InvoiceSeries"("companyId", "prefix");
CREATE INDEX        IF NOT EXISTS "InvoiceSeries_companyId_idx"         ON "InvoiceSeries"("companyId");

ALTER TABLE "InvoiceSeries" DROP CONSTRAINT IF EXISTS "InvoiceSeries_companyId_fkey";
ALTER TABLE "InvoiceSeries" ADD CONSTRAINT "InvoiceSeries_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── BankAccount ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "BankAccount" (
    "id"            SERIAL NOT NULL,
    "companyId"     INTEGER NOT NULL,
    "bankName"      TEXT NOT NULL,
    "iban"          TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "currency"      TEXT NOT NULL DEFAULT 'RON',
    "isDefault"     BOOLEAN NOT NULL DEFAULT false,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BankAccount_companyId_idx" ON "BankAccount"("companyId");

ALTER TABLE "BankAccount" DROP CONSTRAINT IF EXISTS "BankAccount_companyId_fkey";
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── RecurringInvoice ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "RecurringInvoice" (
    "id"           SERIAL NOT NULL,
    "companyId"    INTEGER NOT NULL,
    "clientId"     INTEGER NOT NULL,
    "templateName" TEXT NOT NULL,
    "series"       TEXT,
    "amount"       DECIMAL(14,2) NOT NULL,
    "currency"     TEXT NOT NULL DEFAULT 'RON',
    "notes"        TEXT,
    "interval"     "RecurringInterval" NOT NULL,
    "dayOfMonth"   INTEGER NOT NULL DEFAULT 1,
    "nextRunAt"    TIMESTAMP(3) NOT NULL,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurringInvoice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RecurringInvoice_companyId_idx" ON "RecurringInvoice"("companyId");
CREATE INDEX IF NOT EXISTS "RecurringInvoice_nextRunAt_idx"  ON "RecurringInvoice"("nextRunAt");

ALTER TABLE "RecurringInvoice" DROP CONSTRAINT IF EXISTS "RecurringInvoice_companyId_fkey";
ALTER TABLE "RecurringInvoice" ADD CONSTRAINT "RecurringInvoice_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecurringInvoice" DROP CONSTRAINT IF EXISTS "RecurringInvoice_clientId_fkey";
ALTER TABLE "RecurringInvoice" ADD CONSTRAINT "RecurringInvoice_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── EFacturaSubmission ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "EFacturaSubmission" (
    "id"          SERIAL NOT NULL,
    "companyId"   INTEGER NOT NULL,
    "invoiceId"   INTEGER NOT NULL,
    "executionId" TEXT,
    "messageId"   TEXT,
    "status"      "EFacturaStatus" NOT NULL DEFAULT 'PENDING',
    "xmlContent"  TEXT,
    "recipisa"    JSONB,
    "errorMsg"    TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    CONSTRAINT "EFacturaSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EFacturaSubmission_invoiceId_key"   ON "EFacturaSubmission"("invoiceId");
CREATE INDEX        IF NOT EXISTS "EFacturaSubmission_companyId_idx"   ON "EFacturaSubmission"("companyId");

ALTER TABLE "EFacturaSubmission" DROP CONSTRAINT IF EXISTS "EFacturaSubmission_companyId_fkey";
ALTER TABLE "EFacturaSubmission" ADD CONSTRAINT "EFacturaSubmission_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EFacturaSubmission" DROP CONSTRAINT IF EXISTS "EFacturaSubmission_invoiceId_fkey";
ALTER TABLE "EFacturaSubmission" ADD CONSTRAINT "EFacturaSubmission_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Expense ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Expense" (
    "id"          SERIAL NOT NULL,
    "companyId"   INTEGER NOT NULL,
    "category"    "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount"      DECIMAL(14,2) NOT NULL,
    "currency"    TEXT NOT NULL DEFAULT 'RON',
    "date"        TIMESTAMP(3) NOT NULL,
    "supplier"    TEXT,
    "reference"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Expense_companyId_idx" ON "Expense"("companyId");
CREATE INDEX IF NOT EXISTS "Expense_date_idx"      ON "Expense"("date");

ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_companyId_fkey";
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Mark migration as applied in Prisma's tracking table ────────────────────

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    gen_random_uuid()::text,
    'manual',
    NOW(),
    '20260425000000_schema_sync',
    NULL,
    NULL,
    NOW(),
    1
) ON CONFLICT DO NOTHING;
