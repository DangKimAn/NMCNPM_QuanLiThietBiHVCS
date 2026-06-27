import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { PrismaErrorCode } from 'src/common/constant';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { hashPassword, verifyPassword } from 'src/common/bcrypt';
import { UpdateUserDto } from './dto/updateUser.dto';
import { plainToInstance } from 'class-transformer';
import * as xlsx from 'xlsx';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllUser(page?: number, limit?: number) {
    try {
      if (page) {
        const limitNum = limit || 500;
        const skip = (page - 1) * limitNum;

        const [users, total] = await Promise.all([
          this.prismaService.user.findMany({
            skip,
            take: limitNum,
            include: { role: true },
          }),
          this.prismaService.user.count(),
        ]);

        const formattedUsers = users.map((user) => ({
          ...user,
          role: user.role?.roleName || 'User',
        }));

        const data = plainToInstance(UserDto, formattedUsers, {
          excludeExtraneousValues: true,
        });

        return { data, total, page, limit: limitNum };
      }

      const users = await this.prismaService.user.findMany({
        include: { role: true },
      });

      const formattedUsers = users.map((user) => ({
        ...user,
        role: user.role?.roleName || 'User',
      }));

      return plainToInstance(UserDto, formattedUsers, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Lỗi tại getAllUser:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi lấy danh sách người dùng',
      );
    }
  }

  async searchUsers(keyword: string): Promise<UserDto[]> {
    try {
      const users = await this.prismaService.user.findMany({
        where: {
          OR: [
            { username: { contains: keyword, mode: 'insensitive' } },
            { email: { contains: keyword, mode: 'insensitive' } },
            { fullName: { contains: keyword, mode: 'insensitive' } },
          ],
        },
        include: { role: true },
      });

      const formattedUsers = users.map((user) => ({
        ...user,
        role: user.role?.roleName || 'User',
      }));

      return plainToInstance(UserDto, formattedUsers, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Lỗi tại searchUsers:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi tìm kiếm người dùng',
      );
    }
  }


  async getUserByUserId(userId: number): Promise<UserDto> {
    try {
      const user = await this.prismaService.user.findFirstOrThrow({
        where: { userId },
        include: { role: true },
      });

      const userWithRoleField = {
        ...user,
        role: user.role?.roleName || 'User',
      };

      return plainToInstance(UserDto, userWithRoleField, {
        excludeExtraneousValues: true,
      });
    } catch (error: any) {
      if (error.code === PrismaErrorCode.RecordNotFound) {
        throw new NotFoundException('Không tìm thấy người dùng với ID này !!!');
      }

      console.error('Lỗi tại getUserByUserId:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi tìm kiếm thông tin người dùng',
      );
    }
  }

  async getUserByEmail(email: string): Promise<UserDto> {
    try {
      const user = await this.prismaService.user.findUniqueOrThrow({
        where: { email },
        include: { role: true },
      });

      const userWithRoleField = {
        ...user,
        role: user.role?.roleName || 'User',
      };

      return plainToInstance(UserDto, userWithRoleField, {
        excludeExtraneousValues: true,
      });
    } catch (error: any) {
      if (error.code === PrismaErrorCode.RecordNotFound) {
        throw new NotFoundException('Không tìm thấy người dùng với Email này !!!');
      }

      console.error('Lỗi tại getUserByEmail:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi tìm kiếm bằng Email',
      );
    }
  }

  async getUserByUsername(username: string): Promise<UserDto> {
    try {
      const user = await this.prismaService.user.findUniqueOrThrow({
        where: { username },
        include: { role: true },
      });

      const userWithRoleField = {
        ...user,
        role: user.role?.roleName || 'User',
      };

      return plainToInstance(UserDto, userWithRoleField, {
        excludeExtraneousValues: true,
      });
    } catch (error: any) {
      if (error.code === PrismaErrorCode.RecordNotFound) {
        throw new NotFoundException(
          'Không tìm thấy người dùng với Username này !!!',
        );
      }

      console.error('Lỗi tại getUserByUsername:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi tìm kiếm bằng Username',
      );
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserDto> {
    try {
      const { password, roleName, ...rest } = createUserDto;

      const targetRoleName = roleName || 'STUDENT';

      const role = await this.prismaService.role.findUnique({
        where: {
          roleName: targetRoleName,
        },
      });

      if (!role) {
        throw new NotFoundException(
          `Vai trò [${targetRoleName}] không tồn tại trong hệ thống`,
        );
      }

      const hashedPassword = await hashPassword(password);

      const newUser = await this.prismaService.user.create({
        data: {
          ...rest,
          hashedPassword,
          roleId: role.roleId,
          status: 'ACTIVE',
        },
        include: {
          role: true,
        },
      });

      const userWithRoleField = {
        ...newUser,
        role: newUser.role?.roleName || 'User',
      };

      return plainToInstance(UserDto, userWithRoleField, {
        excludeExtraneousValues: true,
      });
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (
        error.code === PrismaErrorCode.ConFlictCode ||
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Tên đăng nhập hoặc Email đã tồn tại trong hệ thống!',
        );
      }

      console.error('Lỗi tại createUser:', error);
      throw new InternalServerErrorException('Lỗi hệ thống khi tạo tài khoản');
    }
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    try {
      const { password, ...updateData } = updateUserDto;
      const dataToUpdate: any = { ...updateData };

      if (password) {
        dataToUpdate.hashedPassword = await hashPassword(password);
      }

      const updatedUser = await this.prismaService.user.update({
        where: { userId },
        data: dataToUpdate,
        include: { role: true },
      });

      const userWithRoleField = {
        ...updatedUser,
        role: updatedUser.role?.roleName || 'User',
      };

      return plainToInstance(UserDto, userWithRoleField, {
        excludeExtraneousValues: true,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          'Không tìm thấy dữ liệu phù hợp để cập nhật!',
        );
      }

      if (error.code === 'P2002') {
        throw new ConflictException(
          'Username hoặc Email này đã tồn tại trong hệ thống!',
        );
      }

      console.error(`Lỗi ở updateUser (ID: ${userId}):`, error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi cập nhật thông tin người dùng!',
      );
    }
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    try {
      await this.prismaService.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { userId },
        });

        if (!user) {
          throw new NotFoundException(
            `Không tìm thấy người dùng có ID ${userId} để xóa!`,
          );
        }

        // Xóa nhật ký hoạt động của user
        await tx.activityLog.deleteMany({
          where: { userId },
        });

        // Xóa phiếu điều chuyển thiết bị do user thực hiện
        await tx.equipmentTransfer.deleteMany({
          where: { executorId: userId },
        });

        // Nếu user là người xử lý phản ánh thì bỏ liên kết người xử lý
        await tx.report.updateMany({
          where: { handlerId: userId },
          data: {
            handlerId: null,
          },
        });

        // Xóa các phản ánh do user này gửi
        await tx.report.deleteMany({
          where: { reporterId: userId },
        });

        // Cuối cùng mới xóa user
        await tx.user.delete({
          where: { userId },
        });
      });

      return {
        message: 'Xóa người dùng thành công!',
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (
        error.code === PrismaErrorCode.RecordNotFound ||
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Không tìm thấy người dùng có ID ${userId} để xóa!`,
        );
      }

      console.error(`Lỗi ở deleteUser (ID: ${userId}):`, error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi xóa người dùng!',
      );
    }
  }

  async findUserWithRole(userId: number) {
    return await this.prismaService.user.findUnique({
      where: { userId },
      include: { role: true },
    });
  }

  async changeUserRole(
    userId: number,
    roleName: string,
  ): Promise<{ message: string; user: UserDto }> {
    const targetRole = await this.prismaService.role.findUnique({
      where: { roleName },
    });

    if (!targetRole) {
      throw new NotFoundException(
        `Nhóm quyền [${roleName}] không tồn tại trong hệ thống!`,
      );
    }

    try {
      const updatedUser = await this.prismaService.user.update({
        where: { userId },
        data: { roleId: targetRole.roleId },
        include: { role: true },
      });

      const userWithRoleField = {
        ...updatedUser,
        role: updatedUser.role?.roleName || 'User',
      };

      return {
        message: `Đổi quyền tài khoản thành công sang nhóm [${roleName}]`,
        user: plainToInstance(UserDto, userWithRoleField, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Không tìm thấy người dùng mang ID ${userId} để chuyển quyền!`,
        );
      }

      console.error('Lỗi tại changeUserRole:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống trong quá trình cập nhật quyền hạn người dùng.',
      );
    }
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!oldPassword || !newPassword) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới',
      );
    }

    const user = await this.prismaService.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    const isOldPasswordValid = await verifyPassword(
      oldPassword,
      user.hashedPassword,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await this.prismaService.user.update({
      where: { userId },
      data: {
        hashedPassword: hashedNewPassword,
      },
    });

    return {
      message: 'Đổi mật khẩu thành công',
    };
  }

  async importUsersFromExcel(file: any) {
    let successCount = 0;
    let failedCount = 0;
    const errors: { row: number; reason: string }[] = [];

    try {
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data: any[] = xlsx.utils.sheet_to_json(sheet);

      let rowNum = 1; 

      for (const row of data) {
        rowNum++;
        try {
          const username = row['Username'] || row['username'];
          const email = row['Email'] || row['email'];
          const fullName = row['Họ tên'] || row['fullName'];
          const phoneNumber = row['Số điện thoại'] || row['phoneNumber'];
          const password = row['Mật khẩu tạm thời'] || row['password'] || '123456aA@';
          const roleName = row['Vai trò'] || row['roleName'] || 'STUDENT';

          if (!username || !email) {
            failedCount++;
            errors.push({ row: rowNum, reason: 'Thiếu Username hoặc Email' });
            continue;
          }

          const existingUser = await this.prismaService.user.findFirst({
            where: {
              OR: [{ username: String(username) }, { email: String(email) }]
            }
          });

          if (existingUser) {
            failedCount++;
            errors.push({ row: rowNum, reason: 'Username hoặc Email đã tồn tại' });
            continue;
          }

          const targetRole = await this.prismaService.role.findUnique({
            where: { roleName: String(roleName) },
          });

          if (!targetRole) {
            failedCount++;
            errors.push({ row: rowNum, reason: `Vai trò [${roleName}] không tồn tại` });
            continue;
          }

          const hashedPassword = await hashPassword(String(password));

          await this.prismaService.user.create({
            data: {
              username: String(username),
              email: String(email),
              fullName: fullName ? String(fullName) : null,
              phoneNumber: phoneNumber ? String(phoneNumber) : null,
              hashedPassword,
              roleId: targetRole.roleId,
              status: 'ACTIVE',
            },
          });

          successCount++;
        } catch (e: any) {
          failedCount++;
          errors.push({ row: rowNum, reason: e.message || 'Lỗi hệ thống' });
        }
      }

      return { successCount, failedCount, errors };
    } catch (error) {
      throw new BadRequestException('Lỗi đọc file Excel. Vui lòng kiểm tra lại định dạng file.');
    }
  }
}