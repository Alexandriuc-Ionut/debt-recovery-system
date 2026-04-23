import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    if (dto.cui) {
      const existing = await this.prisma.company.findUnique({
        where: { cui: dto.cui },
      });
      if (existing) {
        throw new ConflictException('A company with this CUI already exists');
      }
    }

    return this.prisma.company.create({ data: dto });
  }

  async findById(id: number) {
    return this.prisma.company.findUnique({ where: { id } });
  }
}
