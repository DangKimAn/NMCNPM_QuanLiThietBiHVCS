import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { ApiBadGatewayResponse, ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
import { CreatePermissionDto } from './dto/CreatePermission.dto';
import { UpdatePermissionDto } from './dto/UpdatePermission.dto';

@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

 @Get() 
  @ApiOkResponse()
  @ApiInternalServerErrorResponse()
  async getAllPermission() {
    const permissions = await this.permissionService.getAllPermission();
    return permissions; 
  }

  @Get("getPermissionByPermissionId/:permissionId")
  async getPermissionById(@Param('permissionId', ParseIntPipe) permissionId: number) {
      return await this.permissionService.getPermissionById(permissionId);
  }

  @Get("getPermissionByPermissionName/:permissionName")
  async getPermissionByName(@Param('permissionName') permissionName: string) {
      return await this.permissionService.getPermissionByName(permissionName);
  }

  @ApiCreatedResponse()
  @ApiInternalServerErrorResponse()
  @ApiConflictResponse()
  @Post()
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
      return await this.permissionService.createPermission(createPermissionDto);
  }

  @ApiNotFoundResponse()
  @ApiConflictResponse()
  @ApiOkResponse()
  @ApiInternalServerErrorResponse()
  @Patch(":permissionId")
  async updatePermission(
      @Param("permissionId", ParseIntPipe) permissionId: number,
      @Body() updatePermissionDto: UpdatePermissionDto
  ) {
      return await this.permissionService.updatePermission(permissionId, updatePermissionDto);
  }
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @ApiOkResponse()
  @ApiInternalServerErrorResponse()

  @Delete(":permissionId") 
  async deletePermission(@Param("permissionId", ParseIntPipe) permissionId: number) {
      return await this.permissionService.deletePermission(permissionId);
  }
}
