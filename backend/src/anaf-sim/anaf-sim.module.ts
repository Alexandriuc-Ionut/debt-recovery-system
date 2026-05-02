import { Module } from '@nestjs/common';
import { AnafSimController } from './anaf-sim.controller';
import { AnafSimService } from './anaf-sim.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnafSimController],
  providers: [AnafSimService],
})
export class AnafSimModule {}
