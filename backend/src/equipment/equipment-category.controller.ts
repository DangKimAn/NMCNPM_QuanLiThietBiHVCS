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

import { EquipmentCategoryService } from './equipment-category.service';
import { CreateEquipmentCategoryDto } from './dto/create-equipment-category.dto';
import { UpdateEquipmentCategoryDto } from './dto/update-equipment-category.dto';

@ApiTags('Equipment Categories - Loại thiết bị')
@Controller('equipment-categories')
export class EquipmentCategoryController {
  constructor(
    private readonly equipmentCategoryService: EquipmentCategoryService,
  ) {}

  @Post()
  create(@Body() createDto: CreateEquipmentCategoryDto) {
    return this.equipmentCategoryService.create(createDto);
  }

  @Get()
  findAll() {
    return this.equipmentCategoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentCategoryService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEquipmentCategoryDto,
  ) {
    return this.equipmentCategoryService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentCategoryService.remove(id);
  }
}