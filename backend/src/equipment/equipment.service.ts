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
          const name = row['Tên thiết bị'];
          const categoryName = row['Loại thiết bị'];
          const roomCode = row['Phòng học'];
          const quantity = Number(row['Số lượng']) || 1;
          const statusStr = row['Trạng thái'];
          const description = row['Ghi chú'];

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

          const category = await this.prisma.equipmentCategory.findFirst({
            where: { name: String(categoryName) }
          });

          if (!category) {
            failedCount++;
            errors.push({ row: rowNum, reason: `Loại thiết bị [${categoryName}] không tồn tại trong hệ thống` });
            continue;
          }

          let status: EquipmentStatus = EquipmentStatus.GOOD;
          if (statusStr === 'Báo hỏng') status = EquipmentStatus.BROKEN;
          else if (statusStr === 'Đang sửa' || statusStr === 'Bảo trì') status = EquipmentStatus.UNDER_REPAIR;
          else if (statusStr === 'Thanh lý') status = EquipmentStatus.DISCARDED;

          // Tìm thiết bị trùng tên, loại, trạng thái
          let equipment = await this.prisma.equipment.findFirst({
            where: {
              name: String(name),
              categoryId: category.categoryId,
              status: status,
            },
          });

          if (equipment) {
            equipment = await this.prisma.equipment.update({
              where: { equipmentId: equipment.equipmentId },
              data: { quantity: equipment.quantity + quantity },
            });
          } else {
            equipment = await this.prisma.equipment.create({
              data: {
                name: String(name),
                categoryId: category.categoryId,
                unit: 'cái',
                quantity,
                status,
                description: description ? String(description) : null,
              },
            });
          }

          if (roomCode) {
            const room = await this.prisma.room.findUnique({
              where: { code: String(roomCode) },
            });

            if (room) {
              const existingAllocation = await this.prisma.equipmentAllocation.findFirst({
                where: {
                  equipmentId: equipment.equipmentId,
                  roomId: room.roomId,
                },
              });

              if (existingAllocation) {
                await this.prisma.equipmentAllocation.update({
                  where: { allocationId: existingAllocation.allocationId },
                  data: { quantity: existingAllocation.quantity + quantity },
                });
              } else {
                await this.prisma.equipmentAllocation.create({
                  data: {
                    equipmentId: equipment.equipmentId,
                    roomId: room.roomId,
                    quantity,
                    allocatedAt: new Date(),
                    note: 'Import từ Excel',
                  },
                });
              }
            } else {
              // Bỏ qua allocation hoặc báo lỗi nhẹ, nhưng thiết bị đã được tạo/cộng dồn
              errors.push({
                row: rowNum,
                reason: `Đã thêm/cộng dồn thiết bị nhưng phòng [${roomCode}] không tồn tại`,
              });
            }
          }

          successCount++;
        } catch (e: any) {
          failedCount++;
          errors.push({ row: rowNum, reason: e.message || 'Lỗi hệ thống' });
        }
      }

      return { successCount, failedCount, errors };
    } catch (error) {
      throw new BadRequestException('Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.');
    }
  }
}