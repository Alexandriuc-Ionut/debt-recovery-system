import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AuditAction, InvoiceStatus, PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(companyId: number) {
    return this.prisma.payment.findMany({
      where: { invoice: { companyId } },
      include: { invoice: true },
      orderBy: { paidAt: 'desc' },
    });
  }

  async findByInvoice(invoiceId: number, companyId: number) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
    });

    if (!invoice) {
      throw new NotFoundException('Factura nu a fost gasita');
    }

    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paidAt: 'desc' },
    });
  }

  async create(dto: CreatePaymentDto, companyId: number, userId: number) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, companyId },
      include: { payments: true },
    });

    if (!invoice) {
      throw new NotFoundException('Factura nu a fost gasita');
    }

    if (invoice.status === InvoiceStatus.CANCELED) {
      throw new BadRequestException(
        'Nu se pot adauga plati pe o factura anulata',
      );
    }

    const paidSoFar = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    const remaining = Number(invoice.totalAmount) - paidSoFar;

    if (dto.amount > remaining) {
      throw new BadRequestException('Suma platita depaseste restul de plata');
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        paidAt: new Date(dto.paidAt),
        method: dto.method ?? PaymentMethod.BANK,
        reference: dto.reference,
      },
    });

    const newPaidTotal = paidSoFar + dto.amount;
    let newStatus: InvoiceStatus = InvoiceStatus.OPEN;
    if (newPaidTotal >= Number(invoice.totalAmount)) {
      newStatus = InvoiceStatus.PAID;
    } else if (newPaidTotal > 0) {
      newStatus = InvoiceStatus.PARTIAL;
    }

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: newStatus },
    });

    await this.auditService.log({
      companyId,
      userId,
      action: AuditAction.ADD_PAYMENT,
      entityType: 'Payment',
      entityId: payment.id,
    });

    return payment;
  }

  async update(id: number, dto: Partial<CreatePaymentDto>, companyId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, invoice: { companyId } },
    });
    if (!payment) throw new NotFoundException('Plata nu a fost gasita');
    return this.prisma.payment.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.paidAt && { paidAt: new Date(dto.paidAt) }),
        ...(dto.method && { method: dto.method }),
        ...(dto.reference !== undefined && { reference: dto.reference }),
      },
      include: { invoice: { include: { client: true } } },
    });
  }

  async remove(paymentId: number, companyId: number, userId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, invoice: { companyId } },
      include: { invoice: { include: { payments: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Plata nu a fost gasita');
    }

    if (payment.invoice.status === InvoiceStatus.PAID) {
      throw new ForbiddenException(
        'Nu se poate sterge o plata de pe o factura platita integral',
      );
    }

    await this.prisma.payment.delete({ where: { id: paymentId } });

    // Recalculate invoice status after deletion
    const remaining = payment.invoice.payments
      .filter((p) => p.id !== paymentId)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const total = Number(payment.invoice.totalAmount);
    let newStatus: InvoiceStatus = InvoiceStatus.OPEN;
    if (remaining >= total) {
      newStatus = InvoiceStatus.PAID;
    } else if (remaining > 0) {
      newStatus = InvoiceStatus.PARTIAL;
    }

    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: newStatus },
    });

    await this.auditService.log({
      companyId,
      userId,
      action: AuditAction.DELETE_PAYMENT,
      entityType: 'Payment',
      entityId: paymentId,
    });

    return { message: 'Plata a fost stearsa' };
  }
}
