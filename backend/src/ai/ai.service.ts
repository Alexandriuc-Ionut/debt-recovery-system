import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskLevel } from '@prisma/client';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async calculateClientScore(clientId: number) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        invoices: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const invoices = client.invoices;

    if (invoices.length === 0) {
      const score = await this.prisma.aIClientScore.upsert({
        where: { clientId },
        update: {
          trustScore: 100,
          riskLevel: RiskLevel.LOW,
          lateProb: 0,
          modelVersion: 'rule-based-v1',
          calculatedAt: new Date(),
        },
        create: {
          companyId: client.companyId,
          clientId: client.id,
          trustScore: 100,
          riskLevel: RiskLevel.LOW,
          lateProb: 0,
          modelVersion: 'rule-based-v1',
        },
      });

      return score;
    }

    const today = new Date();

    let lateInvoices = 0;
    let totalDelayDays = 0;
    let totalOutstanding = 0;

    for (const invoice of invoices) {
      const totalAmount = Number(invoice.totalAmount);

      const paidAmount = invoice.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );

      const remainingAmount = totalAmount - paidAmount;
      totalOutstanding += remainingAmount;

      if (invoice.dueDate < today && remainingAmount > 0) {
        lateInvoices++;

        const diffTime = today.getTime() - invoice.dueDate.getTime();
        const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        totalDelayDays += overdueDays;
      }
    }

    const totalInvoices = invoices.length;
    const lateRatio = lateInvoices / totalInvoices;
    const avgDelayDays = lateInvoices > 0 ? totalDelayDays / lateInvoices : 0;

    let trustScore = 100;

    trustScore -= Math.round(lateRatio * 40);
    trustScore -= Math.min(Math.round(avgDelayDays), 30);

    if (totalOutstanding > 10000) {
      trustScore -= 20;
    } else if (totalOutstanding > 5000) {
      trustScore -= 10;
    }

    if (trustScore < 0) {
      trustScore = 0;
    }

    let riskLevel: RiskLevel = RiskLevel.LOW;

    if (trustScore < 50) {
      riskLevel = RiskLevel.HIGH;
    } else if (trustScore < 80) {
      riskLevel = RiskLevel.MEDIUM;
    }

    const lateProb = Number((100 - trustScore) / 100);

    const score = await this.prisma.aIClientScore.upsert({
      where: { clientId },
      update: {
        trustScore,
        riskLevel,
        lateProb,
        modelVersion: 'rule-based-v1',
        calculatedAt: new Date(),
      },
      create: {
        companyId: client.companyId,
        clientId: client.id,
        trustScore,
        riskLevel,
        lateProb,
        modelVersion: 'rule-based-v1',
      },
    });

    return {
      clientId: client.id,
      clientName: client.name,
      totalInvoices,
      lateInvoices,
      avgDelayDays,
      totalOutstanding,
      trustScore: score.trustScore,
      riskLevel: score.riskLevel,
      lateProb: score.lateProb,
    };
  }

  async calculateScoresForCompany(companyId: number) {
    const clients = await this.prisma.client.findMany({
      where: { companyId },
    });

    const results: any[] = [];

    for (const client of clients) {
      const result = await this.calculateClientScore(client.id);
      results.push(result);
    }

    return {
      companyId,
      totalClients: results.length,
      results,
    };
  }

  async findAllScores(companyId: number) {
    return this.prisma.aIClientScore.findMany({
      where: { companyId },
      include: {
        client: true,
      },
      orderBy: {
        trustScore: 'asc',
      },
    });
  }
}
