import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface AuditLogData {
  companyId?: number;
  userId?: number;
  action: AuditAction;
  entityType?: string;
  entityId?: number;
  success?: boolean;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        success: data.success ?? true,
      },
    });
  }
}
