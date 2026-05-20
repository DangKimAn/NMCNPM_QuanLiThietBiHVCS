import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ManagerDashboardService } from './manager-dashboard.service';

@ApiTags('Manager Dashboard - Tổng quan cán bộ quản lý')
@Controller('manager-dashboard')
export class ManagerDashboardController {
  constructor(private readonly dashboardService: ManagerDashboardService) {}

  @Get('overview')
  getOverview() {
    return this.dashboardService.getOverview();
  }
}