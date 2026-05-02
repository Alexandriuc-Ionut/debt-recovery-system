/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuditAction, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private mailService: MailService,
  ) {}

  async findAll(companyId: number, status?: InvoiceStatus, page = 1, limit = 20) {
    const where = { companyId, ...(status && { status }) };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { client: true, payments: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id: number, companyId: number) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId },
      include: { client: true, payments: true },
    });

    if (!invoice) {
      throw new NotFoundException('Factura nu a fost gasita');
    }

    return invoice;
  }

  async findByClient(clientId: number, companyId: number) {
    return this.prisma.invoice.findMany({
      where: { clientId, companyId },
      include: { client: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateInvoiceDto, companyId: number, userId: number) {
    const invoice = await this.prisma.invoice.create({
      data: {
        companyId,
        clientId: dto.clientId,
        series: dto.series,
        number: dto.number,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        totalAmount: dto.totalAmount,
        currency: dto.currency ?? 'RON',
        notes: dto.notes,
        status: InvoiceStatus.OPEN,
      },
      include: { client: true },
    });

    await this.auditService.log({
      companyId,
      userId,
      action: AuditAction.CREATE_INVOICE,
      entityType: 'Invoice',
      entityId: invoice.id,
    });

    // Send invoice email to client if they have an email address
    if (invoice.client.email) {
      void this.mailService.sendInvoiceEmail(
        invoice.client.email,
        invoice.client.name,
        invoice.series ? `${invoice.series}-${invoice.number}` : invoice.number,
        Number(invoice.totalAmount),
        invoice.currency,
        invoice.dueDate,
      );
    }

    return invoice;
  }

  async update(id: number, dto: { dueDate?: string; notes?: string; totalAmount?: number; currency?: string }, companyId: number) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id, companyId } });
    if (!invoice) throw new NotFoundException('Factura nu a fost gasita');
    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.totalAmount !== undefined && { totalAmount: dto.totalAmount }),
        ...(dto.currency && { currency: dto.currency }),
      },
      include: { client: true },
    });
  }

  async exportSaga(companyId: number): Promise<string> {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId },
      include: { client: true },
      orderBy: { createdAt: 'asc' },
    });

    const toRoDate = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    };

    const header =
      'Nr,Serie,Numar,Data emitere,Data scadenta,Client,CUI Client,Valoare totala,Moneda,Status';
    const rows = invoices.map((inv, i) =>
      [
        i + 1,
        inv.series ?? '',
        inv.number,
        toRoDate(inv.issueDate),
        toRoDate(inv.dueDate),
        `"${inv.client.name}"`,
        inv.client.cui ?? '',
        Number(inv.totalAmount).toFixed(2),
        inv.currency,
        inv.status,
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }

  async cancel(id: number, companyId: number, userId: number) {
    const invoice = await this.findById(id, companyId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Nu se poate anula o factura platita');
    }

    if (invoice.status === InvoiceStatus.CANCELED) {
      throw new BadRequestException('Factura este deja anulata');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELED },
    });

    await this.auditService.log({
      companyId,
      userId,
      action: AuditAction.CANCEL_INVOICE,
      entityType: 'Invoice',
      entityId: id,
    });

    return updated;
  }
}
