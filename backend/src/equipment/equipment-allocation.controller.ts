import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { EquipmentAllocationService } from './equipment-allocation.service';
import { CreateEquipmentAllocationDto } from './dto/create-equipment-allocation.dto';
import { UpdateEquipmentAllocationDto } from './dto/update-equipment-allocation.dto';

@ApiTags('Equipment Allocations - Gắn thiết bị vào phòng')
@Controller('equipment-allocations')
export class EquipmentAllocationController {
  constructor(
    private readonly allocationService: EquipmentAllocationService,
  ) {}

  @Post()
  create(@Body() createDto: CreateEquipmentAllocationDto) {
    return this.allocationService.create(createDto);
  }

  @Get()
  findAll() {
    return this.allocationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.allocationService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEquipmentAllocationDto,
  ) {
    return this.allocationService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.allocationService.remove(id);
  }
}