import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  private get baseUrl() {
    return process.env.ROOM_API ? `${process.env.ROOM_API}/api/rooms` : 'http://localhost:3000/api/rooms';
  }

  // Simple in-memory cache
  private cachedRooms: any[] = [];
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 300000; // 5 minutes

  private async fetchRoomsFromApi(): Promise<any[]> {
    const now = Date.now();
    if (this.cachedRooms.length > 0 && (now - this.cacheTimestamp < this.CACHE_TTL)) {
      return this.cachedRooms;
    }

    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      const data = await response.json();
      
      const rawRooms = data.data || [];
      this.cachedRooms = rawRooms.map((r: any) => ({
        roomId: r.id,
        code: r.name,
        name: r.name,
        capacity: r.totalEquipments || 0,
        status: 'AVAILABLE',
      }));
      this.cacheTimestamp = now;

      return this.cachedRooms;
    } catch (error) {
      console.error(error);
      // Fallback to cache if API is down but we have stale cache
      if (this.cachedRooms.length > 0) return this.cachedRooms;
      return [];
    }
  }

  // Lấy danh sách phòng học kèm thiết bị, có hỗ trợ tìm kiếm
  async findAll(query: { search?: string }) {
    let rooms = await this.fetchRoomsFromApi();

    // Lấy tất cả allocation kèm equipment + category từ DB
    const allocations = await this.prisma.equipmentAllocation.findMany({
      include: {
        equipment: {
          include: { category: true },
        },
      },
    });

    // Gộp allocations vào từng phòng
    rooms = rooms.map((room: any) => ({
      ...room,
      allocations: allocations
        .filter((a) => a.roomId === room.roomId)
        .map((a) => ({
          allocationId: a.allocationId,
          quantity: 1,
          equipment: {
            equipmentId: a.equipment.equipmentId,
            equipmentCode: a.equipment.equipmentCode,
            name: a.equipment.name,
            status: a.equipment.status,
            category: a.equipment.category
              ? { categoryId: a.equipment.category.categoryId, name: a.equipment.category.name }
              : null,
          },
        })),
    }));

    if (query.search) {
      const lowerSearch = query.search.toLowerCase();
      return rooms.filter((r: any) => 
        r.name.toLowerCase().includes(lowerSearch) || 
        r.code.toLowerCase().includes(lowerSearch)
      );
    }
    return rooms;
  }

  // Lấy chi tiết một phòng học
  async findOne(roomId: number) {
    const rooms = await this.fetchRoomsFromApi();
    const room = rooms.find((r: any) => r.roomId === roomId);
    return room || null;
  }

  // Thêm phòng học mới
  async create(dto: CreateRoomDto) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: dto.name }),
      });
      if (!response.ok) {
        throw new Error('Failed to create room');
      }
      
      // Invalidate cache
      this.cacheTimestamp = 0;

      const data = await response.json();
      return {
        roomId: data.id,
        code: data.name,
        name: data.name,
        capacity: data.totalEquipments || 0,
        status: 'AVAILABLE',
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Lỗi khi tạo phòng học mới qua hệ thống ngoài');
    }
  }

  // Cập nhật phòng học
  async update(roomId: number, dto: UpdateRoomDto) {
    throw new InternalServerErrorException('API hiện tại không hỗ trợ cập nhật thông tin phòng');
  }

  // Xóa phòng học
  async remove(roomId: number) {
    try {
      const response = await fetch(`${this.baseUrl}/${roomId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }
      
      // Invalidate cache
      this.cacheTimestamp = 0;

      return { success: true, message: 'Xóa phòng học thành công' };
    } catch (error: any) {
      console.error(error);
      throw new InternalServerErrorException(error.message || 'Lỗi khi xóa phòng học');
    }
  }

  // Cập nhật số lượng thiết bị (cộng/trừ) qua API và tự động ROLLBACK Prisma nếu lỗi
  async updateEquipmentCount(roomId: number, action: 'add' | 'sub', amount: number) {
    if (!roomId) return null;
    
    // Invalidate cache since count will change
    this.cacheTimestamp = 0;

    const response = await fetch(`${this.baseUrl}/${roomId}/equipment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, amount }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundException(`Phòng học ID ${roomId} không tồn tại trên ROOM_API`);
      }
      if (response.status === 400) {
        const err = await response.json();
        throw new InternalServerErrorException(err.error || 'Lỗi cập nhật số lượng thiết bị trên ROOM_API');
      }
      throw new InternalServerErrorException(`Lỗi hệ thống khi gọi ROOM_API (Status: ${response.status})`);
    }

    const data = await response.json();
    
    return {
      roomId: data.id,
      code: data.name,
      name: data.name,
      capacity: data.totalEquipments || 0,
      status: 'AVAILABLE',
    };
  }
}