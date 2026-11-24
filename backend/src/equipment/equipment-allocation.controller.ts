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

import { EquipmentAllocationService } from './equipment-allocation.service';
import { CreateEquipmentAllocationDto } from './dto/create-equipment-allocation.dto';
import { UpdateEquipmentAllocationDto } from './dto/update-equipment-allocation.dto';
import { CreateBulkEquipmentAllocationDto } from './dto/create-bulk-equipment-allocation.dto';
import { BulkDeleteEquipmentAllocationDto } from './dto/bulk-delete-equipment-allocation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/decorators/role.enum';

@ApiTags('Equipment Allocations - Gắn thiết bị vào phòng')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('equipment-allocations')
export class EquipmentAllocationController {
  constructor(private readonly allocationService: EquipmentAllocationService) {}

  @Post()
  create(@Body() createDto: CreateEquipmentAllocationDto) {
    return this.allocationService.create(createDto);
  }

  @Post('bulk')
  createBulk(@Body() createBulkDto: CreateBulkEquipmentAllocationDto) {
    return this.allocationService.createBulk(createBulkDto);
  }

  @Post('bulk-delete')
  removeBulk(@Body() bulkDeleteDto: BulkDeleteEquipmentAllocationDto) {
    return this.allocationService.removeBulk(bulkDeleteDto);
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
