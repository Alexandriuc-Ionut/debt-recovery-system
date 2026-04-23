import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Channel, ReminderStatus } from '@prisma/client';

const COOLDOWN_DAYS = 3;

function daysBetween(a: Date, b: Date): number {
  return Math.abs(Math.floor((a.getTime() - b.getTime()) / 86_400_000));
}

function nextLevel(sentCount: number): 1 | 2 | 3 {
  if (sentCount === 0) return 1;
  if (sentCount === 1) return 2;
  return 3;
}

@Injectable()
export class RemindersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async processOverdueInvoices(companyId: number) {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId, status: { in: ['OPEN', 'PARTIAL'] } },
      include: {
        client: true,
        payments: true,
        reminders: { orderBy: { sentAt: 'desc' } },
      },
    });

    const today = new Date();
    const createdReminders: { id: number }[] = [];

    for (const invoice of invoices) {
      const totalAmount = Number(invoice.totalAmount);
      const paidAmount = invoice.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const remainingAmount = totalAmount - paidAmount;
      const isOverdue = remainingAmount > 0 && invoice.dueDate < today;
      if (!isOverdue) continue;

      const lastSent = invoice.reminders.find((r) => r.status === 'SENT');
      if (lastSent && daysBetween(today, lastSent.sentAt) < COOLDOWN_DAYS)
        continue;

      const sentCount = invoice.reminders.filter(
        (r) => r.status === 'SENT',
      ).length;
      const level = nextLevel(sentCount);
      const clientEmail = invoice.client.email;

      const reminder = await this.prisma.reminder.create({
        data: {
          invoiceId: invoice.id,
          channel: Channel.EMAIL,
          recipient: clientEmail ?? 'no-email@example.com',
          status: clientEmail ? ReminderStatus.SENT : ReminderStatus.FAILED,
          errorMsg: clientEmail ? null : 'Client has no email address',
          sentAt: new Date(),
        },
      });

      if (clientEmail) {
        void this.mailService.sendStagedReminderEmail(
          clientEmail,
          invoice.client.name,
          invoice.series
            ? `${invoice.series}-${invoice.number}`
            : invoice.number,
          remainingAmount,
          invoice.currency,
          invoice.dueDate,
          level,
        );
      }

      createdReminders.push(reminder);
    }

    return {
      message: 'Reminder process completed',
      totalCreated: createdReminders.length,
      reminders: createdReminders,
    };
  }

  async sendToClient(clientId: number, companyId: number) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId },
    });
    if (!client) throw new NotFoundException('Client not found');

    const invoices = await this.prisma.invoice.findMany({
      where: { clientId, companyId, status: { in: ['OPEN', 'PARTIAL'] } },
      include: {
        payments: true,
        reminders: { orderBy: { sentAt: 'desc' } },
      },
    });

    const today = new Date();
    const createdReminders: { id: number }[] = [];

    for (const invoice of invoices) {
      const totalAmount = Number(invoice.totalAmount);
      const paidAmount = invoice.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const remainingAmount = totalAmount - paidAmount;
      const isOverdue = remainingAmount > 0 && invoice.dueDate < today;
      if (!isOverdue) continue;

      const sentCount = invoice.reminders.filter(
        (r) => r.status === 'SENT',
      ).length;
      const level = nextLevel(sentCount);
      const clientEmail = client.email;

      const reminder = await this.prisma.reminder.create({
        data: {
          invoiceId: invoice.id,
          channel: Channel.EMAIL,
          recipient: clientEmail ?? 'no-email@example.com',
          status: clientEmail ? ReminderStatus.SENT : ReminderStatus.FAILED,
          errorMsg: clientEmail ? null : 'Client has no email address',
          sentAt: new Date(),
        },
      });

      if (clientEmail) {
        void this.mailService.sendStagedReminderEmail(
          clientEmail,
          client.name,
          invoice.series
            ? `${invoice.series}-${invoice.number}`
            : invoice.number,
          remainingAmount,
          invoice.currency,
          invoice.dueDate,
          level,
        );
      }

      createdReminders.push(reminder);
    }

    return {
      message:
        createdReminders.length > 0
          ? `${createdReminders.length} reminder(s) sent to ${client.name}`
          : `No overdue invoices found for ${client.name}`,
      totalCreated: createdReminders.length,
    };
  }

  async findAll(companyId: number) {
    return this.prisma.reminder.findMany({
      where: {
        invoice: {
          companyId,
          status: { notIn: ['PAID', 'CANCELED'] },
        },
      },
      include: { invoice: { include: { client: true } }, rule: true },
      orderBy: { sentAt: 'desc' },
    });
  }
}
