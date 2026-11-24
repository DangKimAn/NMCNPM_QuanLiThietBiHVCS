import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/decorators/role.enum';

@ApiTags('Rooms - Phòng học')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // GET /rooms?search=A201
  @Get()
  findAll(
    @Query('search') search?: string,
  ) {
    return this.roomService.findAll({ search });
  }

  // GET /rooms/1
  @Get(':roomId')
  findOne(@Param('roomId') roomId: string) {
    return this.roomService.findOne(Number(roomId));
  }

  // POST /rooms
  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() dto: CreateRoomDto) {
    return this.roomService.create(dto);
  }


  // DELETE /rooms/1
  @Delete(':roomId')
  @Roles(Role.ADMIN, Role.MANAGER)
  remove(@Param('roomId') roomId: string) {
    return this.roomService.remove(Number(roomId));
  }
}