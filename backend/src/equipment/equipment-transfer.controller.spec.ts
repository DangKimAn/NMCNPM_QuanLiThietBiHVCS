import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentTransferController } from './equipment-transfer.controller';
import { EquipmentTransferService } from './equipment-transfer.service';

describe('EquipmentTransferController', () => {
  let controller: EquipmentTransferController;
  let service: jest.Mocked<Partial<EquipmentTransferService>>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn().mockResolvedValue([
        { transferId: 1, equipmentId: 5, fromRoomId: 1, toRoomId: 2 },
      ] as any),
      findOne: jest.fn().mockResolvedValue({ transferId: 1, equipmentId: 5 } as any),
      create: jest.fn().mockResolvedValue({ transferId: 2, equipmentId: 6 } as any),
      createBulk: jest.fn().mockResolvedValue({ count: 4 } as any),
      importFromExcel: jest.fn().mockResolvedValue({ total: 10, success: 10, failed: 0 } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentTransferController],
      providers: [
        { provide: EquipmentTransferService, useValue: service },
      ],
    }).compile();

    controller = module.get<EquipmentTransferController>(EquipmentTransferController);
  });

  it('TC-TRANS-01: Tạo lệnh điều chuyển thiết bị', async () => {
    const dto = { equipmentId: 6, fromRoomId: 1, toRoomId: 2, transferDate: '2026-11-24' };
    const result = await controller.create(dto as any);
    expect(result.transferId).toBe(2);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('TC-TRANS-02: Điều chuyển hàng loạt thiết bị (bulk)', async () => {
    const dto = { transfers: [{ equipmentId: 7, fromRoomId: 1, toRoomId: 2 }] };
    const result = await controller.createBulk(dto as any);
    expect(result.count).toBe(4);
    expect(service.createBulk).toHaveBeenCalledWith(dto);
  });

  it('TC-TRANS-03: Import lệnh điều chuyển từ file Excel', async () => {
    const mockFile = { buffer: Buffer.from('test') } as any;
    const result = await controller.importTransferExcel(mockFile);
    expect(result.success).toBe(10);
    expect(service.importFromExcel).toHaveBeenCalledWith(mockFile);
  });

  it('TC-TRANS-04: Lấy danh sách lịch sử điều chuyển thiết bị', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('TC-TRANS-05: Xem chi tiết lệnh điều chuyển theo ID', async () => {
    const result = await controller.findOne(1);
    expect(result.transferId).toBe(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });
});
