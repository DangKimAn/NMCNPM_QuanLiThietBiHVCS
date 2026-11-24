import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentTransferDto } from './dto/create-equipment-transfer.dto';
import { CreateBulkEquipmentTransferDto } from './dto/create-bulk-equipment-transfer.dto';
import { RoomService } from '../room/room.service';
import { EventsGateway } from '../events/events.gateway';
import * as xlsx from 'xlsx';

@Injectable()
export class EquipmentTransferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomService: RoomService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async populateRooms(transfer: any) {
    if (!transfer) return null;
    const fromRoom = await this.roomService.findOne(transfer.fromRoomId);
    const toRoom = await this.roomService.findOne(transfer.toRoomId);
    return { ...transfer, fromRoom, toRoom };
  }

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

    if (!fromAllocation) {
      throw new BadRequestException(
        'Thiết bị này không nằm ở phòng chuyển đi.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật phòng mới cho thiết bị này
      await tx.equipmentAllocation.update({
        where: {
          allocationId: fromAllocation.allocationId,
        },
        data: {
          roomId: createDto.toRoomId,
          allocatedAt: new Date(createDto.transferredAt),
          note: createDto.note,
        },
      });

      // 2. Ghi nhận lịch sử chuyển
      const transferResult = await tx.equipmentTransfer.create({
        data: {
          equipmentId: createDto.equipmentId,
          fromRoomId: createDto.fromRoomId,
          toRoomId: createDto.toRoomId,
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
          executor: true,
        },
      });

      // Đồng bộ số lượng với ROOM_API. Nếu API lỗi sẽ tự động rollback transaction
      await this.roomService.updateEquipmentCount(createDto.fromRoomId, 'sub', 1);
      await this.roomService.updateEquipmentCount(createDto.toRoomId, 'add', 1);

      return transferResult;
    }, { timeout: 20000 });

    const populated = await this.populateRooms(result);
    this.eventsGateway.emitEquipmentTransferred({ type: 'transfer', transferId: populated.transferId });
    return populated;
  }

  async createBulk(bulkDto: CreateBulkEquipmentTransferDto) {
    if (!bulkDto.transfers || bulkDto.transfers.length === 0) {
      throw new BadRequestException('Danh sách điều chuyển không được trống.');
    }

    const roomQuantityChangeMap = new Map<number, number>();

    const results = await this.prisma.$transaction(async (tx) => {
      const createdTransfers: any[] = [];

      for (const createDto of bulkDto.transfers) {
        if (createDto.fromRoomId === createDto.toRoomId) {
          throw new BadRequestException('Phòng chuyển đến phải khác phòng chuyển đi.');
        }

        const equipment = await tx.equipment.findUnique({
          where: { equipmentId: createDto.equipmentId },
        });

        if (!equipment) {
          throw new NotFoundException(`Không tìm thấy thiết bị có id = ${createDto.equipmentId}`);
        }

        const fromAllocation = await tx.equipmentAllocation.findFirst({
          where: {
            equipmentId: createDto.equipmentId,
            roomId: createDto.fromRoomId,
          },
        });

        if (!fromAllocation) {
          throw new BadRequestException(`Thiết bị ID ${createDto.equipmentId} không nằm ở phòng chuyển đi.`);
        }

        // 1. Cập nhật phòng mới cho thiết bị
        await tx.equipmentAllocation.update({
          where: { allocationId: fromAllocation.allocationId },
          data: {
            roomId: createDto.toRoomId,
            allocatedAt: new Date(createDto.transferredAt),
            note: createDto.note,
          },
        });

        // 2. Lưu lịch sử
        const transferResult = await tx.equipmentTransfer.create({
          data: {
            equipmentId: createDto.equipmentId,
            fromRoomId: createDto.fromRoomId,
            toRoomId: createDto.toRoomId,
            transferredAt: new Date(createDto.transferredAt),
            executorId: createDto.executorId,
            note: createDto.note,
          },
          include: {
            equipment: { include: { category: true } },
            executor: true,
          },
        });

        createdTransfers.push(transferResult);

        // Gom nhóm sự thay đổi số lượng phòng
        const currentFromQty = roomQuantityChangeMap.get(createDto.fromRoomId) || 0;
        roomQuantityChangeMap.set(createDto.fromRoomId, currentFromQty - 1);

        const currentToQty = roomQuantityChangeMap.get(createDto.toRoomId) || 0;
        roomQuantityChangeMap.set(createDto.toRoomId, currentToQty + 1);
      }

      // Gọi ROOM_API để áp dụng thay đổi (gộp các request lại)
      for (const [roomId, qtyChange] of roomQuantityChangeMap.entries()) {
        if (qtyChange > 0) {
          await this.roomService.updateEquipmentCount(roomId, 'add', qtyChange);
        } else if (qtyChange < 0) {
          await this.roomService.updateEquipmentCount(roomId, 'sub', Math.abs(qtyChange));
        }
      }

      return createdTransfers;
    }, { timeout: 30000 });

    const populated = await Promise.all(results.map(t => this.populateRooms(t)));
    this.eventsGateway.emitEquipmentTransferred({ type: 'transfer_bulk', count: populated.length });
    return populated;
  }

  async findAll() {
    const transfers = await this.prisma.equipmentTransfer.findMany({
      orderBy: {
        transferredAt: 'desc',
      },
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
        executor: true,
      },
    });

    return Promise.all(transfers.map(t => this.populateRooms(t)));
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
        executor: true,
      },
    });

    if (!transfer) {
      throw new NotFoundException(
        `Không tìm thấy lịch sử điều chuyển có id = ${id}`,
      );
    }

    return this.populateRooms(transfer);
  }

  async importFromExcel(file: any) {
    let successCount = 0;
    let failedCount = 0;

    const errors: any[] = [];

    try {
      const workbook = xlsx.read(file.buffer, {
        type: 'buffer',
      });

      const sheetName = workbook.SheetNames[0];

      const sheet = workbook.Sheets[sheetName];

      const data: any[] = xlsx.utils.sheet_to_json(sheet);

      const rooms = await this.roomService.findAll({});

      for (let i = 0; i < data.length; i++) {
        const row = data[i];

        try {
          const equipmentCode = String(row['Mã thiết bị'] || '').trim();

          const toRoomCode = String(row['Phòng mới'] || '').trim();

          const note = String(row['Ghi chú'] || '').trim();

          if (!equipmentCode) {
            throw new BadRequestException('Thiếu mã thiết bị');
          }

          if (!toRoomCode) {
            throw new BadRequestException('Thiếu phòng mới');
          }

          // tìm thiết bị
          const equipment = await this.prisma.equipment.findUnique({
            where: {
              equipmentCode,
            },
            include: {
              allocations: true,
            },
          });

          if (!equipment) {
            throw new BadRequestException(
              `Không tìm thấy thiết bị ${equipmentCode}`,
            );
          }

          const currentAllocation = equipment.allocations[0];

          if (!currentAllocation) {
            throw new BadRequestException(
              `Thiết bị ${equipmentCode} chưa có phòng`,
            );
          }

          // tìm phòng mới
          const toRoom = rooms.find(
            (r: any) => r.code === toRoomCode,
          );

          if (!toRoom) {
            throw new BadRequestException(
              `Phòng ${toRoomCode} không tồn tại`,
            );
          }

          if (currentAllocation.roomId === toRoom.roomId) {
            throw new BadRequestException(
              'Phòng mới trùng phòng hiện tại',
            );
          }

          // transaction
          await this.prisma.$transaction(async (tx) => {
            // update allocation
            await tx.equipmentAllocation.update({
              where: {
                allocationId: currentAllocation.allocationId,
              },
              data: {
                roomId: toRoom.roomId,
                allocatedAt: new Date(),
                note,
              },
            });

            // tạo lịch sử transfer
            await tx.equipmentTransfer.create({
              data: {
                equipmentId: equipment.equipmentId,
                fromRoomId: currentAllocation.roomId,
                toRoomId: toRoom.roomId,

                // sửa executorId theo user đang login
                executorId: 1,

                transferredAt: new Date(),

                note:
                  note || 'Import điều chuyển từ Excel',
              },
            });
          });

          // update ROOM_API
          await this.roomService.updateEquipmentCount(
            currentAllocation.roomId,
            'sub',
            1,
          );

          await this.roomService.updateEquipmentCount(
            toRoom.roomId,
            'add',
            1,
          );

          successCount++;
        } catch (error: any) {
          failedCount++;

          errors.push({
            row: i + 2,
            reason: error.message,
          });
        }
      }

      this.eventsGateway.emitEquipmentTransferred({ type: 'transfer_import', successCount });

      return {
        successCount,
        failedCount,
        errors,
      };
    } catch (error) {
      throw new BadRequestException(
        'Lỗi đọc file Excel',
      );
    }
  }
}