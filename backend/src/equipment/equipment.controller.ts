import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EquipmentStatus } from '@prisma/client';

import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';

@ApiTags('Equipments - Thiết bị')
@Controller('equipments')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  // GET /equipments?search=may&status=GOOD&roomId=1&categoryId=1
  // status=need-handle sẽ lọc các thiết bị BROKEN hoặc UNDER_REPAIR
  @Get()
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

  // GET /equipments/1
  @Get(':equipmentId')
  findOne(@Param('equipmentId') equipmentId: string) {
    return this.equipmentService.findOne(Number(equipmentId));
  }

  // POST /equipments
  @Post()
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(dto);
  }

  // PATCH /equipments/1
  @Patch(':equipmentId')
  update(
    @Param('equipmentId') equipmentId: string,
    @Body() dto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.update(Number(equipmentId), dto);
  }

  // PATCH /equipments/1/status
  @Patch(':equipmentId/status')
  updateStatus(
    @Param('equipmentId') equipmentId: string,
    @Body() dto: UpdateEquipmentStatusDto,
  ) {
    return this.equipmentService.updateStatus(Number(equipmentId), dto);
  }

  // DELETE /equipments/1
  @Delete(':equipmentId')
  remove(@Param('equipmentId') equipmentId: string) {
    return this.equipmentService.remove(Number(equipmentId));
  }
}