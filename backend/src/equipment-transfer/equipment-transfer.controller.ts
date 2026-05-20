import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { EquipmentTransferService } from './equipment-transfer.service';
import { CreateEquipmentTransferDto } from './dto/create-equipment-transfer.dto';

@ApiTags('Equipment Transfers - Điều chuyển thiết bị')
@Controller('equipment-transfers')
export class EquipmentTransferController {
  constructor(private readonly transferService: EquipmentTransferService) {}

  // GET /equipment-transfers?equipmentId=1&fromRoomId=1&toRoomId=2
  @Get()
  findAll(
    @Query('equipmentId') equipmentId?: string,
    @Query('fromRoomId') fromRoomId?: string,
    @Query('toRoomId') toRoomId?: string,
  ) {
    return this.transferService.findAll({
      equipmentId: equipmentId ? Number(equipmentId) : undefined,
      fromRoomId: fromRoomId ? Number(fromRoomId) : undefined,
      toRoomId: toRoomId ? Number(toRoomId) : undefined,
    });
  }

  // GET /equipment-transfers/1
  @Get(':transferId')
  findOne(@Param('transferId') transferId: string) {
    return this.transferService.findOne(Number(transferId));
  }

  // POST /equipment-transfers
  @Post()
  create(@Body() dto: CreateEquipmentTransferDto) {
    return this.transferService.create(dto);
  }
}