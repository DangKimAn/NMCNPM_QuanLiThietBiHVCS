import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { EquipmentStatus } from '@prisma/client';

import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';

import { Role } from 'src/auth/decorators/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('Equipments - Thiết bị')
@Controller('equipments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  // Xem danh sách thiết bị
  // Có thể tìm kiếm theo: mã thiết bị, tên thiết bị, mô tả, loại thiết bị
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

  // Xem chi tiết thiết bị
  @Public()
  @Get(':equipmentId')
  findOne(@Param('equipmentId') equipmentId: string) {
    return this.equipmentService.findOne(Number(equipmentId));
  }

  // Thêm thiết bị mới
  // Mỗi lần thêm thủ công chỉ thêm 1 thiết bị
  // Body cần có: equipmentCode, name, categoryId, status, description
  @Post()
  @Roles(Role.MANAGER, Role.ADMIN)
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(dto);
  }

  // Import thiết bị từ Excel
  // Mẫu Excel mới:
  // Mã thiết bị | Tên thiết bị | Loại thiết bị | Phòng học | Trạng thái | Ghi chú
  @Post('import')
  @Roles(Role.MANAGER, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async importEquipmentsFromExcel(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file');
    }

    return this.equipmentService.importEquipmentsFromExcel(file);
  }

  // Cập nhật thông tin thiết bị
  @Patch(':equipmentId')
  @Roles(Role.MANAGER)
  update(
    @Param('equipmentId') equipmentId: string,
    @Body() dto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.update(Number(equipmentId), dto);
  }

  // Cập nhật trạng thái thiết bị
  @Patch(':equipmentId/status')
  @Roles(Role.MANAGER)
  updateStatus(
    @Param('equipmentId') equipmentId: string,
    @Body() dto: UpdateEquipmentStatusDto,
  ) {
    return this.equipmentService.updateStatus(Number(equipmentId), dto);
  }

  // Xóa thiết bị
  // Hiện tại service sẽ không xóa cứng mà chuyển sang trạng thái DISCARDED
  @Delete(':equipmentId')
  @Roles(Role.MANAGER, Role.ADMIN)
  remove(@Param('equipmentId') equipmentId: string) {
    return this.equipmentService.remove(Number(equipmentId));
  }
}