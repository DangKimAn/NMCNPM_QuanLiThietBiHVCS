import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { EquipmentTransferService } from './equipment-transfer.service';
import { CreateEquipmentTransferDto } from './dto/create-equipment-transfer.dto';
import { CreateBulkEquipmentTransferDto } from './dto/create-bulk-equipment-transfer.dto';

@ApiTags('Equipment Transfers - Điều chuyển thiết bị')
@Controller('equipment-transfers')
export class EquipmentTransferController {
  constructor(private readonly transferService: EquipmentTransferService) {}

  @Post()
  create(@Body() createDto: CreateEquipmentTransferDto) {
    return this.transferService.create(createDto);
  }

  @Post('bulk')
  createBulk(@Body() createBulkDto: CreateBulkEquipmentTransferDto) {
    return this.transferService.createBulk(createBulkDto);
  }

  @Get()
  findAll() {
    return this.transferService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transferService.findOne(id);
  }
}