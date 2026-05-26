import { BadGatewayException, BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleDto } from './dto/role.dto';
import { Prisma, Role } from '@prisma/client';
import { createRoleDto } from './dto/createRole.dto';
import { transcode } from 'buffer';
import { NotFoundError } from 'rxjs';
import { UpdateRoleDto } from './dto/updateRole.dto';
import { reportUnhandledError } from 'rxjs/internal/util/reportUnhandledError';
import { PrismaErrorCode } from 'src/common/constant';
import { AddPermissionDto } from 'src/permission/dto/AddPermission.dto';
import { Role_PermissionDto } from './dto/role_permission.dto';

@Injectable()
export class RoleService {

    constructor(private readonly prismaService: PrismaService) {

    }



    async getAllRole() {
        try {
            const roles = await this.prismaService.role.findMany({
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            });
            // Flatten: trả về permissions là array Permission trực tiếp
            return roles.map((role) => ({
                roleId: role.roleId,
                roleName: role.roleName,
                description: role.description,
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
                permissions: role.permissions.map((rp) => rp.permission),
            }));
        } catch (error) {
            throw new InternalServerErrorException()
        }
    }



    async createRole(createRoleDto: createRoleDto): Promise<Role> {

        
        const { roleName, description  }: createRoleDto = createRoleDto
        try {
            const role = await this.prismaService.role.create({
                data: {
                    roleName,
                    description,
                }
            })
            return role
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('roleName is existed ');
                }
            }
            throw error
        }
    }

    async getRoleByRoleName(roleName : string) : Promise<Role>{
        const role = await this.prismaService.role.findUnique({
            where:{
                roleName
            }
        })
        if (role)
            return role
        throw new NotFoundException("This roleName is not found !!!!")
    }

    async getRoleByRoleID(roleId : number): Promise<Role>{
        const role =await this.prismaService.role.findUnique({
            where:{roleId}
        })
        if(role)
            return role 
        throw new NotFoundException("This roleId is not found !!")
    }

    async updateRole(roleId  : number , updateRoleDto: UpdateRoleDto){
        const {roleName, description} : UpdateRoleDto = updateRoleDto 
        try{
            const newRole = await this.prismaService.role.update({
                where:{
                    roleId 
                },
                data:{
                    roleName ,
                    description
                }

            })

            return newRole
        }  catch(error)
        {
            if (error.code === PrismaErrorCode.RecordNotFound)
                throw new NotFoundException('This roleId is not found !!!')
            if (error.code === PrismaErrorCode.ConFlictCode)
                throw new ConflictException("This nameRole is existed")
            throw new InternalServerErrorException(error)
        }
    }

    async deleteRole(roleId: number){
        try{
            await this.prismaService.role.delete({
                where:{
                    roleId
                }
            })

            return {
                'message' : 'delete Role successfull'
            }
        }catch(error){
            if (error.code === PrismaErrorCode.RecordNotFound)
                throw new NotFoundException('This roleId is not found !!!')

            if (error.code === PrismaErrorCode.ForeignKeyConstraintFailed) {
                        throw new BadRequestException(`Không thể xóa Permission này vì nó đang được sử dụng (ràng buộc khóa ngoại). Vui lòng gỡ nó khỏi các Role trước khi xóa!`);
            }
            return error
        }
    }


    async createPermission(roleId : number , addPermissionDto :AddPermissionDto ) : Promise<Role_PermissionDto>{
        const {permissionId} : AddPermissionDto = addPermissionDto
        try{
            return  await this.prismaService.rolePermission.create({
                data:{
                    roleId , 
                    permissionId
                }
            })


        }catch(error)
        {
            if (error.code === PrismaErrorCode.ForeignKeyConstraintFailed)
                throw new NotFoundException("This permission Id or role id is not found !!")

            if (error.code === PrismaErrorCode.ConFlictCode)
                throw new ConflictException('Have conflict ')
            console.log(error)
            throw new InternalServerErrorException('Internal Server Error')

        }
    }
}
