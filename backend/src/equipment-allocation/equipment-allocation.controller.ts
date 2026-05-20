import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { EquipmentAllocationService } from './equipment-allocation.service';
import { CreateEquipmentAllocationDto } from './dto/create-equipment-allocation.dto';
import { UpdateEquipmentAllocationDto } from './dto/update-equipment-allocation.dto';

@ApiTags('Equipment Allocations - Gắn thiết bị với phòng')
@Controller('equipment-allocations')
export class EquipmentAllocationController {
  constructor(private readonly allocationService: EquipmentAllocationService) {}

  // Lấy danh sách thiết bị được gắn với phòng
  // Ví dụ:
  // GET /equipment-allocations
  // GET /equipment-allocations?roomId=1
  // GET /equipment-allocations?equipmentId=1
  @Get()
  findAll(
    @Query('roomId') roomId?: string,
    @Query('equipmentId') equipmentId?: string,
  ) {
    return this.allocationService.findAll({
      roomId: roomId ? Number(roomId) : undefined,
      equipmentId: equipmentId ? Number(equipmentId) : undefined,
    });
  }

  // Lấy chi tiết một bản ghi gắn thiết bị
  // GET /equipment-allocations/1
  @Get(':allocationId')
  findOne(@Param('allocationId') allocationId: string) {
    return this.allocationService.findOne(Number(allocationId));
  }

  // Gắn thiết bị vào phòng
  // POST /equipment-allocations
  @Post()
  create(@Body() dto: CreateEquipmentAllocationDto) {
    return this.allocationService.create(dto);
  }

  // Cập nhật thông tin gắn thiết bị
  // PATCH /equipment-allocations/1
  @Patch(':allocationId')
  update(
    @Param('allocationId') allocationId: string,
    @Body() dto: UpdateEquipmentAllocationDto,
  ) {
    return this.allocationService.update(Number(allocationId), dto);
  }

  // Xóa thông tin gắn thiết bị
  // DELETE /equipment-allocations/1
  @Delete(':allocationId')
  remove(@Param('allocationId') allocationId: string) {
    return this.allocationService.remove(Number(allocationId));
  }
}