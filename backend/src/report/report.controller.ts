import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';

import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { HandleReportDto } from './dto/handle-report.dto';

@ApiTags('Reports - Phản ánh báo hỏng')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // GET /reports?status=PENDING&roomId=1&equipmentId=1&search=may
  @Get()
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

  // GET /reports/1
  @Get(':reportId')
  findOne(@Param('reportId') reportId: string) {
    return this.reportService.findOne(Number(reportId));
  }

  // POST /reports
  @Post()
  create(@Body() dto: CreateReportDto) {
    return this.reportService.create(dto);
  }

  // PATCH /reports/1/handle
  @Patch(':reportId/handle')
  handle(@Param('reportId') reportId: string, @Body() dto: HandleReportDto) {
    return this.reportService.handle(Number(reportId), dto);
  }
}