import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';

@ApiTags('Rooms - Phòng học')
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
  create(@Body() dto: CreateRoomDto) {
    return this.roomService.create(dto);
  }


  // DELETE /rooms/1
  @Delete(':roomId')
  remove(@Param('roomId') roomId: string) {
    return this.roomService.remove(Number(roomId));
  }
}