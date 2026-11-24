import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role as PrismaRole } from '@prisma/client';
import { createRoleDto } from './dto/createRole.dto';
import { UpdateRoleDto } from './dto/updateRole.dto';
import { AddPermissionDto } from 'src/permission/dto/AddPermission.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role as RoleEnum } from 'src/auth/decorators/role.enum';

@ApiTags('Role')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('/')
  @ApiOkResponse({ description: 'Get all roles successfull' })
  async getAllRole() {
    const roles: PrismaRole[] = await this.roleService.getAllRole();
    if (roles.length === 0) return `Don't have any roles `;
    else return roles;
  }

  @Get('/getRoleByNameRole/:nameRole')
  async getRoleByRoleName(@Param('nameRole') nameRole: string) {
    return await this.roleService.getRoleByRoleName(nameRole);
  }

  @Get('/GetRoleByRoleID/:roleId')
  async getRolebyRoleID(@Param('roleId', new ParseIntPipe()) roleID: number) {
    return await this.roleService.getRoleByRoleID(roleID);
  }
  @Post('/')
  async createRole(@Body() createRoleDto: createRoleDto) {
    const role: PrismaRole = await this.roleService.createRole(createRoleDto);
    return role;
  }

  @Patch('/:roleId')
  async updateRole(
    @Param('roleId', new ParseIntPipe()) roleId: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return await this.roleService.updateRole(roleId, updateRoleDto);
  }

  @Delete('/:roleId')
  async deleteRole(@Param('roleId', new ParseIntPipe()) roleId: number) {
    return await this.roleService.deleteRole(roleId);
  }

  @Post('/createRolePermission/:roleId')
  async createRolePermission(
    @Param('roleId', new ParseIntPipe()) roleId: number,
    @Body() addPermissionDto: AddPermissionDto,
  ) {
    return await this.roleService.createPermission(roleId, addPermissionDto);
  }
}
