import { Injectable, NotFoundException } from '@nestjs/common';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ExpenseCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export class UpdateExpenseDto {
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;
}

export class CreateExpenseDto {
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;
}

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  findAll(companyId: number) {
    return this.prisma.expense.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
    });
  }

  create(dto: CreateExpenseDto, companyId: number) {
    return this.prisma.expense.create({
      data: {
        companyId,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency ?? 'RON',
        date: new Date(dto.date),
        supplier: dto.supplier,
        reference: dto.reference,
      },
    });
  }

  async update(id: number, dto: UpdateExpenseDto, companyId: number) {
    const existing = await this.prisma.expense.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Expense not found');

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.supplier !== undefined && { supplier: dto.supplier }),
        ...(dto.reference !== undefined && { reference: dto.reference }),
      },
    });
  }

  async remove(id: number, companyId: number) {
    const existing = await this.prisma.expense.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Expense not found');

    await this.prisma.expense.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
