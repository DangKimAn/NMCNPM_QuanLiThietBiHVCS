import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { EquipmentTransferService } from './equipment-transfer.service';
import { CreateEquipmentTransferDto } from './dto/create-equipment-transfer.dto';
import { CreateBulkEquipmentTransferDto } from './dto/create-bulk-equipment-transfer.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/decorators/role.enum';

import {
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';

import { ApiBody, ApiConsumes } from '@nestjs/swagger';

import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Equipment Transfers - Điều chuyển thiết bị')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('equipment-transfers')
export class EquipmentTransferController {
  constructor(private readonly transferService: EquipmentTransferService) {}

  @Post()
  create(@Body() createDto: CreateEquipmentTransferDto) {
    return this.transferService.create(createDto);
  }
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  importTransferExcel(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
            message: 'Dung lượng file không được vượt quá 5MB',
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.transferService.importFromExcel(file);
  }

  @Post('bulk')
  createBulk(@Body() createBulkDto: CreateBulkEquipmentTransferDto) {
    return this.transferService.createBulk(createBulkDto);
  }

  @Get()
  findAll() {
    return this.transferService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transferService.findOne(id);
  }
}