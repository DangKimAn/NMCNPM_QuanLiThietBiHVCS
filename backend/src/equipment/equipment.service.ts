import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EquipmentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';
import * as xlsx from 'xlsx';

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

    // Tìm kiếm theo mã thiết bị, tên thiết bị, mô tả hoặc tên loại thiết bị
    if (query.search) {
      where.OR = [
        { equipmentCode: { contains: query.search, mode: 'insensitive' } },
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
  // Mỗi lần thêm thủ công chỉ thêm 1 thiết bị thật.
  // Vì vậy bắt buộc có mã thiết bị riêng và quantity luôn là 1.
  async create(dto: CreateEquipmentDto) {
    const equipmentCode = dto.equipmentCode?.trim();

    if (!equipmentCode) {
      throw new BadRequestException('Vui lòng nhập mã thiết bị');
    }

    const name = dto.name?.trim();

    if (!name) {
      throw new BadRequestException('Vui lòng nhập tên thiết bị');
    }

    const category = await this.prisma.equipmentCategory.findUnique({
      where: { categoryId: dto.categoryId },
    });

    if (!category) {
      throw new BadRequestException('Loại thiết bị không tồn tại');
    }

    const existedCode = await this.prisma.equipment.findUnique({
      where: { equipmentCode },
    });

    if (existedCode) {
      throw new BadRequestException('Mã thiết bị đã tồn tại');
    }

    return this.prisma.equipment.create({
      data: {
        equipmentCode,
        name,
        categoryId: dto.categoryId,
        unit: dto.unit?.trim() || 'cái',
        quantity: 1,
        status: dto.status ?? EquipmentStatus.GOOD,
        description: dto.description?.trim() || null,
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

    const data: Prisma.EquipmentUpdateInput = {};

    if (dto.equipmentCode !== undefined) {
      const equipmentCode = dto.equipmentCode.trim();

      if (!equipmentCode) {
        throw new BadRequestException('Mã thiết bị không được để trống');
      }

      const existedCode = await this.prisma.equipment.findFirst({
        where: {
          equipmentCode,
          equipmentId: {
            not: equipmentId,
          },
        },
      });

      if (existedCode) {
        throw new BadRequestException('Mã thiết bị đã tồn tại');
      }

      data.equipmentCode = equipmentCode;
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      if (!name) {
        throw new BadRequestException('Tên thiết bị không được để trống');
      }

      data.name = name;
    }

    if (dto.categoryId !== undefined) {
      data.category = {
        connect: {
          categoryId: dto.categoryId,
        },
      };
    }

    if (dto.unit !== undefined) {
      data.unit = dto.unit?.trim() || 'cái';
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    return this.prisma.equipment.update({
      where: { equipmentId },
      data,
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
  // Thay vào đó chuyển thiết bị sang trạng thái DISCARDED.
  async remove(equipmentId: number) {
    await this.findOne(equipmentId);

    return this.prisma.equipment.update({
      where: { equipmentId },
      data: {
        status: EquipmentStatus.DISCARDED,
      },
    });
  }

  // Import danh sách thiết bị từ Excel
  // Mẫu Excel mới:
  // Mã thiết bị | Tên thiết bị | Loại thiết bị | Phòng học | Trạng thái | Ghi chú
  //
  // Mỗi dòng Excel là 1 thiết bị riêng.
  // Không dùng cột Số lượng và không cộng dồn số lượng nữa.
  async importEquipmentsFromExcel(file: any) {
    let successCount = 0;
    let failedCount = 0;
    const errors: { row: number; reason: string }[] = [];

    try {
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data: any[] = xlsx.utils.sheet_to_json(sheet);

      let rowNum = 1;

      for (const row of data) {
        rowNum++;

        try {
          const equipmentCodeRaw = row['Mã thiết bị'];
          const nameRaw = row['Tên thiết bị'];
          const categoryNameRaw = row['Loại thiết bị'];
          const roomCodeRaw = row['Phòng học'];
          const statusRaw = row['Trạng thái'];
          const descriptionRaw = row['Ghi chú'];

          const equipmentCode = equipmentCodeRaw
            ? String(equipmentCodeRaw).trim()
            : '';

          const name = nameRaw ? String(nameRaw).trim() : '';
          const categoryName = categoryNameRaw
            ? String(categoryNameRaw).trim()
            : '';
          const roomCode = roomCodeRaw ? String(roomCodeRaw).trim() : '';
          const statusStr = statusRaw ? String(statusRaw).trim() : '';
          const description = descriptionRaw
            ? String(descriptionRaw).trim()
            : null;

          if (!equipmentCode) {
            failedCount++;
            errors.push({ row: rowNum, reason: 'Thiếu Mã thiết bị' });
            continue;
          }

          if (!name) {
            failedCount++;
            errors.push({ row: rowNum, reason: 'Thiếu Tên thiết bị' });
            continue;
          }

          if (!categoryName) {
            failedCount++;
            errors.push({ row: rowNum, reason: 'Thiếu Loại thiết bị' });
            continue;
          }

          const existedEquipment = await this.prisma.equipment.findUnique({
            where: { equipmentCode },
          });

          if (existedEquipment) {
            failedCount++;
            errors.push({
              row: rowNum,
              reason: `Mã thiết bị [${equipmentCode}] đã tồn tại`,
            });
            continue;
          }

          const category = await this.prisma.equipmentCategory.findFirst({
            where: {
              name: categoryName,
            },
          });

          if (!category) {
            failedCount++;
            errors.push({
              row: rowNum,
              reason: `Loại thiết bị [${categoryName}] không tồn tại trong hệ thống`,
            });
            continue;
          }

          let status: EquipmentStatus = EquipmentStatus.GOOD;

          if (statusStr === 'Báo hỏng' || statusStr === 'Hỏng') {
            status = EquipmentStatus.BROKEN;
          } else if (statusStr === 'Đang sửa' || statusStr === 'Bảo trì') {
            status = EquipmentStatus.UNDER_REPAIR;
          } else if (statusStr === 'Thanh lý') {
            status = EquipmentStatus.DISCARDED;
          }

          const equipment = await this.prisma.equipment.create({
            data: {
              equipmentCode,
              name,
              categoryId: category.categoryId,
              unit: 'cái',
              quantity: 1,
              status,
              description,
            },
          });

          if (roomCode) {
            const room = await this.prisma.room.findUnique({
              where: {
                code: roomCode,
              },
            });

            if (room) {
              await this.prisma.equipmentAllocation.create({
                data: {
                  equipmentId: equipment.equipmentId,
                  roomId: room.roomId,
                  quantity: 1,
                  allocatedAt: new Date(),
                  note: 'Import từ Excel',
                },
              });
            } else {
              errors.push({
                row: rowNum,
                reason: `Đã thêm thiết bị nhưng phòng [${roomCode}] không tồn tại`,
              });
            }
          }

          successCount++;
        } catch (e: any) {
          failedCount++;
          errors.push({
            row: rowNum,
            reason: e.message || 'Lỗi hệ thống',
          });
        }
      }

      return { successCount, failedCount, errors };
    } catch (error) {
      throw new BadRequestException(
        'Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.',
      );
    }
  }
}