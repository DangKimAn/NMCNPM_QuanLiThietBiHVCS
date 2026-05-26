import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    required: false,
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(255)
  password?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  phoneNumber?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Status không hợp lệ' })
  status?: UserStatus;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  roleId?: number;
}