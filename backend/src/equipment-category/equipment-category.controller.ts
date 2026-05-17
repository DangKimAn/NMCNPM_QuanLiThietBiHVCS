import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { EquipmentCategoryService } from './equipment-category.service';
import { CreateEquipmentCategoryDto } from './dto/create-equipment-category.dto';
import { UpdateEquipmentCategoryDto } from './dto/update-equipment-category.dto';

@ApiTags('Equipment Categories - Loại thiết bị')
@Controller('equipment-categories')
export class EquipmentCategoryController {
  constructor(private readonly categoryService: EquipmentCategoryService) {}

  // GET /equipment-categories?search=Trình chiếu
  @Get()
  findAll(@Query('search') search?: string) {
    return this.categoryService.findAll(search);
  }

  // GET /equipment-categories/1
  @Get(':categoryId')
  findOne(@Param('categoryId') categoryId: string) {
    return this.categoryService.findOne(Number(categoryId));
  }

  // POST /equipment-categories
  @Post()
  create(@Body() dto: CreateEquipmentCategoryDto) {
    return this.categoryService.create(dto);
  }

  // PATCH /equipment-categories/1
  @Patch(':categoryId')
  update(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateEquipmentCategoryDto,
  ) {
    return this.categoryService.update(Number(categoryId), dto);
  }

  // DELETE /equipment-categories/1
  @Delete(':categoryId')
  remove(@Param('categoryId') categoryId: string) {
    return this.categoryService.remove(Number(categoryId));
  }
}