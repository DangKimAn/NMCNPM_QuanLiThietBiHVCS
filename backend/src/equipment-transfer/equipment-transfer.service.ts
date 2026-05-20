import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentTransferDto } from './dto/create-equipment-transfer.dto';

@Injectable()
export class EquipmentTransferService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy lịch sử điều chuyển thiết bị
  async findAll(query: {
    equipmentId?: number;
    fromRoomId?: number;
    toRoomId?: number;
  }) {
    const where: Prisma.EquipmentTransferWhereInput = {};

    if (query.equipmentId) {
      where.equipmentId = query.equipmentId;
    }

    if (query.fromRoomId) {
      where.fromRoomId = query.fromRoomId;
    }

    if (query.toRoomId) {
      where.toRoomId = query.toRoomId;
    }

    return this.prisma.equipmentTransfer.findMany({
      where,
      orderBy: {
        transferredAt: 'desc',
      },
      include: {
        equipment: true,
        fromRoom: true,
        toRoom: true,
        executor: true,
      },
    });
  }

  // Lấy chi tiết một lần điều chuyển
  async findOne(transferId: number) {
    const transfer = await this.prisma.equipmentTransfer.findUnique({
      where: { transferId },
      include: {
        equipment: true,
        fromRoom: true,
        toRoom: true,
        executor: true,
      },
    });

    if (!transfer) {
      throw new NotFoundException('Không tìm thấy lịch sử điều chuyển');
    }

    return transfer;
  }

  // Điều chuyển thiết bị
  async create(dto: CreateEquipmentTransferDto) {
    if (dto.fromRoomId === dto.toRoomId) {
      throw new BadRequestException('Phòng mới phải khác phòng hiện tại');
    }

    const equipment = await this.prisma.equipment.findUnique({
      where: { equipmentId: dto.equipmentId },
    });

    if (!equipment) {
      throw new BadRequestException('Thiết bị không tồn tại');
    }

    const fromRoom = await this.prisma.room.findUnique({
      where: { roomId: dto.fromRoomId },
    });

    if (!fromRoom) {
      throw new BadRequestException('Phòng hiện tại không tồn tại');
    }

    const toRoom = await this.prisma.room.findUnique({
      where: { roomId: dto.toRoomId },
    });

    if (!toRoom) {
      throw new BadRequestException('Phòng mới không tồn tại');
    }

    const executor = await this.prisma.user.findUnique({
      where: { userId: dto.executorId },
    });

    if (!executor) {
      throw new BadRequestException('Người thực hiện không tồn tại');
    }

    const fromAllocation = await this.prisma.equipmentAllocation.findFirst({
      where: {
        equipmentId: dto.equipmentId,
        roomId: dto.fromRoomId,
      },
    });

    if (!fromAllocation || fromAllocation.quantity < dto.quantity) {
      throw new BadRequestException('Số lượng thiết bị trong phòng hiện tại không đủ để điều chuyển');
    }

    // Transaction đảm bảo:
    // 1. Trừ số lượng ở phòng cũ
    // 2. Cộng số lượng ở phòng mới
    // 3. Lưu lịch sử điều chuyển
    // Nếu một bước lỗi thì tất cả sẽ rollback
    return this.prisma.$transaction(async (tx) => {
      await tx.equipmentAllocation.update({
        where: { allocationId: fromAllocation.allocationId },
        data: {
          quantity: fromAllocation.quantity - dto.quantity,
        },
      });

      const toAllocation = await tx.equipmentAllocation.findFirst({
        where: {
          equipmentId: dto.equipmentId,
          roomId: dto.toRoomId,
        },
      });

      if (toAllocation) {
        await tx.equipmentAllocation.update({
          where: { allocationId: toAllocation.allocationId },
          data: {
            quantity: toAllocation.quantity + dto.quantity,
          },
        });
      } else {
        await tx.equipmentAllocation.create({
          data: {
            equipmentId: dto.equipmentId,
            roomId: dto.toRoomId,
            quantity: dto.quantity,
            allocatedAt: new Date(dto.transferredAt),
            note: `Tự động tạo khi điều chuyển từ phòng ${fromRoom.code}`,
          },
        });
      }

      return tx.equipmentTransfer.create({
        data: {
          equipmentId: dto.equipmentId,
          fromRoomId: dto.fromRoomId,
          toRoomId: dto.toRoomId,
          quantity: dto.quantity,
          transferredAt: new Date(dto.transferredAt),
          executorId: dto.executorId,
          note: dto.note,
        },
        include: {
          equipment: true,
          fromRoom: true,
          toRoom: true,
          executor: true,
        },
      });
    });
  }
}