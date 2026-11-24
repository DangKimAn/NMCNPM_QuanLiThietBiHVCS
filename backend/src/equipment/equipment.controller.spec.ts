import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { EquipmentStatus } from '@prisma/client';

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let service: jest.Mocked<Partial<EquipmentService>>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn().mockResolvedValue({
        data: [{ equipmentId: 1, equipmentCode: 'MC01', name: 'Máy chiếu Sony' }],
        total: 1,
      } as any),
      findOne: jest.fn().mockResolvedValue({ equipmentId: 1, equipmentCode: 'MC01' } as any),
      create: jest.fn().mockResolvedValue({ equipmentId: 2, equipmentCode: 'MC02' } as any),
      createBulk: jest.fn().mockResolvedValue({ count: 5 } as any),
      update: jest.fn().mockResolvedValue({ equipmentId: 1, name: 'Tên mới' } as any),
      updateStatus: jest.fn().mockResolvedValue({ equipmentId: 1, status: EquipmentStatus.BROKEN } as any),
      remove: jest.fn().mockResolvedValue({ message: 'Xóa thiết bị thành công' } as any),
      importEquipmentsFromExcel: jest.fn().mockResolvedValue({ successCount: 10, failedCount: 0 } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [
        { provide: EquipmentService, useValue: service },
      ],
    }).compile();

    controller = module.get<EquipmentController>(EquipmentController);
  });

  it('TC-EQ-01: Tìm kiếm thiết bị theo bộ lọc', async () => {
    const result = await controller.findAll('Sony', EquipmentStatus.AVAILABLE, '1', '2', '1', '10');
    expect(result.data).toHaveLength(1);
    expect(service.findAll).toHaveBeenCalledWith({
      search: 'Sony',
      status: EquipmentStatus.AVAILABLE,
      roomId: 1,
      categoryId: 2,
      page: 1,
      limit: 10,
    });
  });

  it('TC-EQ-02: Tạo thiết bị mới thành công', async () => {
    const dto = { equipmentCode: 'MC02', name: 'Máy chiếu Epson', categoryId: 1 };
    const result = await controller.create(dto as any);
    expect(result.equipmentCode).toBe('MC02');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('TC-EQ-03: Xem chi tiết thiết bị theo equipmentId', async () => {
    const result = await controller.findOne(1);
    expect(result.equipmentId).toBe(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('TC-EQ-04: Cập nhật thông tin thiết bị', async () => {
    const dto = { name: 'Tên mới' };
    const result = await controller.update(1, dto as any);
    expect(result.name).toBe('Tên mới');
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('TC-EQ-05: Cập nhật trạng thái thiết bị nhanh', async () => {
    const dto = { status: EquipmentStatus.BROKEN };
    const result = await controller.updateStatus(1, dto);
    expect(result.status).toBe(EquipmentStatus.BROKEN);
    expect(service.updateStatus).toHaveBeenCalledWith(1, dto);
  });

  it('TC-EQ-06: Xóa thiết bị', async () => {
    const result = await controller.remove(1);
    expect(result).toHaveProperty('message');
    expect(service.remove).toHaveBeenCalledWith(1);
  });

  it('TC-EQ-07: Tạo hàng loạt thiết bị (bulk)', async () => {
    const dto = { items: [{ equipmentCode: 'MC03', name: 'MC 3', categoryId: 1 }] };
    const result = await controller.createBulk(dto as any);
    expect(result.count).toBe(5);
    expect(service.createBulk).toHaveBeenCalledWith(dto);
  });

  it('TC-EQ-08: Import thiết bị từ file Excel', async () => {
    const mockFile = { buffer: Buffer.from('test') } as any;
    const result = await controller.importEquipmentsFromExcel(mockFile);
    expect(result.successCount).toBe(10);
    expect(service.importEquipmentsFromExcel).toHaveBeenCalledWith(mockFile);
  });
});
