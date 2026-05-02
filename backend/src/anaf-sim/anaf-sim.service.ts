import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EFacturaStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnafSimService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.eFacturaSubmission.findMany({
      include: {
        invoice: { include: { client: true } },
        company: { select: { id: true, name: true, cui: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  findPending() {
    return this.prisma.eFacturaSubmission.findMany({
      where: { status: EFacturaStatus.PENDING },
      include: {
        invoice: { include: { client: true } },
        company: { select: { id: true, name: true, cui: true } },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async validate(id: number) {
    const sub = await this.prisma.eFacturaSubmission.findUnique({
      where: { id },
    });
    if (!sub) throw new NotFoundException('Submission not found');
    if (sub.status !== EFacturaStatus.PENDING)
      throw new BadRequestException('Submission is not in PENDING state');

    const messageId = String(Math.floor(1_000_000 + Math.random() * 8_999_999));
    const recipisa = {
      id_incarcare: sub.executionId,
      id_descarcare: messageId,
      stare: 'ok',
      tip: 'FACTURA TRIMISA',
      data_creare: new Date().toISOString(),
      mesaje: [
        {
          tip: 'SUCCES',
          mesaj: 'Factura validata cu succes de sistemul ANAF SPV',
        },
      ],
    };

    return this.prisma.eFacturaSubmission.update({
      where: { id },
      data: {
        status: EFacturaStatus.VALIDATED,
        messageId,
        recipisa,
        processedAt: new Date(),
        errorMsg: null,
      },
    });
  }

  async reject(id: number, errorMsg: string) {
    const sub = await this.prisma.eFacturaSubmission.findUnique({
      where: { id },
    });
    if (!sub) throw new NotFoundException('Submission not found');
    if (sub.status !== EFacturaStatus.PENDING)
      throw new BadRequestException('Submission is not in PENDING state');

    const recipisa = {
      id_incarcare: sub.executionId,
      stare: 'nok',
      tip: 'FACTURA RESPINSA',
      data_creare: new Date().toISOString(),
      mesaje: [{ tip: 'EROARE', mesaj: errorMsg }],
    };

    return this.prisma.eFacturaSubmission.update({
      where: { id },
      data: {
        status: EFacturaStatus.ERROR,
        processedAt: new Date(),
        errorMsg,
        recipisa,
      },
    });
  }

  async getXml(id: number): Promise<string> {
    const sub = await this.prisma.eFacturaSubmission.findUnique({
      where: { id },
    });
    if (!sub) throw new NotFoundException('Submission not found');
    if (!sub.xmlContent) throw new BadRequestException('No XML available');
    return sub.xmlContent;
  }

  getStats() {
    return this.prisma.eFacturaSubmission
      .groupBy({ by: ['status'], _count: { id: true } })
      .then((rows) => {
        const map: Record<string, number> = {};
        rows.forEach((r) => (map[r.status] = r._count.id));
        return {
          total: Object.values(map).reduce((a, b) => a + b, 0),
          pending: map['PENDING'] ?? 0,
          validated: map['VALIDATED'] ?? 0,
          error: map['ERROR'] ?? 0,
        };
      });
  }
}
