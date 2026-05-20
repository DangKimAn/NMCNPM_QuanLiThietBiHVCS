import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentTransferDto } from './dto/create-equipment-transfer.dto';

@Injectable()
export class EquipmentTransferService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateEquipmentTransferDto) {
    if (createDto.fromRoomId === createDto.toRoomId) {
      throw new BadRequestException(
        'Phòng chuyển đến phải khác phòng chuyển đi.',
      );
    }

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

    const fromRoom = await this.prisma.room.findUnique({
      where: {
        roomId: createDto.fromRoomId,
      },
    });

    if (!fromRoom) {
      throw new NotFoundException(
        `Không tìm thấy phòng chuyển đi có id = ${createDto.fromRoomId}`,
      );
    }

    const toRoom = await this.prisma.room.findUnique({
      where: {
        roomId: createDto.toRoomId,
      },
    });

    if (!toRoom) {
      throw new NotFoundException(
        `Không tìm thấy phòng chuyển đến có id = ${createDto.toRoomId}`,
      );
    }

    const executor = await this.prisma.user.findUnique({
      where: {
        userId: createDto.executorId,
      },
    });

    if (!executor) {
      throw new NotFoundException(
        `Không tìm thấy cán bộ thực hiện có id = ${createDto.executorId}`,
      );
    }

    const fromAllocation = await this.prisma.equipmentAllocation.findFirst({
      where: {
        equipmentId: createDto.equipmentId,
        roomId: createDto.fromRoomId,
      },
    });

    if (!fromAllocation || fromAllocation.quantity < createDto.quantity) {
      throw new BadRequestException(
        'Số lượng thiết bị ở phòng chuyển đi không đủ để điều chuyển.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.equipmentAllocation.update({
        where: {
          allocationId: fromAllocation.allocationId,
        },
        data: {
          quantity: fromAllocation.quantity - createDto.quantity,
        },
      });

      const toAllocation = await tx.equipmentAllocation.findFirst({
        where: {
          equipmentId: createDto.equipmentId,
          roomId: createDto.toRoomId,
        },
      });

      if (toAllocation) {
        await tx.equipmentAllocation.update({
          where: {
            allocationId: toAllocation.allocationId,
          },
          data: {
            quantity: toAllocation.quantity + createDto.quantity,
            allocatedAt: new Date(createDto.transferredAt),
            note: createDto.note,
          },
        });
      } else {
        await tx.equipmentAllocation.create({
          data: {
            equipmentId: createDto.equipmentId,
            roomId: createDto.toRoomId,
            quantity: createDto.quantity,
            allocatedAt: new Date(createDto.transferredAt),
            note: createDto.note,
          },
        });
      }

      return tx.equipmentTransfer.create({
        data: {
          equipmentId: createDto.equipmentId,
          fromRoomId: createDto.fromRoomId,
          toRoomId: createDto.toRoomId,
          quantity: createDto.quantity,
          transferredAt: new Date(createDto.transferredAt),
          executorId: createDto.executorId,
          note: createDto.note,
        },
        include: {
          equipment: {
            include: {
              category: true,
            },
          },
          fromRoom: true,
          toRoom: true,
          executor: true,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.equipmentTransfer.findMany({
      orderBy: {
        transferredAt: 'desc',
      },
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
        fromRoom: true,
        toRoom: true,
        executor: true,
      },
    });
  }

  async findOne(id: number) {
    const transfer = await this.prisma.equipmentTransfer.findUnique({
      where: {
        transferId: id,
      },
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
        fromRoom: true,
        toRoom: true,
        executor: true,
      },
    });

    if (!transfer) {
      throw new NotFoundException(
        `Không tìm thấy lịch sử điều chuyển có id = ${id}`,
      );
    }

    return transfer;
  }
}