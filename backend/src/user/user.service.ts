import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { InternalServerErrorCode, PrismaErrorCode } from 'src/common/constant';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { hashPassword, verifyPassword } from 'src/common/bcrypt';
import { UpdateUserDto } from './dto/updateUser.dto';
import { User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserService {

    constructor(private readonly prismaService: PrismaService) {}
    
    async getAllUser(): Promise<UserDto[]> {
        try {
            const users : UserDto[] =  await this.prismaService.user.findMany()
            return plainToInstance(UserDto, users, { excludeExtraneousValues: true });

        } catch (error) {
            throw new InternalServerErrorException(error)
        }
    }

    async getUserByUserId(userId: number): Promise<UserDto> {
        try { 
            const user : UserDto = await this.prismaService.user.findFirstOrThrow({
                where: {
                    userId
                }
            })
            return plainToInstance(UserDto,user, { excludeExtraneousValues: true });

        } catch (error) {

            if (error.code === PrismaErrorCode.RecordNotFound)
                throw new NotFoundException("This username is not found !!!")
            throw new InternalServerErrorException(error)
        }
    }

    async getUserByEmail(email: string): Promise<UserDto> {
        try {
            const user: UserDto = await this.prismaService.user.findUniqueOrThrow({
                where: {
                    email
                }
            })
            return plainToInstance(UserDto,user, { excludeExtraneousValues: true });

        } catch (error) {

            if (error.code === PrismaErrorCode.RecordNotFound)
                throw new NotFoundException("This username is not found !!!")
            throw new InternalServerErrorException(error)
        }
    }


    async getUserByUsername(username: string): Promise<UserDto> {
        try {
            const user: UserDto =  await this.prismaService.user.findUniqueOrThrow({
                where: {
                    username
                }
            })
            return user
        } catch (error) {

            if (error.code === PrismaErrorCode.RecordNotFound)
                throw new NotFoundException("This username is not found !!!")
            throw new InternalServerErrorException(error)
        }
    }

    async createUser(createUserDto: CreateUserDto): Promise<UserDto> {
        try {

            const { password, ...res }: CreateUserDto = createUserDto
            const hashedPassword = await hashPassword(password)
            const newUser = await this.prismaService.user.create({
                data: {
                    ...res,
                    hashedPassword
                }
            })
            // return newUser;
            return plainToInstance(UserDto, newUser, { excludeExtraneousValues: true });
        } catch (error) {

            if (error.code === PrismaErrorCode.ConFlictCode)
                throw new ConflictException('Conflict')

            if (error.code === PrismaErrorCode.RecordNotFound)
                throw new NotFoundException('Not found')
            throw new InternalServerErrorException(error)
        }
    }

    async updateUser(userId: number, updateUserDto: UpdateUserDto): Promise<UserDto> {
        try {
            const { password, ...updateData } = updateUserDto;

            const dataToUpdate: any = { ...updateData };

            if (password) {
                dataToUpdate.hashedPassword = await hashPassword(password);
            }

            const updatedUser: UserDto = await this.prismaService.user.update({
                where: { userId },
                data: dataToUpdate
            });
            return plainToInstance(UserDto,updatedUser, { excludeExtraneousValues: true });
        } catch (error) {
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

        } catch (error) {
            if (error.code === PrismaErrorCode.RecordNotFound) {
                throw new NotFoundException(`Không tìm thấy người dùng có ID ${userId} để xóa!`);
            }

            if (error.code === PrismaErrorCode.ForeignKeyConstraintFailed) {
                throw new ConflictException(
                    'Không thể xóa người dùng này vì họ đang có dữ liệu liên kết (nhật ký, báo cáo, thiết bị...). Vui lòng vô hiệu hóa (INACTIVE) thay vì xóa!'
                );
            }

            console.error(`Lỗi ở deleteUser (ID: ${userId}):`, error);
            throw new InternalServerErrorException('Lỗi hệ thống khi xóa người dùng!');
        }
    }
    
    // Hàm bổ sung phục vụ riêng cho vòng Guard Check Quyền (JWT Strategy gọi qua đây)
    async findUserWithRole(userId: number) {
        return await this.prismaService.user.findUnique({
            where: { userId },
            include: { role: true },
        });
    }

    // --- HÀM MỚI BỔ SUNG: CHUYỂN ĐỔI QUYỀN SANG MANAGER (HOẶC ROLE KHÁC) ---
    async changeUserRole(userId: number, roleName: string): Promise<{ message: string; user: UserDto }> {
        // 1. Tìm bản ghi nhóm quyền trong Database xem có đúng tên hay không
        const targetRole = await this.prismaService.role.findUnique({
            where: { roleName: roleName },
        });

        if (!targetRole) {
            throw new NotFoundException(`Nhóm quyền [${roleName}] không tồn tại trong hệ thống!`);
        }

        try {
            // 2. Tiến hành update đè trường roleId của User đích
            const updatedUser = await this.prismaService.user.update({
                where: { userId },
                data: { roleId: targetRole.roleId },
            });

            return {
                message: `Đổi quyền tài khoản thành công sang nhóm [${roleName}]`,
                user: plainToInstance(UserDto, updatedUser, { excludeExtraneousValues: true }),
            };
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException(`Không tìm thấy người dùng mang ID ${userId} để chuyển quyền!`);
            }
            throw new InternalServerErrorException('Lỗi hệ thống trong quá trình cập nhật quyền hạn người dùng.');
        }
    }
}