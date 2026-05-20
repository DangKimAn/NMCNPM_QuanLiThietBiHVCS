import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentAllocationDto } from './dto/create-equipment-allocation.dto';
import { UpdateEquipmentAllocationDto } from './dto/update-equipment-allocation.dto';

@Injectable()
export class EquipmentAllocationService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy danh sách thiết bị được gắn vào phòng
  async findAll(query: { roomId?: number; equipmentId?: number }) {
    const where: Prisma.EquipmentAllocationWhereInput = {};

    if (query.roomId) {
      where.roomId = query.roomId;
    }

    if (query.equipmentId) {
      where.equipmentId = query.equipmentId;
    }

    return this.prisma.equipmentAllocation.findMany({
      where,
      orderBy: { allocationId: 'asc' },
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
        room: true,
      },
    });
  }

  // Lấy chi tiết một bản ghi gắn thiết bị
  async findOne(allocationId: number) {
    const allocation = await this.prisma.equipmentAllocation.findUnique({
      where: { allocationId },
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
        room: true,
      },
    });

    if (!allocation) {
      throw new NotFoundException('Không tìm thấy thông tin gắn thiết bị');
    }

    return allocation;
  }

  // Gắn thiết bị vào phòng
  async create(dto: CreateEquipmentAllocationDto) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { equipmentId: dto.equipmentId },
    });

    if (!equipment) {
      throw new BadRequestException('Thiết bị không tồn tại');
    }

    const room = await this.prisma.room.findUnique({
      where: { roomId: dto.roomId },
    });

    if (!room) {
      throw new BadRequestException('Phòng học không tồn tại');
    }

    // Nếu thiết bị đã được gắn vào phòng này rồi thì cộng thêm số lượng
    const existedAllocation = await this.prisma.equipmentAllocation.findFirst({
      where: {
        equipmentId: dto.equipmentId,
        roomId: dto.roomId,
      },
    });

    if (existedAllocation) {
      return this.prisma.equipmentAllocation.update({
        where: { allocationId: existedAllocation.allocationId },
        data: {
          quantity: existedAllocation.quantity + dto.quantity,
          allocatedAt: dto.allocatedAt
            ? new Date(dto.allocatedAt)
            : existedAllocation.allocatedAt,
          note: dto.note ?? existedAllocation.note,
        },
        include: {
          equipment: {
            include: {
              category: true,
            },
          },
          room: true,
        },
      });
    }

    return this.prisma.equipmentAllocation.create({
      data: {
        equipmentId: dto.equipmentId,
        roomId: dto.roomId,
        quantity: dto.quantity,
        allocatedAt: dto.allocatedAt ? new Date(dto.allocatedAt) : new Date(),
        note: dto.note,
      },
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
        room: true,
      },
    });
  }

  // Cập nhật thông tin gắn thiết bị
  async update(allocationId: number, dto: UpdateEquipmentAllocationDto) {
    await this.findOne(allocationId);

    return this.prisma.equipmentAllocation.update({
      where: { allocationId },
      data: {
        equipmentId: dto.equipmentId,
        roomId: dto.roomId,
        quantity: dto.quantity,
        allocatedAt: dto.allocatedAt ? new Date(dto.allocatedAt) : undefined,
        note: dto.note,
      },
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
        room: true,
      },
    });
  }

  // Xóa thông tin gắn thiết bị
  async remove(allocationId: number) {
    await this.findOne(allocationId);

    return this.prisma.equipmentAllocation.delete({
      where: { allocationId },
    });
  }
}