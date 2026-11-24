import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';

describe('RoleController', () => {
  let controller: RoleController;
  let service: jest.Mocked<Partial<RoleService>>;

  beforeEach(async () => {
    service = {
      getAllRole: jest.fn().mockResolvedValue([
        { roleId: 1, roleName: 'ADMIN' },
        { roleId: 2, roleName: 'MANAGER' },
      ] as any),
      getRoleByRoleName: jest.fn().mockResolvedValue({ roleId: 1, roleName: 'ADMIN' } as any),
      getRoleByRoleID: jest.fn().mockResolvedValue({ roleId: 1, roleName: 'ADMIN' } as any),
      createRole: jest.fn().mockResolvedValue({ roleId: 3, roleName: 'AUDITOR' } as any),
      updateRole: jest.fn().mockResolvedValue({ roleId: 3, roleName: 'AUDITOR_UPDATED' } as any),
      deleteRole: jest.fn().mockResolvedValue({ message: 'Xóa vai trò thành công' } as any),
      createPermission: jest.fn().mockResolvedValue({ message: 'Gán quyền thành công' } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        { provide: RoleService, useValue: service },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
  });

  it('TC-ROLE-01: Lấy danh sách tất cả các Role', async () => {
    const result = await controller.getAllRole();
    expect(result).toHaveLength(2);
    expect(service.getAllRole).toHaveBeenCalled();
  });

  it('TC-ROLE-02: Lấy thông tin role theo roleName', async () => {
    const result = await controller.getRoleByRoleName('ADMIN');
    expect(result.roleName).toBe('ADMIN');
    expect(service.getRoleByRoleName).toHaveBeenCalledWith('ADMIN');
  });

  it('TC-ROLE-03: Lấy thông tin role theo roleId', async () => {
    const result = await controller.getRolebyRoleID(1);
    expect(result.roleId).toBe(1);
    expect(service.getRoleByRoleID).toHaveBeenCalledWith(1);
  });

  it('TC-ROLE-04: Admin tạo vai trò mới', async () => {
    const dto = { roleName: 'AUDITOR' };
    const result = await controller.createRole(dto as any);
    expect(result.roleName).toBe('AUDITOR');
    expect(service.createRole).toHaveBeenCalledWith(dto);
  });

  it('TC-ROLE-05: Admin cập nhật vai trò', async () => {
    const dto = { roleName: 'AUDITOR_UPDATED' };
    const result = await controller.updateRole(3, dto as any);
    expect(result.roleName).toBe('AUDITOR_UPDATED');
    expect(service.updateRole).toHaveBeenCalledWith(3, dto);
  });

  it('TC-ROLE-06: Admin xóa vai trò', async () => {
    const result = await controller.deleteRole(3);
    expect(result).toHaveProperty('message');
    expect(service.deleteRole).toHaveBeenCalledWith(3);
  });

  it('TC-ROLE-07: Gán quyền cho vai trò', async () => {
    const dto = { permissionId: 1 };
    const result = await controller.createRolePermission(1, dto as any);
    expect(result).toHaveProperty('message');
    expect(service.createPermission).toHaveBeenCalledWith(1, dto);
  });
});
