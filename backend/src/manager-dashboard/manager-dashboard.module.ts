import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ManagerDashboardController } from './manager-dashboard.controller';
import { ManagerDashboardService } from './manager-dashboard.service';

@Module({
  imports: [PrismaModule],
  controllers: [ManagerDashboardController],
  providers: [ManagerDashboardService],
})
export class ManagerDashboardModule {}