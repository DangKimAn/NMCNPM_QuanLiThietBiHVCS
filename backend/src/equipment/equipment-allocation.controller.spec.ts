import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentAllocationController } from './equipment-allocation.controller';
import { EquipmentAllocationService } from './equipment-allocation.service';

describe('EquipmentAllocationController', () => {
  let controller: EquipmentAllocationController;
  let service: jest.Mocked<Partial<EquipmentAllocationService>>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn().mockResolvedValue([
        { allocationId: 1, equipmentId: 10, roomId: 1 },
      ] as any),
      findOne: jest.fn().mockResolvedValue({ allocationId: 1, equipmentId: 10, roomId: 1 } as any),
      create: jest.fn().mockResolvedValue({ allocationId: 2, equipmentId: 11, roomId: 2 } as any),
      createBulk: jest.fn().mockResolvedValue({ count: 3 } as any),
      removeBulk: jest.fn().mockResolvedValue({ message: 'Đã xóa 2 phân bổ' } as any),
      update: jest.fn().mockResolvedValue({ allocationId: 1, roomId: 3 } as any),
      remove: jest.fn().mockResolvedValue({ message: 'Đã hủy phân bổ' } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentAllocationController],
      providers: [
        { provide: EquipmentAllocationService, useValue: service },
      ],
    }).compile();

    controller = module.get<EquipmentAllocationController>(EquipmentAllocationController);
  });

  it('TC-ALLOC-01: Gán 1 thiết bị vào phòng học', async () => {
    const dto = { equipmentId: 11, roomId: 2, allocatedDate: '2026-11-24' };
    const result = await controller.create(dto as any);
    expect(result.allocationId).toBe(2);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('TC-ALLOC-02: Gán hàng loạt thiết bị vào phòng (bulk)', async () => {
    const dto = { equipmentIds: [1, 2, 3], roomId: 2, allocatedDate: '2026-11-24' };
    const result = await controller.createBulk(dto as any);
    expect(result.count).toBe(3);
    expect(service.createBulk).toHaveBeenCalledWith(dto);
  });

  it('TC-ALLOC-03: Hủy gán hàng loạt thiết bị (bulk delete)', async () => {
    const dto = { allocationIds: [1, 2] };
    const result = await controller.removeBulk(dto as any);
    expect(result).toHaveProperty('message');
    expect(service.removeBulk).toHaveBeenCalledWith(dto);
  });

  it('TC-ALLOC-04: Lấy danh sách phân bổ thiết bị', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('TC-ALLOC-05: Xem chi tiết 1 phân bổ thiết bị', async () => {
    const result = await controller.findOne(1);
    expect(result.allocationId).toBe(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('TC-ALLOC-06: Cập nhật thông tin phân bổ', async () => {
    const dto = { roomId: 3 };
    const result = await controller.update(1, dto as any);
    expect(result.roomId).toBe(3);
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('TC-ALLOC-07: Hủy phân bổ thiết bị theo id', async () => {
    const result = await controller.remove(1);
    expect(result).toHaveProperty('message');
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
