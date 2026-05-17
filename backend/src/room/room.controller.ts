import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoomStatus } from '@prisma/client';

import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@ApiTags('Rooms - Phòng học')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // GET /rooms?search=A201&status=AVAILABLE
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: RoomStatus,
  ) {
    return this.roomService.findAll({ search, status });
  }

  // GET /rooms/1
  @Get(':roomId')
  findOne(@Param('roomId') roomId: string) {
    return this.roomService.findOne(Number(roomId));
  }

  // POST /rooms
  @Post()
  create(@Body() dto: CreateRoomDto) {
    return this.roomService.create(dto);
  }

  // PATCH /rooms/1
  @Patch(':roomId')
  update(@Param('roomId') roomId: string, @Body() dto: UpdateRoomDto) {
    return this.roomService.update(Number(roomId), dto);
  }

  // DELETE /rooms/1
  @Delete(':roomId')
  remove(@Param('roomId') roomId: string) {
    return this.roomService.remove(Number(roomId));
  }
}