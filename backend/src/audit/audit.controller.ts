import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

const PAGE_SIZE = 15;

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') pageQ?: string,
    @Query('action') actionQ?: string,
    @Query('from') fromQ?: string,   // YYYY-MM-DD
    @Query('to') toQ?: string,       // YYYY-MM-DD
  ) {
    const page = Math.max(1, Number.parseInt(pageQ ?? '1', 10) || 1);
    const skip = (page - 1) * PAGE_SIZE;

    const where: Record<string, unknown> = { companyId: user.companyId };

    if (actionQ && actionQ !== 'ALL') {
      where.action = actionQ as AuditAction;
    }

    if (fromQ || toQ) {
      const dateFilter: Record<string, Date> = {};
      if (fromQ) dateFilter.gte = new Date(`${fromQ}T00:00:00.000Z`);
      if (toQ)   dateFilter.lte = new Date(`${toQ}T23:59:59.999Z`);
      where.createdAt = dateFilter;
    }

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        include: {
          user: { select: { email: true, fullName: true } },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };
  }
}
