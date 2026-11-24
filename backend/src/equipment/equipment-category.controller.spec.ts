import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentCategoryController } from './equipment-category.controller';
import { EquipmentCategoryService } from './equipment-category.service';

describe('EquipmentCategoryController', () => {
  let controller: EquipmentCategoryController;
  let service: jest.Mocked<Partial<EquipmentCategoryService>>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn().mockResolvedValue([
        {
          categoryId: 1,
          name: 'Máy chiếu',
          description: 'Máy chiếu giảng dạy',
        },
      ] as any),
      findOne: jest
        .fn()
        .mockResolvedValue({ categoryId: 1, name: 'Máy chiếu' } as any),
      create: jest
        .fn()
        .mockResolvedValue({ categoryId: 2, name: 'Máy lạnh' } as any),
      update: jest
        .fn()
        .mockResolvedValue({ categoryId: 1, name: 'Máy chiếu 4K' } as any),
      remove: jest
        .fn()
        .mockResolvedValue({ message: 'Xóa danh mục thành công' } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentCategoryController],
      providers: [{ provide: EquipmentCategoryService, useValue: service }],
    }).compile();

    controller = module.get<EquipmentCategoryController>(
      EquipmentCategoryController,
    );
  });

  it('TC-CAT-01: Lấy danh sách danh mục thiết bị', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('TC-CAT-02: Tạo danh mục thiết bị mới', async () => {
    const dto = { name: 'Máy lạnh', description: 'Máy điều hòa nhiệt độ' };
    const result = await controller.create(dto);
    expect(result.name).toBe('Máy lạnh');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('TC-CAT-03: Cập nhật danh mục thiết bị', async () => {
    const dto = { name: 'Máy chiếu 4K' };
    const result = await controller.update(1, dto);
    expect(result.name).toBe('Máy chiếu 4K');
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('TC-CAT-04: Xóa danh mục thiết bị', async () => {
    const result = await controller.remove(1);
    expect(result).toHaveProperty('message');
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
