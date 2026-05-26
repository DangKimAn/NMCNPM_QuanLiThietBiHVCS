import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@student.ptithcm.edu.vn' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được trống' })
  email: string;

  @ApiProperty({ example: '483920' })
  @IsString()
  @IsNotEmpty({ message: 'Mã OTP không được trống' })
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 chữ số' })
  otp: string;
}
