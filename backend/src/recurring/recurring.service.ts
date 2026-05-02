import { Injectable, NotFoundException } from '@nestjs/common';
import {
  IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min,
} from 'class-validator';
import { RecurringInterval } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export class CreateRecurringDto {
  @IsInt()
  @Min(1)
  clientId: number;

  @IsString()
  @MaxLength(100)
  templateName: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  series?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsEnum(RecurringInterval)
  interval: RecurringInterval;

  @IsOptional()
  @IsInt()
  @Min(1)
  dayOfMonth?: number;

  @IsDateString()
  nextRunAt: string;
}

@Injectable()
export class RecurringService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: number) {
    return this.prisma.recurringInvoice.findMany({
      where: { companyId },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateRecurringDto, companyId: number) {
    return this.prisma.recurringInvoice.create({
      data: {
        companyId,
        clientId: dto.clientId,
        templateName: dto.templateName,
        series: dto.series,
        amount: dto.amount,
        currency: dto.currency ?? 'RON',
        notes: dto.notes,
        interval: dto.interval,
        dayOfMonth: dto.dayOfMonth ?? 1,
        nextRunAt: new Date(dto.nextRunAt),
      },
      include: { client: true },
    });
  }

  async update(id: number, dto: Partial<CreateRecurringDto>, companyId: number) {
    const existing = await this.prisma.recurringInvoice.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Recurring invoice not found');
    return this.prisma.recurringInvoice.update({
      where: { id },
      data: {
        ...(dto.templateName && { templateName: dto.templateName }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.interval && { interval: dto.interval }),
        ...(dto.dayOfMonth !== undefined && { dayOfMonth: dto.dayOfMonth }),
        ...(dto.nextRunAt && { nextRunAt: new Date(dto.nextRunAt) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.series !== undefined && { series: dto.series }),
      },
      include: { client: true },
    });
  }

  async toggleActive(id: number, companyId: number) {
    const existing = await this.prisma.recurringInvoice.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Recurring invoice not found');

    return this.prisma.recurringInvoice.update({
      where: { id },
      data: { isActive: !existing.isActive },
      include: { client: true },
    });
  }

  async remove(id: number, companyId: number) {
    const existing = await this.prisma.recurringInvoice.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Recurring invoice not found');

    await this.prisma.recurringInvoice.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
