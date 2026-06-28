import { Module } from '@nestjs/common';
import { FormConfigController } from './form-config.controller';
import { FormConfigService } from './form-config.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FormConfigController],
  providers: [FormConfigService],
  exports: [FormConfigService],
})
export class FormConfigModule {}
