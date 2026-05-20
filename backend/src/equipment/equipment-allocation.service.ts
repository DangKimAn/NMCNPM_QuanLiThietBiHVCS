import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentAllocationDto } from './dto/create-equipment-allocation.dto';
import { UpdateEquipmentAllocationDto } from './dto/update-equipment-allocation.dto';

@Injectable()
export class EquipmentAllocationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateEquipmentAllocationDto) {
    const equipment = await this.prisma.equipment.findUnique({
      where: {
        equipmentId: createDto.equipmentId,
      },
    });

    if (!equipment) {
      throw new NotFoundException(
        `Không tìm thấy thiết bị có id = ${createDto.equipmentId}`,
      );
    }

    const room = await this.prisma.room.findUnique({
      where: {
        roomId: createDto.roomId,
      },
    });

    if (!room) {
      throw new NotFoundException(
        `Không tìm thấy phòng học có id = ${createDto.roomId}`,
      );
    }

    const existedAllocation = await this.prisma.equipmentAllocation.findFirst({
      where: {
        equipmentId: createDto.equipmentId,
        roomId: createDto.roomId,
      },
    });

    if (existedAllocation) {
      return this.prisma.equipmentAllocation.update({
        where: {
          allocationId: existedAllocation.allocationId,
        },
        data: {
          quantity: existedAllocation.quantity + createDto.quantity,
          allocatedAt: new Date(createDto.allocatedAt),
          note: createDto.note,
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
        equipmentId: createDto.equipmentId,
        roomId: createDto.roomId,
        quantity: createDto.quantity,
        allocatedAt: new Date(createDto.allocatedAt),
        note: createDto.note,
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

  async findAll() {
    return this.prisma.equipmentAllocation.findMany({
      orderBy: {
        allocationId: 'desc',
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

  async findOne(id: number) {
    const allocation = await this.prisma.equipmentAllocation.findUnique({
      where: {
        allocationId: id,
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

    if (!allocation) {
      throw new NotFoundException(
        `Không tìm thấy bản ghi phân bổ có id = ${id}`,
      );
    }

    return allocation;
  }

  async update(id: number, updateDto: UpdateEquipmentAllocationDto) {
    await this.findOne(id);

    if (updateDto.equipmentId) {
      const equipment = await this.prisma.equipment.findUnique({
        where: {
          equipmentId: updateDto.equipmentId,
        },
      });

      if (!equipment) {
        throw new NotFoundException(
          `Không tìm thấy thiết bị có id = ${updateDto.equipmentId}`,
        );
      }
    }

    if (updateDto.roomId) {
      const room = await this.prisma.room.findUnique({
        where: {
          roomId: updateDto.roomId,
        },
      });

      if (!room) {
        throw new NotFoundException(
          `Không tìm thấy phòng học có id = ${updateDto.roomId}`,
        );
      }
    }

    if (updateDto.quantity !== undefined && updateDto.quantity <= 0) {
      throw new BadRequestException('Số lượng phải lớn hơn 0.');
    }

    return this.prisma.equipmentAllocation.update({
      where: {
        allocationId: id,
      },
      data: {
        equipmentId: updateDto.equipmentId,
        roomId: updateDto.roomId,
        quantity: updateDto.quantity,
        allocatedAt: updateDto.allocatedAt
          ? new Date(updateDto.allocatedAt)
          : undefined,
        note: updateDto.note,
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

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.equipmentAllocation.delete({
      where: {
        allocationId: id,
      },
    });
  }
}