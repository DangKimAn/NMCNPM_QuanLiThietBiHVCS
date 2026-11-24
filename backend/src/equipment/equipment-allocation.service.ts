import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentAllocationDto } from './dto/create-equipment-allocation.dto';
import { UpdateEquipmentAllocationDto } from './dto/update-equipment-allocation.dto';
import { CreateBulkEquipmentAllocationDto } from './dto/create-bulk-equipment-allocation.dto';
import { BulkDeleteEquipmentAllocationDto } from './dto/bulk-delete-equipment-allocation.dto';
import { RoomService } from '../room/room.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class EquipmentAllocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomService: RoomService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async populateRoom(allocation: any) {
    if (!allocation) return null;
    const room = await this.roomService.findOne(allocation.roomId);
    return { ...allocation, room };
  }

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

    const existedAllocation = await this.prisma.equipmentAllocation.findFirst({
      where: {
        equipmentId: createDto.equipmentId,
      },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      let allocResult;
      if (existedAllocation) {
        allocResult = await tx.equipmentAllocation.update({
          where: {
            allocationId: existedAllocation.allocationId,
          },
          data: {
            roomId: createDto.roomId,
            allocatedAt: new Date(createDto.allocatedAt),
            note: createDto.note,
          },
          include: {
            equipment: { include: { category: true } },
          },
        });
        
        // Nếu chuyển phòng, trừ phòng cũ, cộng phòng mới
        if (existedAllocation.roomId !== createDto.roomId) {
          await this.roomService.updateEquipmentCount(existedAllocation.roomId, 'sub', 1);
          await this.roomService.updateEquipmentCount(createDto.roomId, 'add', 1);
        }
      } else {
        allocResult = await tx.equipmentAllocation.create({
          data: {
            equipmentId: createDto.equipmentId,
            roomId: createDto.roomId,
            allocatedAt: new Date(createDto.allocatedAt),
            note: createDto.note,
          },
          include: {
            equipment: { include: { category: true } },
          },
        });
        
        await this.roomService.updateEquipmentCount(createDto.roomId, 'add', 1);
      }
      
      return allocResult;
    });

    const populated = await this.populateRoom(result);
    this.eventsGateway.emitEquipmentTransferred({ type: 'allocation', allocationId: populated.allocationId });
    return populated;
  }

  async createBulk(bulkDto: CreateBulkEquipmentAllocationDto) {
    if (!bulkDto.allocations || bulkDto.allocations.length === 0) {
      throw new BadRequestException('Danh sách phân bổ không được trống.');
    }

    // Tối ưu hóa: Gom nhóm theo roomId để hạn chế gọi ROOM_API
    const roomAddQuantityMap = new Map<number, number>();
    const roomSubQuantityMap = new Map<number, number>();

    const results = await this.prisma.$transaction(async (tx) => {
      const createdAllocations: any[] = [];

      for (const createDto of bulkDto.allocations) {
        const equipment = await tx.equipment.findUnique({
          where: { equipmentId: createDto.equipmentId },
        });

        if (!equipment) {
          throw new NotFoundException(`Không tìm thấy thiết bị có id = ${createDto.equipmentId}`);
        }

        const existedAllocation = await tx.equipmentAllocation.findFirst({
          where: {
            equipmentId: createDto.equipmentId,
          },
        });

        let allocResult;
        if (existedAllocation) {
          allocResult = await tx.equipmentAllocation.update({
            where: { allocationId: existedAllocation.allocationId },
            data: {
              roomId: createDto.roomId,
              allocatedAt: new Date(createDto.allocatedAt),
              note: createDto.note,
            },
            include: { equipment: { include: { category: true } } },
          });

          if (existedAllocation.roomId !== createDto.roomId) {
            const currentSub = roomSubQuantityMap.get(existedAllocation.roomId) || 0;
            roomSubQuantityMap.set(existedAllocation.roomId, currentSub + 1);
            
            const currentAdd = roomAddQuantityMap.get(createDto.roomId) || 0;
            roomAddQuantityMap.set(createDto.roomId, currentAdd + 1);
          }
        } else {
          allocResult = await tx.equipmentAllocation.create({
            data: {
              equipmentId: createDto.equipmentId,
              roomId: createDto.roomId,
              allocatedAt: new Date(createDto.allocatedAt),
              note: createDto.note,
            },
            include: { equipment: { include: { category: true } } },
          });

          const currentAdd = roomAddQuantityMap.get(createDto.roomId) || 0;
          roomAddQuantityMap.set(createDto.roomId, currentAdd + 1);
        }

        createdAllocations.push(allocResult);
      }

      // Gọi ROOM_API cho từng phòng đã được gom nhóm
      for (const [roomId, totalSub] of roomSubQuantityMap.entries()) {
        await this.roomService.updateEquipmentCount(roomId, 'sub', totalSub);
      }
      for (const [roomId, totalAdd] of roomAddQuantityMap.entries()) {
        await this.roomService.updateEquipmentCount(roomId, 'add', totalAdd);
      }

      return createdAllocations;
    });

    const populated = await Promise.all(results.map(a => this.populateRoom(a)));
    this.eventsGateway.emitEquipmentTransferred({ type: 'allocation_bulk', count: populated.length });
    return populated;
  }

  async findAll() {
    const allocations = await this.prisma.equipmentAllocation.findMany({
      orderBy: {
        allocationId: 'desc',
      },
      include: {
        equipment: {
          include: {
            category: true,
          },
        },
      },
    });

    return Promise.all(allocations.map(a => this.populateRoom(a)));
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
      },
    });

    if (!allocation) {
      throw new NotFoundException(
        `Không tìm thấy bản ghi phân bổ có id = ${id}`,
      );
    }

    return this.populateRoom(allocation);
  }

  async update(id: number, updateDto: UpdateEquipmentAllocationDto) {
    const currentAllocation = await this.prisma.equipmentAllocation.findUnique({
      where: { allocationId: id }
    });
    
    if (!currentAllocation) {
      throw new NotFoundException(`Không tìm thấy bản ghi phân bổ có id = ${id}`);
    }

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

    const newRoomId = updateDto.roomId ?? currentAllocation.roomId;

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedAlloc = await tx.equipmentAllocation.update({
        where: {
          allocationId: id,
        },
        data: {
          equipmentId: updateDto.equipmentId,
          roomId: updateDto.roomId,
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
        },
      });

      if (newRoomId !== currentAllocation.roomId) {
        // Phòng bị đổi: trừ 1 ở phòng cũ, cộng 1 ở phòng mới
        await this.roomService.updateEquipmentCount(currentAllocation.roomId, 'sub', 1);
        await this.roomService.updateEquipmentCount(newRoomId, 'add', 1);
      }

      return updatedAlloc;
    });

    return this.populateRoom(result);
  }

  async remove(id: number) {
    const currentAllocation = await this.prisma.equipmentAllocation.findUnique({
      where: { allocationId: id }
    });
    
    if (!currentAllocation) {
      throw new NotFoundException(`Không tìm thấy bản ghi phân bổ có id = ${id}`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const deletedAlloc = await tx.equipmentAllocation.delete({
        where: {
          allocationId: id,
        },
      });

      await this.roomService.updateEquipmentCount(deletedAlloc.roomId, 'sub', 1);
      return deletedAlloc;
    });

    return result;
  }

  async removeBulk(bulkDeleteDto: BulkDeleteEquipmentAllocationDto) {
    if (!bulkDeleteDto.allocationIds || bulkDeleteDto.allocationIds.length === 0) {
      throw new BadRequestException('Danh sách ID không được trống.');
    }

    const roomQuantityMap = new Map<number, number>();

    const result = await this.prisma.$transaction(async (tx) => {
      const deletedAllocations: any[] = [];

      for (const id of bulkDeleteDto.allocationIds) {
        const currentAllocation = await tx.equipmentAllocation.findUnique({
          where: { allocationId: id }
        });
        
        if (!currentAllocation) {
          throw new NotFoundException(`Không tìm thấy bản ghi phân bổ có id = ${id}`);
        }

        const deletedAlloc = await tx.equipmentAllocation.delete({
          where: { allocationId: id },
        });

        deletedAllocations.push(deletedAlloc);

        const currentQty = roomQuantityMap.get(deletedAlloc.roomId) || 0;
        roomQuantityMap.set(deletedAlloc.roomId, currentQty + 1);
      }

      // Gọi ROOM_API cho từng phòng đã được gom nhóm
      for (const [roomId, totalQuantity] of roomQuantityMap.entries()) {
        await this.roomService.updateEquipmentCount(roomId, 'sub', totalQuantity);
      }

      return { success: true, count: deletedAllocations.length };
    });

    return result;
  }
}