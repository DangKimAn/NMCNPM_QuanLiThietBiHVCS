// src/report/report.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';

import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { HandleReportDto } from './dto/handle-report.dto';

// Khai báo các Guards và Decorators
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; 
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Reports - Phản ánh báo hỏng')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard) //Bắt buộc mọi API trong file này phải ĐĂNG NHẬP
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // MANAGER & ADMIN: Được xem danh sách toàn bộ các phản ánh để quản lý
  @Get()
  @Roles('MANAGER', 'ADMIN')
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

  // MANAGER & ADMIN: Xem chi tiết một phản ánh cụ thể
  @Get(':reportId')
  @Roles('MANAGER', 'ADMIN')
  findOne(@Param('reportId') reportId: string) {
    return this.reportService.findOne(Number(reportId));
  }

  // STUDENT & TEACHER: Mới có quyền gửi phản ánh báo hỏng lên hệ thống
  @Post()
  @Roles('STUDENT', 'TEACHER')
  create(
    @Body() dto: CreateReportDto,
    @Request() req,
  ) {
    const userId = req.user.id; 
    
    // Truyền tách rời: dto là tham số thứ nhất, userId là tham số thứ hai
    return this.reportService.create(dto, Number(userId)); 
  }

  // ⚙️ CHỈ MANAGER: Mới có quyền xử lý phản ánh (Duyệt, từ chối, chuyển trạng thái)
  @Patch(':reportId/handle')
  @Roles('MANAGER') // Đúng chuẩn yêu cầu: Chỉ duy nhất MANAGER được sờ vào API này
  handle(
    @Param('reportId') reportId: string, 
    @Body() dto: HandleReportDto,
    @Request() req, //Bổ sung lấy đối tượng request để bóc tách thông tin token của Manager
  ) {
    const handlerId = req.user.id; //Lấy ID bảo mật của Manager từ token
    
    //Truyền đủ cả 3 tham số sang Service đúng như khai báo định nghĩa
    return this.reportService.handle(Number(reportId), dto, Number(handlerId)); 
  }
}