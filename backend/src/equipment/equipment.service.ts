import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EquipmentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';
import { CreateBulkEquipmentDto } from './dto/create-bulk-equipment.dto';
import { RoomService } from '../room/room.service';
import * as xlsx from 'xlsx';

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomService: RoomService,
  ) {}

  private formatEquipmentCode(categoryName: string, inputCode: string): string {
    if (!categoryName || !inputCode) return inputCode;
    
    // Sinh tiền tố viết tắt từ tên danh mục (vd: "Máy chiếu" -> "MC", "Bảng từ" -> "BT")
    const words = categoryName.split(' ').filter(w => w.trim().length > 0);
    const acronym = words.map(w => w.charAt(0).toUpperCase()).join('');
    const prefix = `${acronym}-PTITHCM-`;
    
    if (inputCode.startsWith(prefix)) {
      return inputCode;
    }
    
    // Nếu mã đã có tiền tố kiểu khác thì cắt bỏ đi để thay tiền tố mới
    const cleanCode = inputCode.replace(/^.*?-PTITHCM-/, '');
    return `${prefix}${cleanCode}`;
  }

  private async populateRoomsForEquipmentList(equipments: any[]) {
    if (!equipments.length) return equipments;
    const rooms = await this.roomService.findAll({});
    const roomMap = new Map(rooms.map((r: any) => [r.roomId, r]));

    return equipments.map(eq => {
      if (eq.allocations) {
        eq.allocations = eq.allocations.map((a: any) => ({
          ...a,
          room: roomMap.get(a.roomId) || null
        }));
      }
      return eq;
    });
  }

  private async populateRoomsForSingleEquipment(equipment: any) {
    if (!equipment) return null;
    const rooms = await this.roomService.findAll({});
    const roomMap = new Map(rooms.map((r: any) => [r.roomId, r]));

    if (equipment.allocations) {
      equipment.allocations = equipment.allocations.map((a: any) => ({
        ...a,
        room: roomMap.get(a.roomId) || null
      }));
    }
    if (equipment.transfers) {
      equipment.transfers = equipment.transfers.map((t: any) => ({
        ...t,
        fromRoom: roomMap.get(t.fromRoomId) || null,
        toRoom: roomMap.get(t.toRoomId) || null
      }));
    }
    if (equipment.reports) {
      equipment.reports = equipment.reports.map((r: any) => ({
        ...r,
        room: roomMap.get(r.roomId) || null
      }));
    }

    return equipment;
  }

  // Lấy danh sách thiết bị
  async findAll(query: {
    search?: string;
    status?: EquipmentStatus | 'need-handle';
    roomId?: number;
    categoryId?: number;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.EquipmentWhereInput = {};

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

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.status) {
      if (query.status === 'need-handle') {
        where.status = {
          in: [EquipmentStatus.BROKEN, EquipmentStatus.UNDER_REPAIR],
        };
      } else {
        where.status = query.status;
      }
    }

    if (query.roomId) {
      where.allocations = {
        some: {
          roomId: query.roomId,
        },
      };
    }

    const page = query.page;
    const limit = query.limit || 500;

    if (page) {
      const skip = (page - 1) * limit;

      const [equipments, total] = await Promise.all([
        this.prisma.equipment.findMany({
          where,
          orderBy: { equipmentId: 'asc' },
          skip,
          take: limit,
          include: {
            category: true,
            allocations: {

            },
          },
        }),
        this.prisma.equipment.count({ where }),
      ]);

      const data = await this.populateRoomsForEquipmentList(equipments);

      return { data, total, page, limit };
    }

    const equipments = await this.prisma.equipment.findMany({
      where,
      orderBy: { equipmentId: 'asc' },
      include: {
        category: true,
        allocations: {

        },
      },
    });

    return this.populateRoomsForEquipmentList(equipments);
  }

  // Lấy chi tiết thiết bị
  async findOne(equipmentId: number) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { equipmentId },
      include: {
        category: true,
        allocations: true,
        transfers: {
          include: {
            executor: true,
          },
          orderBy: {
            transferredAt: 'desc',
          },
        },
        reports: {
          include: {
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

    return this.populateRoomsForSingleEquipment(equipment);
  }

  // Thêm thiết bị mới
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

    const formattedEquipmentCode = this.formatEquipmentCode(category.name, equipmentCode);

    const existedCode = await this.prisma.equipment.findUnique({
      where: { equipmentCode: formattedEquipmentCode },
    });

    if (existedCode) {
      throw new BadRequestException('Mã thiết bị đã tồn tại');
    }

    return this.prisma.equipment.create({
      data: {
        equipmentCode: formattedEquipmentCode,
        name,
        categoryId: dto.categoryId,
        unit: dto.unit?.trim() || 'cái',
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
    const currentEquipment = await this.findOne(equipmentId);

    let categoryToUse = currentEquipment.category;
    if (dto.categoryId) {
      categoryToUse = await this.prisma.equipmentCategory.findUnique({
        where: { categoryId: dto.categoryId },
      });

      if (!categoryToUse) {
        throw new BadRequestException('Loại thiết bị không tồn tại');
      }
    }

    const data: Prisma.EquipmentUpdateInput = {};

    let equipmentCode = dto.equipmentCode !== undefined ? dto.equipmentCode.trim() : currentEquipment.equipmentCode;
    
    if (!equipmentCode) {
      throw new BadRequestException('Mã thiết bị không được để trống');
    }

    equipmentCode = this.formatEquipmentCode(categoryToUse.name, equipmentCode);

    if (equipmentCode !== currentEquipment.equipmentCode) {
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

    const result = await this.prisma.equipment.update({
      where: { equipmentId },
      data,
      include: {
        category: true,
        allocations: true,
      },
    });
    
    return this.populateRoomsForSingleEquipment(result);
  }

  // Cập nhật trạng thái thiết bị
  async updateStatus(equipmentId: number, dto: UpdateEquipmentStatusDto) {
    await this.findOne(equipmentId);

    const result = await this.prisma.equipment.update({
      where: { equipmentId },
      data: {
        status: dto.status,
        description: dto.description,
      },
      include: {
        category: true,
        allocations: true,
      },
    });

    return this.populateRoomsForSingleEquipment(result);
  }

  // Xóa thiết bị
  async remove(equipmentId: number) {
    await this.findOne(equipmentId);

    return this.prisma.equipment.update({
      where: { equipmentId },
      data: {
        status: EquipmentStatus.DISCARDED,
      },
    });
  }

  // Thêm thiết bị hàng loạt
  async createBulk(dto: CreateBulkEquipmentDto) {
    if (!dto.equipments || dto.equipments.length === 0) {
      throw new BadRequestException('Danh sách thiết bị không được trống.');
    }

    const roomQuantityMap = new Map<number, number>();
    
    // Fetch categories first to format codes
    const categoryIds = [...new Set(dto.equipments.map(e => e.categoryId))];
    const categories = await this.prisma.equipmentCategory.findMany({
      where: { categoryId: { in: categoryIds } },
    });
    const categoryMap = new Map(categories.map(c => [c.categoryId, c]));

    // Format all codes
    for (const item of dto.equipments) {
      const category = categoryMap.get(item.categoryId);
      if (!category) {
        throw new BadRequestException(`Loại thiết bị ID ${item.categoryId} không tồn tại.`);
      }
      item.equipmentCode = this.formatEquipmentCode(category.name, item.equipmentCode);
    }

    const equipmentCodes = dto.equipments.map(e => e.equipmentCode);
    
    const uniqueCodes = new Set(equipmentCodes);
    if (uniqueCodes.size !== equipmentCodes.length) {
      throw new BadRequestException('Danh sách thiết bị chứa các mã trùng lặp.');
    }

    const existingEquipments = await this.prisma.equipment.findMany({
      where: { equipmentCode: { in: equipmentCodes } },
      select: { equipmentCode: true },
    });

    if (existingEquipments.length > 0) {
      const existingCodes = existingEquipments.map(e => e.equipmentCode).join(', ');
      throw new BadRequestException(`Các mã thiết bị đã tồn tại trong hệ thống: ${existingCodes}`);
    }

    const rooms = await this.roomService.findAll({});

    const results = await this.prisma.$transaction(async (tx) => {
      const createdEquipments: any[] = [];

      for (const item of dto.equipments) {
        // We already validated categories above
        const category = categoryMap.get(item.categoryId)!;

        const equipment = await tx.equipment.create({
          data: {
            equipmentCode: item.equipmentCode,
            name: item.name,
            categoryId: item.categoryId,
            unit: item.unit || 'cái',
            status: item.status || EquipmentStatus.GOOD,
            description: item.description || null,
          },
        });

        if (item.roomId) {
          const room = rooms.find((r: any) => r.roomId === item.roomId);
          if (!room) {
            throw new BadRequestException(`Phòng học ID ${item.roomId} không tồn tại.`);
          }

          await tx.equipmentAllocation.create({
            data: {
              equipmentId: equipment.equipmentId,
              roomId: item.roomId,
              allocatedAt: new Date(),
              note: 'Tạo hàng loạt',
            },
          });

          const currentQty = roomQuantityMap.get(item.roomId) || 0;
          roomQuantityMap.set(item.roomId, currentQty + 1);
        }

        createdEquipments.push(equipment);
      }

      for (const [roomId, totalQuantity] of roomQuantityMap.entries()) {
        await this.roomService.updateEquipmentCount(roomId, 'add', totalQuantity);
      }

      return createdEquipments;
    }, { timeout: 30000 });

    return {
      success: true,
      message: `Đã tạo thành công ${results.length} thiết bị.`,
      data: results
    };
  }

  // Import danh sách thiết bị từ Excel
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
      const rooms = await this.roomService.findAll({});
      const validItems: any[] = [];

      // Validate phase
      for (const row of data) {
        rowNum++;
        const equipmentCodeRaw = row['Mã thiết bị'];
        const nameRaw = row['Tên thiết bị'];
        const categoryNameRaw = row['Loại thiết bị'];
        const roomCodeRaw = row['Phòng học'];
        const statusRaw = row['Trạng thái'];
        const descriptionRaw = row['Ghi chú'];

        let equipmentCode = equipmentCodeRaw ? String(equipmentCodeRaw).trim() : '';
        const name = nameRaw ? String(nameRaw).trim() : '';
        const categoryName = categoryNameRaw ? String(categoryNameRaw).trim() : '';
        const roomCode = roomCodeRaw ? String(roomCodeRaw).trim() : '';
        const statusStr = statusRaw ? String(statusRaw).trim() : '';
        const description = descriptionRaw ? String(descriptionRaw).trim() : null;

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
          where: { name: categoryName },
        });

        if (!category) {
          failedCount++;
          errors.push({ row: rowNum, reason: `Loại thiết bị [${categoryName}] không tồn tại trong hệ thống` });
          continue;
        }


        if (!equipmentCode) {
          failedCount++;
          errors.push({ row: rowNum, reason: 'Thiếu Mã thiết bị' });
          continue;
        }

        equipmentCode = this.formatEquipmentCode(category.name, equipmentCode);

        const existedEquipment = await this.prisma.equipment.findUnique({
          where: { equipmentCode },
        });

        if (existedEquipment) {
          failedCount++;
          errors.push({ row: rowNum, reason: `Mã thiết bị [${equipmentCode}] đã tồn tại trong hệ thống` });
          continue;
        }

        const inMemoryDuplicate = validItems.some(item => item.equipmentCode === equipmentCode);
        if (inMemoryDuplicate) {
          failedCount++;
          errors.push({ row: rowNum, reason: `Mã thiết bị [${equipmentCode}] bị trùng lặp với dòng trước đó trong file Excel` });
          continue;
        }
        
        let roomId = null;
        if (roomCode) {
          const room = rooms.find((r: any) => r.code === roomCode);
          if (!room) {
            failedCount++;
            errors.push({ row: rowNum, reason: `Phòng học [${roomCode}] không tồn tại trên ROOM_API` });
            continue;
          }
          roomId = room.roomId;
        }

        let status: EquipmentStatus = EquipmentStatus.GOOD;
        if (statusStr === 'Báo hỏng' || statusStr === 'Hỏng') {
          status = EquipmentStatus.BROKEN;
        } else if (statusStr === 'Đang sửa' || statusStr === 'Bảo trì') {
          status = EquipmentStatus.UNDER_REPAIR;
        } else if (statusStr === 'Thanh lý') {
          status = EquipmentStatus.DISCARDED;
        }

        validItems.push({
          row: rowNum,
          equipmentCode,
          name,
          categoryId: category.categoryId,
          roomId,
          status,
          description
        });
      }

      // Execution phase (all valid items in one transaction)
      if (validItems.length > 0) {
        const roomQuantityMap = new Map<number, number>();
        
        try {
          await this.prisma.$transaction(async (tx) => {
            for (const item of validItems) {
              const equipment = await tx.equipment.create({
                data: {
                  equipmentCode: item.equipmentCode,
                  name: item.name,
                  categoryId: item.categoryId,
                  unit: 'cái',
                  status: item.status,
                  description: item.description,
                },
              });

              if (item.roomId) {
                await tx.equipmentAllocation.create({
                  data: {
                    equipmentId: equipment.equipmentId,
                    roomId: item.roomId,
                    allocatedAt: new Date(),
                    note: 'Import từ Excel',
                  },
                });

                const currentQty = roomQuantityMap.get(item.roomId) || 0;
                roomQuantityMap.set(item.roomId, currentQty + 1);
              }
              successCount++;
            }
          });

          // Cập nhật ROOM_API bên ngoài transaction để tránh timeout database
          for (const [roomId, totalQuantity] of roomQuantityMap.entries()) {
            await this.roomService.updateEquipmentCount(roomId, 'add', totalQuantity);
          }

        } catch (error: any) {
          // If transaction fails, nothing is saved
          successCount = 0;
          failedCount += validItems.length;
          errors.push({ row: -1, reason: `Lỗi hệ thống khi lưu dữ liệu hoặc cập nhật ROOM_API: ${error.message}` });
        }
      }

      return { successCount, failedCount, errors };
    } catch (error) {
      throw new BadRequestException('Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.');
    }
  }
}