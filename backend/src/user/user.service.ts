import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { PrismaErrorCode } from 'src/common/constant';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { hashPassword } from 'src/common/bcrypt';
import { UpdateUserDto } from './dto/updateUser.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserService {

    constructor(private readonly prismaService: PrismaService) {}
    
    async getAllUser(): Promise<UserDto[]> {
        try {
            // Nạp kèm thông tin role từ database
            const users = await this.prismaService.user.findMany({
                include: { role: true }
            });

            // Map danh sách để chèn thêm chuỗi 'role' tương thích với UserDto
            const formattedUsers = users.map(user => ({
                ...user,
                role: user.role?.roleName || 'User'
            }));

            return plainToInstance(UserDto, formattedUsers, { excludeExtraneousValues: true }); 
        } catch (error) {
            console.error("Lỗi tại getAllUser:", error);
            throw new InternalServerErrorException('Lỗi hệ thống khi lấy danh sách người dùng');
        }
    }

    async getUserByUserId(userId: number): Promise<UserDto> {
        try { 
            // 🛠️ Đã bỏ `: UserDto` để tránh lỗi TS2741 và thêm include
            const user = await this.prismaService.user.findFirstOrThrow({
                where: { userId },
                include: { role: true }
            });

            const userWithRoleField = {
                ...user,
                role: user.role?.roleName || 'User'
            };

            return plainToInstance(UserDto, userWithRoleField, { excludeExtraneousValues: true });
        } catch (error: any) {
            if (error.code === PrismaErrorCode.RecordNotFound)
                throw new NotFoundException("Không tìm thấy người dùng với ID này !!!");
            console.error("Lỗi tại getUserByUserId:", error);
            throw new InternalServerErrorException('Lỗi hệ thống khi tìm kiếm thông tin người dùng');
        }
    }

    async getUserByEmail(email: string): Promise<UserDto> {
        try {
            // 🛠️ Đã sửa lỗi ép kiểu và bổ sung include dữ liệu quan hệ
            const user = await this.prismaService.user.findUniqueOrThrow({
                where: { email },
                include: { role: true }
            });

            const userWithRoleField = {
                ...user,
                role: user.role?.roleName || 'User'
            };

            return plainToInstance(UserDto, userWithRoleField, { excludeExtraneousValues: true });
        } catch (error: any) {
            if (error.code === PrismaErrorCode.RecordNotFound)
                throw new NotFoundException("Không tìm thấy người dùng với Email này !!!");
            console.error("Lỗi tại getUserByEmail:", error);
            throw new InternalServerErrorException('Lỗi hệ thống khi tìm kiếm bằng Email');
        }
    }

    async getUserByUsername(username: string): Promise<UserDto> {
        try {
            // 🛠️ Đã sửa lỗi ép kiểu và bổ sung nạp kèm quan hệ hệ thống
            const user = await this.prismaService.user.findUniqueOrThrow({
                where: { username },
                include: { role: true }
            });

            const userWithRoleField = {
                ...user,
                role: user.role?.roleName || 'User'
            };

            return plainToInstance(UserDto, userWithRoleField, { excludeExtraneousValues: true });
        } catch (error: any) {
            if (error.code === PrismaErrorCode.RecordNotFound)
                throw new NotFoundException("Không tìm thấy người dùng với Username này !!!");
            console.error("Lỗi tại getUserByUsername:", error);
            throw new InternalServerErrorException('Lỗi hệ thống khi tìm kiếm bằng Username');
        }
    }

    async createUser(createUserDto: CreateUserDto): Promise<UserDto> {
        try {
            const { password, ...res }: CreateUserDto = createUserDto;
            const hashedPassword = await hashPassword(password);
            
            const newUser = await this.prismaService.user.create({
                data: {
                    ...res,
                    hashedPassword
                },
                include: { role: true } // Lấy kèm thông tin group quyền vừa gán
            });

            const userWithRoleField = {
                ...newUser,
                role: newUser.role?.roleName || 'User'
            };

            return plainToInstance(UserDto, userWithRoleField, { excludeExtraneousValues: true });
        } catch (error: any) {
            if (error.code === PrismaErrorCode.ConFlictCode)
                throw new ConflictException('Tài khoản hoặc thông tin bị trùng lặp!');
            console.error("Lỗi tại createUser:", error);
            throw new InternalServerErrorException('Lỗi hệ thống khi tạo tài khoản');
        }
    }

    async updateUser(userId: number, updateUserDto: UpdateUserDto): Promise<UserDto> {
        try {
            const { password, ...updateData } = updateUserDto;
            const dataToUpdate: any = { ...updateData };

            if (password) {
                dataToUpdate.hashedPassword = await hashPassword(password);
            }

            // 🛠️ Đã chuyển đổi định dạng và bao bọc thêm include liên kết bảng
            const updatedUser = await this.prismaService.user.update({
                where: { userId },
                data: dataToUpdate,
                include: { role: true }
            });

            const userWithRoleField = {
                ...updatedUser,
                role: updatedUser.role?.roleName || 'User'
            };

            return plainToInstance(UserDto, userWithRoleField, { excludeExtraneousValues: true });
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new NotFoundException(`Không tìm thấy dữ liệu phù hợp để cập nhật!`);
            }
            if (error.code === 'P2002') {
                throw new ConflictException('Username hoặc Email này đã tồn tại trong hệ thống!');
            }
            console.error(`Lỗi ở updateUser (ID: ${userId}):`, error);
            throw new InternalServerErrorException('Lỗi hệ thống khi cập nhật thông tin người dùng!');
        }
    }

    async deleteUser(userId: number): Promise<{ message: string }> {
        try {
            await this.prismaService.user.delete({
                where: { userId }
            });
            return { message: 'Delete user Successfull!' };
        } catch (error: any) {
            if (error.code === PrismaErrorCode.RecordNotFound) {
                throw new NotFoundException(`Không tìm thấy người dùng có ID ${userId} để xóa!`);
            }
            if (error.code === PrismaErrorCode.ForeignKeyConstraintFailed) {
                throw new ConflictException(
                    'Không thể xóa người dùng này vì họ đang có dữ liệu liên kết. Vui lòng vô hiệu hóa thay vì xóa!'
                );
            }
            console.error(`Lỗi ở deleteUser (ID: ${userId}):`, error);
            throw new InternalServerErrorException('Lỗi hệ thống khi xóa người dùng!');
        }
    }
    
    async findUserWithRole(userId: number) {
        return await this.prismaService.user.findUnique({
            where: { userId },
            include: { role: true },
        });
    }

    async changeUserRole(userId: number, roleName: string): Promise<{ message: string; user: UserDto }> {
        const targetRole = await this.prismaService.role.findUnique({
            where: { roleName: roleName },
        });

        if (!targetRole) {
            throw new NotFoundException(`Nhóm quyền [${roleName}] không tồn tại trong hệ thống!`);
        }

        try {
            const updatedUser = await this.prismaService.user.update({
                where: { userId },
                data: { roleId: targetRole.roleId },
                include: { role: true }
            });

            const userWithRoleField = {
                ...updatedUser,
                role: updatedUser.role?.roleName || 'User'
            };

            return {
                message: `Đổi quyền tài khoản thành công sang nhóm [${roleName}]`,
                user: plainToInstance(UserDto, userWithRoleField, { excludeExtraneousValues: true }),
            };
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new NotFoundException(`Không tìm thấy người dùng mang ID ${userId} để chuyển quyền!`);
            }
            console.error("Lỗi tại changeUserRole:", error);
            throw new InternalServerErrorException('Lỗi hệ thống trong quá trình cập nhật quyền hạn người dùng.');
        }
    }
}