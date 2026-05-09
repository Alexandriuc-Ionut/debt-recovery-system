-- CreateTable
CREATE TABLE "ClientSnapshot" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "cui" TEXT NOT NULL,
    "anafName" TEXT,
    "vatPayer" BOOLEAN NOT NULL DEFAULT false,
    "isInactive" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnrcAlert" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "clientName" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnrcAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientSnapshot_clientId_key" ON "ClientSnapshot"("clientId");

-- CreateIndex
CREATE INDEX "ClientSnapshot_companyId_idx" ON "ClientSnapshot"("companyId");

-- CreateIndex
CREATE INDEX "OnrcAlert_companyId_idx" ON "OnrcAlert"("companyId");

-- CreateIndex
CREATE INDEX "OnrcAlert_isRead_idx" ON "OnrcAlert"("isRead");

-- AddForeignKey
ALTER TABLE "ClientSnapshot" ADD CONSTRAINT "ClientSnapshot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSnapshot" ADD CONSTRAINT "ClientSnapshot_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnrcAlert" ADD CONSTRAINT "OnrcAlert_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnrcAlert" ADD CONSTRAINT "OnrcAlert_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
