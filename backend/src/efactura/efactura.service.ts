import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EFacturaStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/* ─── UBL 2.1 / CIUS-RO XML Generator ─────────────────────────────────────── */
function generateUblXml(params: {
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  currency: string;
  totalAmount: number;
  vatRate: number;
  sellerName: string;
  sellerCui: string;
  sellerAddress: string;
  buyerName: string;
  buyerCui: string;
  buyerAddress: string;
}): string {
  const vatAmount = +(
    (params.totalAmount * params.vatRate) /
    (100 + params.vatRate)
  ).toFixed(2);
  const taxableAmount = +(params.totalAmount - vatAmount).toFixed(2);
  const vatPercent = +params.vatRate.toFixed(2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">

  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${params.invoiceNumber}</cbc:ID>
  <cbc:IssueDate>${params.issueDate}</cbc:IssueDate>
  <cbc:DueDate>${params.dueDate}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${params.currency}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${params.currency}</cbc:TaxCurrencyCode>

  <!-- Seller -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${params.sellerName}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${params.sellerAddress}</cbc:StreetName>
        <cac:Country>
          <cbc:IdentificationCode>RO</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>RO${params.sellerCui}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${params.sellerName}</cbc:RegistrationName>
        <cbc:CompanyID>${params.sellerCui}</cbc:CompanyID>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Buyer -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${params.buyerName}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${params.buyerAddress}</cbc:StreetName>
        <cac:Country>
          <cbc:IdentificationCode>RO</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>RO${params.buyerCui}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${params.buyerName}</cbc:RegistrationName>
        <cbc:CompanyID>${params.buyerCui}</cbc:CompanyID>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- VAT breakdown -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${params.currency}">${vatAmount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${params.currency}">${taxableAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${params.currency}">${vatAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${vatPercent}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <!-- Totals -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${params.currency}">${taxableAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${params.currency}">${taxableAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${params.currency}">${params.totalAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${params.currency}">${params.totalAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <!-- Invoice line -->
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${params.currency}">${taxableAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Servicii conform contract</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${vatPercent}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${params.currency}">${taxableAmount.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>

</Invoice>`;
}

/* ─── Mock ANAF helpers ────────────────────────────────────────────────────── */
function isMockMode(): boolean {
  return process.env.EFACTURA_MOCK === 'true';
}

function fakeMockSubmit(): { executionId: string } {
  const executionId = String(
    Math.floor(10_000_000 + Math.random() * 89_999_999),
  );
  return { executionId };
}

function fakeMockPoll(executionId: string): {
  status: EFacturaStatus;
  messageId: string;
  recipisa: object;
} {
  const messageId = String(Math.floor(1_000_000 + Math.random() * 8_999_999));
  return {
    status: EFacturaStatus.VALIDATED,
    messageId,
    recipisa: {
      id_incarcare: executionId,
      id_descarcare: messageId,
      stare: 'ok',
      tip: 'FACTURA TRIMISA',
      data_creare: new Date().toISOString(),
      mesaje: [{ tip: 'SUCCES', mesaj: 'Factura validata cu succes' }],
    },
  };
}

/* ─── ANAF real API helpers (Sandbox) ─────────────────────────────────────── */
async function anafSubmit(
  xml: string,
  sellerCui: string,
): Promise<{ executionId: string }> {
  // In production: get OAuth2 token from SPV digital certificate first.
  // For Sandbox: use pre-configured token from env (EFACTURA_ANAF_TOKEN).
  const token = process.env.EFACTURA_ANAF_TOKEN ?? '';
  const url = `https://api.anaf.ro/test/EINVOICE/upload?standard=UBL&cif=${sellerCui}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/xml',
    },
    body: xml,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`ANAF upload failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    ExecutionId?: string;
    index_incarcare?: number;
  };
  const executionId = String(data.ExecutionId ?? data.index_incarcare ?? '');
  if (!executionId) throw new Error('ANAF did not return an execution ID');
  return { executionId };
}

async function anafPoll(executionId: string): Promise<{
  status: EFacturaStatus;
  messageId: string;
  recipisa: object;
} | null> {
  const token = process.env.EFACTURA_ANAF_TOKEN ?? '';
  const url = `https://api.anaf.ro/test/EINVOICE/stareMesaj?id_incarcare=${executionId}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    stare?: string;
    id_descarcare?: string;
    Errors?: { errorMessage: string }[];
  };

  if (!data.stare) return null;
  const stare = data.stare.toLowerCase();

  if (stare === 'ok') {
    return {
      status: EFacturaStatus.VALIDATED,
      messageId: data.id_descarcare ?? '',
      recipisa: data,
    };
  }
  if (stare === 'nok' || stare === 'eroare') {
    return {
      status: EFacturaStatus.ERROR,
      messageId: '',
      recipisa: data,
    };
  }
  return null; // still processing
}

/* ─── Service ──────────────────────────────────────────────────────────────── */
@Injectable()
export class EFacturaService {
  constructor(private prisma: PrismaService) {}

  /* List all submissions for a company */
  findAll(companyId: number) {
    return this.prisma.eFacturaSubmission.findMany({
      where: { companyId },
      include: {
        invoice: { include: { client: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /* List invoices that have NOT been submitted yet */
  async findEligible(companyId: number) {
    const submitted = await this.prisma.eFacturaSubmission.findMany({
      where: { companyId },
      select: { invoiceId: true },
    });
    const submittedIds = submitted.map((s) => s.invoiceId);

    return this.prisma.invoice.findMany({
      where: {
        companyId,
        id: { notIn: submittedIds.length ? submittedIds : [-1] },
      },
      include: { client: true },
      orderBy: { issueDate: 'desc' },
    });
  }

  /* Submit an invoice to ANAF (or mock) */
  async submit(invoiceId: number, companyId: number) {
    // Guard: already submitted?
    const existing = await this.prisma.eFacturaSubmission.findUnique({
      where: { invoiceId },
    });
    if (existing) {
      throw new BadRequestException('Invoice already submitted to ANAF');
    }

    // Load invoice + company details
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: { client: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    const vatRate = company.vatRate ? Number(company.vatRate) : 19;
    const invoiceNumber = invoice.series
      ? `${invoice.series}-${invoice.number}`
      : invoice.number;

    // Generate UBL 2.1 XML
    const xml = generateUblXml({
      invoiceNumber,
      issueDate: invoice.issueDate.toISOString().slice(0, 10),
      dueDate: invoice.dueDate.toISOString().slice(0, 10),
      currency: invoice.currency,
      totalAmount: Number(invoice.totalAmount),
      vatRate,
      sellerName: company.name,
      sellerCui: company.cui ?? '0000000',
      sellerAddress: company.address ?? 'Romania',
      buyerName: invoice.client.name,
      buyerCui: invoice.client.cui ?? '0000000',
      buyerAddress: invoice.client.address ?? 'Romania',
    });

    // Submit to ANAF (mock or real)
    let executionId: string;
    try {
      if (isMockMode()) {
        executionId = fakeMockSubmit().executionId;
      } else {
        const result = await anafSubmit(xml, company.cui ?? '');
        executionId = result.executionId;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ANAF submission failed';
      // Save as ERROR so the user can see what happened
      return this.prisma.eFacturaSubmission.create({
        data: {
          companyId,
          invoiceId,
          status: EFacturaStatus.ERROR,
          xmlContent: xml,
          errorMsg: msg,
        },
      });
    }

    return this.prisma.eFacturaSubmission.create({
      data: {
        companyId,
        invoiceId,
        executionId,
        status: EFacturaStatus.PENDING,
        xmlContent: xml,
      },
    });
  }

  /* Poll ANAF for the processing result */
  async poll(submissionId: number, companyId: number) {
    const submission = await this.prisma.eFacturaSubmission.findFirst({
      where: { id: submissionId, companyId },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.status !== EFacturaStatus.PENDING) return submission;
    if (!submission.executionId)
      throw new BadRequestException('No execution ID to poll');

    let result: {
      status: EFacturaStatus;
      messageId: string;
      recipisa: object;
    } | null;

    if (isMockMode()) {
      result = fakeMockPoll(submission.executionId);
    } else {
      result = await anafPoll(submission.executionId);
    }

    if (!result) return submission; // still processing

    return this.prisma.eFacturaSubmission.update({
      where: { id: submissionId },
      data: {
        status: result.status,
        messageId: result.messageId || null,
        recipisa: result.recipisa,
        processedAt: new Date(),
        errorMsg:
          result.status === EFacturaStatus.ERROR
            ? JSON.stringify(result.recipisa)
            : null,
      },
    });
  }

  /* Get raw XML for download */
  async getXml(submissionId: number, companyId: number): Promise<string> {
    const sub = await this.prisma.eFacturaSubmission.findFirst({
      where: { id: submissionId, companyId },
    });
    if (!sub) throw new NotFoundException('Submission not found');
    if (!sub.xmlContent) throw new BadRequestException('No XML available');
    return sub.xmlContent;
  }
}
