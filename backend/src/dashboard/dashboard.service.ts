import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverdueCount(companyId: number): Promise<{ count: number }> {
    const today = new Date();
    const count = await this.prisma.invoice.count({
      where: {
        companyId,
        status: { in: ['OPEN', 'PARTIAL'] },
        dueDate: { lt: today },
      },
    });
    return { count };
  }

  async getOverdueInvoices(companyId: number) {
    const today = new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ['OPEN', 'PARTIAL'] },
        dueDate: { lt: today },
      },
      include: { client: true },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });
    return invoices.map((inv) => ({
      id: inv.id,
      number: `${inv.series ?? ''}${inv.number}`,
      clientName: inv.client.name,
      dueDate: inv.dueDate,
      totalAmount: inv.totalAmount,
      currency: inv.currency,
      status: inv.status,
      overdueDays: Math.floor(
        (today.getTime() - new Date(inv.dueDate).getTime()) / 86_400_000,
      ),
    }));
  }

  async getSummary(companyId: number) {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId },
      include: {
        payments: true,
        client: true,
      },
    });

    const today = new Date();
    const in7 = new Date(today.getTime() + 7 * 86_400_000);
    const in30 = new Date(today.getTime() + 30 * 86_400_000);
    const in60 = new Date(today.getTime() + 60 * 86_400_000);

    let totalInvoices = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let overdueInvoices = 0;

    let bucket0to30 = 0;
    let bucket31to60 = 0;
    let bucket61plus = 0;

    // Cash flow forecast buckets
    let cfOverdue = 0;
    let cfThisWeek = 0;
    let cfThisMonth = 0;
    let cfNextMonth = 0;

    const invoiceDetails = invoices.map((invoice) => {
      const invoiceTotal = Number(invoice.totalAmount);
      const paidAmount = invoice.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );
      const remainingAmount = invoiceTotal - paidAmount;
      const dueDate = new Date(invoice.dueDate);

      totalInvoices += invoiceTotal;
      totalPaid += paidAmount;
      totalOutstanding += remainingAmount;

      let overdueDays = 0;
      const isActive =
        invoice.status === 'OPEN' || invoice.status === 'PARTIAL';

      if (remainingAmount > 0 && dueDate < today) {
        overdueInvoices++;
        const diffTime = today.getTime() - dueDate.getTime();
        overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (overdueDays <= 30) {
          bucket0to30 += remainingAmount;
        } else if (overdueDays <= 60) {
          bucket31to60 += remainingAmount;
        } else {
          bucket61plus += remainingAmount;
        }

        if (isActive) cfOverdue += remainingAmount;
      } else if (isActive && remainingAmount > 0) {
        // Upcoming
        if (dueDate <= in7) {
          cfThisWeek += remainingAmount;
        } else if (dueDate <= in30) {
          cfThisMonth += remainingAmount;
        } else if (dueDate <= in60) {
          cfNextMonth += remainingAmount;
        }
      }

      return {
        id: invoice.id,
        clientName: invoice.client.name,
        invoiceNumber: `${invoice.series ?? ''}${invoice.number}`,
        totalAmount: invoiceTotal,
        paidAmount,
        remainingAmount,
        dueDate: invoice.dueDate,
        overdueDays,
        status: invoice.status,
      };
    });

    return {
      totals: {
        totalInvoices,
        totalPaid,
        totalOutstanding,
        overdueInvoices,
      },
      aging: {
        bucket0to30,
        bucket31to60,
        bucket61plus,
      },
      cashFlow: {
        overdue: cfOverdue,
        thisWeek: cfThisWeek,
        thisMonth: cfThisMonth,
        nextMonth: cfNextMonth,
      },
      invoices: invoiceDetails,
    };
  }
}
