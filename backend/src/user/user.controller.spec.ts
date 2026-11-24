import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Role } from 'src/auth/decorators/role.enum';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<Partial<UserService>>;

  beforeEach(async () => {
    userService = {
      createUser: jest.fn(),
      getAllUser: jest.fn(),
      searchUsers: jest.fn(),
      getUserByEmail: jest.fn(),
      getUserByUserId: jest.fn(),
      getUserByUsername: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      changeUserRole: jest.fn(),
      changePassword: jest.fn(),
      importUsersFromExcel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  describe('update (PATCH /:userId - Chống leo thang đặc quyền)', () => {
    it('TC-USER-10: User tự cập nhật thông tin cá nhân của mình thành công', async () => {
      const currentUser = { userId: 10, role: Role.STUDENT };
      const dto = { fullName: 'Nguyen Van A', phoneNumber: '0901234567' };
      const mockResult = { userId: 10, fullName: 'Nguyen Van A' } as any;

      userService.updateUser = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.update(10, dto, currentUser);
      expect(result).toEqual(mockResult);
      expect(userService.updateUser).toHaveBeenCalledWith(10, dto);
    });

    it('TC-USER-11: User thường cố ý gửi roleId -> Bị chặn với lỗi ForbiddenException', async () => {
      const currentUser = { userId: 10, role: Role.STUDENT };
      const dto = { fullName: 'Hacker', roleId: 1 }; // cố ý leo thang quyền

      await expect(controller.update(10, dto, currentUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.update(10, dto, currentUser)).rejects.toThrow(
        'Bạn không có quyền thay đổi vai trò (role) của tài khoản!',
      );
      expect(userService.updateUser).not.toHaveBeenCalled();
    });

    it('TC-USER-12: User thường cố ý gửi status -> Bị chặn với lỗi ForbiddenException', async () => {
      const currentUser = { userId: 10, role: Role.TEACHER };
      const dto = { status: 'ACTIVE' as any }; // cố ý tự mở khóa tài khoản

      await expect(controller.update(10, dto, currentUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.update(10, dto, currentUser)).rejects.toThrow(
        'Bạn không có quyền thay đổi trạng thái (status) của tài khoản!',
      );
      expect(userService.updateUser).not.toHaveBeenCalled();
    });

    it('TC-USER-13: Admin được phép cập nhật thông tin kèm roleId cho user khác', async () => {
      const currentUser = { userId: 1, role: Role.ADMIN };
      const dto = { fullName: 'Updated Name', roleId: 2 };
      const mockResult = {
        userId: 10,
        fullName: 'Updated Name',
        roleId: 2,
      } as any;

      userService.updateUser = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.update(10, dto, currentUser);
      expect(result).toEqual(mockResult);
      expect(userService.updateUser).toHaveBeenCalledWith(10, dto);
    });

    it('TC-USER-08: User thường sửa thông tin của người khác khi không phải ADMIN -> Bị chặn', async () => {
      const currentUser = { userId: 10, role: Role.STUDENT };
      const dto = { fullName: 'Try Edit Someone Else' };

      await expect(controller.update(99, dto, currentUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.update(99, dto, currentUser)).rejects.toThrow(
        'Bạn không có quyền chỉnh sửa thông tin của người dùng khác!',
      );
    });
  });

  describe('findOne (GET /getUserbyUserId/:userID)', () => {
    it('TC-USER-07: User xem thông tin chính mình thành công', async () => {
      const currentUser = { userId: 5, role: Role.STUDENT };
      userService.getUserByUserId = jest
        .fn()
        .mockResolvedValue({ userId: 5, username: 'sv1' } as any);

      const result = await controller.findOne(5, currentUser);
      expect(result.userId).toBe(5);
    });

    it('TC-USER-08b: User thường xem thông tin người khác bị ForbiddenException', async () => {
      const currentUser = { userId: 5, role: Role.STUDENT };

      await expect(controller.findOne(6, currentUser)).rejects.toThrow(
        'Bạn không có quyền xem thông tin chi tiết của người dùng khác!',
      );
    });

    it('TC-USER-09: Admin xem thông tin bất kỳ user nào thành công', async () => {
      const currentUser = { userId: 1, role: Role.ADMIN };
      userService.getUserByUserId = jest
        .fn()
        .mockResolvedValue({ userId: 6, username: 'sv2' } as any);

      const result = await controller.findOne(6, currentUser);
      expect(result.userId).toBe(6);
    });
  });

  describe('changePassword (PATCH /:userId/password)', () => {
    it('TC-USER-16: Đổi mật khẩu của chính mình thành công', async () => {
      const currentUser = { userId: 5, role: Role.STUDENT };
      userService.changePassword = jest
        .fn()
        .mockResolvedValue({ message: 'Đổi mật khẩu thành công' });

      const result = await controller.changePassword(
        5,
        { oldPassword: 'old', newPassword: 'new' },
        currentUser,
      );
      expect(result.message).toBe('Đổi mật khẩu thành công');
      expect(userService.changePassword).toHaveBeenCalledWith(5, 'old', 'new');
    });

    it('TC-USER-16b: Đổi mật khẩu tài khoản người khác bị chặn', async () => {
      const currentUser = { userId: 5, role: Role.STUDENT };

      await expect(
        controller.changePassword(
          6,
          { oldPassword: 'old', newPassword: 'new' },
          currentUser,
        ),
      ).rejects.toThrow('Chỉ được phép đổi mật khẩu của chính mình!');
    });
  });
});
