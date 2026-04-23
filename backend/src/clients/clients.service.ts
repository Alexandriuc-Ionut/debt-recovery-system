import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

interface AnafFoundResult {
  denumire?: string;
  adresa?: string;
  scpTVA?: boolean;
}

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(companyId: number) {
    return this.prisma.client.findMany({ where: { companyId } });
  }

  async findById(id: number, companyId: number) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId },
    });

    if (!client) {
      throw new NotFoundException('Clientul nu a fost gasit');
    }

    return client;
  }

  async create(dto: CreateClientDto, companyId: number, userId: number) {
    const client = await this.prisma.client.create({
      data: { ...dto, companyId },
    });

    await this.auditService.log({
      companyId,
      userId,
      action: AuditAction.CREATE_CLIENT,
      entityType: 'Client',
      entityId: client.id,
    });

    return client;
  }

  async update(
    id: number,
    dto: UpdateClientDto,
    companyId: number,
    userId: number,
  ) {
    await this.findById(id, companyId); // throws 404 if not found / wrong company

    const client = await this.prisma.client.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      companyId,
      userId,
      action: AuditAction.UPDATE_CLIENT,
      entityType: 'Client',
      entityId: client.id,
    });

    return client;
  }

  async remove(id: number, companyId: number, userId: number) {
    await this.findById(id, companyId); // throws 404 if not found / wrong company

    await this.prisma.client.delete({ where: { id } });

    await this.auditService.log({
      companyId,
      userId,
      action: AuditAction.DELETE_CLIENT,
      entityType: 'Client',
      entityId: id,
    });

    return { message: 'Clientul a fost sters' };
  }

  async lookupCui(
    cui: string,
  ): Promise<{ name: string; address: string; vatPayer: boolean }> {
    const today = new Date().toISOString().split('T')[0];
    const cuiNumber = parseInt(cui.replace('RO', '').replace(/\s/g, ''), 10);

    const res = await fetch(
      'https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ cui: cuiNumber, data: today }]),
      },
    );

    if (!res.ok) {
      throw new NotFoundException('ANAF API request failed');
    }

    const data = (await res.json()) as { found?: AnafFoundResult[] };

    if (!data.found || data.found.length === 0) {
      throw new NotFoundException('CUI not found in ANAF registry');
    }

    const company = data.found[0];

    return {
      name: company.denumire ?? '',
      address: company.adresa ?? '',
      vatPayer: company.scpTVA ?? false,
    };
  }
}
