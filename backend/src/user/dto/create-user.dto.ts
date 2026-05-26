import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  username!: string;

  @ApiProperty({
    required: false,
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiProperty()
  @IsString()
  password!: string;

  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    required: false,
    example: 'STUDENT',
  })
  @IsString()
  @IsOptional()
  roleName?: string;
}