import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RoomModule } from '../room/room.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [PrismaModule, RoomModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}