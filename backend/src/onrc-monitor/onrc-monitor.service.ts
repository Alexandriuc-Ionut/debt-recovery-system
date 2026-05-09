import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AnafEntry = {
  date_generale?: { denumire?: string };
  inregistrare_scop_Tva?: { scpTVA?: boolean };
  stare_inregistrare?: {
    statusInactivi?: boolean;
    statusSuspendare?: boolean;
  };
};

@Injectable()
export class OnrcMonitorService {
  private readonly logger = new Logger(OnrcMonitorService.name);

  constructor(private prisma: PrismaService) {}

  async scanCompany(companyId: number): Promise<{ scanned: number; alertsCreated: number }> {
    const clients = await this.prisma.client.findMany({
      where: { companyId, cui: { not: null } },
      include: { snapshot: true },
    });

    const today = new Date().toISOString().split('T')[0];
    let alertsCreated = 0;

    for (const client of clients) {
      if (!client.cui) continue;
      const cleanCui = client.cui.replace(/\D/g, '');
      if (!cleanCui) continue;

      let entry: AnafEntry | null = null;
      try {
        const res = await fetch(
          'https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{ cui: Number(cleanCui), data: today }]),
            signal: AbortSignal.timeout(8000),
          },
        );
        if (res.ok) {
          const data = (await res.json()) as { found?: AnafEntry[] };
          entry = data.found?.[0] ?? null;
        }
      } catch {
        this.logger.warn(`ANAF lookup failed for CUI ${cleanCui}`);
        continue;
      }

      if (!entry) continue;

      const current = {
        anafName: entry.date_generale?.denumire?.trim() ?? null,
        vatPayer: entry.inregistrare_scop_Tva?.scpTVA ?? false,
        isInactive: entry.stare_inregistrare?.statusInactivi ?? false,
        isSuspended: entry.stare_inregistrare?.statusSuspendare ?? false,
      };

      const prev = client.snapshot;

      if (!prev) {
        // First scan — store snapshot, no alerts yet
        await this.prisma.clientSnapshot.create({
          data: {
            companyId,
            clientId: client.id,
            cui: cleanCui,
            ...current,
          },
        });
        continue;
      }

      // Diff and create alerts for changes
      const alerts: { alertType: string; description: string }[] = [];

      if (current.isInactive && !prev.isInactive) {
        alerts.push({
          alertType: 'STATUS_INACTIVE',
          description: `${client.name} a devenit INACTIV în registrul ANAF — semnal de insolvență.`,
        });
      }

      if (current.isSuspended && !prev.isSuspended) {
        alerts.push({
          alertType: 'STATUS_SUSPENDED',
          description: `${client.name} și-a suspendat activitatea conform ANAF.`,
        });
      }

      if (!current.vatPayer && prev.vatPayer) {
        alerts.push({
          alertType: 'VAT_LOST',
          description: `${client.name} a pierdut înregistrarea ca plătitor de TVA.`,
        });
      }

      if (current.vatPayer && !prev.vatPayer) {
        alerts.push({
          alertType: 'VAT_GAINED',
          description: `${client.name} s-a înregistrat ca plătitor de TVA.`,
        });
      }

      if (
        current.anafName &&
        prev.anafName &&
        current.anafName.toLowerCase() !== prev.anafName.toLowerCase()
      ) {
        alerts.push({
          alertType: 'NAME_CHANGED',
          description: `${client.name} și-a schimbat denumirea ANAF: "${prev.anafName}" → "${current.anafName}".`,
        });
      }

      if (alerts.length > 0) {
        await this.prisma.onrcAlert.createMany({
          data: alerts.map((a) => ({
            companyId,
            clientId: client.id,
            clientName: client.name,
            alertType: a.alertType,
            description: a.description,
          })),
        });
        alertsCreated += alerts.length;
      }

      // Update snapshot
      await this.prisma.clientSnapshot.update({
        where: { clientId: client.id },
        data: { ...current, checkedAt: new Date() },
      });
    }

    return { scanned: clients.length, alertsCreated };
  }

  async getAlerts(companyId: number) {
    return this.prisma.onrcAlert.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(companyId: number): Promise<number> {
    return this.prisma.onrcAlert.count({
      where: { companyId, isRead: false },
    });
  }

  async markRead(companyId: number, id: number) {
    return this.prisma.onrcAlert.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(companyId: number) {
    await this.prisma.onrcAlert.updateMany({
      where: { companyId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All alerts marked as read' };
  }
}
