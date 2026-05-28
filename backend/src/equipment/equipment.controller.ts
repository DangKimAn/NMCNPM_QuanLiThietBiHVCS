import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { EquipmentStatus } from '@prisma/client';

import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';
import { Role } from 'src/auth/decorators/role.enum';

// Import các bộ bảo vệ quyền truy cập của bạn
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Equipments - Thiết bị')
@Controller('equipments')
@UseGuards(JwtAuthGuard, RolesGuard) // Bọc toàn bộ file: Phải đăng nhập mới được sờ vào các API này
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) { }

  // AI CŨNG XEM ĐƯỢC: Bất kỳ ai đăng nhập đều có thể xem danh sách thiết bị
  @Public()
  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: EquipmentStatus })
  @ApiQuery({ name: 'roomId', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: EquipmentStatus | 'need-handle',
    @Query('roomId') roomId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.equipmentService.findAll({
      search,
      status,
      roomId: roomId ? Number(roomId) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
    });
  }

  // AI CŨNG XEM ĐƯỢC: Bất kỳ ai đăng nhập đều có thể xem chi tiết thiết bị
  @Public()
  @Get(':equipmentId')
  findOne(@Param('equipmentId') equipmentId: string) {
    return this.equipmentService.findOne(Number(equipmentId));
  }

  //CHỈ MANAGER & ADMIN: Mới có quyền tạo thiết bị mới
  @Post()
  @Roles(Role.MANAGER, Role.ADMIN)
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(dto);
  }

  @Post('import')
  @Roles(Role.MANAGER, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async importEquipmentsFromExcel(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Vui lòng chọn file');
    return await this.equipmentService.importEquipmentsFromExcel(file);
  }

  // CHỈ MANAGER: Mới có quyền cập nhật thông tin thiết bị (ADMIN không có quyền)
  @Patch(':equipmentId')
  @Roles(Role.MANAGER)
  update(
    @Param('equipmentId') equipmentId: string,
    @Body() dto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.update(Number(equipmentId), dto);
  }

  // CHỈ MANAGER: Mới có quyền duyệt/đổi trạng thái thiết bị (ADMIN không có quyền)
  @Patch(':equipmentId/status')
  @Roles(Role.MANAGER)
  updateStatus(
    @Param('equipmentId') equipmentId: string,
    @Body() dto: UpdateEquipmentStatusDto,
  ) {
    return this.equipmentService.updateStatus(Number(equipmentId), dto);
  }

  //CHỈ MANAGER & ADMIN: Mới được quyền xóa thiết bị khỏi hệ thống
  @Delete(':equipmentId')
  @Roles(Role.MANAGER, Role.ADMIN)
  remove(@Param('equipmentId') equipmentId: string) {
    return this.equipmentService.remove(Number(equipmentId));
  }
}