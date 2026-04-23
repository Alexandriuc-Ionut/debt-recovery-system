import { Module } from '@nestjs/common';
import { EFacturaController } from './efactura.controller';
import { EFacturaService } from './efactura.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EFacturaController],
  providers: [EFacturaService],
})
export class EFacturaModule {}
