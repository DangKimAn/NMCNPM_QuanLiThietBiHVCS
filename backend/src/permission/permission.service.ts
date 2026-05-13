import { BadGatewayException, ConflictException, Injectable, InternalServerErrorException, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PermissionDto } from './dto/permission..dto';
import { permission } from 'process';
import { CreatePermissionDto } from './dto/CreatePermission.dto';
import { BadRequestCode, PrismaErrorCode } from 'src/common/constant';
import { UpdatePermissionDto } from './dto/UpdatePermission.dto';

@Injectable()
export class PermissionService {

    constructor(private readonly prismaService : PrismaService){}

    async getAllPermission() :Promise<PermissionDto[] >{
        try{
            const permissions : PermissionDto[] = await this.prismaService.permission.findMany();
            return permissions
        }catch(error){
            throw new InternalServerErrorException(error)
        }

    }


    async getPermissionById(permissionId: number) {
        try {
            const permission = await this.prismaService.permission.findUnique({
                where: { permissionId }
            });

            if (!permission) {
                throw new NotFoundException(`Không tìm thấy Permission với ID: ${permissionId}`);
            }
            return permission;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException(error.message);
        }
    }

    async getPermissionByName(permissionName: string) {
        try {
            // Giả định field trong database là permissionName
            const permission = await this.prismaService.permission.findFirst({
                where: { permissionName } 
            });

            if (!permission) {
                throw new NotFoundException(`Không tìm thấy Permission với tên: ${permissionName}`);
            }
            return permission;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException(error.message);
        }
    }

    async createPermission(createPermissionDto: CreatePermissionDto) {
        try {
            return await this.prismaService.permission.create({
                data: createPermissionDto
            });
        } catch (error) {
            if (error.code === PrismaErrorCode.ConFlictCode) {
                throw new ConflictException('Tên Permission này đã tồn tại!');
            }
            throw new InternalServerErrorException(error.message);
        }
    }

    async updatePermission(permissionId: number, updatePermissionDto: UpdatePermissionDto) {
        try {
            return await this.prismaService.permission.update({
                where: { permissionId },
                data: { ...updatePermissionDto }
            });
        } catch (error) {
            if (error.code === PrismaErrorCode.RecordNotFound) {
                throw new NotFoundException(`Không tìm thấy Permission với ID: ${permissionId} để cập nhật`);
            }
            if (error.code === PrismaErrorCode.ConFlictCode) {
                throw new ConflictException('Tên Permission bị trùng lặp!');
            }
            throw new InternalServerErrorException(error.message);
        }
    }

    async deletePermission(permissionId: number) {
        try {
            return await this.prismaService.permission.delete({
                where: { permissionId }
            });
        } catch (error) {
             if (error.code === PrismaErrorCode.RecordNotFound) {
                throw new NotFoundException(`Không tìm thấy Permission với ID: ${permissionId} để xóa`);
            }
            if (error.code === PrismaErrorCode.ForeignKeyConstraintFailed) {
            throw new BadGatewayException(`Không thể xóa Permission này vì nó đang được sử dụng (ràng buộc khóa ngoại). Vui lòng gỡ nó khỏi các Role trước khi xóa!`);
        }
            throw new InternalServerErrorException(error.message);
        }
    }
}
