import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EquipmentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy danh sách thiết bị
  async findAll(query: {
    search?: string;
    status?: EquipmentStatus | 'need-handle';
    roomId?: number;
    categoryId?: number;
  }) {
    const where: Prisma.EquipmentWhereInput = {};

    // Tìm kiếm theo tên, mô tả hoặc tên loại thiết bị
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        {
          category: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Lọc theo loại thiết bị
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    // Lọc theo trạng thái
    // need-handle nghĩa là cần xử lý: BROKEN hoặc UNDER_REPAIR
    if (query.status) {
      if (query.status === 'need-handle') {
        where.status = {
          in: [EquipmentStatus.BROKEN, EquipmentStatus.UNDER_REPAIR],
        };
      } else {
        where.status = query.status;
      }
    }

    // Lọc theo phòng học thông qua bảng EquipmentAllocation
    if (query.roomId) {
      where.allocations = {
        some: {
          roomId: query.roomId,
          quantity: {
            gt: 0,
          },
        },
      };
    }

    return this.prisma.equipment.findMany({
      where,
      orderBy: { equipmentId: 'asc' },
      include: {
        category: true,
        allocations: {
          where: {
            quantity: {
              gt: 0,
            },
          },
          include: {
            room: true,
          },
        },
      },
    });
  }

  // Lấy chi tiết thiết bị
  async findOne(equipmentId: number) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { equipmentId },
      include: {
        category: true,
        allocations: {
          include: {
            room: true,
          },
        },
        transfers: {
          include: {
            fromRoom: true,
            toRoom: true,
            executor: true,
          },
          orderBy: {
            transferredAt: 'desc',
          },
        },
        reports: {
          include: {
            room: true,
            reporter: true,
            handler: true,
          },
          orderBy: {
            reportedAt: 'desc',
          },
        },
      },
    });

    if (!equipment) {
      throw new NotFoundException('Không tìm thấy thiết bị');
    }

    return equipment;
  }

  // Thêm thiết bị mới
  async create(dto: CreateEquipmentDto) {
    const category = await this.prisma.equipmentCategory.findUnique({
      where: { categoryId: dto.categoryId },
    });

    if (!category) {
      throw new BadRequestException('Loại thiết bị không tồn tại');
    }

    return this.prisma.equipment.create({
      data: {
        name: dto.name,
        categoryId: dto.categoryId,
        unit: dto.unit,
        quantity: dto.quantity,
        status: dto.status ?? EquipmentStatus.GOOD,
        description: dto.description,
      },
      include: {
        category: true,
      },
    });
  }

  // Cập nhật thông tin thiết bị
  async update(equipmentId: number, dto: UpdateEquipmentDto) {
    await this.findOne(equipmentId);

    if (dto.categoryId) {
      const category = await this.prisma.equipmentCategory.findUnique({
        where: { categoryId: dto.categoryId },
      });

      if (!category) {
        throw new BadRequestException('Loại thiết bị không tồn tại');
      }
    }

    return this.prisma.equipment.update({
      where: { equipmentId },
      data: dto,
      include: {
        category: true,
        allocations: {
          include: {
            room: true,
          },
        },
      },
    });
  }

  // Cập nhật trạng thái thiết bị
  async updateStatus(equipmentId: number, dto: UpdateEquipmentStatusDto) {
    await this.findOne(equipmentId);

    return this.prisma.equipment.update({
      where: { equipmentId },
      data: {
        status: dto.status,
        description: dto.description,
      },
      include: {
        category: true,
        allocations: {
          include: {
            room: true,
          },
        },
      },
    });
  }

  // Xóa thiết bị
  // Để tránh lỗi ràng buộc dữ liệu, mình không xóa cứng.
  // Thay vào đó chuyển thiết bị sang trạng thái DISCARDED và quantity = 0.
  async remove(equipmentId: number) {
    await this.findOne(equipmentId);

    return this.prisma.equipment.update({
      where: { equipmentId },
      data: {
        status: EquipmentStatus.DISCARDED,
        quantity: 0,
      },
    });
  }
}