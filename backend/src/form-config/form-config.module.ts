import { Module } from '@nestjs/common';
import { FormConfigService } from './form-config.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FormConfigService],
  exports: [FormConfigService],
})
export class FormConfigModule {}
