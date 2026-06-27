import {
  Controller,
  Get,
  Param,
  Put,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FormConfigService } from './form-config.service';
import { UpdateFormConfigDto } from './dto/update-form-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/decorators/role.enum';

@ApiTags('FormConfig')
@Controller('form-config')
export class FormConfigController {
  constructor(private readonly formConfigService: FormConfigService) {}

  @Get()
  async getAllForms() {
    return this.formConfigService.getAllForms();
  }

  @Get(':formKey')
  async getConfig(@Param('formKey') formKey: string) {
    return this.formConfigService.getConfig(formKey);
  }

  @Put(':formKey')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateConfig(
    @Param('formKey') formKey: string,
    @Body() dto: UpdateFormConfigDto,
  ) {
    return this.formConfigService.updateConfig(formKey, dto);
  }

  @Delete(':formKey/:fieldKey')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteField(
    @Param('formKey') formKey: string,
    @Param('fieldKey') fieldKey: string,
  ) {
    return this.formConfigService.deleteField(formKey, fieldKey);
  }
}
