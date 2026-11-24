import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { EquipmentCategoryService } from './equipment-category.service';
import { CreateEquipmentCategoryDto } from './dto/create-equipment-category.dto';
import { UpdateEquipmentCategoryDto } from './dto/update-equipment-category.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/decorators/role.enum';

@ApiTags('Equipment Categories - Loại thiết bị')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('equipment-categories')
export class EquipmentCategoryController {
  constructor(
    private readonly equipmentCategoryService: EquipmentCategoryService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
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
  @Roles(Role.ADMIN, Role.MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEquipmentCategoryDto,
  ) {
    return this.equipmentCategoryService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentCategoryService.remove(id);
  }
}