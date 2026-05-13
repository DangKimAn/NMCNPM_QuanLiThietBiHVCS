import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { RoleService } from './role.service';
import { ApiOkResponse } from '@nestjs/swagger';
import { describe } from 'node:test';
import { Role } from '@prisma/client';
import { createRoleDto } from './dto/createRole.dto';
import { catchError } from 'rxjs';
import { UpdateRoleDto } from './dto/updateRole.dto';
import { runInContext } from 'vm';
import { AddPermissionDto } from 'src/permission/dto/AddPermission.dto';
import { reportUnhandledError } from 'rxjs/internal/util/reportUnhandledError';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {
  }


  @Get('/')
  @ApiOkResponse({ description: 'Get all roles successfull' })

  async getAllRole() {
    const roles: Role[] = await this.roleService.getAllRole();
    if (roles.length === 0)
      return `Don't have any roles `
    else
      return roles
  }

  @Get('/getRoleByNameRole/:nameRole')

  async getRoleByRoleName(@Param('nameRole') nameRole: string) {
    return await this.roleService.getRoleByRoleName(nameRole)
  }

  @Get('/GetRoleByRoleID/:roleId')
  async getRolebyRoleID(@Param('roleId', new ParseIntPipe()) roleID: number) {
    return await this.roleService.getRoleByRoleID(roleID)
  }
  @Post('/')
  async createRole(@Body() createRoleDto: createRoleDto) {

    const role: Role = await this.roleService.createRole(createRoleDto);
    return role;
  }

  @Patch('/:roleId')
  async updateRole(@Param('roleId', new ParseIntPipe()) roleId: number, @Body() updateRoleDto: UpdateRoleDto) {
    return await this.roleService.updateRole(roleId, updateRoleDto);
  }

  @Delete('/:roleId')

  async deleteRole(@Param('roleId' ,  new ParseIntPipe()) roleId : number){
    return await this.roleService.deleteRole(roleId);    
  }

  @Post("/createRolePermission/:roleId")

  async createRolePermission(@Param("roleId" ,new ParseIntPipe()) roleId : number,  @Body() addPermissionDto : AddPermissionDto ){
    return await this.roleService.createPermission(roleId ,addPermissionDto);
  }
}
