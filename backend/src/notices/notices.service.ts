import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

// PDFKit built-in fonts only cover WinAnsi (no ș/ț), so transliterate.
function ro(text: string): string {
  return text
    .replace(/[ăâ]/g, 'a').replace(/[ĂÂ]/g, 'A')
    .replace(/î/g, 'i').replace(/Î/g, 'I')
    .replace(/[șş]/g, 's').replace(/[ȘŞ]/g, 'S')
    .replace(/[țţ]/g, 't').replace(/[ȚŢ]/g, 'T');
}

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async generateSomatie(invoiceId: number, companyId: number, lang: 'ro' | 'en' = 'ro'): Promise<Buffer> {
    const isEn = lang === 'en';
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        client: true,
        payments: true,
        company: true,
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const totalAmount = Number(invoice.totalAmount);
    const paidAmount = invoice.payments.reduce(
      (s, p) => s + Number(p.amount),
      0,
    );
    const remainingAmount = totalAmount - paidAmount;
    const daysOverdue = Math.floor(
      (Date.now() - new Date(invoice.dueDate).getTime()) / 86_400_000,
    );

    const locale = isEn ? 'en-GB' : 'ro-RO';
    const dueStr = new Date(invoice.dueDate).toLocaleDateString(locale);
    const todayStr = new Date().toLocaleDateString(locale);
    const invoiceRef = invoice.series
      ? `${invoice.series}-${invoice.number}`
      : invoice.number;

    // Record in DB
    await this.prisma.paymentNotice.create({
      data: {
        invoiceId: invoice.id,
        noticeType: 'SOMATIE',
      },
    });

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 60,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const company = { ...invoice.company, name: ro(invoice.company.name), address: invoice.company.address ? ro(invoice.company.address) : invoice.company.address };
      const client = { ...invoice.client, name: ro(invoice.client.name), address: invoice.client.address ? ro(invoice.client.address) : invoice.client.address };

      // ── Header ──────────────────────────────────────────────────────
      doc
        .fontSize(9)
        .fillColor('#64748b')
        .font('Helvetica')
        .text(
          `${company.name}${company.cui ? ' | CUI: ' + company.cui : ''}${company.address ? ' | ' + company.address : ''}`,
          { align: 'right' },
        )
        .moveDown(0.3);

      doc
        .moveTo(60, doc.y)
        .lineTo(535, doc.y)
        .strokeColor('#e2e8f0')
        .stroke()
        .moveDown(1);

      // ── Title ───────────────────────────────────────────────────────
      doc
        .fontSize(20)
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .text(isEn ? 'PAYMENT DEMAND NOTICE' : ro('SOMAȚIE DE PLATĂ'), { align: 'center' })
        .moveDown(0.3);

      doc
        .fontSize(10)
        .fillColor('#64748b')
        .font('Helvetica')
        .text(
          isEn
            ? `No. ${invoiceRef} — Date: ${todayStr}`
            : `Nr. ${invoiceRef} — Data: ${todayStr}`,
          { align: 'center' },
        )
        .moveDown(1.5);

      // ── Parties ─────────────────────────────────────────────────────
      const colW = 210;
      const startY = doc.y;
      const col2X = 60 + colW + 30;

      // Creditor box
      doc
        .fontSize(8)
        .fillColor('#94a3b8')
        .font('Helvetica-Bold')
        .text(isEn ? 'CREDITOR' : 'CREDITOR', 60, startY, { width: colW });
      doc
        .fontSize(10)
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .text(company.name, 60, startY + 14, { width: colW });
      doc
        .fontSize(9)
        .fillColor('#475569')
        .font('Helvetica')
        .text(
          [company.cui ? `CUI: ${company.cui}` : '', company.address ?? '']
            .filter(Boolean)
            .join('\n'),
          60,
          startY + 28,
          { width: colW },
        );

      // Debtor box
      doc
        .fontSize(8)
        .fillColor('#94a3b8')
        .font('Helvetica-Bold')
        .text(isEn ? 'DEBTOR' : 'DEBITOR', col2X, startY, { width: colW });
      doc
        .fontSize(10)
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .text(client.name, col2X, startY + 14, { width: colW });
      doc
        .fontSize(9)
        .fillColor('#475569')
        .font('Helvetica')
        .text(
          [
            client.cui ? `CUI: ${client.cui}` : '',
            client.address ?? '',
            client.email ?? '',
          ]
            .filter(Boolean)
            .join('\n'),
          col2X,
          startY + 28,
          { width: colW },
        );

      // After absolute-positioned columns, manually advance Y past both columns
      // (estimate: label+name+3 lines of details ≈ 70pt)
      doc.y = startY + 72;

      // ── Divider ─────────────────────────────────────────────────────
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#e2e8f0').stroke();
      doc.y += 14;

      // ── Body text ───────────────────────────────────────────────────
      const bodyText = isEn
        ? `By means of this notice, ${company.name} hereby demands that debtor ${client.name} pay the outstanding amount ` +
          `for invoice no. ${invoiceRef}, with payment due ${dueStr}, now overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}.`
        : ro(`Prin prezenta, ${company.name} someaza pe debitorul ${client.name} sa achite suma restanta aferenta` +
          ` facturii fiscale nr. ${invoiceRef}, cu termen de plata ${dueStr}, aflata in intarziere de ${daysOverdue} zile.`);
      doc
        .fontSize(11)
        .fillColor('#0f172a')
        .font('Helvetica')
        .text(bodyText, 60, doc.y, { align: 'justify', lineGap: 2, width: 475 });
      doc.y += 16;

      // ── Invoice table ────────────────────────────────────────────────
      const tableTop = doc.y;
      const cols = [60, 200, 320, 430];

      doc.rect(60, tableTop, 475, 22).fill('#f1f5f9');

      doc
        .fontSize(9)
        .fillColor('#475569')
        .font('Helvetica-Bold')
        .text(isEn ? 'Invoice' : 'Factura', cols[0] + 4, tableTop + 6)
        .text(isEn ? 'Due date' : 'Scadenta la', cols[1] + 4, tableTop + 6)
        .text(isEn ? 'Total amount' : 'Valoare totala', cols[2] + 4, tableTop + 6)
        .text(isEn ? 'Amount due' : 'Suma restanta', cols[3] + 4, tableTop + 6);

      const rowY = tableTop + 22;
      doc.rect(60, rowY, 475, 22).strokeColor('#e2e8f0').stroke();

      doc
        .fontSize(10)
        .fillColor('#0f172a')
        .font('Helvetica')
        .text(invoiceRef, cols[0] + 4, rowY + 6)
        .text(dueStr, cols[1] + 4, rowY + 6);

      doc
        .font('Helvetica-Bold')
        .text(
          `${totalAmount.toFixed(2)} ${invoice.currency}`,
          cols[2] + 4,
          rowY + 6,
        )
        .fillColor('#dc2626')
        .text(
          `${remainingAmount.toFixed(2)} ${invoice.currency}`,
          cols[3] + 4,
          rowY + 6,
        );

      doc.y = rowY + 34;

      // ── Legal text ───────────────────────────────────────────────────
      doc
        .fontSize(10.5)
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .text(
          isEn ? 'Total amount due immediately: ' : 'Suma totala de achitat imediat: ',
          60,
          doc.y,
          { continued: true, width: 475 },
        )
        .font('Helvetica')
        .fillColor('#dc2626')
        .text(`${remainingAmount.toFixed(2)} ${invoice.currency}`);
      doc.y += 14;

      const legalText = isEn
        ? `You are hereby demanded to pay the above amount within 5 business days of receipt of this notice. ` +
          `Failure to comply will result in the initiation of legal proceedings for debt recovery, including litigation ` +
          `and enforcement, with all court and enforcement costs borne by the debtor.`
        : `Va somam sa achitati suma mentionata mai sus in termen de 5 zile lucratoare de la data primirii prezentei somatii. ` +
          `In caz contrar, vom proceda la declansarea procedurilor legale de recuperare a creantei, inclusiv actionarea in instanta ` +
          `si executare silita, cu suportarea de catre debitor a tuturor cheltuielilor de judecata si executare.`;
      doc
        .fontSize(10.5)
        .font('Helvetica')
        .fillColor('#334155')
        .text(legalText, 60, doc.y, { align: 'justify', lineGap: 2, width: 475 });
      doc.y += 28;

      // ── Signature ────────────────────────────────────────────────────
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#e2e8f0').stroke();
      doc.y += 14;

      const sigY = doc.y;
      doc
        .fontSize(9)
        .fillColor('#64748b')
        .font('Helvetica-Bold')
        .text(isEn ? 'Legal Representative / Signature' : 'Reprezentant legal / Semnatura', 60, sigY, { width: 220 })
        .text(isEn ? 'Company Stamp' : 'Stampila societatii', 335, sigY, { width: 200 });

      doc
        .fontSize(8)
        .fillColor('#94a3b8')
        .font('Helvetica')
        .text(`${company.name}`, 60, sigY + 14, { width: 220 })
        .text(`${isEn ? 'Date' : 'Data'}: ${todayStr}`, 60, sigY + 26, { width: 220 });

      doc.flushPages();
      doc.end();
    });
  }
}
