import { Module } from '@nestjs/common';
import { OnrcMonitorService } from './onrc-monitor.service';
import { OnrcMonitorController } from './onrc-monitor.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OnrcMonitorService],
  controllers: [OnrcMonitorController],
})
export class OnrcMonitorModule {}
