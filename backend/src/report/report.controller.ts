// src/report/report.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';

import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { HandleReportDto } from './dto/handle-report.dto';
import { Role } from 'src/auth/decorators/role.enum';

// Khai báo các Guards và Decorators bảo mật
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; 
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Reports - Phản ánh báo hỏng')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard) // Bắt buộc mọi API trong file này phải ĐĂNG NHẬP
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  //MANAGER: Được xem danh sách toàn bộ các phản ánh để quản lý hệ thống tổng
  @Get()
  @Roles(Role.MANAGER)
  findAll(
    @Query('status') status?: ReportStatus,
    @Query('roomId') roomId?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('search') search?: string,
  ) {
    return this.reportService.findAll({
      status,
      roomId: roomId ? Number(roomId) : undefined,
      equipmentId: equipmentId ? Number(equipmentId) : undefined,
      search,
    });
  }

  // - MANAGER: Được xem chi tiết bất kỳ phản ánh nào.
  // - TEACHER, STUDENT: Chỉ được xem phản ánh do CHÍNH MÌNH tạo ra.
  @Get(':reportId')
  @Roles(Role.MANAGER, Role.TEACHER, Role.STUDENT) 
  findOne(
    @Param('reportId') reportId: string,
    @Request() req, 
  ) {
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    return this.reportService.findOne(Number(reportId), Number(currentUserId), currentUserRole);
  }

  //STUDENT & TEACHER: Mới có quyền gửi phản ánh báo hỏng lên hệ thống
  @Post()
  @Roles(Role.STUDENT, Role.TEACHER)
  create(
    @Body() dto: CreateReportDto,
    @Request() req,
  ) {
    const userId = req.user.id; 
    return this.reportService.create(dto, Number(userId)); 
  }

  //CHỈ MANAGER: Mới có quyền xử lý phản ánh (ADMIN không có quyền can thiệp)
  @Patch(':reportId/handle')
  @Roles(Role.MANAGER) 
  handle(
    @Param('reportId') reportId: string, 
    @Body() dto: HandleReportDto,
    @Request() req, 
  ) {
    const handlerId = req.user.id; 
    return this.reportService.handle(Number(reportId), dto, Number(handlerId)); 
  }
}