import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ManagerDashboardService } from './manager-dashboard.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/decorators/role.enum';

@ApiTags('Manager Dashboard - Tổng quan cán bộ quản lý')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('manager-dashboard')
export class ManagerDashboardController {
  constructor(private readonly dashboardService: ManagerDashboardService) {}

  @Get('overview')
  getOverview() {
    return this.dashboardService.getOverview();
  }
}