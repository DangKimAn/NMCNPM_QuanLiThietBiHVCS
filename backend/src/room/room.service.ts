import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoomStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy danh sách phòng học, có hỗ trợ tìm kiếm và lọc trạng thái
  async findAll(query: { search?: string; status?: RoomStatus }) {
    const where: Prisma.RoomWhereInput = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { building: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.room.findMany({
      where,
      orderBy: { roomId: 'asc' },
      include: {
        // Lấy luôn danh sách thiết bị đang được gắn trong phòng
        allocations: {
          include: {
            equipment: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
  }

  // Lấy chi tiết một phòng học
  async findOne(roomId: number) {
    const room = await this.prisma.room.findUnique({
      where: { roomId },
      include: {
        allocations: {
          include: {
            equipment: {
              include: {
                category: true,
              },
            },
          },
        },
        reports: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng học');
    }

    return room;
  }

  // Thêm phòng học mới
  async create(dto: CreateRoomDto) {
    const existedRoom = await this.prisma.room.findUnique({
      where: { code: dto.code },
    });

    if (existedRoom) {
      throw new BadRequestException('Mã phòng đã tồn tại');
    }

    return this.prisma.room.create({
      data: {
        code: dto.code,
        name: dto.name,
        building: dto.building,
        floor: dto.floor,
        capacity: dto.capacity,
        status: dto.status ?? RoomStatus.AVAILABLE,
      },
    });
  }

  // Cập nhật phòng học
  async update(roomId: number, dto: UpdateRoomDto) {
    await this.findOne(roomId);

    return this.prisma.room.update({
      where: { roomId },
      data: dto,
    });
  }

  // Xóa phòng học
  // Lưu ý: nếu phòng đã có thiết bị/phản ánh liên quan thì Prisma có thể không cho xóa
  async remove(roomId: number) {
    await this.findOne(roomId);

    return this.prisma.room.delete({
      where: { roomId },
    });
  }
}