import { Test, TestingModule } from '@nestjs/testing';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';

describe('RoomController', () => {
  let controller: RoomController;
  let roomService: jest.Mocked<Partial<RoomService>>;

  beforeEach(async () => {
    roomService = {
      findAll: jest
        .fn()
        .mockResolvedValue([
          { roomId: 1, name: 'A201', capacity: 40, status: 'AVAILABLE' },
        ] as any),
      findOne: jest.fn().mockResolvedValue({ roomId: 1, name: 'A201' } as any),
      create: jest.fn().mockResolvedValue({ roomId: 2, name: 'B102' } as any),
      remove: jest.fn().mockResolvedValue({ message: 'Xóa thành công' } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [{ provide: RoomService, useValue: roomService }],
    }).compile();

    controller = module.get<RoomController>(RoomController);
  });

  it('TC-ROOM-01: Lấy danh sách phòng học thành công', async () => {
    const result = await controller.findAll('A201');
    expect(result).toHaveLength(1);
    expect(roomService.findAll).toHaveBeenCalledWith({ search: 'A201' });
  });

  it('TC-ROOM-02: Lấy chi tiết phòng học theo roomId', async () => {
    const result = await controller.findOne('1');
    expect(result.roomId).toBe(1);
    expect(roomService.findOne).toHaveBeenCalledWith(1);
  });

  it('TC-ROOM-03: Admin/Manager tạo phòng học mới', async () => {
    const dto = { name: 'B102', totalEquipments: 50 };
    const result = await controller.create(dto);
    expect(result.name).toBe('B102');
    expect(roomService.create).toHaveBeenCalledWith(dto);
  });

  it('TC-ROOM-04: Admin/Manager xóa phòng học', async () => {
    const result = await controller.remove('1');
    expect(result).toHaveProperty('message');
    expect(roomService.remove).toHaveBeenCalledWith(1);
  });
});
