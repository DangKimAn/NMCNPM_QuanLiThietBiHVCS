import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class AddPermissionDto {
  @ApiProperty()
  @IsNumber()
  permissionId: number;
}
