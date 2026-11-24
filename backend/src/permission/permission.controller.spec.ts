import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';

describe('PermissionController', () => {
  let controller: PermissionController;
  let service: jest.Mocked<Partial<PermissionService>>;

  beforeEach(async () => {
    service = {
      getAllPermission: jest.fn().mockResolvedValue([
        { permissionId: 1, permissionName: 'MANAGE_ROOM' },
        { permissionId: 2, permissionName: 'MANAGE_EQUIPMENT' },
      ] as any),
      getPermissionById: jest.fn().mockResolvedValue({ permissionId: 1, permissionName: 'MANAGE_ROOM' } as any),
      getPermissionByName: jest.fn().mockResolvedValue({ permissionId: 1, permissionName: 'MANAGE_ROOM' } as any),
      createPermission: jest.fn().mockResolvedValue({ permissionId: 3, permissionName: 'VIEW_REPORTS' } as any),
      updatePermission: jest.fn().mockResolvedValue({ permissionId: 3, permissionName: 'VIEW_REPORTS_EDITED' } as any),
      deletePermission: jest.fn().mockResolvedValue({ message: 'Xóa quyền thành công' } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionController],
      providers: [
        { provide: PermissionService, useValue: service },
      ],
    }).compile();

    controller = module.get<PermissionController>(PermissionController);
  });

  it('TC-PERM-01: Lấy danh sách toàn bộ Permissions', async () => {
    const result = await controller.getAllPermission();
    expect(result).toHaveLength(2);
    expect(service.getAllPermission).toHaveBeenCalled();
  });

  it('TC-PERM-02: Lấy thông tin permission theo ID', async () => {
    const result = await controller.getPermissionById(1);
    expect(result.permissionId).toBe(1);
    expect(service.getPermissionById).toHaveBeenCalledWith(1);
  });

  it('TC-PERM-03: Lấy thông tin permission theo Name', async () => {
    const result = await controller.getPermissionByName('MANAGE_ROOM');
    expect(result.permissionName).toBe('MANAGE_ROOM');
    expect(service.getPermissionByName).toHaveBeenCalledWith('MANAGE_ROOM');
  });

  it('TC-PERM-04: Tạo permission mới', async () => {
    const dto = { permissionName: 'VIEW_REPORTS', description: 'Xem phản ánh' };
    const result = await controller.createPermission(dto as any);
    expect(result.permissionName).toBe('VIEW_REPORTS');
    expect(service.createPermission).toHaveBeenCalledWith(dto);
  });

  it('TC-PERM-05: Cập nhật permission', async () => {
    const dto = { permissionName: 'VIEW_REPORTS_EDITED' };
    const result = await controller.updatePermission(3, dto as any);
    expect(result.permissionName).toBe('VIEW_REPORTS_EDITED');
    expect(service.updatePermission).toHaveBeenCalledWith(3, dto);
  });

  it('TC-PERM-06: Xóa permission', async () => {
    const result = await controller.deletePermission(3);
    expect(result).toHaveProperty('message');
    expect(service.deletePermission).toHaveBeenCalledWith(3);
  });
});
